-- Enable the pgvector extension to work with embedding vectors
create extension if not exists vector;

-- Create the venues table
create table if not exists public.venues (
  id text primary key,
  name text not null,
  category text not null,
  location text not null,
  card_size text not null check (card_size in ('immersive', 'cinematic', 'layered', 'compact')),
  spacing text not null check (spacing in ('tight', 'breathe', 'isolated')),
  hero_image text not null,
  atmosphere text not null check (atmosphere in ('morning', 'afternoon', 'golden-hour', 'night', 'late-night', 'dawn')),
  quality real not null,
  tagline text not null,
  narrative text not null,
  tags text[] not null default '{}',
  
  -- The 8D vector representing the venue's latent taste coordinates
  -- We'll use this for the taste vector and intent matching in Phase 3E
  taste_vector vector(8),

  -- Timestamps
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS (Row Level Security)
alter table public.venues enable row level security;

-- Create a policy that allows anyone to read venues (since this is public data for now)
create policy "Allow public read access to venues"
  on public.venues
  for select
  to public
  using (true);

-- Create a function to automatically update the updated_at column
create or replace function public.handle_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- Trigger to call the update function
create trigger handle_venues_updated_at
  before update on public.venues
  for each row
  execute procedure public.handle_updated_at();

-- (Optional) Create an HNSW index for the vector column to speed up similarity searches later
create index on public.venues using hnsw (taste_vector vector_l2_ops);
