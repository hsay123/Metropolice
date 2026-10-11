# Redesign log — PhysicalData Network UI pass

Start: 2026-10-11 12:57 IST (90 min budget from here).

## Decisions made without asking (logged per the brief)

1. **Visual authority.** The brief says "keep AGENTS.md Part A (rules, schemas, honesty
   rules)" and "this file overrides its visual direction". AGENTS.md A3 is visual
   direction (radius hierarchy, palette, shell). So: **the brief wins on visuals**; A1/A2
   (audience), A4 (libraries), A5 (routes), A6 (API contract + honesty), A7 (component
   inventory) stay binding. Every radius/palette/shell change gets written into
   `docs/DESIGN.md` v2 **and** mirrored back into `AGENTS.md` A3 so code and docs agree.
2. **Honesty rules beat polish.** "Not enough data yet", the test-token note, mock
   labelling and pending/failed tx states stay. Where the brief calls them slop, they get
   restyled, not deleted.
3. **Tooling.** No Mobbin plan was confirmed in this environment, and browser OAuth needs a
   human, so **Mobbin is skipped** unless the user says otherwise. Impeccable install is
   attempted with a hard timeout; if it fails we fall back to the built-in
   `redesign-existing-projects` skill and the repo's own docs.
4. **No image viewing.** This model cannot view screenshots. Verification is DOM,
   computed-style, geometry and contrast measurement, plus `tsc`/`lint`/`build`. Screens
   needing a human eye are listed in the final report.
5. **Write scope.** `docs/`, `scripts/`, `.shots/` and project `opencode.json` are in scope
   for this pass; `backend/` and contract code are not.

## Elapsed

| Time | Elapsed | Phase | Note |
|---|---|---|---|
| 12:57 | 0:00 | Phase 0 | Clean tree confirmed (`602779a` already committed); branch `redesign-v2` cut. |