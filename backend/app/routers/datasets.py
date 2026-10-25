from fastapi import APIRouter, HTTPException, Depends, UploadFile, File, Form, status
from typing import Dict, Any, List, Optional
import json

from app.database import db
from app.models import DatasetAccessUpdate, BulkDatasetAccessUpdate, DatasetMetadataUpdate
from app.services.auth_service import get_current_user, require_roles
from app.services.parquet_service import process_csv_to_parquet
from app.config import PARQUET_DIR

router = APIRouter(prefix="/api/datasets", tags=["Datasets"])

def check_can_delete(dataset: Dict[str, Any], user: Dict[str, Any]) -> bool:
    """
    Enforces the rule:
    'the person who uploaded the data can delete the data they uploaded and admin can delete all the data'
    """
    if not user or not dataset:
        return False
    if user.get("role") == "ADMIN":
        return True

    user_id = user.get("id")
    user_email = (user.get("email") or "").lower()
    user_name = (user.get("name") or "").lower()

    uploader_id = dataset.get("uploaderId")
    uploader_email = (dataset.get("uploaderEmail") or "").lower()
    uploader_name = (dataset.get("uploaderName") or "").lower()

    if uploader_id and user_id and uploader_id == user_id:
        return True
    if uploader_email and user_email and uploader_email == user_email:
        return True
    if uploader_name and user_name and uploader_name == user_name:
        return True

    return False

@router.get("")
def list_datasets(current_user: Dict[str, Any] = Depends(get_current_user)):
    company_id = current_user.get("companyId", "").upper()
    role = current_user.get("role", "STAFF")

    permitted = db.get_datasets_for_user(company_id, role, current_user.get("id"))
    all_company = db.get_all_company_datasets(company_id)

    return {
        "success": True,
        "datasets": permitted,
        "allCompanyDatasets": all_company if role == "ADMIN" else permitted
    }

@router.get("/{dataset_id}")
def get_dataset(dataset_id: str, current_user: Dict[str, Any] = Depends(get_current_user)):
    company_id = current_user.get("companyId", "").upper()
    role = current_user.get("role", "STAFF")

    for d in db.datasets:
        if d["id"] == dataset_id and d.get("companyId", "").upper() == company_id:
            level = d.get("accessLevel", "All")
            # Permission check
            if role == "STAFF" and level != "All":
                raise HTTPException(status_code=403, detail="Access denied by dataset governance policy.")
            if role == "HR" and level == "Admin only":
                raise HTTPException(status_code=403, detail="Access denied: Admin only dataset.")
            return {"success": True, "dataset": d}

    raise HTTPException(status_code=404, detail="Dataset not found.")

