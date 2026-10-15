import urllib.request
import json
import uuid

BASE_URL = "http://127.0.0.1:8000"

def test_all():
    print("1. Testing Health...")
    with urllib.request.urlopen(f"{BASE_URL}/api/health") as r:
        print("Health:", json.loads(r.read().decode()))

    print("\n2. Testing Login...")
    login_data = json.dumps({
        "companyId": "ACME-001",
        "email": "sarah.admin@acme.io",
        "password": "password123"
    }).encode("utf-8")
    req = urllib.request.Request(f"{BASE_URL}/api/auth/login", data=login_data, headers={"Content-Type": "application/json"})
    with urllib.request.urlopen(req) as r:
        auth_res = json.loads(r.read().decode())
        token = auth_res["token"]
        print("Logged in as:", auth_res["user"]["name"], "| Token length:", len(token))

    headers = {
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json"
    }

    print("\n3. Testing Get Datasets...")
    req = urllib.request.Request(f"{BASE_URL}/api/datasets", headers=headers)
    with urllib.request.urlopen(req) as r:
        ds_res = json.loads(r.read().decode())
        print(f"Found {len(ds_res.get('datasets', []))} datasets")

    print("\n4. Testing Run SQL Query on DuckDB...")
    sql_data = json.dumps({
        "sql": "SELECT department, count(*) as count, round(avg(salary), 2) as avg_sal FROM acme_employees_2025 GROUP BY department ORDER BY avg_sal DESC;",
        "limit": 10
    }).encode("utf-8")
    req = urllib.request.Request(f"{BASE_URL}/api/sql/run", data=sql_data, headers=headers)
    with urllib.request.urlopen(req) as r:
        sql_res = json.loads(r.read().decode())
        print("SQL Success:", sql_res["success"], "| Rows:", len(sql_res["rows"]), "| Telemetry:", sql_res["telemetry"])

    print("\n5. Testing Natural Language 'Ask Your Data'...")
    ask_data = json.dumps({
        "question": "What is the average salary by department?"
    }).encode("utf-8")
    req = urllib.request.Request(f"{BASE_URL}/api/ask", data=ask_data, headers=headers)
    with urllib.request.urlopen(req) as r:
        ask_res = json.loads(r.read().decode())
        print("Interpreted:", ask_res["interpreted"])
        print("Generated SQL:", ask_res["sql"])
        print("Suggested Chart:", ask_res["suggestedChart"])
        print("Summary:", ask_res["summary"])

    print("\n6. Testing CSV to Parquet Upload...")
    boundary = "----TestBoundary" + uuid.uuid4().hex
    csv_bytes = b"dept,employee,salary,bonus\nSales,John Doe,85000,12000\nEngineering,Jane Smith,135000,20000\nHR,Jim Brown,70000,8000\n"
    
    parts = []
    parts.append(f"--{boundary}\r\nContent-Disposition: form-data; name=\"file\"; filename=\"test_emp.csv\"\r\nContent-Type: text/csv\r\n\r\n".encode("utf-8"))
    parts.append(csv_bytes)
    parts.append(f"\r\n--{boundary}\r\nContent-Disposition: form-data; name=\"displayName\"\r\n\r\nTest CSV Upload\r\n".encode("utf-8"))
    parts.append(f"--{boundary}\r\nContent-Disposition: form-data; name=\"description\"\r\n\r\nUploaded for verification\r\n".encode("utf-8"))
    parts.append(f"--{boundary}--\r\n".encode("utf-8"))
    multipart_body = b"".join(parts)

    upload_headers = {
        "Authorization": f"Bearer {token}",
        "Content-Type": f"multipart/form-data; boundary={boundary}"
    }
    req = urllib.request.Request(f"{BASE_URL}/api/datasets/upload", data=multipart_body, headers=upload_headers)
    with urllib.request.urlopen(req) as r:
        upload_res = json.loads(r.read().decode())
        created_ds = upload_res["dataset"]
        print("Uploaded Dataset Name:", created_ds["name"], "| Format:", created_ds["format"], "| Size:", created_ds["size"])

    print("\n7. Testing Query on newly uploaded Parquet dataset in DuckDB...")
    new_tbl = created_ds["name"].replace(".parquet", "").replace("-", "_")
    sql_data2 = json.dumps({
        "sql": f"SELECT dept, employee, salary FROM \"{new_tbl}\" WHERE salary > 80000;",
        "limit": 10
    }).encode("utf-8")
    req = urllib.request.Request(f"{BASE_URL}/api/sql/run", data=sql_data2, headers=headers)
    with urllib.request.urlopen(req) as r:
        sql_res2 = json.loads(r.read().decode())
        print("Query on new Parquet:", sql_res2["rows"])

    print("\n8. Testing Uploader Deletion Rule...")
    # Admin can delete it
    req = urllib.request.Request(f"{BASE_URL}/api/datasets/{created_ds['id']}", method="DELETE", headers=headers)
    with urllib.request.urlopen(req) as r:
        del_res = json.loads(r.read().decode())
        print("Dataset deleted successfully:", del_res)

    print("\nAll Backend Test Suites Passed Successfully!")

if __name__ == "__main__":
    test_all()
