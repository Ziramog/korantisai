-- Cloudinary image materialization support.
-- Additive only: preserve existing Google photo references and curated image rows.

alter table public.venue_images
  add column if not exists url text,
  add column if not exists secure_url text,
  add column if not exists public_id text,
  add column if not exists role text,
  add column if not exists sort_order integer not null default 0,
  add column if not exists source text,
  add column if not exists google_photo_reference text,
  add column if not exists bytes integer,
  add column if not exists format text,
  add column if not exists quality_score integer,
  add column if not exists updated_at timestamp with time zone default timezone('utc'::text, now()) not null;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'venue_images_role_check'
      and conrelid = 'public.venue_images'::regclass
  ) then
    alter table public.venue_images
      add constraint venue_images_role_check
      check (role is null or role in ('hero', 'card', 'gallery'));
  end if;
end $$;

create unique index if not exists idx_venue_images_public_id
  on public.venue_images (public_id)
  where public_id is not null;

create unique index if not exists idx_venue_images_google_photo_reference
  on public.venue_images (venue_id, google_photo_reference)
  where google_photo_reference is not null;

create index if not exists idx_venue_images_venue_role_sort
  on public.venue_images (venue_id, role, sort_order);