@router.post("/upload")
async def upload_dataset(
    file: UploadFile = File(...),
    customName: Optional[str] = Form(None),
    displayName: Optional[str] = Form(None),
    description: Optional[str] = Form(None),
    tags: Optional[str] = Form(None),
    accessLevel: Optional[str] = Form("All"),
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    company_id = current_user.get("companyId", "").upper()
    csv_bytes = await file.read()
    if not csv_bytes:
        raise HTTPException(status_code=400, detail="Uploaded file is empty.")

    tag_list = [t.strip() for t in tags.split(",") if t.strip()] if tags else ["lakehouse", "parquet"]

    dataset_dict = process_csv_to_parquet(
        csv_bytes=csv_bytes,
        original_filename=file.filename or "dataset.csv",
        company_id=company_id,
        custom_name=customName or "",
        display_name=displayName or "",
        description=description or "",
        tags=tag_list,
        access_level=accessLevel or "All",
        uploader=current_user
    )

    db.add_dataset(dataset_dict)
    db.log_event(
        company_id=company_id,
        user_name=current_user.get("name", "User"),
        user_role=current_user.get("role", "STAFF"),
        action="Dataset Upload",
        resource=dataset_dict["name"],
        details=f"Uploaded and converted to Parquet ({dataset_dict['rowCount']:,} rows)."
    )
    db.save()

    return {"success": True, "dataset": dataset_dict}

@router.post("/preview")
async def preview_uploaded_file(file: UploadFile = File(...)):
    """
    Inspects an uploaded data file (CSV, JSON, or Parquet) and returns
    detected schema, column types, row counts, and sample preview rows.
    """
    import io
    import pandas as pd
    import pyarrow.parquet as pq

    raw_bytes = await file.read()
    if not raw_bytes:
        raise HTTPException(status_code=400, detail="Uploaded file is empty.")

    filename = file.filename or "dataset.csv"
    fn_lower = filename.lower()

    fmt = "csv"
    try:
        if raw_bytes.startswith(b"PAR1") or fn_lower.endswith(".parquet"):
            fmt = "parquet"
            try:
                tbl = pq.read_table(io.BytesIO(raw_bytes))
                df = tbl.to_pandas()
            except Exception:
                df = pd.read_parquet(io.BytesIO(raw_bytes))
        elif fn_lower.endswith(".json"):
            fmt = "json"
            df = pd.read_json(io.BytesIO(raw_bytes))
        else:
            fmt = "csv"
            try:
                df = pd.read_csv(io.BytesIO(raw_bytes))
            except Exception:
                df = pd.read_csv(io.BytesIO(raw_bytes), sep=None, engine="python", on_bad_lines="skip")
    except Exception as parse_err:
        raise HTTPException(status_code=400, detail=f"Failed to parse {filename}: {str(parse_err)}")

    headers = [str(c) for c in df.columns]
    sample_df = df.head(10).fillna("")
    sample_rows = [[str(v) for v in row] for row in sample_df.values.tolist()]

    schema = []
    for col in headers:
        s = df[col]
        dtype = str(s.dtype).lower()
        col_type = "VARCHAR(64)"
        if "int" in dtype:
            col_type = "INTEGER"
        elif "float" in dtype or "double" in dtype or "decimal" in dtype:
            col_type = "FLOAT"
        elif "datetime" in dtype or "date" in dtype:
            col_type = "DATE"
        elif "bool" in dtype:
            col_type = "BOOLEAN"

        sample_val = str(s.dropna().iloc[0]) if not s.dropna().empty else ""
        schema.append({
            "column": col,
            "type": col_type,
            "sample": sample_val,
            "nullable": bool(s.isnull().any())
        })

    return {
        "success": True,
        "format": fmt,
        "rowCount": len(df),
        "headers": headers,
        "sampleRows": sample_rows,
        "schema": schema
    }

@router.delete("/all")
def delete_all_datasets(current_user: Dict[str, Any] = Depends(require_roles(["ADMIN"]))):
    company_id = current_user.get("companyId", "").upper()
    existing = [d for d in db.datasets if d.get("companyId", "").upper() == company_id]
    count = len(existing)

    # Remove physical files
    for d in existing:
        fpath = PARQUET_DIR / d["name"]
        if fpath.exists():
            try:
                fpath.unlink()
            except Exception:
                pass

    for d in existing:
        db.delete_dataset(d["id"])
    db.log_event(
        company_id=company_id,
        user_name=current_user.get("name", "Admin"),
        user_role="ADMIN",
        action="All Datasets Deleted",
        resource=f"All {company_id} Datasets",
        details=f"Administrator deleted all {count} datasets for organization {company_id}."
    )
    db.save()

    return {"success": True, "deletedCount": count}

@router.delete("/{dataset_id}")
def delete_dataset(dataset_id: str, current_user: Dict[str, Any] = Depends(get_current_user)):
    target = None
    target_idx = -1
    for idx, d in enumerate(db.datasets):
        if d["id"] == dataset_id:
            target = d
            target_idx = idx
            break

    if not target:
        raise HTTPException(status_code=404, detail="Dataset not found.")

    company_id = current_user.get("companyId", "").upper()
    if target.get("companyId", "").upper() != company_id:
        raise HTTPException(status_code=403, detail="Cannot access datasets from another organization.")

    # ENFORCE RULE:
    # "the person who uploaded the data can delete the data they uploaded and admin can delete all the data"
    if not check_can_delete(target, current_user):
        db.log_event(
            company_id=company_id,
            user_name=current_user.get("name", "User"),
            user_role=current_user.get("role", "STAFF"),
            action="Dataset Deletion Denied",
            resource=target.get("name", dataset_id),
            details=f"Delete operation blocked: {current_user.get('name')} is not an admin and was not the uploader of this dataset.",
            status="Failed"
        )
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Permission Denied: Only the uploader of this dataset or a company administrator can delete it."
        )

    # Delete physical parquet file
    fpath = PARQUET_DIR / target["name"]
    if fpath.exists():
        try:
            fpath.unlink()
        except Exception:
            pass

    db.delete_dataset(target["id"])
    is_admin = current_user.get("role") == "ADMIN"
    db.log_event(
        company_id=company_id,
        user_name=current_user.get("name", "User"),
        user_role=current_user.get("role", "STAFF"),
        action="Dataset Deleted",
        resource=target.get("name", dataset_id),
        details=f"{current_user.get('name')} ({'Administrator' if is_admin else 'Uploader'}) permanently removed dataset from storage."
    )
    db.save()

    return {"success": True, "message": "Dataset successfully deleted."}

