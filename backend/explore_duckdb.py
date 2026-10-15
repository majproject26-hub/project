import duckdb
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent
PARQUET_DIR = BASE_DIR / "data" / "parquet"

def print_header(title):
    print("\n" + "=" * 65)
    print(f"  [DUCKDB] {title}")
    print("=" * 65)

def main():
    print_header(f"DUCKDB LAKEHOUSE EXPLORER (DuckDB v{duckdb.__version__})")
    
    # 1. Connect to DuckDB
    con = duckdb.connect(database=":memory:")
    print("[OK] In-memory DuckDB analytical engine initialized.")

    # 2. Discover and register all Parquet datasets
    parquet_files = list(PARQUET_DIR.glob("*.parquet"))
    print(f"\nScanning physical storage: {PARQUET_DIR}")
    print(f"Found {len(parquet_files)} Snappy-compressed Parquet datasets:\n")

    for p in parquet_files:
        table_name = p.stem.replace("-", "_")
        con.execute(f"CREATE OR REPLACE VIEW \"{table_name}\" AS SELECT * FROM read_parquet('{p.as_posix()}');")
        count = con.execute(f"SELECT COUNT(*) FROM \"{table_name}\"").fetchone()[0]
        size_kb = round(p.stat().st_size / 1024, 1)
        print(f"  * Table: {table_name:<42} | {count:>4} rows | {size_kb:>6} KB")

    # 3. Live Analytical Query 1: Employee Salaries
    print_header("QUERY 1: Department Salary Analysis (acme_employees_2025)")
    q1 = """
    SELECT 
        department,
        COUNT(*) as headcount,
        ROUND(AVG(salary), 2) as avg_salary,
        MIN(salary) as min_salary,
        MAX(salary) as max_salary
    FROM acme_employees_2025
    GROUP BY department
    ORDER BY avg_salary DESC;
    """
    print("SQL Query:\n" + q1)
    print("DuckDB Result Table:")
    print(con.execute(q1).df().to_string(index=False))

    # 4. Live Analytical Query 2: Q3 Sales
    print_header("QUERY 2: Global Deal Revenue by Region (q3_global_sales_revenue)")
    q2 = """
    SELECT 
        region,
        COUNT(*) as deals_closed,
        SUM(deal_size) as total_revenue,
        ROUND(AVG(deal_size), 2) as avg_deal_size
    FROM q3_global_sales_revenue
    GROUP BY region
    ORDER BY total_revenue DESC;
    """
    print("SQL Query:\n" + q2)
    print("DuckDB Result Table:")
    print(con.execute(q2).df().to_string(index=False))

    # 5. Live Analytical Query 3: Satellite Telemetry
    print_header("QUERY 3: Constellation Telemetry (constellation_satellite_telemetry_stream)")
    q3 = """
    SELECT 
        satellite_id,
        orbital_altitude_km as altitude_km,
        battery_soc_pct as battery_pct,
        solar_temp_c as temp_c,
        status
    FROM constellation_satellite_telemetry_stream
    ORDER BY battery_pct DESC;
    """
    print("SQL Query:\n" + q3)
    print("DuckDB Result Table:")
    print(con.execute(q3).df().to_string(index=False))

    print_header("SUMMARY")
    print("[OK] DuckDB is executing fast in-memory OLAP analytics on your physical Parquet files!")
    print("[OK] You can also query DuckDB in your browser at http://localhost:5173/sql (SQL Studio)")
    print("=" * 65 + "\n")

if __name__ == "__main__":
    main()
