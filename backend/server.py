from fastapi import FastAPI, APIRouter, HTTPException
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import json
import logging
from pathlib import Path
from pydantic import BaseModel, Field
from typing import List, Optional
import uuid
from datetime import datetime, timezone


ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

app = FastAPI(title="AW139 Power Assurance Calculator")
api_router = APIRouter(prefix="/api")

# ---------------------------------------------------------------------------
# Power Assurance chart model (digitised from AW139 RFM Suppl. 12, Fig 4K-2)
# ---------------------------------------------------------------------------
MODEL = json.loads((ROOT_DIR / 'pac_model.json').read_text())
CAL = MODEL['cal']

# Operational limits from the chart (must not be exceeded while establishing hover)
LIMIT_ITT = 775.0   # deg C
LIMIT_NG = 102.4    # %
LIMIT_TQ = 105.0    # %


def x2v(c, x):
    return c['v0'] + (x - c['x0']) * (c['v1'] - c['v0']) / (c['x1'] - c['x0'])


def v2x(c, v):
    return c['x0'] + (v - c['v0']) * (c['x1'] - c['x0']) / (c['v1'] - c['v0'])


def _interp_y_at_x(pts, xt):
    p = sorted(pts)
    if xt <= p[0][0]:
        x0, y0 = p[0]; x1, y1 = p[1]
        return y0 + (y1 - y0) * (xt - x0) / (x1 - x0)
    if xt >= p[-1][0]:
        x0, y0 = p[-2]; x1, y1 = p[-1]
        return y0 + (y1 - y0) * (xt - x0) / (x1 - x0)
    for j in range(len(p) - 1):
        if p[j][0] <= xt <= p[j + 1][0]:
            x0, y0 = p[j]; x1, y1 = p[j + 1]
            return y0 if x1 == x0 else y0 + (y1 - y0) * (xt - x0) / (x1 - x0)


def _interp_x_at_y(pts, yt):
    p = sorted(pts, key=lambda q: q[1])
    if yt <= p[0][1]:
        x0, y0 = p[0][0], p[0][1]; x1, y1 = p[1][0], p[1][1]
        return x0 + (x1 - x0) * (yt - y0) / (y1 - y0)
    if yt >= p[-1][1]:
        x0, y0 = p[-2][0], p[-2][1]; x1, y1 = p[-1][0], p[-1][1]
        return x0 + (x1 - x0) * (yt - y0) / (y1 - y0)
    for j in range(len(p) - 1):
        if p[j][1] <= yt <= p[j + 1][1]:
            y0 = p[j][1]; x0 = p[j][0]; y1 = p[j + 1][1]; x1 = p[j + 1][0]
            return x0 if y1 == y0 else x0 + (x1 - x0) * (yt - y0) / (y1 - y0)


def _lin_interp_pairs(pairs, x):
    pairs = sorted(pairs)
    if x <= pairs[0][0]:
        (x0, y0), (x1, y1) = pairs[0], pairs[1]
        return y0 + (y1 - y0) * (x - x0) / (x1 - x0)
    if x >= pairs[-1][0]:
        (x0, y0), (x1, y1) = pairs[-2], pairs[-1]
        return y0 + (y1 - y0) * (x - x0) / (x1 - x0)
    for j in range(len(pairs) - 1):
        if pairs[j][0] <= x <= pairs[j + 1][0]:
            x0, y0 = pairs[j]; x1, y1 = pairs[j + 1]
            return y0 + (y1 - y0) * (x - x0) / (x1 - x0)


def lookup_max_limits(tq: float, pa: float, oat: float):
    """Reproduce the graphical lookup: (TQ, PA) -> carry height -> (OAT) -> max ITT & NG."""
    xtq = v2x(CAL['tq'], tq)
    pa_pairs = [(c['pa'], _interp_y_at_x(c['pts'], xtq)) for c in MODEL['left']]
    carry_y = _lin_interp_pairs(pa_pairs, pa)

    itt_pairs = [(c['oat'], x2v(CAL['itt'], _interp_x_at_y(c['pts'], carry_y))) for c in MODEL['mid']]
    max_itt = _lin_interp_pairs(itt_pairs, oat)

    ng_pairs = [(c['oat'], x2v(CAL['ng'], _interp_x_at_y(c['pts'], carry_y))) for c in MODEL['right']]
    max_ng = _lin_interp_pairs(ng_pairs, oat)
    return round(max_itt, 1), round(max_ng, 1)


