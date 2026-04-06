import { Link2, Bot, TrendingUp } from "lucide-react";

const STEPS = [
  {
    icon: Link2,
    step: "1",
    title: "Connect Your Accounts",
    description:
      "Link your Google Business Profile or upload your Play Store service account. Takes under 2 minutes.",
  },
  {
    icon: Bot,
    step: "2",
    title: "AI Replies Instantly",
    description:
      "ReviewPilot generates context-aware replies for every review. Approve, edit, or auto-publish — your choice.",
  },
  {
    icon: TrendingUp,
    step: "3",
    title: "Grow Your Reviews",
    description:
      "Send SMS campaigns to happy customers. Track ratings climb with real-time analytics and sentiment tracking.",
  },
];

export function HowItWorks() {
  return (
    <section className="py-20 sm:py-28 bg-secondary/30">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="font-heading text-3xl font-bold sm:text-4xl">
            How It Works
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">
            Get started in minutes, not days.
          </p>
        </div>

        <div className="grid gap-8 md:grid-cols-3">
          {STEPS.map((step) => (
            <div key={step.step} className="text-center">
              <div className="relative mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-teal-500 text-white shadow-lg shadow-teal-500/25">
                <step.icon className="h-7 w-7" />
                <span className="absolute -top-2 -right-2 flex h-7 w-7 items-center justify-center rounded-full bg-navy-900 text-xs font-bold text-white">
                  {step.step}
                </span>
              </div>
              <h3 className="font-heading text-xl font-semibold mb-3">
                {step.title}
              </h3>
              <p className="text-sm text-muted-foreground leading-relaxed max-w-xs mx-auto">
                {step.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
