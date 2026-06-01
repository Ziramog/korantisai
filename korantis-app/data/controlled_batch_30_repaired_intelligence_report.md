# Controlled Batch 30 Repaired Intelligence Report

Generated: 2026-06-01T03:07:04.714Z

## Summary

- Total venues: 30
- Matched after repair: 30
- Active: 20
- Pending review: 9
- Rejected: 1
- Decision: C) Add practical evidence source acquisition

## Required Answers

1. Did the 5 match failures repair? Yes (La Noire, Cafe Registrado, Oli Cafe, Confiteria Las Violetas, Aldos).
2. Did any rejected venues become pending or active? Yes: Cafe Registrado -> pending_review, Oli Cafe -> pending_review, Confiteria Las Violetas -> pending_review, Aldos -> pending_review.
3. Did any pending venues become active? No.
4. Is La Malbequeria still rejected for photo reasons? Yes.
5. Are cafes still under-evidenced for work? Yes: 10/10 cafes still have weak work/practical evidence..
6. Is the machine ready for a 50-candidate batch? No. C) Add practical evidence source acquisition

## Status Changes

- La Noire: match ambiguous_match -> matched; eligibility pending_review -> pending_review; score 51; reasons eligibility score 51 requires calibration or missing validation gates
- Cafe Registrado: match ambiguous_match -> matched; eligibility rejected -> pending_review; score 50; reasons eligibility score 50 requires calibration or missing validation gates
- Oli Cafe: match ambiguous_match -> matched; eligibility rejected -> pending_review; score 47; reasons eligibility score 47 requires calibration or missing validation gates
- Confiteria Las Violetas: match ambiguous_match -> matched; eligibility rejected -> pending_review; score 51; reasons eligibility score 51 requires calibration or missing validation gates
- Aldos: match unmatched -> matched; eligibility rejected -> pending_review; score 54; reasons eligibility score 54 requires calibration or missing validation gates

## Current Status By Venue

- La Noire: pending_review, match matched, photo 0, work 0, evidence gaps missing vision evidence; missing review text evidence; weak work/practical evidence; weak seating evidence; weak quiet evidence
- Cafe Registrado: pending_review, match matched, photo 0, work 0, evidence gaps missing vision evidence; missing review text evidence; weak work/practical evidence; weak seating evidence; weak quiet evidence
- La Biela: active, match matched, photo 85, work 0, evidence gaps missing review text evidence; weak work/practical evidence; weak quiet evidence
- Oli Cafe: pending_review, match matched, photo 0, work 0, evidence gaps missing vision evidence; missing review text evidence; weak work/practical evidence; weak seating evidence; weak quiet evidence
- Cafe Rivas: active, match matched, photo 90, work 0, evidence gaps missing review text evidence; weak work/practical evidence; weak quiet evidence
- Full City Coffee House: active, match matched, photo 85, work 0, evidence gaps missing review text evidence; weak work/practical evidence; weak quiet evidence
- Cafe Tortoni: active, match matched, photo 85, work 0, evidence gaps missing review text evidence; weak work/practical evidence; weak quiet evidence
- Confiteria La Ideal: active, match matched, photo 92, work 0, evidence gaps missing review text evidence; weak work/practical evidence; weak quiet evidence
- Confiteria Las Violetas: pending_review, match matched, photo 0, work 0, evidence gaps missing vision evidence; missing review text evidence; weak work/practical evidence; weak seating evidence; weak quiet evidence
- Casa Dingo: pending_review, match matched, photo 80, work 0, evidence gaps missing review text evidence; weak work/practical evidence; weak quiet evidence
- Sacro: active, match matched, photo 75, work 0, evidence gaps missing review text evidence; weak work/practical evidence; weak quiet evidence
- Bar El Federal: active, match matched, photo 85, work 0, evidence gaps missing review text evidence; weak work/practical evidence; weak quiet evidence
- Elena: active, match matched, photo 95, work 0, evidence gaps missing review text evidence; weak work/practical evidence; weak quiet evidence
- Los Galgos: active, match matched, photo 80, work 0, evidence gaps missing review text evidence; weak work/practical evidence; weak quiet evidence
- La Carniceria: pending_review, match matched, photo 70, work 0, evidence gaps missing review text evidence; weak work/practical evidence; weak quiet evidence
- Aramburu: active, match matched, photo 70, work 0, evidence gaps missing review text evidence; weak work/practical evidence; weak quiet evidence
- Mengano: active, match matched, photo 80, work 0, evidence gaps missing review text evidence; weak work/practical evidence; weak quiet evidence
- Nino Gordo: active, match matched, photo 80, work 0, evidence gaps missing review text evidence; weak work/practical evidence; weak quiet evidence
- Proper: pending_review, match matched, photo 80, work 0, evidence gaps missing review text evidence; weak work/practical evidence; weak quiet evidence
- Anafe: pending_review, match matched, photo 75, work 0, evidence gaps missing review text evidence; weak work/practical evidence; weak quiet evidence
- Aldos: pending_review, match matched, photo 0, work 0, evidence gaps missing vision evidence; missing review text evidence; weak work/practical evidence; weak seating evidence; weak quiet evidence
- Anchoita Cava: active, match matched, photo 75, work 0, evidence gaps missing review text evidence; weak work/practical evidence; weak quiet evidence
- Naranjo Bar: active, match matched, photo 80, work 0, evidence gaps missing review text evidence; weak work/practical evidence; weak quiet evidence
- La Malbequeria: rejected, match matched, photo 50, work 0, evidence gaps missing review text evidence; weak work/practical evidence; weak quiet evidence
- Trova Bar: active, match matched, photo 80, work 0, evidence gaps missing review text evidence; weak work/practical evidence; weak quiet evidence
- Verne Club: active, match matched, photo 80, work 0, evidence gaps missing review text evidence; weak work/practical evidence; weak quiet evidence
- Doppelganger Bar: active, match matched, photo 75, work 0, evidence gaps missing review text evidence; weak work/practical evidence; weak quiet evidence
- Uptown: active, match matched, photo 75, work 0, evidence gaps missing review text evidence; weak work/practical evidence; weak quiet evidence
- Floreria Atlantico: active, match matched, photo 80, work 0, evidence gaps missing review text evidence; weak work/practical evidence; weak quiet evidence
- Presidente Bar: active, match matched, photo 80, work 0, evidence gaps missing review text evidence; weak work/practical evidence; weak quiet evidence

## Decision Rationale

- Match rate after repair is above the 90% threshold.
- Existing evaluated photo hero success remains above the 85% threshold, but newly repaired matches have not been vision-evaluated because LLM calls are disallowed in F.1.
- Practical/work evidence remains weak for cafés, so work café scoring should not drive scaling decisions yet.