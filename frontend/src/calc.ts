import model from "@/src/data/pac_model.json";
import { CalcRequest, CalcResponse, EngineInput, EngineResult, ChartTrace } from "@/src/api";

// ---- Offline Power Assurance model (mirror of backend server.py) ----
type Axis = { x0: number; v0: number; x1: number; v1: number };
type Pt = [number, number];

const CAL = model.cal as { tq: Axis; itt: Axis; ng: Axis };
const LEFT = model.left as { pa: number; pts: Pt[] }[];
const MID = model.mid as { oat: number; pts: Pt[] }[];
const RIGHT = model.right as { oat: number; pts: Pt[] }[];

const LIMIT_ITT = 775;
const LIMIT_NG = 102.4;
const LIMIT_TQ = 105;
const CAUTION_ITT = 10;
const CAUTION_NG = 0.5;

const IMG_W = 2550;
const IMG_H = 1147;
const TOP_Y = 143;

// Supported chart ranges (for edge-of-chart warnings)
export const RANGE = {
  oat: { min: -45, max: 50 },
  pa: { min: -1000, max: 14000 },
  tq: { min: 90, max: 105 },
};

const x2v = (c: Axis, x: number) => c.v0 + ((x - c.x0) * (c.v1 - c.v0)) / (c.x1 - c.x0);
const v2x = (c: Axis, v: number) => c.x0 + ((v - c.v0) * (c.x1 - c.x0)) / (c.v1 - c.v0);

function interpYatX(pts: Pt[], xt: number): number {
  const p = [...pts].sort((a, b) => a[0] - b[0]);
  if (xt <= p[0][0]) {
    const [x0, y0] = p[0];
    const [x1, y1] = p[1];
    return y0 + ((y1 - y0) * (xt - x0)) / (x1 - x0);
  }
  if (xt >= p[p.length - 1][0]) {
    const [x0, y0] = p[p.length - 2];
    const [x1, y1] = p[p.length - 1];
    return y0 + ((y1 - y0) * (xt - x0)) / (x1 - x0);
  }
  for (let j = 0; j < p.length - 1; j++) {
    if (p[j][0] <= xt && xt <= p[j + 1][0]) {
      const [x0, y0] = p[j];
      const [x1, y1] = p[j + 1];
      return x1 === x0 ? y0 : y0 + ((y1 - y0) * (xt - x0)) / (x1 - x0);
    }
  }
  return p[p.length - 1][1];
}

function interpXatY(pts: Pt[], yt: number): number {
  const p = [...pts].sort((a, b) => a[1] - b[1]);
  if (yt <= p[0][1]) {
    const [x0, y0] = p[0];
    const [x1, y1] = p[1];
    return x0 + ((x1 - x0) * (yt - y0)) / (y1 - y0);
  }
  if (yt >= p[p.length - 1][1]) {
    const [x0, y0] = p[p.length - 2];
    const [x1, y1] = p[p.length - 1];
    return x0 + ((x1 - x0) * (yt - y0)) / (y1 - y0);
  }
  for (let j = 0; j < p.length - 1; j++) {
    if (p[j][1] <= yt && yt <= p[j + 1][1]) {
      const [x0, y0] = p[j];
      const [x1, y1] = p[j + 1];
      return y1 === y0 ? x0 : x0 + ((x1 - x0) * (yt - y0)) / (y1 - y0);
    }
  }
  return p[p.length - 1][0];
}

function linInterpPairs(pairs: [number, number][], x: number): number {
  const p = [...pairs].sort((a, b) => a[0] - b[0]);
  if (x <= p[0][0]) {
    const [[x0, y0], [x1, y1]] = [p[0], p[1]];
    return y0 + ((y1 - y0) * (x - x0)) / (x1 - x0);
  }
  if (x >= p[p.length - 1][0]) {
    const [[x0, y0], [x1, y1]] = [p[p.length - 2], p[p.length - 1]];
    return y0 + ((y1 - y0) * (x - x0)) / (x1 - x0);
  }
  for (let j = 0; j < p.length - 1; j++) {
    if (p[j][0] <= x && x <= p[j + 1][0]) {
      const [x0, y0] = p[j];
      const [x1, y1] = p[j + 1];
      return y0 + ((y1 - y0) * (x - x0)) / (x1 - x0);
    }
  }
  return p[p.length - 1][1];
}

