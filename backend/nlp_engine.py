"""
KSP CrimeIntel — NLP Engine
Parses natural-language queries (English + Kannada) into structured QueryIntent objects.
Primary: Google Gemini 2.0 Flash  |  Fallback: Comprehensive rule-based parser
"""

import os
import re
import json
import logging
from dataclasses import dataclass, field
from typing import List, Optional, Dict

logger = logging.getLogger(__name__)

# ──────────────────────── vocabulary ──────────────────────────────

CRIME_MAP = {
    "murder":       ["murder", "killing", "homicide", "culpable", "killed", "ಕೊಲೆ"],
    "rape":         ["rape", "sexual assault", "pocso", "sexual offence", "ಅತ್ಯಾಚಾರ"],
    "theft":        ["theft", "steal", "stolen", "larceny", "ಕಳ್ಳತನ"],
    "robbery":      ["robbery", "dacoity", "dacoit", "loot", "armed robbery"],
    "burglary":     ["burglary", "house breaking", "break-in", "breaking"],
    "auto_theft":   ["auto theft", "vehicle theft", "car theft", "bike", "motor cycle"],
    "kidnapping":   ["kidnap", "abduction", "abducted", "missing child", "ಅಪಹರಣ"],
    "fraud":        ["fraud", "cheating", "scam", "financial crime", "embezzlement", "ಮೋಸ"],
    "cyber":        ["cyber", "online fraud", "phishing", "hacking", "digital crime"],
    "dowry":        ["dowry", "dowry death", "dowry harassment", "ವರದಕ್ಷಿಣೆ"],
    "assault":      ["assault", "hurt", "grievous hurt", "attack", "battery"],
    "drug":         ["drug", "narcotics", "ndps", "trafficking", "ganja", "heroin"],
    "gambling":     ["gambling", "matka", "betting", "gaming"],
    "traffic":      ["traffic", "road accident", "rash driving", "accident", "hit and run"],
    "corruption":   ["corruption", "bribery", "bribe", "anti-corruption"],
    "riot":         ["riot", "communal", "mob violence", "unlawful assembly"],
    "women":        ["women", "ಮಹಿಳೆ", "gender based"],
    "children":     ["children", "minor", "juvenile"],
    "property":     ["property"],
    "arson":        ["arson", "fire", "burning"],
}

DISTRICT_LIST = [
    "bagalkot", "bangalore", "bengaluru", "bengaluru urban", "bengaluru rural",
    "belagavi", "bellary", "ballari", "bidar", "chamarajanagar", "chikkaballapur",
    "chikkamagaluru", "chitradurga", "dakshina kannada", "davanagere", "dharwad",
    "gadag", "hassan", "haveri", "kodagu", "kolar", "koppal", "mandya", "mysuru",
    "mysore", "raichur", "ramanagara", "shimoga", "shivamogga", "tumakuru",
    "tumkur", "udupi", "uttara kannada", "vijayapura", "bijapur", "yadgir",
]

MONTH_MAP = {
    "january":1,"february":2,"march":3,"april":4,"may":5,"june":6,
    "july":7,"august":8,"september":9,"october":10,"november":11,"december":12,
    "jan":1,"feb":2,"mar":3,"apr":4,"jun":6,"jul":7,"aug":8,
    "sep":9,"oct":10,"nov":11,"dec":12,
}

INTENT_PATTERNS = {
    "hotspot":    [r"hot\s*spot", r"high crime area", r"crime prone", r"most dangerous",
                   r"worst.*district", r"dangerous.*area", r"most.*crime.*district"],
    "trend":      [r"\btrend\b", r"over.*year", r"year.*wise", r"historical",
                   r"\bincrease\b", r"\bdecrease\b", r"how.*changed", r"pattern over",
                   r"growth.*crime", r"crime.*growth"],
    "compare":    [r"\bcompare\b", r"\bvs\.?\b", r"versus", r"top \d+",
                   r"\bhighest\b", r"\blowest\b", r"\branking\b", r"which district.*most",
                   r"most.*district", r"rank.*district", r"best.*worst"],
    "predict":    [r"\bpredict\b", r"\bforecast\b", r"next year", r"\bfuture\b",
                   r"\bexpected\b", r"202[5-9]\b", r"2030\b", r"will.*crime"],
    "network":    [r"\bnetwork\b", r"connection", r"criminal link", r"\bgang\b",
                   r"organized crime", r"crime syndicate", r"crime map"],
    "profile":    [r"\bprofile\b", r"\bbreakdown\b", r"\boverview\b",
                   r"about.*district", r"crime.*in.*district", r"what.*crime.*in"],
    "socio":      [r"socio.?economic", r"\bpoverty\b", r"\bliteracy\b",
                   r"\bgdp\b", r"\bunemployment\b", r"education.*crime",
                   r"economic.*crime", r"correlation.*crime"],
    "victim":     [r"\bvictim\b", r"\bsurvivor\b", r"who.*affected",
                   r"victim.*profile", r"victim.*age", r"demographic.*victim"],
    "conviction": [r"\bconviction\b", r"conviction rate", r"\bchargesheet\b",
                   r"arrest rate", r"\bacquit\b", r"\btrial\b", r"justice.*rate"],
    "monthly":    [r"\bmonthly\b", r"\bseasonal\b", r"month.*pattern",
                   r"which month", r"\bjanuary\b", r"\bfestival\b"],
    "detail":     [r"\blist\b", r"\bshow\b", r"cases.*in\b", r"\bfir\b",
                   r"registered.*cases", r"reported.*cases", r"how many.*cases"],
}

# ──────────────────────── data class ──────────────────────────────

