-- Phase 4: Psychogeographic Identity Schema

-- Create the profiles table linked to Supabase Auth
create table if not exists public.profiles (
  id uuid references auth.users(id) on delete cascade primary key,
  -- 8D Identity Vector
  identity_centroid vector(8) default '[0,0,0,0,0,0,0,0]'::vector,
  current_drift vector(8) default '[0,0,0,0,0,0,0,0]'::vector,
  identity_plasticity real default 0.1, -- How quickly centroid adapts to drift
  
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS for profiles
alter table public.profiles enable row level security;

-- Users can read and update their own profile
create policy "Users can view own profile" 
  on public.profiles for select 
  using (auth.uid() = id);

create policy "Users can update own profile" 
  on public.profiles for update 
  using (auth.uid() = id);

-- Trigger to create a profile automatically when a new user signs up
create or replace function public.handle_new_user() 
returns trigger as $$
begin
  insert into public.profiles (id)
  values (new.id);
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Create the venue_interactions table
-- The enum handles how the user interacted with a venue
create type interaction_status as enum ('saved', 'visited', 'resonated', 'discovered', 'ignored');

create table if not exists public.venue_interactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete cascade not null,
  venue_id text references public.venues(id) on delete cascade not null,
  status interaction_status not null,
  
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
  
  -- Prevent duplicate identical interaction states for the same user and venue
  unique(user_id, venue_id, status)
);

-- Enable RLS for venue_interactions
alter table public.venue_interactions enable row level security;

create policy "Users can view own interactions" 
  on public.venue_interactions for select 
  using (auth.uid() = user_id);

create policy "Users can insert own interactions" 
  on public.venue_interactions for insert 
  with check (auth.uid() = user_id);

create policy "Users can update own interactions" 
  on public.venue_interactions for update 
  using (auth.uid() = user_id);

create policy "Users can delete own interactions" 
  on public.venue_interactions for delete 
  using (auth.uid() = user_id);
