-- Auth/RLS hardening for Korantis consumer accounts.
-- Additive/idempotent intent: tighten public data access and keep user-owned data private.
-- Apply manually in Supabase SQL editor after reviewing.

do $$
begin
  if to_regclass('public.profiles') is not null then
    alter table public.profiles enable row level security;

    drop policy if exists "Users can view own profile" on public.profiles;
    drop policy if exists "Users can update own profile" on public.profiles;
    drop policy if exists "profiles_select_own" on public.profiles;
    drop policy if exists "profiles_insert_own" on public.profiles;
    drop policy if exists "profiles_update_own" on public.profiles;

    create policy "profiles_select_own"
      on public.profiles
      for select
      to authenticated
      using (auth.uid() = id);

    create policy "profiles_insert_own"
      on public.profiles
      for insert
      to authenticated
      with check (auth.uid() = id);

    create policy "profiles_update_own"
      on public.profiles
      for update
      to authenticated
      using (auth.uid() = id)
      with check (auth.uid() = id);
  end if;
end $$;

do $$
begin
  if to_regclass('public.venue_interactions') is not null then
    alter table public.venue_interactions enable row level security;

    drop policy if exists "Users can view own interactions" on public.venue_interactions;
    drop policy if exists "Users can insert own interactions" on public.venue_interactions;
    drop policy if exists "Users can update own interactions" on public.venue_interactions;
    drop policy if exists "Users can delete own interactions" on public.venue_interactions;
    drop policy if exists "venue_interactions_select_own" on public.venue_interactions;
    drop policy if exists "venue_interactions_insert_own" on public.venue_interactions;
    drop policy if exists "venue_interactions_update_own" on public.venue_interactions;
    drop policy if exists "venue_interactions_delete_own" on public.venue_interactions;

    create policy "venue_interactions_select_own"
      on public.venue_interactions
      for select
      to authenticated
      using (auth.uid() = user_id);

    create policy "venue_interactions_insert_own"
      on public.venue_interactions
      for insert
      to authenticated
      with check (auth.uid() = user_id);

    create policy "venue_interactions_update_own"
      on public.venue_interactions
      for update
      to authenticated
      using (auth.uid() = user_id)
      with check (auth.uid() = user_id);

    create policy "venue_interactions_delete_own"
      on public.venue_interactions
      for delete
      to authenticated
      using (auth.uid() = user_id);
  end if;
end $$;

do $$
begin
  if to_regclass('public.venues') is not null then
    alter table public.venues enable row level security;

    drop policy if exists "Allow public read access to venues" on public.venues;
    drop policy if exists "Allow public read access to published venues" on public.venues;
    drop policy if exists "Admins can read venues" on public.venues;
    drop policy if exists "venues_public_read_active" on public.venues;

    create policy "venues_public_read_active"
      on public.venues
      for select
      to anon, authenticated
      using (curation_status = 'active');
  end if;
end $$;

do $$
begin
  if to_regclass('public.venue_images') is not null then
    alter table public.venue_images enable row level security;

    drop policy if exists "Allow public read access to venue images" on public.venue_images;
    drop policy if exists "venue_images_public_read_active_venue" on public.venue_images;

    create policy "venue_images_public_read_active_venue"
      on public.venue_images
      for select
      to anon, authenticated
      using (
        exists (
          select 1
          from public.venues
          where public.venues.id = public.venue_images.venue_id
            and public.venues.curation_status = 'active'
        )
      );
  end if;
end $$;

-- Internal enrichment/admin tables should not be broadly readable by every logged-in user.
do $$
begin
  if to_regclass('public.venue_reviews') is not null then
    alter table public.venue_reviews enable row level security;
    drop policy if exists "Admins can read venue_reviews" on public.venue_reviews;
  end if;

  if to_regclass('public.venue_atmosphere') is not null then
    alter table public.venue_atmosphere enable row level security;
    drop policy if exists "Admins can read venue_atmosphere" on public.venue_atmosphere;
  end if;

  if to_regclass('public.venue_embeddings') is not null then
    alter table public.venue_embeddings enable row level security;
    drop policy if exists "Admins can read venue_embeddings" on public.venue_embeddings;
  end if;

  if to_regclass('public.venue_resonance') is not null then
    alter table public.venue_resonance enable row level security;
    drop policy if exists "Admins can read venue_resonance" on public.venue_resonance;
  end if;

  if to_regclass('public.venue_quality') is not null then
    alter table public.venue_quality enable row level security;
    drop policy if exists "Admins can read venue_quality" on public.venue_quality;
  end if;

  if to_regclass('public.quality_scores') is not null then
    alter table public.quality_scores enable row level security;
  end if;

  if to_regclass('public.staging_venues') is not null then
    alter table public.staging_venues enable row level security;
  end if;
end $$;
