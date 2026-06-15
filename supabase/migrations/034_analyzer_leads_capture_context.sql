-- 034_analyzer_leads_capture_context.sql
--
-- Additive, nullable columns on analyzer_leads for the Phase 3 value-gate.
-- The public analyzer now captures email at the FIRST result (to unlock the
-- full theme breakdown + sample AI reply + PDF), not only at the quota wall.
-- These columns let us attribute which surface captured each lead and when.
--
-- ADDITIVE ONLY: no alters to existing columns, no drops, no type changes.
-- Both columns are nullable with no default, so existing rows are unaffected
-- (they read back NULL) and the composite PK (email, package_id) is unchanged.
--
--   unlock_context — which capture surface produced the lead. Written from
--                    src/app/api/tools/analyze-app/email-report/route.ts,
--                    clamped server-side to a known set
--                    (value_gate | quota_gate | pdf_button); anything else → NULL.
--   captured_at    — timestamp of the most recent capture for this
--                    (email, package_id) pair. Set explicitly by the route on
--                    every upsert.

alter table public.analyzer_leads
  add column if not exists unlock_context text;

alter table public.analyzer_leads
  add column if not exists captured_at timestamptz;

comment on column public.analyzer_leads.unlock_context is
  'Capture surface: value_gate | quota_gate | pdf_button (else NULL).';
comment on column public.analyzer_leads.captured_at is
  'Timestamp of the most recent capture for this (email, package_id).';
