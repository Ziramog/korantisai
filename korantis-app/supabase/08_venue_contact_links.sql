create table if not exists public.venue_contact_links (
  id uuid primary key default gen_random_uuid(),
  venue_id uuid null references public.venues(id) on delete cascade,
  candidate_id text null,
  google_place_id text null,
  type text not null check (
    type in (
      'website',
      'phone',
      'instagram',
      'whatsapp',
      'reservation',
      'google_maps',
      'booking',
      'menu'
    )
  ),
  label text null,
  url text null,
  phone_number text null,
  source text not null default 'other' check (
    source in (
      'google_places',
      'official_website',
      'manual',
      'other'
    )
  ),
  confidence numeric null check (confidence is null or (confidence >= 0 and confidence <= 100)),
  verified_at timestamptz null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint venue_contact_links_target_check check (
    venue_id is not null or candidate_id is not null or google_place_id is not null
  ),
  constraint venue_contact_links_payload_check check (
    url is not null or phone_number is not null
  )
);

create index if not exists venue_contact_links_venue_id_idx
  on public.venue_contact_links (venue_id);

create index if not exists venue_contact_links_candidate_id_idx
  on public.venue_contact_links (candidate_id);

create index if not exists venue_contact_links_google_place_id_idx
  on public.venue_contact_links (google_place_id);

create unique index if not exists venue_contact_links_unique_link_idx
  on public.venue_contact_links (
    coalesce(venue_id::text, ''),
    coalesce(candidate_id, ''),
    coalesce(google_place_id, ''),
    type,
    coalesce(url, ''),
    coalesce(phone_number, '')
  );

