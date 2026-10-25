import os
import re
from typing import Dict, Any, List, Optional, Tuple
from app.services.duckdb_service import execute_lakehouse_query

class SQLAgent:
    """
    SQL Agent for the Comprehensive Data Lakehouse.
    Uses Natural Language Processing (NLP) and LLM synthesis to understand
    user queries, generate precise ANSI SQL, and execute queries using DuckDB.
    """

    @classmethod
    def synthesize_and_execute(
        cls,
        question: str,
        target_dataset: Dict[str, Any],
        company_id: str,
        user_role: str,
        user_name: str
    ) -> Dict[str, Any]:
        table_name = target_dataset["name"].replace(".parquet", "").replace("-", "_")
        schema_cols = target_dataset.get("schema", [])
        col_names = [c["column"] for c in schema_cols]
        q_lower = question.lower()

        # Try LLM-assisted SQL synthesis if API key is provided
        llm_sql = cls._try_llm_sql_generation(question, target_dataset)

        if llm_sql:
            sql = llm_sql
            interpreted = f"LLM SQL Agent interpreted: {question}"
        else:
            # High-precision schema-grounded Natural Language Processing (NLP)
            sql, interpreted, suggested_chart, x_axis, y_axis = cls._nlp_sql_synthesis(q_lower, table_name, schema_cols)

        # Execute query using DuckDB
        query_exec = execute_lakehouse_query(
            sql=sql,
            company_id=company_id,
            user_role=user_role,
            user_name=user_name,
            limit=25
        )

        # Self-healing fallback if query execution failed or was empty
        if not query_exec.get("success") or not query_exec.get("rows"):
            fallback_sql = f'SELECT * FROM "{table_name}" LIMIT 10;'
            query_exec_fb = execute_lakehouse_query(
                sql=fallback_sql,
                company_id=company_id,
                user_role=user_role,
                user_name=user_name,
                limit=10
            )
            if query_exec_fb.get("success") and query_exec_fb.get("rows"):
                query_exec = query_exec_fb
                sql = fallback_sql
                interpreted = f"Retrieved top records from {target_dataset.get('displayName', target_dataset['name'])}."

        columns = query_exec.get("columns", [])
        rows = query_exec.get("rows", [])
        telemetry = query_exec.get("telemetry", {})

        # Determine chart axes
        chart_type = "bar"
        x_col = columns[0] if columns else "item"
        y_col = columns[1] if len(columns) > 1 else x_col

        # Pick appropriate chart type
        if any(w in q_lower for w in ["trend", "timeline", "over time", "month", "date", "daily"]):
            chart_type = "line"
        elif any(w in q_lower for w in ["share", "proportion", "breakdown", "percentage"]) and len(rows) <= 6:
            chart_type = "pie"

        return {
            "sql": sql,
            "interpreted": interpreted,
            "columns": columns,
            "rows": rows,
            "telemetry": telemetry,
            "suggestedChart": chart_type,
            "xAxis": x_col,
            "yAxis": y_col,
            "success": query_exec.get("success", True),
            "error": query_exec.get("error")
        }

    @classmethod
    def _nlp_sql_synthesis(
        cls,
        q_lower: str,
        table_name: str,
        schema_cols: List[Dict[str, Any]]
    ) -> Tuple[str, str, str, str, str]:
        col_names = [c["column"] for c in schema_cols]

        def find_col(patterns):
            for pat in patterns:
                for col in col_names:
                    if pat.lower() in col.lower():
                        return col
            return None

        num_cols = [
            c["column"] for c in schema_cols
            if any(t in c.get("type", "").upper() for t in ["INT", "FLOAT", "DOUBLE", "NUMERIC", "DECIMAL", "REAL"])
        ]
        cat_cols = [
            c["column"] for c in schema_cols
            if any(t in c.get("type", "").upper() for t in ["VARCHAR", "TEXT", "STRING", "CHAR", "DATE"])
        ]

        salary_col = find_col(["base_salary", "salary", "compensation", "pay", "wage", "bonus"])
        dept_col = find_col(["department", "dept", "team", "division", "group", "category"])
        name_col = find_col(["full_name", "employee_name", "name", "employee_id"])
        revenue_col = find_col(["deal_size", "revenue", "sales", "amount", "total", "mrr", "cost"])
        region_col = find_col(["region", "territory", "country", "location", "city", "state"])
        stock_col = find_col(["stock_qty", "stock", "quantity", "qty", "inventory", "count", "units"])
        category_col = find_col(["category", "part", "component", "type"])
        metric_col = find_col(["battery_soc", "battery", "altitude", "temp", "score", "value", "usage"])
        entity_col = find_col(["satellite_id", "device_id", "sku", "id"])

        if salary_col and (dept_col or cat_cols) and any(w in q_lower for w in ["salary", "compensation", "pay", "department", "employee", "headcount"]):
            dim = dept_col or cat_cols[0]
            sql = f'SELECT "{dim}", ROUND(AVG("{salary_col}"), 2) as avg_{salary_col}, COUNT(*) as headcount FROM "{table_name}" GROUP BY "{dim}" ORDER BY avg_{salary_col} DESC LIMIT 8;'
            return sql, f"Aggregated average {salary_col} and headcount grouped by {dim}.", "bar", dim, f"avg_{salary_col}"

        if revenue_col and (region_col or cat_cols) and any(w in q_lower for w in ["revenue", "sales", "deal", "region", "market", "closed"]):
            dim = region_col or cat_cols[0]
            sql = f'SELECT "{dim}", SUM("{revenue_col}") as total_{revenue_col}, COUNT(*) as deals FROM "{table_name}" GROUP BY "{dim}" ORDER BY total_{revenue_col} DESC LIMIT 8;'
            return sql, f"Aggregated total {revenue_col} grouped by {dim}.", "bar", dim, f"total_{revenue_col}"

        if stock_col and (category_col or cat_cols) and any(w in q_lower for w in ["stock", "inventory", "item", "part", "lead", "hardware"]):
            dim = category_col or cat_cols[0]
            sql = f'SELECT "{dim}", SUM("{stock_col}") as total_{stock_col} FROM "{table_name}" GROUP BY "{dim}" ORDER BY total_{stock_col} ASC LIMIT 8;'
            return sql, f"Summarized {stock_col} grouped by {dim}.", "bar", dim, f"total_{stock_col}"

        if metric_col and (entity_col or cat_cols) and any(w in q_lower for w in ["telemetry", "satellite", "battery", "altitude", "temp", "orbit"]):
            dim = entity_col or cat_cols[0]
            sql = f'SELECT "{dim}", ROUND(AVG("{metric_col}"), 2) as avg_{metric_col} FROM "{table_name}" GROUP BY "{dim}" ORDER BY avg_{metric_col} DESC LIMIT 8;'
            return sql, f"Analyzed telemetry average {metric_col} across {dim}.", "line", dim, f"avg_{metric_col}"

        if any(w in q_lower for w in ["top", "highest", "max", "best"]) and num_cols:
            dim = name_col or (cat_cols[0] if cat_cols else col_names[0])
            val = num_cols[0]
            sql = f'SELECT "{dim}", "{val}" FROM "{table_name}" ORDER BY "{val}" DESC LIMIT 5;'
            return sql, f"Extracted top 5 records by {val} descending.", "bar", dim, val

        if num_cols and cat_cols:
            dim = cat_cols[0]
            val = num_cols[0]
            sql = f'SELECT "{dim}", ROUND(AVG("{val}"), 2) as avg_{val}, COUNT(*) as records FROM "{table_name}" GROUP BY "{dim}" ORDER BY avg_{val} DESC LIMIT 8;'
            return sql, f"Grouped records by {dim} with average {val}.", "bar", dim, f"avg_{val}"

        if cat_cols:
            dim = cat_cols[0]
            sql = f'SELECT "{dim}", COUNT(*) as record_count FROM "{table_name}" GROUP BY "{dim}" ORDER BY record_count DESC LIMIT 8;'
            return sql, f"Counted records by category {dim}.", "bar", dim, "record_count"

        sql = f'SELECT * FROM "{table_name}" LIMIT 10;'
        return sql, f"Sampled leading records from table.", "bar", col_names[0] if col_names else "id", col_names[1] if len(col_names) > 1 else col_names[0]

    @classmethod
    def _try_llm_sql_generation(cls, question: str, target_dataset: Dict[str, Any]) -> Optional[str]:
        """
        Connects to LLM (Gemini or OpenAI) if an API key is available in environment.
        """
        gemini_key = os.getenv("GEMINI_API_KEY") or os.getenv("GOOGLE_API_KEY")
        if not gemini_key:
            return None

        try:
            from google import genai
            client = genai.Client(api_key=gemini_key)
            schema_summary = ", ".join([f"{c['column']} ({c.get('type', 'TEXT')})" for c in target_dataset.get("schema", [])])
            table_name = target_dataset["name"].replace(".parquet", "").replace("-", "_")

            prompt = (
                f"You are the SQL Agent in a DuckDB Data Lakehouse. Convert this question into a single valid DuckDB SQL query.\n"
                f"Table name: \"{table_name}\"\n"
                f"Available columns: {schema_summary}\n"
                f"Question: \"{question}\"\n"
                f"Rules: Return ONLY the raw SQL query. No markdown formatting, no comments, no explanation. Use double quotes for column names."
            )
            response = client.models.generate_content(
                model='gemini-2.5-flash',
                contents=prompt
            )
            raw_text = response.text.strip().replace("```sql", "").replace("```", "").strip()
            if raw_text.upper().startswith("SELECT"):
                return raw_text
        except Exception as e:
            print(f"[INFO] SQL Agent LLM fallback to NLP: {e}")

        return None
