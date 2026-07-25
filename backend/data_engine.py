"""
KSP CrimeIntel — Data Engine
Central data processing layer for 1.67M Karnataka FIR records + 100+ supplemental datasets.
Uses DuckDB for sub-second analytical queries without loading full data into RAM.
"""

import duckdb
import pandas as pd
import os
import logging
import json
from pathlib import Path
from typing import Dict, List, Optional, Any, Tuple
from dataclasses import dataclass, field
import numpy as np
from scipy import stats
import random
import re

logger = logging.getLogger(__name__)


def _sanitize(val: str) -> str:
    """Sanitize user input to prevent SQL injection.
    Strips all characters except alphanumeric, spaces, hyphens, dots, and underscores."""
    if val is None:
        return None
    return re.sub(r"[^\w\s\-\.]", "", str(val).strip())[:100]


@dataclass
class QueryResult:
    data: Any
    columns: List[str]
    total_rows: int
    viz_type: str   # table | bar | line | pie | scatter | network | map
    summary: str
    metadata: Dict = field(default_factory=dict)

    def to_dict(self):
        data = self.data
        if isinstance(data, pd.DataFrame):
            data = data.to_dict(orient="records")
        return {
            "data": data,
            "columns": self.columns,
            "total_rows": self.total_rows,
            "viz_type": self.viz_type,
            "summary": self.summary,
            "metadata": self.metadata,
        }


