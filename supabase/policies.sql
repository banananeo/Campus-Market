-- Campus-Market RLS + Storage policies
-- Run this in Supabase Dashboard > SQL Editor.
-- Assumes tables: profiles(id uuid PK, name text, department text, year int),
-- listings(id, seller_id uuid, status text), listing_images(listing_id, image_url),
-- favorites(user_id uuid, listing_id), messages(sender_id uuid, receiver_id uuid, listing_id)
-- and storage bucket "listing-images" with files stored as "<auth.uid>/<listing_id>/..."

-- 1) Enable RLS
alter table public.profiles enable row level security;
alter table public.listings enable row level security;
alter table public.listing_images enable row level security;
alter table public.favorites enable row level security;
alter table public.messages enable row level security;

-- 2) Profiles: full login wall, authenticated users can read all, write own only
drop policy if exists "profiles select authed" on public.profiles;
create policy "profiles select authed"
on public.profiles for select to authenticated using (true);

drop policy if exists "profiles insert own" on public.profiles;
create policy "profiles insert own"
on public.profiles for insert to authenticated with check (auth.uid() = id);

drop policy if exists "profiles update own" on public.profiles;
create policy "profiles update own"
on public.profiles for update to authenticated
using (auth.uid() = id) with check (auth.uid() = id);

-- Safety net: auto-create profile from auth metadata (keeps login/signup in sync)
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, name, department, year)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'name', 'Student'),
    new.raw_user_meta_data->>'department',
    nullif(new.raw_user_meta_data->>'year', '')::int
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users for each row execute function public.handle_new_user();

-- 3) Listings: browse available + own, write owner only
drop policy if exists "listings select" on public.listings;
create policy "listings select"
on public.listings for select to authenticated
using (status = 'available' or seller_id = auth.uid());

drop policy if exists "listings insert own" on public.listings;
create policy "listings insert own"
on public.listings for insert to authenticated
with check (auth.uid() = seller_id);

drop policy if exists "listings update own" on public.listings;
create policy "listings update own"
on public.listings for update to authenticated
using (auth.uid() = seller_id) with check (auth.uid() = seller_id);

drop policy if exists "listings delete own" on public.listings;
create policy "listings delete own"
on public.listings for delete to authenticated
using (auth.uid() = seller_id);

-- 4) Listing images: read all authed, write only via owned listing
drop policy if exists "listing_images select" on public.listing_images;
create policy "listing_images select"
on public.listing_images for select to authenticated using (true);

drop policy if exists "listing_images insert owner" on public.listing_images;
create policy "listing_images insert owner"
on public.listing_images for insert to authenticated
with check (
  exists (
    select 1 from public.listings l
    where l.id = listing_id and l.seller_id = auth.uid()
  )
);

drop policy if exists "listing_images delete owner" on public.listing_images;
create policy "listing_images delete owner"
on public.listing_images for delete to authenticated
using (
  exists (
    select 1 from public.listings l
    where l.id = listing_id and l.seller_id = auth.uid()
  )
);

-- 5) Favorites: owner only
drop policy if exists "favorites owner all" on public.favorites;
create policy "favorites owner all"
on public.favorites for all to authenticated
using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- 6) Messages: participant-only threads, no self-messages
drop policy if exists "messages select participant" on public.messages;
create policy "messages select participant"
on public.messages for select to authenticated
using (auth.uid() = sender_id or auth.uid() = receiver_id);

drop policy if exists "messages insert sender" on public.messages;
create policy "messages insert sender"
on public.messages for insert to authenticated
with check (auth.uid() = sender_id and sender_id <> receiver_id);

-- 7) Storage bucket + policies
insert into storage.buckets (id, name, public)
values ('listing-images', 'listing-images', true)
on conflict (id) do nothing;

drop policy if exists "listing-images read" on storage.objects;
create policy "listing-images read"
on storage.objects for select to authenticated
using (bucket_id = 'listing-images');

drop policy if exists "listing-images upload own folder" on storage.objects;
create policy "listing-images upload own folder"
on storage.objects for insert to authenticated
with check (
  bucket_id = 'listing-images'
  and (storage.foldername(name))[1] = auth.uid()::text
);

drop policy if exists "listing-images delete own folder" on storage.objects;
create policy "listing-images delete own folder"
on storage.objects for delete to authenticated
using (
  bucket_id = 'listing-images'
  and (storage.foldername(name))[1] = auth.uid()::text
);
