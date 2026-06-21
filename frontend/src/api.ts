const BASE = process.env.EXPO_PUBLIC_BACKEND_URL;

export type EngineInput = { torque: number; itt: number; ng: number };

export type EngineResult = {
  torque: number;
  itt: number;
  ng: number;
  max_itt: number;
  max_ng: number;
  itt_margin: number;
  ng_margin: number;
  itt_pass: boolean;
  ng_pass: boolean;
  passed: boolean;
  near_limit: boolean;
  op_limit_exceeded: boolean;
  notes: string[];
};

export type CalcResponse = {
  oat: number;
  pressure_altitude: number;
  engine1: EngineResult;
  engine2?: EngineResult | null;
  overall_pass: boolean;
  trace?: ChartTrace | null;
};

export type ChartTrace = {
  top_y: number;
  carry_y: number;
  tq_x: number;
  itt_x: number;
  ng_x: number;
};

export type CalcRequest = {
  oat: number;
  pressure_altitude: number;
  engine1: EngineInput;
  engine2?: EngineInput | null;
};

export async function calculate(req: CalcRequest): Promise<CalcResponse> {
  const res = await fetch(`${BASE}/api/pac/calculate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(req),
  });
  if (!res.ok) {
    let detail = "Calculation failed";
    try {
      const j = await res.json();
      detail = j.detail || detail;
    } catch {}
    throw new Error(detail);
  }
  return res.json();
}
