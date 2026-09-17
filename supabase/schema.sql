-- 평범한 물건 박물관 — exhibits 스키마
-- Supabase 프로젝트의 SQL Editor에서 한 번 실행하세요 (Dashboard → SQL Editor → New query).
-- 이 파일은 imperative 방식의 초기 스키마이며, 재실행해도 안전하도록 idempotent하게 작성했습니다.

-- 1. exhibits 테이블
create table if not exists public.exhibits (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users (id) on delete cascade,
  item_name text not null,
  story text not null,
  mood text not null default 'warm' check (mood in ('playful', 'warm', 'curator')),
  title text not null,
  description text not null,
  photo_path text not null,
  photo_crop jsonb not null default '{"x":50,"y":50}'::jsonb,
  show_story boolean not null default true,
  display_name text,
  visibility text not null default 'private' check (visibility in ('private', 'link')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists exhibits_owner_id_idx on public.exhibits (owner_id);
create index if not exists exhibits_visibility_idx on public.exhibits (visibility);
create index if not exists exhibits_photo_path_idx on public.exhibits (photo_path);

-- updated_at 자동 갱신
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists exhibits_set_updated_at on public.exhibits;
create trigger exhibits_set_updated_at
  before update on public.exhibits
  for each row
  execute function public.set_updated_at();

alter table public.exhibits enable row level security;

-- 작성자는 공개 범위와 관계없이 자기 전시를 모두 볼 수 있다.
drop policy if exists "exhibits_select_owner" on public.exhibits;
create policy "exhibits_select_owner"
  on public.exhibits for select
  to authenticated
  using ((select auth.uid()) = owner_id);

-- 링크 공유 중인 전시는 로그인 여부와 관계없이 누구나 볼 수 있다 (목록 노출은 없음, 이 정책은 개별 조회만 허용).
drop policy if exists "exhibits_select_shared" on public.exhibits;
create policy "exhibits_select_shared"
  on public.exhibits for select
  to anon, authenticated
  using (visibility = 'link');

drop policy if exists "exhibits_insert_owner" on public.exhibits;
create policy "exhibits_insert_owner"
  on public.exhibits for insert
  to authenticated
  with check ((select auth.uid()) = owner_id);

drop policy if exists "exhibits_update_owner" on public.exhibits;
create policy "exhibits_update_owner"
  on public.exhibits for update
  to authenticated
  using ((select auth.uid()) = owner_id)
  with check ((select auth.uid()) = owner_id);

drop policy if exists "exhibits_delete_owner" on public.exhibits;
create policy "exhibits_delete_owner"
  on public.exhibits for delete
  to authenticated
  using ((select auth.uid()) = owner_id);

-- 2. Storage: 비공개 사진 버킷
insert into storage.buckets (id, name, public)
values ('exhibit-photos', 'exhibit-photos', false)
on conflict (id) do nothing;

-- 업로드 경로 규칙: {auth.uid()}/{임의 파일명}. 폴더 이름이 곧 소유자 확인 기준이다.
drop policy if exists "exhibit_photos_insert_own_folder" on storage.objects;
create policy "exhibit_photos_insert_own_folder"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'exhibit-photos'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

-- 작성자는 확정 여부나 공개 범위와 무관하게 자기 폴더의 사진을 계속 볼 수 있다.
drop policy if exists "exhibit_photos_select_own_folder" on storage.objects;
create policy "exhibit_photos_select_own_folder"
  on storage.objects for select
  to authenticated
  using (
    bucket_id = 'exhibit-photos'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

-- 링크로 공유 중인 전시에 딸린 사진은 그 전시를 보는 사람도 볼 수 있다.
-- signed URL 발급 시점에도 이 정책이 적용되므로, 공유가 꺼지면 새 서명 URL 발급이 즉시 막힌다.
drop policy if exists "exhibit_photos_select_shared_exhibit" on storage.objects;
create policy "exhibit_photos_select_shared_exhibit"
  on storage.objects for select
  to anon, authenticated
  using (
    bucket_id = 'exhibit-photos'
    and exists (
      select 1 from public.exhibits e
      where e.photo_path = storage.objects.name
        and e.visibility = 'link'
    )
  );
