alter table public.quality_scores
add column if not exists review_language_mix text,
add column if not exists atmosphere_word_count integer,
add column if not exists embedding_generated boolean default false,
add column if not exists last_processed_at timestamp with time zone default timezone('utc'::text, now());
