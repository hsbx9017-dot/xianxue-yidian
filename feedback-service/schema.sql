-- All feedback lives outside the public Data API schema.
create schema if not exists feedback_private;
revoke all on schema feedback_private from public, anon, authenticated;
create table if not exists feedback_private.feedback (
 submission_id uuid primary key,
 rating text not null check (rating in ('','有帮助','有一点','暂时没有')),
 stuck text not null check (char_length(stuck)<=800),
 wish text not null check (char_length(wish)<=800),
 mode text not null check (mode in ('not_used','rules','deepseek')),
 processed boolean not null default false,
 created_at timestamptz not null default now()
);
alter table feedback_private.feedback enable row level security;
revoke all on feedback_private.feedback from public, anon, authenticated;
create or replace function public.submit_feedback(payload jsonb) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare v_id uuid; v_rating text; v_stuck text; v_wish text; v_mode text; v_row feedback_private.feedback%rowtype;
begin
 if jsonb_typeof(payload) is distinct from 'object' or
    (select count(*) from jsonb_object_keys(payload)) <> 5 or
    not (payload ?& array['submissionId','rating','stuck','wish','mode']) then
   raise exception 'invalid feedback' using errcode='22023';
 end if;
 if exists(select 1 from jsonb_each(payload) where jsonb_typeof(value)<>'string') then
   raise exception 'invalid fields' using errcode='22023';
 end if;
 if (payload->>'submissionId') !~ '^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$' then
   raise exception 'invalid id' using errcode='22023';
 end if;
 v_id:=(payload->>'submissionId')::uuid; v_rating:=btrim(payload->>'rating');
 v_stuck:=btrim(payload->>'stuck'); v_wish:=btrim(payload->>'wish'); v_mode:=payload->>'mode';
 if v_rating not in ('','有帮助','有一点','暂时没有') or v_mode not in ('not_used','rules','deepseek') or
   char_length(v_stuck)>800 or char_length(v_wish)>800 or (v_rating='' and v_stuck='' and v_wish='') or
   (v_stuck||v_wish) ~ '(sk-[A-Za-z0-9_-]{20,}|sb_secret_[A-Za-z0-9_-]+|gh[pousr]_[A-Za-z0-9]{20,}|github_pat_[A-Za-z0-9_]+|-----BEGIN[^\n]*PRIVATE KEY-----)' then
   raise exception 'invalid content' using errcode='22023';
 end if;
 insert into feedback_private.feedback(submission_id,rating,stuck,wish,mode)
 values(v_id,v_rating,v_stuck,v_wish,v_mode) on conflict do nothing;
 select * into strict v_row from feedback_private.feedback where submission_id=v_id;
 if v_row.rating<>v_rating or v_row.stuck<>v_stuck or v_row.wish<>v_wish or v_row.mode<>v_mode then
   raise exception 'submission conflict' using errcode='22023';
 end if;
 return jsonb_build_object('ok',true,'id',v_row.submission_id,'receivedAt',v_row.created_at);
end $$;
revoke all on function public.submit_feedback(jsonb) from public, anon, authenticated;
grant execute on function public.submit_feedback(jsonb) to anon, authenticated;

create or replace function public.admin_feedback_list(before_time timestamptz default null, before_id uuid default null)
returns jsonb language sql stable security definer set search_path = '' as $$
 select coalesce(jsonb_agg(to_jsonb(f) order by created_at desc, submission_id desc),'[]'::jsonb)
 from (select * from feedback_private.feedback where before_time is null or
 (created_at,submission_id)<(before_time,before_id) order by created_at desc,submission_id desc limit 100) f;
$$;
create or replace function public.admin_feedback_mark(item_id uuid, done boolean)
returns boolean language plpgsql security definer set search_path = '' as $$
begin
 update feedback_private.feedback set processed=done where submission_id=item_id;
 return found;
end $$;
revoke all on function public.admin_feedback_list(timestamptz,uuid) from public,anon,authenticated;
revoke all on function public.admin_feedback_mark(uuid,boolean) from public,anon,authenticated;
grant execute on function public.admin_feedback_list(timestamptz,uuid) to service_role;
grant execute on function public.admin_feedback_mark(uuid,boolean) to service_role;
