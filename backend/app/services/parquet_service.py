import io
import math
from pathlib import Path
from typing import Dict, Any, List, Tuple
import pandas as pd
import numpy as np
import pyarrow as pa
import pyarrow.parquet as pq

from app.config import PARQUET_DIR

def process_csv_to_parquet(
    csv_bytes: bytes,
    original_filename: str,
    company_id: str,
    custom_name: str = "",
    display_name: str = "",
    description: str = "",
    tags: List[str] = None,
    access_level: str = "All",
    uploader: Dict[str, Any] = None
) -> Dict[str, Any]:
    """
    Parses CSV content, infers schema, calculates column distributions,
    writes compressed Parquet (Snappy) to disk, and returns the dataset metadata.
    """
    raw_size_bytes = len(csv_bytes)
    
    # Read into pandas DataFrame based on file type / magic bytes
    if csv_bytes.startswith(b"PAR1") or original_filename.lower().endswith(".parquet"):
        try:
            table_in = pq.read_table(io.BytesIO(csv_bytes))
            df = table_in.to_pandas()
        except Exception:
            df = pd.read_parquet(io.BytesIO(csv_bytes))
    elif original_filename.lower().endswith(".json"):
        df = pd.read_json(io.BytesIO(csv_bytes))
    else:
        try:
            df = pd.read_csv(io.BytesIO(csv_bytes))
        except Exception:
            # Fallback with different encoding or delimiter
            df = pd.read_csv(io.BytesIO(csv_bytes), sep=None, engine="python", on_bad_lines="skip")

    row_count = len(df)
    col_count = len(df.columns)

    # Sanitize parquet filename
    clean_stem = (custom_name or original_filename).lower().replace(" ", "_")
    clean_stem = "".join(c for c in clean_stem if c.isalnum() or c in "_-")
    if not clean_stem.endswith(".parquet"):
        clean_stem += ".parquet"
    parquet_filename = f"{company_id.lower()}_{clean_stem}"
    parquet_filepath = PARQUET_DIR / parquet_filename

    # Convert to PyArrow Table and save as Snappy Parquet
    table = pa.Table.from_pandas(df)
    pq.write_table(table, parquet_filepath, compression="snappy")

    parquet_size_bytes = parquet_filepath.stat().st_size
    compression_pct = round((1 - (parquet_size_bytes / max(raw_size_bytes, 1))) * 100)
    if compression_pct < 0:
        compression_pct = 0
    compression_ratio = f"{compression_pct}% (vs CSV)"

    def format_size(bytes_val: int) -> str:
        if bytes_val < 1024:
            return f"{bytes_val} B"
        elif bytes_val < 1024 * 1024:
            return f"{round(bytes_val / 1024, 1)} KB"
        else:
            return f"{round(bytes_val / (1024 * 1024), 1)} MB"

    formatted_size = format_size(parquet_size_bytes)

    # Schema Detection & Column Stats
    schema_info = []
    column_stats = []

    for col in df.columns:
        s = df[col]
        dtype = str(s.dtype)
        null_count = int(s.isnull().sum())
        null_pct = f"{round((null_count / max(row_count, 1)) * 100, 2)}%"
        unique_count = int(s.nunique(dropna=True))
        sample_val = str(s.dropna().iloc[0]) if not s.dropna().empty else ""

        # Map type
        col_type = "VARCHAR(64)"
        if "int" in dtype:
            col_type = "INTEGER"
        elif "float" in dtype:
            col_type = "FLOAT"
        elif "datetime" in dtype or "date" in dtype:
            col_type = "DATE"
        elif "bool" in dtype:
            col_type = "BOOLEAN"

        schema_info.append({
            "column": str(col),
            "type": col_type,
            "nullCount": null_count,
            "nullPct": null_pct,
            "uniqueCount": unique_count,
            "sample": sample_val
        })

        # Calculate stats for numeric & categorical
        if pd.api.types.is_numeric_dtype(s) and not s.dropna().empty:
            s_clean = s.dropna()
            c_min = float(s_clean.min())
            c_max = float(s_clean.max())
            c_mean = float(s_clean.mean())
            c_std = float(s_clean.std()) if len(s_clean) > 1 else 0.0

            # 4-5 bucket distribution
            try:
                counts, bin_edges = np.histogram(s_clean, bins=4)
                dist = []
                for b_idx in range(len(counts)):
                    dist.append({
                        "label": f"{round(bin_edges[b_idx], 1)}-{round(bin_edges[b_idx+1], 1)}",
                        "value": int(counts[b_idx])
                    })
            except Exception:
                dist = []

            column_stats.append({
                "column": str(col),
                "min": round(c_min, 2),
                "max": round(c_max, 2),
                "mean": round(c_mean, 2),
                "stdDev": round(c_std, 2),
                "distribution": dist
            })
        elif s.nunique() <= 10 and not s.dropna().empty:
            val_counts = s.value_counts().head(6)
            dist = [{"label": str(k), "value": int(v)} for k, v in val_counts.items()]
            column_stats.append({
                "column": str(col),
                "uniqueCount": unique_count,
                "distribution": dist
            })

    # Prepare preview rows (first 15 rows)
    preview_rows = df.head(15).fillna("").to_dict(orient="records")

    import datetime
    now_str = datetime.datetime.now().strftime("%Y-%m-%d")

    uploader_name = uploader.get("name", "System") if uploader else "System"
    uploader_role = uploader.get("role", "STAFF") if uploader else "STAFF"
    uploader_id = uploader.get("id") if uploader else None
    uploader_email = uploader.get("email") if uploader else None

    dataset_dict = {
        "id": f"ds-{int(datetime.datetime.now().timestamp() * 1000)}",
        "companyId": company_id.upper(),
        "name": parquet_filename,
        "displayName": display_name or original_filename.replace(".csv", "").replace("_", " ").title(),
        "description": description or f"Ingested dataset with {row_count:,} records transformed to Snappy Parquet.",
        "format": "Parquet (Snappy)",
        "size": formatted_size,
        "rowCount": row_count,
        "colCount": col_count,
        "compressionRatio": compression_ratio,
        "accessLevel": access_level,
        "uploaderId": uploader_id,
        "uploaderEmail": uploader_email,
        "uploaderName": uploader_name,
        "uploaderRole": uploader_role,
        "uploadDate": now_str,
        "tags": tags or ["lakehouse", "parquet"],
        "schema": schema_info,
        "columnStats": column_stats,
        "previewData": preview_rows,
        "history": [
            {
                "id": f"v-{int(datetime.datetime.now().timestamp() * 1000)}",
                "version": "v1.0",
                "author": uploader_name,
                "action": "Initial Ingestion",
                "date": datetime.datetime.now().strftime("%Y-%m-%d %H:%M"),
                "comment": f"Uploaded raw CSV ({format_size(raw_size_bytes)}) and converted to compressed Parquet."
            }
        ]
    }

    return dataset_dict
