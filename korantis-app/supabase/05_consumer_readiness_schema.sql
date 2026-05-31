-- Phase B consumer-readiness additions.
-- Additive only: keeps the existing hybrid schema intact.

alter table public.venues
  add column if not exists hero_image text;