@dataclass
class QueryIntent:
    intent:       str = "general"
    crime_types:  List[str] = field(default_factory=list)
    districts:    List[str] = field(default_factory=list)
    year_start:   Optional[int] = None
    year_end:     Optional[int] = None
    month:        Optional[int] = None
    limit:        int = 10
    target_year:  Optional[int] = None
    demographic:  Dict = field(default_factory=dict)
    original_query: str = ""
    language:     str = "en"

    def to_dict(self):
        return {k: v for k, v in self.__dict__.items()}


# ──────────────────────── engine ──────────────────────────────────

class NLPEngine:
    def __init__(self):
        self.gemini_model = None
        self._init_gemini()


    def _init_gemini(self):
        key = os.getenv("GEMINI_API_KEY", "").strip()
        if not key or key == "your_gemini_api_key_here":
            logger.info("No Gemini key — rule-based NLP active")
            return
        try:
            from google import genai
            self._genai_client = genai.Client(api_key=key)
            self._genai_model_name = "gemini-2.0-flash"
            self.gemini_model = True   # flag for gemini_available property
            logger.info("Gemini 2.0 Flash NLP engine ready ✓")
        except Exception as e:
            logger.warning(f"Gemini init failed ({e}) — using rules")

    # ─── Gemini path ──────────────────────────────────────────────

    async def _gemini_parse(self, query: str) -> QueryIntent:
        prompt = f"""You are a crime data query parser for Karnataka State Police (KSP).
Parse the user query and return ONLY a valid JSON object — no markdown, no extra text.

User query: "{query}"

JSON schema:
{{
  "intent":      "hotspot|trend|compare|predict|network|profile|socio|victim|conviction|monthly|detail|general",
  "crime_types": ["<crime types from: murder rape theft robbery burglary auto_theft kidnapping fraud cyber dowry assault drug gambling traffic corruption riot women children property arson>"],
  "districts":   ["<Karnataka district names only>"],
  "year_start":  <integer|null>,
  "year_end":    <integer|null>,
  "month":       <1-12|null>,
  "limit":       <integer default 10>,
  "target_year": <integer|null — only for predictions>,
  "demographic": {{"sex":"male|female|null","age_group":"child|adult|senior|null","role":"victim|accused|null"}},
  "language":    "en|kn"
}}

Intent guide:
hotspot=dangerous areas, trend=year-over-year change, compare=ranking districts,
predict=future forecast, network=criminal connections, profile=district/crime overview,
socio=socioeconomic correlation, victim=victim demographics, conviction=arrest/conviction rates,
monthly=seasonal patterns, detail=specific case counts/listings, general=fallback."""
        from google import genai
        resp = self._genai_client.models.generate_content(
            model=self._genai_model_name, contents=prompt
        )
        txt  = resp.text.strip()
        txt  = re.sub(r"```json?\s*", "", txt)
        txt  = re.sub(r"```", "", txt).strip()
        d    = json.loads(txt)
        return QueryIntent(
            intent      =d.get("intent","general"),
            crime_types =d.get("crime_types",[]),
            districts   =d.get("districts",[]),
            year_start  =d.get("year_start"),
            year_end    =d.get("year_end"),
            month       =d.get("month"),
            limit       =d.get("limit",10),
            target_year =d.get("target_year"),
            demographic =d.get("demographic",{}),
            original_query=query,
            language    =d.get("language","en"),
        )

    # ─── rule-based path ──────────────────────────────────────────

    def _rule_parse(self, query: str) -> QueryIntent:
        ql = query.lower()

        # language
        lang = "kn" if any(ord(c) > 0x0C7F for c in query) else "en"

        # intent
        intent = "general"
        for name, pats in INTENT_PATTERNS.items():
            if any(re.search(p, ql) for p in pats):
                intent = name
                break

        # crime types
        crimes = [k for k, v in CRIME_MAP.items() if any(re.search(rf"\b{re.escape(c)}\b", ql) for c in v)]
        dists  = [d.title() for d in DISTRICT_LIST if d in ql]

        # years
        raw_years = [int(y) for y in re.findall(r"\b(20\d{2}|19\d{2})\b", query)]
        year_start = raw_years[0]  if raw_years else None
        year_end   = raw_years[-1] if len(raw_years) > 1 else year_start

        # prediction target
        target_year = None
        if intent == "predict":
            future = [y for y in raw_years if y >= 2024]
            target_year = future[0] if future else 2026

        # month
        month = next((v for k, v in MONTH_MAP.items() if k in ql), None)

        # limit
        m = re.search(r"\btop\s*(\d+)\b", ql)
        limit = int(m.group(1)) if m else 10

        # demographic
        demo: Dict = {}
        if re.search(r"\bfemale\b|\bwomen\b|\bwoman\b|\bgirl\b", ql):
            demo["sex"] = "female"
        elif re.search(r"\bmale\b|\bman\b|\bmen\b|\bboy\b", ql):
            demo["sex"] = "male"
        if re.search(r"\bchild\b|\bminor\b|\bjuvenile\b|\bkid\b", ql):
            demo["age_group"] = "child"
        if re.search(r"\bvictim\b|\bsurvivor\b", ql):
            demo["role"] = "victim"
        elif re.search(r"\baccused\b|\bsuspect\b|\bcriminal\b|\boffender\b", ql):
            demo["role"] = "accused"

        return QueryIntent(
            intent=intent, crime_types=crimes, districts=dists,
            year_start=year_start, year_end=year_end, month=month,
            limit=limit, target_year=target_year, demographic=demo,
            original_query=query, language=lang,
        )

    async def parse(self, query: str) -> QueryIntent:
        if self.gemini_available:
            try:
                return await self._gemini_parse(query)
            except Exception as e:
                logger.error(f"Gemini parse failed: {e}")
        return self._rule_parse(query)

    @property
    def gemini_available(self) -> bool:
        return self.gemini_model is True
