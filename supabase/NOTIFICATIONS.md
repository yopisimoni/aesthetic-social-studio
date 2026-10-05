# Lead notifications — deployment and cutover

The Supabase project was restored on 5 October 2026. The private delivery-state migration and `notify-new-lead` function are deployed. Public lead insert policies are unchanged. The existing FormSubmit database trigger remains active until a verified cutover; no production Resend delivery has been claimed.

## Required secrets
Set `RESEND_API_KEY`, `LEAD_NOTIFICATION_FROM` (a verified Resend-domain sender), and a random `LEAD_WEBHOOK_SECRET` as Supabase project secrets. Supabase supplies `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` to the function. Never add secret values to GitHub or frontend code. The connected Resend account currently has no verified domains.

## Cutover
1. Confirm the sender domain in Resend and set the secrets.
2. Call the function with `x-webhook-secret` and a clearly marked existing test lead ID. Verify one email at `aestheticsocialstudio.co@gmail.com` and `lead_notifications.status='sent'`. Repeat the same ID and confirm no second email. The handler reads canonical database data, not supplied lead fields.
3. Configure an INSERT webhook on `public.leads` to POST to `https://himqukzzshptwjhoryav.supabase.co/functions/v1/notify-new-lead`, with the secret header. Remove the old `trg_notify_aesthetic_social_studio_lead` only in the same controlled cutover after successful testing; keeping both sends two notifications through different providers.
4. Insert one marked test lead through the live form, verify email receipt and unchanged insert-only public access. Delete test data only after verification.

## Failures and retries
Email failure returns 503 and records a non-sensitive error code without failing the original asynchronous lead insert. Configure a trusted retry runner/webhook service to replay failed lead IDs after `next_attempt_at`; database webhooks alone do not guarantee scheduled retries. Pending failures require monitoring until that runner is configured. Six attempts maximum, two-minute claim lease, and 23-hour replay window protect concurrent delivery and Resend's 24-hour idempotency window. Older failures require human review rather than blindly re-sending. No automatic retry scheduler is deployed yet.

Run `node --test tests/notifications.test.mjs` for four deterministic authentication, canonical-data, duplicate, and provider-failure tests. These are mocked tests, not proof of production email delivery.
