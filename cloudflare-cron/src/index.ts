export interface Env {
  APP_URL: string;      // e.g. https://your-app.vercel.app
  CRON_SECRET: string;  // same value as CRON_SECRET in Vercel env
}

export default {
  async scheduled(_event: ScheduledEvent, env: Env, _ctx: ExecutionContext) {
    const url = `${env.APP_URL}/api/cron/poll-reviews`;

    const res = await fetch(url, {
      method: "GET",
      headers: { Authorization: `Bearer ${env.CRON_SECRET}` },
    });

    const body = await res.text();
    console.log(`[reviewpilot-cron] ${res.status} ${url}`, body.slice(0, 500));
  },
} satisfies ExportedHandler<Env>;