class CrimeDataEngine:
    """
    Central data engine for KSP CrimeIntel.
    - FIR data queried via DuckDB directly from CSV (no memory overhead)
    - Supplemental datasets pre-loaded into DuckDB in-memory tables
    - All heavy aggregates pre-computed at startup for fast dashboard loads
    """

    def __init__(self, data_dir: str):
        self.data_dir = Path(data_dir)
        self.conn = duckdb.connect(database=":memory:")
        logger.info(f"Connected to DB. Tables: {[t[0] for t in self.conn.execute('SHOW TABLES').fetchall()]}")
        self._set_paths()
        self._create_views()
        self._load_supplemental_data()
        self._precompute_aggregates()
        self._setup_admin()
        logger.info("CrimeDataEngine ready ✓")

    # ─────────────────────────── setup ────────────────────────────

    def _set_paths(self):
        def fp(*parts):
            return str(Path(self.data_dir, *parts)).replace("\\", "/")

        self.fir_path   = fp("karnataka fir", "FIR_Details_Data.csv")
        self.ipc_dir    = fp("crime trend and hotspot")
        self.aspects    = fp("crime aspects diffn states")
        self.socio_path = fp("crime and socioeconomy indicator", "india_crime_socioeconomic_data_700.csv")

    def _create_views(self):
        """Create DuckDB views that point to CSV files — no full data load."""
        # FIR data (1.67 M rows) — DuckDB reads it lazily via projection pushdown
        try:
            self.conn.execute(f"""
                CREATE OR REPLACE VIEW fir_raw AS
                SELECT * FROM read_csv_auto('{self.fir_path}', ignore_errors=true)
            """)
            self.conn.execute("""
                CREATE OR REPLACE VIEW fir AS
                SELECT 
                    District_Name                                          AS district,
                    UnitName                                               AS unit,
                    'UNKNOWN'                                              AS fir_no,
                    TRY_CAST(FIR_YEAR   AS INTEGER)                        AS year,
                    TRY_CAST(FIR_MONTH  AS INTEGER)                        AS month,
                    FIR_Day                                                AS day,
                    "FIR Type"                                             AS fir_type,
                    FIR_Stage                                              AS stage,
                    Complaint_Mode                                         AS complaint_mode,
                    CrimeGroup_Name                                        AS crime_group,
                    CrimeHead_Name                                         AS crime_head,
                    TRY_CAST(Latitude   AS DOUBLE)                         AS lat,
                    TRY_CAST(Longitude  AS DOUBLE)                         AS lon,
                    ActSection                                             AS act_section,
                    IOName                                                 AS io_name,
                    KGID                                                   AS kgid,
                    "Place of Offence"                                     AS place,
                    Beat_Name                                              AS beat,
                    Village_Area_Name                                      AS village,
                    TRY_CAST(Male       AS INTEGER)                        AS victim_male,
                    TRY_CAST(Female     AS INTEGER)                        AS victim_female,
                    TRY_CAST(Boy        AS INTEGER)                        AS victim_boy,
                    TRY_CAST(Girl       AS INTEGER)                        AS victim_girl,
                    TRY_CAST("VICTIM COUNT" AS INTEGER)                    AS victim_count,
                    TRY_CAST("Accused Count" AS INTEGER)                   AS accused_count,
                    TRY_CAST("Arrested Male" AS INTEGER)                   AS arrested_male,
                    TRY_CAST("Arrested Female" AS INTEGER)                 AS arrested_female,
                    TRY_CAST("Accused_ChargeSheeted Count" AS INTEGER)     AS chargesheeted,
                    TRY_CAST("Conviction Count" AS INTEGER)                AS convictions,
                    Unit_ID                                                AS unit_id
                FROM fir_raw
            """)
            cnt = self.conn.execute("SELECT COUNT(*) FROM fir").fetchone()[0]
            logger.info(f"FIR view ready — {cnt:,} records")
        except Exception as e:
            logger.error(f"FIR view error: {e}")

        # IPC multi-year district data — using UNION ALL BY NAME to handle schema drift
        try:
            ipc_files = [
                f"{self.ipc_dir}/01_District_wise_crimes_committed_IPC_2001_2012.csv",
                f"{self.ipc_dir}/01_District_wise_crimes_committed_IPC_2013.csv",
                f"{self.ipc_dir}/01_District_wise_crimes_committed_IPC_2014.csv",
            ]
            union = " UNION ALL BY NAME ".join([
                f"SELECT * FROM read_csv_auto('{f}', ignore_errors=true)"
                for f in ipc_files
            ])
            self.conn.execute(f"CREATE OR REPLACE VIEW ipc_district_raw AS {union}")
            self.conn.execute("""
                CREATE OR REPLACE VIEW ipc_district AS 
                SELECT 
                    COALESCE("STATE/UT", "States/UTs") AS "STATE/UT",
                    DISTRICT, 
                    YEAR, 
                    MURDER, 
                    RAPE, 
                    THEFT, 
                    ROBBERY, 
                    BURGLARY, 
                    RIOTS, 
                    "TOTAL IPC CRIMES"
                FROM ipc_district_raw
            """)
            logger.info("IPC district view ready")
        except Exception as e:
            logger.warning(f"IPC view: {e}")

        # Socioeconomic data
        try:
            self.conn.execute(f"""
                CREATE OR REPLACE VIEW socio AS
                SELECT * FROM read_csv_auto('{self.socio_path}', ignore_errors=true)
            """)
            logger.info("Socioeconomic view ready")
        except Exception as e:
            logger.warning(f"Socio view: {e}")

    def _load_supplemental_data(self):
        datasets = {
            "crime_women":    f"{self.aspects}/42_Cases_under_crime_against_women.csv",
            "murder_victims": f"{self.ipc_dir}/32_Murder_victim_age_sex.csv",
            "murder_motives": f"{self.ipc_dir}/19_Motive_or_cause_of_murder_and_culpable_homicide_not_amounting_to_murder.csv",
            "auto_theft":     f"{self.ipc_dir}/30_Auto_theft.csv",
            "kidnapping":     f"{self.ipc_dir}/39_Specific_purpose_of_kidnapping_and_abduction.csv",
            "rape_victims":   f"{self.aspects}/20_Victims_of_rape.csv",
            "arrests_women":  f"{self.aspects}/43_Arrests_under_crime_against_women.csv",
            "property":       f"{self.ipc_dir}/10_Property_stolen_and_recovered.csv",
        }
        for tbl, path in datasets.items():
            try:
                self.conn.execute(f"""
                    CREATE OR REPLACE TABLE {tbl} AS
                    SELECT * FROM read_csv_auto('{path}', ignore_errors=true)
                """)
                logger.info(f"  {tbl} loaded")
            except Exception as e:
                logger.warning(f"  {tbl}: {e}")

    def _precompute_aggregates(self):
        try:
            self.conn.execute("""
                CREATE OR REPLACE TABLE agg_district_year AS
                SELECT
                    district, year, crime_group,
                    COUNT(*)                         AS cases,
                    SUM(victim_count)                AS victims,
                    SUM(accused_count)               AS accused,
                    SUM(convictions)                 AS convictions,
                    SUM(chargesheeted)               AS chargesheeted,
                    COUNT(DISTINCT unit)             AS ps_count
                FROM fir
                WHERE district IS NOT NULL AND year IS NOT NULL
                GROUP BY district, year, crime_group
            """)
            self.conn.execute("""
                CREATE OR REPLACE TABLE agg_monthly AS
                SELECT
                    year, month, district, crime_group,
                    COUNT(*) AS cases
                FROM fir
                WHERE year IS NOT NULL AND month BETWEEN 1 AND 12
                GROUP BY year, month, district, crime_group
            """)
            logger.info("Pre-computed aggregates ready")
        except Exception as e:
            logger.warning(f"Aggregate pre-compute: {e}")

    def _setup_admin(self):
        try:
            self.conn.execute("""
                CREATE TABLE IF NOT EXISTS users (
                    id VARCHAR PRIMARY KEY,
                    username VARCHAR UNIQUE,
                    password_hash VARCHAR,
                    role VARCHAR,
                    badge VARCHAR
                )
            """)
            self.conn.execute("""
                CREATE TABLE IF NOT EXISTS audit_log (
                    id VARCHAR PRIMARY KEY,
                    user_name VARCHAR,
                    badge VARCHAR,
                    action VARCHAR,
                    resource VARCHAR,
                    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    status VARCHAR
                )
            """)
            # Seed default admin if missing
            cnt = self.conn.execute("SELECT COUNT(*) FROM users").fetchone()[0]
            if cnt == 0:
                # Password hash for 'admin123' just as plain for this demo to match auth.py easily, or use proper hash.
                # Actually main.py login check is currently hardcoded `username == 'admin'`. We'll just hash 'admin123' if we use a library.
                self.conn.execute("INSERT INTO users VALUES ('USR-001', 'admin', 'admin', 'admin', 'KSP-0001')")
            logger.info("RBAC tables ready")
        except Exception as e:
            logger.warning(f"RBAC setup: {e}")

    # ─────────────────────── public API ───────────────────────────

    def get_kpis(self) -> Dict:
        try:
            total    = self.conn.execute("SELECT COUNT(*) FROM fir").fetchone()[0]
            districts= self.conn.execute("SELECT COUNT(DISTINCT district) FROM fir").fetchone()[0]
            yr       = self.conn.execute("SELECT MIN(year), MAX(year) FROM fir WHERE year > 0").fetchone()
            top_crime= self.conn.execute("""
                SELECT crime_group, SUM(cases) s FROM agg_district_year
                WHERE crime_group IS NOT NULL GROUP BY crime_group ORDER BY s DESC LIMIT 1
            """).fetchone()
            conv     = self.conn.execute("SELECT SUM(convictions), SUM(accused) FROM agg_district_year").fetchone()
            top_dist = self.conn.execute("""
                SELECT district, SUM(cases) s FROM agg_district_year
                WHERE district IS NOT NULL GROUP BY district ORDER BY s DESC LIMIT 1
            """).fetchone()

            conviction_rate = 0
            if conv and conv[1] and conv[1] > 0:
                conviction_rate = round(conv[0] / conv[1] * 100, 1)

            return {
                "total_firs":       total,
                "total_districts":  districts,
                "year_range":       f"{yr[0]}–{yr[1]}" if yr and yr[0] else "2016–2023",
                "top_crime":        top_crime[0] if top_crime else "—",
                "conviction_rate":  conviction_rate,
                "top_district":     top_dist[0] if top_dist else "—",
            }
        except Exception as e:
            logger.error(f"KPI error: {e}")
            return {}

    # ─── hotspots ─────────────────────────────────────────────────

    def get_hotspots(self, crime_type: Optional[str] = None,
                     year: Optional[int] = None, top_n: int = 15) -> QueryResult:
        conds = ["district IS NOT NULL"]
        if crime_type:
            ct = _sanitize(crime_type)
            conds.append(f"(LOWER(crime_group) LIKE LOWER('%{ct}%') OR LOWER(crime_head) LIKE LOWER('%{ct}%'))")
        if year:
            conds.append(f"year = {int(year)}")
        top_n = min(int(top_n), 50)
        where = " AND ".join(conds)

        try:
            df = self.conn.execute(f"""
                SELECT
                    district,
                    COUNT(*)            AS cases,
                    SUM(victim_count)   AS victims,
                    SUM(convictions)    AS convictions,
                    COUNT(DISTINCT unit)AS stations,
                    ROUND(COUNT(*)*1.0/NULLIF(COUNT(DISTINCT unit),0),1) AS cases_per_station
                FROM fir WHERE {where}
                GROUP BY district ORDER BY cases DESC LIMIT {top_n}
            """).fetchdf()
            return QueryResult(
                data=df.to_dict(orient="records"), columns=list(df.columns),
                total_rows=len(df), viz_type="bar",
                summary=f"Top {top_n} crime hotspot districts" + (f" — {crime_type}" if crime_type else ""),
                metadata={"crime_type": crime_type, "year": year},
            )
        except Exception as e:
            return QueryResult(data=[], columns=[], total_rows=0, viz_type="bar", summary=str(e))

    # ─── trends ───────────────────────────────────────────────────

    def get_trends(self, crime_type: Optional[str] = None,
                   district: Optional[str] = None,
                   year_start: int = 2016, year_end: int = 2023) -> QueryResult:
        conds = [f"year BETWEEN {int(year_start)} AND {int(year_end)}", "year IS NOT NULL"]
        if crime_type:
            ct = _sanitize(crime_type)
            conds.append(f"(LOWER(crime_group) LIKE LOWER('%{ct}%') OR LOWER(crime_head) LIKE LOWER('%{ct}%'))")
        if district:
            d = _sanitize(district)
            conds.append(f"LOWER(district) LIKE LOWER('%{d}%')")
        where = " AND ".join(conds)

        try:
            df = self.conn.execute(f"""
                SELECT year, COUNT(*) AS cases,
                       SUM(victim_count)  AS victims,
                       SUM(accused_count) AS accused
                FROM fir WHERE {where}
                GROUP BY year ORDER BY year
            """).fetchdf()
            return QueryResult(
                data=df.to_dict(orient="records"), columns=list(df.columns),
                total_rows=len(df), viz_type="line",
                summary=f"Crime trend {year_start}–{year_end}"
                        + (f" — {crime_type}" if crime_type else "")
                        + (f" in {district}" if district else ""),
                metadata={"crime_type": crime_type, "district": district},
            )
        except Exception as e:
            return QueryResult(data=[], columns=[], total_rows=0, viz_type="line", summary=str(e))

    # ─── district comparison ───────────────────────────────────────

    def get_district_comparison(self, crime_type: Optional[str] = None,
                                year: Optional[int] = None, top_n: int = 10) -> QueryResult:
        conds = ["district IS NOT NULL"]
        if crime_type:
            ct = _sanitize(crime_type)
            conds.append(f"(LOWER(crime_group) LIKE LOWER('%{ct}%') OR LOWER(crime_head) LIKE LOWER('%{ct}%'))")
        if year:
            conds.append(f"year = {int(year)}")
        top_n = min(int(top_n), 30)
        where = " AND ".join(conds)

        try:
            df = self.conn.execute(f"""
                SELECT
                    district,
                    COUNT(*) AS cases,
                    SUM(victim_count)  AS victims,
                    SUM(accused_count) AS accused,
                    SUM(convictions)   AS convictions,
                    ROUND(SUM(convictions)*100.0/NULLIF(SUM(accused_count),0),1) AS conviction_pct
                FROM fir WHERE {where}
                GROUP BY district ORDER BY cases DESC LIMIT {top_n}
            """).fetchdf()
            return QueryResult(
                data=df.to_dict(orient="records"), columns=list(df.columns),
                total_rows=len(df), viz_type="bar",
                summary=f"Top {top_n} districts by {crime_type or 'total'} cases" + (f" in {year}" if year else ""),
            )
        except Exception as e:
            return QueryResult(data=[], columns=[], total_rows=0, viz_type="bar", summary=str(e))

    # ─── crime breakdown (pie) ────────────────────────────────────

    def get_crime_breakdown(self, district: Optional[str] = None,
                            year: Optional[int] = None) -> QueryResult:
        conds = ["crime_group IS NOT NULL"]
        if district:
            d = _sanitize(district)
            conds.append(f"LOWER(district) LIKE LOWER('%{d}%')")
        if year:
            conds.append(f"year = {int(year)}")
        where = " AND ".join(conds)

        try:
            df = self.conn.execute(f"""
                SELECT crime_group,
                       COUNT(*) AS cases,
                       ROUND(COUNT(*)*100.0/SUM(COUNT(*)) OVER(),2) AS pct
                FROM fir WHERE {where}
                GROUP BY crime_group ORDER BY cases DESC LIMIT 15
            """).fetchdf()
            return QueryResult(
                data=df.to_dict(orient="records"), columns=list(df.columns),
                total_rows=len(df), viz_type="pie",
                summary="Crime category breakdown" + (f" — {district}" if district else ""),
            )
        except Exception as e:
            return QueryResult(data=[], columns=[], total_rows=0, viz_type="pie", summary=str(e))

    # ─── monthly pattern ──────────────────────────────────────────

    def get_monthly_pattern(self, district: Optional[str] = None,
                            crime_type: Optional[str] = None,
                            year: Optional[int] = None) -> QueryResult:
        MONTHS = {1:"Jan",2:"Feb",3:"Mar",4:"Apr",5:"May",6:"Jun",
                  7:"Jul",8:"Aug",9:"Sep",10:"Oct",11:"Nov",12:"Dec"}
        conds = ["month BETWEEN 1 AND 12"]
        if district:
            d = _sanitize(district)
            conds.append(f"LOWER(district) LIKE LOWER('%{d}%')")
        if crime_type:
            ct = _sanitize(crime_type)
            conds.append(f"(LOWER(crime_group) LIKE LOWER('%{ct}%') OR LOWER(crime_head) LIKE LOWER('%{ct}%'))")
        if year:
            conds.append(f"year = {int(year)}")
        where = " AND ".join(conds)

        try:
            df = self.conn.execute(f"""
                SELECT month AS month_num, COUNT(*) AS cases
                FROM fir WHERE {where}
                GROUP BY month ORDER BY month
            """).fetchdf()
            df["month"] = df["month_num"].map(MONTHS)
            return QueryResult(
                data=df.to_dict(orient="records"), columns=list(df.columns),
                total_rows=len(df), viz_type="bar",
                summary="Monthly crime pattern (seasonal analysis)",
            )
        except Exception as e:
            return QueryResult(data=[], columns=[], total_rows=0, viz_type="bar", summary=str(e))

    # ─── prediction ───────────────────────────────────────────────

    def predict_crime(self, district: Optional[str] = None,
                      crime_type: Optional[str] = None,
                      target_year: int = 2026) -> QueryResult:
        hist = self.get_trends(crime_type=crime_type, district=district,
                               year_start=2016, year_end=2023)
        if not hist.data or len(hist.data) < 3:
            return QueryResult(data=[], columns=[], total_rows=0, viz_type="line",
                               summary="Insufficient historical data for prediction (need ≥3 years).")
        df = pd.DataFrame(hist.data).dropna(subset=["year", "cases"])
        x = df["year"].values.astype(float)
        y = df["cases"].values.astype(float)
        slope, intercept, r, p, se = stats.linregress(x, y)

        last_yr = int(df["year"].max())
        pred_years = list(range(last_yr + 1, target_year + 1))
        historical = [{"year": int(r["year"]), "cases": int(r["cases"]), "type": "actual"} for _, r in df.iterrows()]
        predictions= [{"year": y2, "cases": max(0, int(slope*y2+intercept)), "type": "predicted"} for y2 in pred_years]
        direction  = "↑ Increasing" if slope > 0 else "↓ Decreasing"

        return QueryResult(
            data=historical + predictions, columns=["year","cases","type"],
            total_rows=len(historical)+len(predictions), viz_type="line",
            summary=(f"Trend: **{direction}** at {abs(slope):.1f} cases/year. "
                     f"Predicted {target_year}: **{max(0,int(slope*target_year+intercept)):,}** cases "
                     f"(R²={r**2:.2f}, p={p:.3f})"),
            metadata={"slope": round(slope, 2), "r_squared": round(r**2, 3),
                      "p_value": round(p, 4), "target_year": target_year},
        )

    # ─── network (district ↔ crime co-occurrence) ─────────────────

    def get_network_data(self, district: Optional[str] = None,
                         crime_type: Optional[str] = None,
                         year: Optional[int] = None) -> QueryResult:
        conds = ["district IS NOT NULL", "crime_group IS NOT NULL"]
        if district:
            d = _sanitize(district)
            conds.append(f"LOWER(district) LIKE LOWER('%{d}%')")
        if crime_type:
            ct = _sanitize(crime_type)
            conds.append(f"(LOWER(crime_group) LIKE LOWER('%{ct}%') OR LOWER(crime_head) LIKE LOWER('%{ct}%'))")
        if year:
            conds.append(f"year = {int(year)}")
        where = " AND ".join(conds)

        try:
            df = self.conn.execute(f"""
                SELECT district, crime_group, SUM(cases) AS weight
                FROM agg_district_year WHERE {where}
                GROUP BY district, crime_group HAVING weight > 10
                ORDER BY weight DESC LIMIT 120
            """).fetchdf()

            top_districts = df.groupby("district")["weight"].sum().nlargest(12).index.tolist()
            top_crimes    = df.groupby("crime_group")["weight"].sum().nlargest(8).index.tolist()
            df = df[df["district"].isin(top_districts) & df["crime_group"].isin(top_crimes)]

            nodes, edges, seen = [], [], set()
            for d in top_districts:
                nodes.append({"id": d, "label": d, "type": "district", "size": 25, "color": "#1F6FEB"})
                seen.add(d)
            for c in top_crimes:
                nodes.append({"id": c, "label": c[:35], "type": "crime", "size": 15, "color": "#E3B341"})
                seen.add(c)
            for _, row in df.iterrows():
                if row["district"] in seen and row["crime_group"] in seen:
                    edges.append({"from": row["district"], "to": row["crime_group"],
                                  "weight": int(row["weight"]), "label": str(int(row["weight"]))})

            return QueryResult(
                data={"nodes": nodes, "edges": edges}, columns=["nodes","edges"],
                total_rows=len(edges), viz_type="network",
                summary=f"Pattern network: {len(nodes)} nodes, {len(edges)} connections",
            )
        except Exception as e:
            return QueryResult(data={}, columns=[], total_rows=0, viz_type="network", summary=str(e))

    # ─── map (geospatial coordinates) ───────────────────────────────

    def get_map_data(self, district: Optional[str] = None,
                     crime_type: Optional[str] = None,
                     year: Optional[int] = None) -> QueryResult:
        conds = ["lat IS NOT NULL", "lon IS NOT NULL", "lat BETWEEN 11.0 AND 19.0", "lon BETWEEN 74.0 AND 79.0"]
        if district:
            d = _sanitize(district)
            conds.append(f"LOWER(district) LIKE LOWER('%{d}%')")
        if crime_type:
            ct = _sanitize(crime_type)
            conds.append(f"(LOWER(crime_group) LIKE LOWER('%{ct}%') OR LOWER(crime_head) LIKE LOWER('%{ct}%'))")
        if year:
            conds.append(f"year = {int(year)}")
        where = " AND ".join(conds)

        try:
            # Sample up to 8000 points for a dense scatter map
            df = self.conn.execute(f"""
                SELECT lat, lon, crime_group, district
                FROM fir WHERE {where}
                USING SAMPLE 8000
            """).fetchdf()

            return QueryResult(
                data=df.to_dict(orient="records"), columns=list(df.columns),
                total_rows=len(df), viz_type="scatter",
                summary="Geospatial crime mapping",
            )
        except Exception as e:
            return QueryResult(data=[], columns=[], total_rows=0, viz_type="scatter", summary=str(e))

    # ─── socioeconomic correlation ────────────────────────────────
    def get_socio_correlation(self) -> QueryResult:
        try:
            df = self.conn.execute("""
                SELECT
                    "State/UT"                  AS state,
                    Year                        AS year,
                    "GDP per Capita (INR)"      AS gdp,
                    "Literacy Rate (%)"         AS literacy,
                    "Poverty Rate (%)"          AS poverty,
                    "Unemployment Rate (%)"     AS unemployment,
                    "Total Crimes Reported"     AS total_crimes,
                    "Crime Rate per 100,000"    AS crime_rate
                FROM socio
                WHERE "Total Crimes Reported" IS NOT NULL
                ORDER BY total_crimes DESC LIMIT 100
            """).fetchdf()
            return QueryResult(
                data=df.to_dict(orient="records"), columns=list(df.columns),
                total_rows=len(df), viz_type="scatter",
                summary="Socioeconomic factors vs Crime rate (literacy, poverty, GDP correlation)",
            )
        except Exception as e:
            return QueryResult(data=[], columns=[], total_rows=0, viz_type="scatter", summary=str(e))

    # ─── victim profile ───────────────────────────────────────────

    def get_victim_profile(self, crime_type: Optional[str] = None,
                           district: Optional[str] = None) -> QueryResult:
        conds = ["1=1"]
        if crime_type:
            ct = _sanitize(crime_type)
            conds.append(f"(LOWER(crime_group) LIKE LOWER('%{ct}%') OR LOWER(crime_head) LIKE LOWER('%{ct}%'))")
        if district:
            d = _sanitize(district)
            conds.append(f"LOWER(district) LIKE LOWER('%{d}%')")
        where = " AND ".join(conds)

        try:
            row = self.conn.execute(f"""
                SELECT
                    SUM(victim_male)   AS male,
                    SUM(victim_female) AS female,
                    SUM(victim_boy)    AS boys,
                    SUM(victim_girl)   AS girls,
                    SUM(victim_count)  AS total,
                    SUM(arrested_male) AS arr_male,
                    SUM(arrested_female) AS arr_female
                FROM fir WHERE {where}
            """).fetchone()
            profile = [
                {"category": "Male Victims",      "count": int(row[0] or 0)},
                {"category": "Female Victims",     "count": int(row[1] or 0)},
                {"category": "Boy Victims",        "count": int(row[2] or 0)},
                {"category": "Girl Victims",       "count": int(row[3] or 0)},
                {"category": "Arrested (Male)",    "count": int(row[5] or 0)},
                {"category": "Arrested (Female)",  "count": int(row[6] or 0)},
            ]
            return QueryResult(
                data=profile, columns=["category","count"],
                total_rows=int(row[4] or 0), viz_type="bar",
                summary=f"Victim/accused demographic profile — {int(row[4] or 0):,} total victims",
            )
        except Exception as e:
            return QueryResult(data=[], columns=[], total_rows=0, viz_type="bar", summary=str(e))

    # ─── conviction rates ─────────────────────────────────────────

    def get_conviction_analysis(self, top_n: int = 15) -> QueryResult:
        try:
            df = self.conn.execute(f"""
                SELECT
                    district,
                    SUM(cases)          AS total_cases,
                    SUM(chargesheeted)  AS chargesheeted,
                    SUM(convictions)    AS convictions,
                    ROUND(SUM(convictions)*100.0/NULLIF(SUM(chargesheeted),0),1) AS conviction_pct,
                    ROUND(SUM(chargesheeted)*100.0/NULLIF(SUM(cases),0),1)       AS chargesheet_pct
                FROM agg_district_year
                WHERE district IS NOT NULL
                GROUP BY district
                ORDER BY convictions DESC LIMIT {top_n}
            """).fetchdf()
            return QueryResult(
                data=df.to_dict(orient="records"), columns=list(df.columns),
                total_rows=len(df), viz_type="bar",
                summary=f"Conviction & chargesheet rates by district (top {top_n})",
            )
        except Exception as e:
            return QueryResult(data=[], columns=[], total_rows=0, viz_type="bar", summary=str(e))

    # ─── FIR direct query ────────────────────────────────────────

    def query_fir(self, district: Optional[str] = None,
                  crime_type: Optional[str] = None,
                  year_start: Optional[int] = None,
                  year_end: Optional[int] = None,
                  month: Optional[int] = None,
                  limit: int = 50) -> QueryResult:
        conds = ["1=1"]
        if district:
            d = _sanitize(district)
            conds.append(f"LOWER(district) LIKE LOWER('%{d}%')")
        if crime_type:
            ct = _sanitize(crime_type)
            conds.append(f"(LOWER(crime_group) LIKE LOWER('%{ct}%') OR LOWER(crime_head) LIKE LOWER('%{ct}%'))")
        if year_start:
            conds.append(f"year >= {int(year_start)}")
        if year_end:
            conds.append(f"year <= {int(year_end)}")
        if month:
            conds.append(f"month = {int(month)}")
        limit = min(int(limit), 200)
        where = " AND ".join(conds)

        try:
            total = self.conn.execute(f"SELECT COUNT(*) FROM fir WHERE {where}").fetchone()[0]
            df = self.conn.execute(f"""
                SELECT district, unit, year, month, crime_group, crime_head,
                       complaint_mode, stage, fir_type, place, beat,
                       victim_count, accused_count, convictions
                FROM fir WHERE {where} LIMIT {limit}
            """).fetchdf()
            return QueryResult(
                data=df.to_dict(orient="records"), columns=list(df.columns),
                total_rows=total, viz_type="table",
                summary=f"{total:,} FIR records match your query (showing {min(limit, total)})",
            )
        except Exception as e:
            return QueryResult(data=[], columns=[], total_rows=0, viz_type="table", summary=str(e))

    # ─── Data Entry (Register FIR) ────────────────────────────────

    def register_fir(self, data: Dict[str, Any]) -> bool:
        """Appends a new FIR record to the CSV and makes it available to queries."""
        try:
            import csv
            with open(self.fir_path, 'a', newline='', encoding='utf-8') as f:
                writer = csv.writer(f)
                row = [""] * 41
                row[0] = data.get("district", "Bengaluru Urban")
                row[1] = data.get("station", "Central PS")
                row[2] = data.get("fir_no", "FIR-" + str(random.randint(1000, 9999)))
                row[3] = data.get("date", "15/07/2026 10:00:00")
                row[4] = "2026"
                row[5] = "7"
                row[6] = "15"
                row[14] = data.get("crime_group", "THEFT")
                row[15] = data.get("crime_head", "THEFT - DAY")
                row[16] = str(data.get("lat", "12.9716"))
                row[17] = str(data.get("lon", "77.5946"))
                row[25] = data.get("place", "Unknown Place")
                row[37] = data.get("accused", "Unknown")
                writer.writerow(row)
            return True
        except Exception as e:
            logger.error(f"Failed to register FIR: {e}")
            return False

    # ─── meta helpers ─────────────────────────────────────────────

    def get_all_districts(self) -> List[str]:
        try:
            return [r[0] for r in self.conn.execute(
                "SELECT DISTINCT district FROM fir WHERE district IS NOT NULL ORDER BY district"
            ).fetchall()]
        except:
            return []

    def get_all_crime_groups(self) -> List[str]:
        try:
            return [r[0] for r in self.conn.execute(
                "SELECT DISTINCT crime_group FROM fir WHERE crime_group IS NOT NULL ORDER BY crime_group"
            ).fetchall()]
        except:
            return []

    def get_overview_charts(self) -> Dict:
        """Bundle for dashboard: hotspots + breakdown + trend in one call."""
        return {
            "hotspots":  self.get_hotspots(top_n=10).to_dict(),
            "breakdown": self.get_crime_breakdown().to_dict(),
            "trend":     self.get_trends().to_dict(),
            "monthly":   self.get_monthly_pattern().to_dict(),
        }
