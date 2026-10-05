type Config = { supabaseUrl?: string; serviceKey?: string; resendKey?: string; webhookSecret?: string; from?: string };
const recipient = "aestheticsocialstudio.co@gmail.com";
const json = (data: unknown, status = 200) => new Response(JSON.stringify(data), { status, headers: { "content-type": "application/json" } });
const escape = (value: unknown) => String(value ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]!));

export function makeHandler(config: Config, transport: typeof fetch = fetch) {
  async function db(path: string, init: RequestInit) {
    const response = await transport(`${config.supabaseUrl}/rest/v1/${path}`, {
      ...init, headers: { "content-type": "application/json", apikey: config.serviceKey!, Authorization: `Bearer ${config.serviceKey}`, ...init.headers },
      signal: AbortSignal.timeout(10000),
    });
    if (!response.ok) throw new Error("database_request_failed");
    return response;
  }
  return async (request: Request): Promise<Response> => {
    if (request.method !== "POST") return json({ error: "method_not_allowed" }, 405);
    if (!config.webhookSecret || request.headers.get("x-webhook-secret") !== config.webhookSecret) return json({ error: "unauthorized" }, 401);
    if (!config.supabaseUrl || !config.serviceKey || !config.resendKey || !config.from) return json({ error: "notification_configuration_incomplete" }, 503);
    const payload = await request.json().catch(() => null);
    // Only trust the ID. Fetch the canonical row server-side; never email webhook-supplied lead fields.
    const id = payload?.record?.id || payload?.lead_id;
    if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id || "")) return json({ error: "invalid_lead_id" }, 400);
    let claim: any;
    try {
      claim = await (await db("rpc/claim_lead_notification", { method: "POST", body: JSON.stringify({ p_lead_id: id }) })).json();
      if (!claim) return json({ ok: true, skipped: true });
      const lead = claim.lead;
      const fields = ["name", "email", "form_type", "service_interest", "source", "status", "created_at", "message"];
      const text = fields.map(key => `${key}: ${String(lead[key] ?? "—")}`).join("\n");
      const html = '<html lang="en"><body><h1>New Aesthetic Social Studio lead</h1><table>' + fields.map(key => `<tr><th scope="row">${escape(key)}</th><td>${escape(lead[key] ?? "—")}</td></tr>`).join("") + '</table></body></html>';
      const sent = await transport("https://api.resend.com/emails", {
        method: "POST", signal: AbortSignal.timeout(10000),
        headers: { Authorization: `Bearer ${config.resendKey}`, "content-type": "application/json", "Idempotency-Key": `aesthetic-lead/${id}` },
        body: JSON.stringify({ from: config.from, to: [recipient], subject: `New Aesthetic Social Studio lead — ${String(lead.form_type || "enquiry").replace(/[\r\n]/g, " ").slice(0, 60)}`, text, html }),
      });
      if (!sent.ok) throw new Error(`email_provider_${sent.status}`);
      const data = await sent.json();
      if (!data.id) throw new Error("email_provider_invalid_response");
      await db(`lead_notifications?lead_id=eq.${id}&claim_token=eq.${claim.claim_token}`, {
        method: "PATCH", body: JSON.stringify({ status: "sent", sent_at: new Date().toISOString(), provider_id: data.id, error_code: null, lease_until: null }),
      });
      return json({ ok: true });
    } catch (error) {
      if (claim?.claim_token) {
        // Safe to replay within 23 hours: the provider idempotency key prevents duplicate sends.
        await db(`lead_notifications?lead_id=eq.${id}&claim_token=eq.${claim.claim_token}`, {
          method: "PATCH", body: JSON.stringify({ status: "failed", error_code: error instanceof Error && /^email_provider_\d+$/.test(error.message) ? error.message : "notification_failed", lease_until: null, next_attempt_at: new Date(Date.now() + 5 * 60000).toISOString() }),
        }).catch(() => {});
      }
      // Do not log names, email addresses, payloads, API keys or provider responses.
      return json({ error: "notification_failed" }, 503);
    }
  };
}
