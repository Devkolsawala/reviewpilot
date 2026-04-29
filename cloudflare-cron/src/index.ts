export interface Env {
  APP_URL: string;
  CRON_SECRET: string;
}

type JobResult = {
  job: string;
  ok: boolean;
  status?: number;
  error?: string;
  body?: string;
};

const JOBS = [
  { name: "poll-reviews", path: "/api/cron/poll-reviews" },
  { name: "send-daily-digest", path: "/api/cron/send-daily-digest" },
] as const;

async function callEndpoint(env: Env, path: string): Promise<Omit<JobResult, "job">> {
  try {
    const url = `${env.APP_URL}${path}`;
    const res = await fetch(url, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${env.CRON_SECRET}`,
        "Content-Type": "application/json",
      },
    });
    const text = await res.text();
    return { ok: res.ok, status: res.status, body: text.slice(0, 500) };
  } catch (e) {
    return { ok: false, error: String(e) };
  }
}

async function runAllJobs(env: Env) {
  const results = await Promise.allSettled(
    JOBS.map(async (j) => ({ job: j.name, ...(await callEndpoint(env, j.path)) }))
  );
  const out: JobResult[] = results.map((r, i) =>
    r.status === "fulfilled"
      ? r.value
      : { job: JOBS[i].name, ok: false, error: String(r.reason) }
  );
  for (const r of out) {
    console.log(
      `[reviewpilot-cron] job=${r.job} ok=${r.ok} status=${r.status ?? "-"}`
    );
  }
  return { timestamp: new Date().toISOString(), results: out };
}

export default {
  async scheduled(_event: ScheduledEvent, env: Env, ctx: ExecutionContext) {
    ctx.waitUntil(runAllJobs(env));
  },
  async fetch(request: Request, env: Env): Promise<Response> {
    if (request.method === "GET") {
      const result = await runAllJobs(env);
      return new Response(JSON.stringify(result, null, 2), {
        headers: { "Content-Type": "application/json" },
      });
    }
    return new Response("ReviewPilot Cron Worker", { status: 200 });
  },
} satisfies ExportedHandler<Env>;
