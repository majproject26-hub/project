"""
Direct DuckDB Connection Demo for SHEGU Lakehouse.
Demonstrates:
1. In-memory connection querying Parquet files.
2. Creating a permanent DuckDB database file (data/lakehouse.duckdb).
3. Querying tables with aggregations.
"""
import duckdb
from pathlib import Path

# Paths
BASE_DIR = Path(__file__).resolve().parent
PARQUET_DIR = BASE_DIR / "data" / "parquet"
DB_FILE = BASE_DIR / "data" / "lakehouse.duckdb"

print("==================================================")
print("[INFO] Connecting to DuckDB...")
print("==================================================")

# 1. Connect to an In-Memory DuckDB instance
con = duckdb.connect(database=":memory:")
print("[OK] In-memory DuckDB connection established!")

# 2. Register all physical Parquet datasets as SQL tables
parquet_files = list(PARQUET_DIR.glob("*.parquet"))
print(f"[INFO] Found {len(parquet_files)} Parquet files in {PARQUET_DIR}:")

for p in parquet_files:
    table_name = p.stem.replace("-", "_")
    con.execute(f"CREATE OR REPLACE VIEW \"{table_name}\" AS SELECT * FROM read_parquet('{p.as_posix()}');")
    count = con.execute(f"SELECT COUNT(*) FROM \"{table_name}\"").fetchone()[0]
    print(f"   * View '{table_name}' registered ({count} rows)")

# 3. Execute a sample analytical query on DuckDB
print("\n[INFO] Running Analytical Query: Average Salary by Department:")
sql = """
SELECT 
    department, 
    COUNT(*) as headcount, 
    ROUND(AVG(salary), 2) as avg_salary,
    MIN(salary) as min_sal,
    MAX(salary) as max_sal
FROM "acme_employees_2025"
GROUP BY department
ORDER BY avg_salary DESC;
"""
df = con.execute(sql).df()
print(df.to_string(index=False))

# 4. Create / connect to a persistent on-disk database file
print("\n[INFO] Connecting to persistent database file:", DB_FILE)
disk_con = duckdb.connect(str(DB_FILE))
disk_con.execute(f"""
    CREATE TABLE IF NOT EXISTS acme_employees AS 
    SELECT * FROM read_parquet('{(PARQUET_DIR / "acme_employees_2025.parquet").as_posix()}');
""")
row_count = disk_con.execute("SELECT COUNT(*) FROM acme_employees").fetchone()[0]
print(f"[OK] Persistent database ready! Table 'acme_employees' has {row_count} rows stored on disk.")
disk_con.close()
con.close()

print("\n[SUCCESS] DuckDB connection and query execution completed successfully!")