# ---------------------------------------------------------------------------
# Schemas
# ---------------------------------------------------------------------------
class EngineInput(BaseModel):
    torque: float = Field(..., description="Indicated engine torque TQ (%)")
    itt: float = Field(..., description="Measured ITT (deg C)")
    ng: float = Field(..., description="Measured NG (%)")


class CalcRequest(BaseModel):
    oat: float = Field(..., description="Outside air temperature (deg C)")
    pressure_altitude: float = Field(..., description="Pressure altitude (ft)")
    engine1: EngineInput
    engine2: Optional[EngineInput] = None


class EngineResult(BaseModel):
    torque: float
    itt: float
    ng: float
    max_itt: float
    max_ng: float
    itt_margin: float            # max_itt - measured (positive = within limits)
    ng_margin: float             # max_ng - measured
    itt_pass: bool
    ng_pass: bool
    passed: bool
    near_limit: bool             # within caution band of either limit
    op_limit_exceeded: bool      # measured value above the absolute operational limit
    notes: List[str] = []


class CalcResponse(BaseModel):
    oat: float
    pressure_altitude: float
    engine1: EngineResult
    engine2: Optional[EngineResult] = None
    overall_pass: bool


CAUTION_ITT = 10.0   # deg C caution band below the allowable limit
CAUTION_NG = 0.5     # % caution band below the allowable limit


def evaluate_engine(oat: float, pa: float, e: EngineInput) -> EngineResult:
    max_itt, max_ng = lookup_max_limits(e.torque, pa, oat)
    itt_margin = round(max_itt - e.itt, 1)
    ng_margin = round(max_ng - e.ng, 1)
    itt_pass = e.itt <= max_itt
    ng_pass = e.ng <= max_ng
    passed = itt_pass and ng_pass
    near_limit = passed and (itt_margin <= CAUTION_ITT or ng_margin <= CAUTION_NG)

    notes: List[str] = []
    op_exceeded = False
    if e.itt > LIMIT_ITT:
        notes.append(f"ITT {e.itt}\u00b0C exceeds operational limit {LIMIT_ITT}\u00b0C")
        op_exceeded = True
    if e.ng > LIMIT_NG:
        notes.append(f"NG {e.ng}% exceeds operational limit {LIMIT_NG}%")
        op_exceeded = True
    if e.torque > LIMIT_TQ:
        notes.append(f"TQ {e.torque}% exceeds operational limit {LIMIT_TQ}%")
        op_exceeded = True
    if not itt_pass:
        notes.append("Measured ITT exceeds maximum allowable \u2014 repeat check / refer to EMM")
    if not ng_pass:
        notes.append("Measured NG exceeds maximum allowable \u2014 repeat check / refer to EMM")

    return EngineResult(
        torque=e.torque, itt=e.itt, ng=e.ng,
        max_itt=max_itt, max_ng=max_ng,
        itt_margin=itt_margin, ng_margin=ng_margin,
        itt_pass=itt_pass, ng_pass=ng_pass, passed=passed,
        near_limit=near_limit, op_limit_exceeded=op_exceeded, notes=notes,
    )


# ---------------------------------------------------------------------------
# Routes
# ---------------------------------------------------------------------------
@api_router.get("/")
async def root():
    return {"message": "AW139 Power Assurance Calculator API"}


@api_router.post("/pac/calculate", response_model=CalcResponse)
async def calculate(req: CalcRequest):
    if not (-40 <= req.oat <= 55):
        raise HTTPException(400, "OAT out of supported range (-40 to 55 \u00b0C)")
    if not (-1000 <= req.pressure_altitude <= 14000):
        raise HTTPException(400, "Pressure altitude out of chart range (-1000 to 14000 ft)")

    r1 = evaluate_engine(req.oat, req.pressure_altitude, req.engine1)
    r2 = evaluate_engine(req.oat, req.pressure_altitude, req.engine2) if req.engine2 else None
    overall = r1.passed and (r2.passed if r2 else True)
    return CalcResponse(
        oat=req.oat, pressure_altitude=req.pressure_altitude,
        engine1=r1, engine2=r2, overall_pass=overall,
    )


class CheckRecord(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())
    payload: dict


@api_router.post("/pac/history")
async def save_history(record: dict):
    obj = CheckRecord(payload=record)
    await db.pac_history.insert_one(obj.model_dump())
    return {"id": obj.id}


@api_router.get("/pac/history")
async def get_history():
    rows = await db.pac_history.find().sort("created_at", -1).to_list(100)
    return [{k: v for k, v in r.items() if k != "_id"} for r in rows]


app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

logging.basicConfig(level=logging.INFO,
                    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)


@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