@router.put("/bulk-access")
def update_bulk_access(
    req: BulkDatasetAccessUpdate,
    current_user: Dict[str, Any] = Depends(require_roles(["ADMIN"]))
):
    company_id = current_user.get("companyId", "").upper()
    updated_count = 0
    for d in db.datasets:
        if d.get("companyId", "").upper() == company_id:
            d["accessLevel"] = req.accessLevel
            updated_count += 1

    db.log_event(
        company_id=company_id,
        user_name=current_user.get("name", "Admin"),
        user_role="ADMIN",
        action="Bulk Dataset Access Changed",
        resource=f"All {company_id} Datasets",
        details=f"Admin changed visibility access for all datasets to \"{req.accessLevel}\"."
    )
    db.save()

    return {"success": True, "count": updated_count, "accessLevel": req.accessLevel}

@router.put("/{dataset_id}/access")
def update_dataset_access(
    dataset_id: str,
    req: DatasetAccessUpdate,
    current_user: Dict[str, Any] = Depends(require_roles(["ADMIN"]))
):
    for d in db.datasets:
        if d["id"] == dataset_id:
            db.update_dataset(dataset_id, {"accessLevel": req.accessLevel})
            db.log_event(
                company_id=current_user.get("companyId"),
                user_name=current_user.get("name"),
                user_role="ADMIN",
                action="Dataset Access Changed",
                resource=d.get("name", dataset_id),
                details=f"Admin changed dataset access permission to \"{req.accessLevel}\"."
            )
            return {"success": True, "dataset": d}

    raise HTTPException(status_code=404, detail="Dataset not found.")

@router.put("/{dataset_id}/metadata")
def update_dataset_metadata(
    dataset_id: str,
    req: DatasetMetadataUpdate,
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    for d in db.datasets:
        if d["id"] == dataset_id:
            if not check_can_delete(d, current_user):
                raise HTTPException(status_code=403, detail="Only the uploader or admin can edit dataset metadata.")
            update_fields = {}
            if req.displayName:
                d["displayName"] = req.displayName
                update_fields["displayName"] = req.displayName
            if req.description:
                d["description"] = req.description
                update_fields["description"] = req.description
            if req.tags:
                d["tags"] = req.tags
                update_fields["tags"] = req.tags
            if req.accessLevel and current_user.get("role") == "ADMIN":
                d["accessLevel"] = req.accessLevel
                update_fields["accessLevel"] = req.accessLevel
            db.update_dataset(dataset_id, update_fields)
            return {"success": True, "dataset": d}

    raise HTTPException(status_code=404, detail="Dataset not found.")
