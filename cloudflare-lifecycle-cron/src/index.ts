/**
 * reviewpilot-lifecycle-cron — isolated daily trigger for the lifecycle email
 * engine. Completely separate from reviewpilot-cron (digest / poll-reviews);
 * it only calls the lifecycle endpoint with the shared CRON_SECRET.
 */

export interface Env {
  APP_URL: string;
  CRON_SECRET: string;
}

const JOB = { name: "lifecycle", path: "/api/cron/lifecycle" } as const;

async function callLifecycle(env: Env) {
  const url = `${env.APP_URL}${JOB.path}`;
  try {
    const res = await fetch(url, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${env.CRON_SECRET}`,
        "Content-Type": "application/json",
      },
    });
    const text = await res.text();
    console.log(
      `[reviewpilot-lifecycle-cron] job=${JOB.name} ok=${res.ok} status=${res.status}`
    );
    return { ok: res.ok, status: res.status, body: text.slice(0, 800) };
  } catch (e) {
    console.log(`[reviewpilot-lifecycle-cron] job=${JOB.name} error=${String(e)}`);
    return { ok: false, error: String(e) };
  }
}

export default {
  async scheduled(_event: ScheduledEvent, env: Env, ctx: ExecutionContext) {
    ctx.waitUntil(callLifecycle(env));
  },
  async fetch(_request: Request, env: Env): Promise<Response> {
    // Manual trigger for testing (e.g. `curl` the worker URL).
    const result = await callLifecycle(env);
    return new Response(JSON.stringify({ timestamp: new Date().toISOString(), result }, null, 2), {
      headers: { "Content-Type": "application/json" },
    });
  },
} satisfies ExportedHandler<Env>;
