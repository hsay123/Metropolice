# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Four roles, and their screen time is not equal.

- **Contributor** — does careful data entry for hours. Wants speed, clear rules, fast feedback and
  fair pay. Fears silent rejection and late payment.
- **Reviewer** — triages a queue. Needs to compare a submission with its reference and decide in
  seconds, with a required reason.
- **Buyer** (robotics team) — wants trustworthy labels without doing QA. Sceptical of AI and crypto
  claims; checks spend, acceptance rate and where each accepted label came from.
- **Admin** — guards the money: roles, signer policy, pause state, quorum approvals.

## Product Purpose

PhysicalData Network lets a robotics team post image and video labelling jobs. Qualified
contributors label them for stablecoin rewards. Only work that passes review gets paid. Monad holds
the budget and one receipt per payout. Raw media and labels stay in private storage.

Success means a buyer can inspect every trust claim: who did the work, which rules applied, who
checked it, and what was paid.

## Positioning

Human-in-the-loop data operations with inspectable provenance. The differentiator is not "AI
labels data" — it is that the QA process is visible and the settlement is provable: accepted-only
exports, a manifest of hashes and pseudonyms, and one receipt per payout on chain, with AI-decided
work marked as AI-decided rather than passed off as human-checked.

## Operating Context

- Laptop-first work tool. The demo is judged from a four-minute screen recording at 1440x900.
- Annotation work happens on a dark surround because media is judged best on a neutral dark field.
- Video labelling reads like an editor's dope sheet: one track per action label, timecode, a
  playhead.
- Reviewers compare submitted labels against reference labels and need mismatches highlighted.
- Contributors work under a time-boxed task lease and need to know the autosave state.
- Money screens are always in a test-token context.

## Capabilities and Constraints

Capabilities: job posting with schema, rubric, budget, deadline and data rights; task claim with a
lease; image box annotation and video action-segment annotation; draft autosave and submit; review
decisions with reason codes; earnings, payout claim and public receipts; export of accepted current
versions only; admin role, pause and quorum controls.

Constraints and terminology:

- Testnet only. Rewards are test tokens with no real value.
- "Accepted" and "paid" are distinct states and must never be conflated.
- Gold tasks and overlap sampling are hidden from contributors; they are reviewer and admin only.
- Contributor identity is pseudonymous; email and legal name appear only on the admin screen.
- Never display a confidence or reputation number without enough samples; say "Not enough data yet".
- Annotation schemas are validated in the client exactly as the server will validate them.

## Brand Commitments

Name: PhysicalData Network. Voice: plain, specific, calm; sentence case; active. The button names
the result and the toast reuses the same verb. Errors state what happened and how to fix it, and do
not apologise. Nothing is sold; things are described.

Binding constraints carried from the project rules: one accent colour; status is never colour alone
(icon plus text); sentence case everywhere; no invented customers, logos, testimonials, statistics
or partner names; no faked transaction success.

## Evidence on Hand

- Product truth: `docs/PRD.md`, `AGENTS.md`, `docs/BACKEND_SPEC.md`, `docs/API-NEEDS.md`.
- Synthetic demo media in `public/media/` (a 12-second pen-writing clip and a poster).
- Mock handlers in `mocks/` provide clearly-labelled synthetic jobs, submissions, receipts and
  chain events.
- A `dev/components` gallery renders the shared primitives.

Absences that future work must not fabricate: real customers, real usage statistics, real prices,
partner logos, testimonials, or real on-chain transactions. There is no production backend yet and
the chain constants are unverified.

## Product Principles

1. Inspectable trust. Every claim about provenance can be opened and read.
2. Never fake a success. Pending, confirmed and failed are three different, visible states.
3. Speed for the person doing the work. Contributors and reviewers are measured in tasks per hour.
4. One accent, structure over decoration. The interface is a bench, not a brochure.
5. Honest copy. Say what the system does not prove.

## Accessibility & Inclusion

WCAG AA for text and control boundaries; status never conveyed by colour alone; visible focus on
every control; targets at least 24x24 px; keyboard-first annotation with hints; motion respects
`prefers-reduced-motion`. The work tool is used for long sessions, so density and legibility outrank
generous whitespace.