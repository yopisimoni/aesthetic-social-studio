-- Apply before enabling the Resend webhook. Existing FormSubmit trigger is preserved.
create table if not exists public.lead_notifications (
  lead_id uuid primary key references public.leads(id) on delete cascade,
  status text not null default 'pending' check (status in ('pending','sending','sent','failed')),
  attempts integer not null default 0,
  claim_token uuid,
  lease_until timestamptz,
  next_attempt_at timestamptz not null default now(),
  first_attempt_at timestamptz,
  sent_at timestamptz,
  provider_id text,
  error_code text
);
alter table public.lead_notifications enable row level security;
revoke all on public.lead_notifications from anon, authenticated;
grant all on public.lead_notifications to service_role;

-- SECURITY INVOKER: only the service role may claim or inspect private lead data.
create or replace function public.claim_lead_notification(p_lead_id uuid)
returns jsonb language plpgsql security invoker set search_path = public as $$
declare job public.lead_notifications; lead public.leads; token uuid;
begin
  select * into lead from public.leads where id=p_lead_id;
  if not found then return null; end if;
  insert into public.lead_notifications(lead_id) values(p_lead_id) on conflict do nothing;
  select * into job from public.lead_notifications where lead_id=p_lead_id for update;
  if job.status='sent' or job.attempts>=6 or job.next_attempt_at>now()
     or (job.status='sending' and job.lease_until>now())
     or (job.first_attempt_at is not null and job.first_attempt_at<now()-interval '23 hours') then
    return null;
  end if;
  token:=gen_random_uuid();
  update public.lead_notifications set status='sending', attempts=attempts+1,
    claim_token=token, lease_until=now()+interval '2 minutes',
    first_attempt_at=coalesce(first_attempt_at,now()) where lead_id=p_lead_id;
  return jsonb_build_object('lead',to_jsonb(lead),'claim_token',token);
end;
$$;
revoke all on function public.claim_lead_notification(uuid) from public, anon, authenticated;
grant execute on function public.claim_lead_notification(uuid) to service_role;