function carryHeight(tq: number, pa: number): number {
  const xtq = v2x(CAL.tq, tq);
  const paPairs = LEFT.map((c) => [c.pa, interpYatX(c.pts, xtq)] as [number, number]);
  return linInterpPairs(paPairs, pa);
}

function lookupMaxLimits(tq: number, pa: number, oat: number): [number, number] {
  const cy = carryHeight(tq, pa);
  const ittPairs = MID.map(
    (c) => [c.oat, x2v(CAL.itt, interpXatY(c.pts, cy))] as [number, number]
  );
  const ngPairs = RIGHT.map(
    (c) => [c.oat, x2v(CAL.ng, interpXatY(c.pts, cy))] as [number, number]
  );
  return [
    Math.round(linInterpPairs(ittPairs, oat) * 10) / 10,
    Math.round(linInterpPairs(ngPairs, oat) * 10) / 10,
  ];
}

function computeTrace(tq: number, pa: number, oat: number): ChartTrace {
  const cy = carryHeight(tq, pa);
  const [maxItt, maxNg] = lookupMaxLimits(tq, pa, oat);
  return {
    top_y: TOP_Y / IMG_H,
    carry_y: cy / IMG_H,
    tq_x: v2x(CAL.tq, tq) / IMG_W,
    itt_x: v2x(CAL.itt, maxItt) / IMG_W,
    ng_x: v2x(CAL.ng, maxNg) / IMG_W,
  };
}

const r1 = (n: number) => Math.round(n * 10) / 10;

function evaluateEngine(oat: number, pa: number, e: EngineInput): EngineResult {
  const [maxItt, maxNg] = lookupMaxLimits(e.torque, pa, oat);
  const ittMargin = r1(maxItt - e.itt);
  const ngMargin = r1(maxNg - e.ng);
  const ittPass = e.itt <= maxItt;
  const ngPass = e.ng <= maxNg;
  const passed = ittPass && ngPass;
  const nearLimit = passed && (ittMargin <= CAUTION_ITT || ngMargin <= CAUTION_NG);

  const notes: string[] = [];
  let opExceeded = false;
  if (e.itt > LIMIT_ITT) {
    notes.push(`ITT ${e.itt}°C exceeds operational limit ${LIMIT_ITT}°C`);
    opExceeded = true;
  }
  if (e.ng > LIMIT_NG) {
    notes.push(`NG ${e.ng}% exceeds operational limit ${LIMIT_NG}%`);
    opExceeded = true;
  }
  if (e.torque > LIMIT_TQ) {
    notes.push(`TQ ${e.torque}% exceeds operational limit ${LIMIT_TQ}%`);
    opExceeded = true;
  }
  if (!ittPass) notes.push("Measured ITT exceeds maximum allowable — repeat check / refer to EMM");
  if (!ngPass) notes.push("Measured NG exceeds maximum allowable — repeat check / refer to EMM");

  return {
    torque: e.torque,
    itt: e.itt,
    ng: e.ng,
    max_itt: maxItt,
    max_ng: maxNg,
    itt_margin: ittMargin,
    ng_margin: ngMargin,
    itt_pass: ittPass,
    ng_pass: ngPass,
    passed,
    near_limit: nearLimit,
    op_limit_exceeded: opExceeded,
    notes,
    trace: computeTrace(e.torque, pa, oat),
  };
}

/** Fully offline power-assurance computation. */
export function computeCheck(req: CalcRequest): CalcResponse {
  const e1 = evaluateEngine(req.oat, req.pressure_altitude, req.engine1);
  const e2 = req.engine2 ? evaluateEngine(req.oat, req.pressure_altitude, req.engine2) : null;
  const overall = e1.passed && (e2 ? e2.passed : true);
  const trace = computeTrace(req.engine1.torque, req.pressure_altitude, req.oat);
  return {
    oat: req.oat,
    pressure_altitude: req.pressure_altitude,
    engine1: e1,
    engine2: e2,
    overall_pass: overall,
    trace,
  };
}
