alter table public.creator_applications
drop constraint if exists creator_applications_applicant_id_key;

create unique index if not exists creator_applications_one_active_per_user_idx
on public.creator_applications (applicant_id)
where status in ('pending', 'approved');

create index if not exists creator_applications_applicant_created_idx
on public.creator_applications (applicant_id, created_at desc);
