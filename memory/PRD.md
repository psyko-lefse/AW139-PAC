# AW139 Power Assurance Calculator — PRD

## Original Problem Statement
Build a mobile power assurance calculator for the AW139 helicopter based on the attached PDF
(AW139 RFM Supplement 12 — Power Assurance Check in Hover Flight, NR=102%, Fig. 4K-2, EASA approved).

## User Choices
- Chart curves digitized from the PDF (approximation; verify before operational use).
- Output: Max allowable ITT & NG + Pass/Fail + margins.
- Supports both Engine 1 and Engine 2 in one session with a combined verdict.
- Units as per chart: OAT °C, Pressure Altitude ft, Torque/NG %, ITT °C.
- Light / clinical instrument-style design.

## User Personas
- AW139 pilots and maintenance engineers performing the hover power assurance check.

## Architecture
- **Backend**: FastAPI (`/app/backend/server.py`). Digitized chart model in `/app/backend/pac_model.json`
  (extracted from the PDF vector geometry, validated against the chart's red worked-example trace).
  Implements the graphical lookup: (TQ, PA) → carry height → (OAT) → Max Allowable ITT & NG via
  piecewise-linear interpolation across 16 pressure-altitude curves and 10 OAT curves per panel.
  - `POST /api/pac/calculate` — returns per-engine max ITT/NG, margins, pass/fail, near-limit, op-limit notes, overall verdict.
  - `POST /api/pac/history`, `GET /api/pac/history` — MongoDB-backed check log (available, not yet surfaced in UI).
- **Frontend**: Expo Router app, two tabs.
  - `Calculate` (`app/(tabs)/index.tsx`): ambient + per-engine inputs, auto-compute (350ms debounce),
    verdict banner, per-engine result cards with margins, twin-engine toggle, reset.
  - `Procedure` (`app/(tabs)/procedure.tsx`): hero, operational limits (775/102.4/105), 10-step procedure, EMM note, source/disclaimer.
  - Keyboard handling via `react-native-keyboard-controller`; SpaceMono tabular numerals.

## Implemented (2026-06-20)
- Digitized chart model + interpolation engine; validated vs worked example (max ITT 718°C, max NG 96.8%).
- Calculate tab with real-time per-engine PASS/FAIL/CAUTION verdicts, signed margins, op-limit notes, haptics.
- Procedure/reference tab. Safety disclaimer throughout.
- Backend 10/10 tests pass; frontend e2e validated.

## Backlog (prioritized)
- **P1**: Surface saved-check history (list/detail) using existing `/api/pac/history` endpoints.
- **P1**: Share/export a completed check as PDF or text.
- **P2**: Editable aircraft tail number / engine serials on each saved record.
- **P2**: Inline chart visualization showing the lookup trace for the entered values.
- **P2**: Imperial/metric toggles (currently chart-native units only).

## Next Tasks
- Confirm digitized values against the user's official chart for a few reference points.
- Implement history list view if the user wants record-keeping (endpoints already exist).
