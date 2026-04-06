import { Check, X } from "lucide-react";

const COMPETITORS = [
  {
    name: "ReviewPilot",
    price: "₹1,500/mo",
    highlight: true,
    features: {
      ai_replies: true,
      google_business: true,
      play_store: true,
      sms_campaigns: true,
      analytics: true,
      white_label: true,
      unlimited_users: false,
    },
  },
  {
    name: "Birdeye",
    price: "₹25,000/mo",
    highlight: false,
    features: {
      ai_replies: true,
      google_business: true,
      play_store: false,
      sms_campaigns: true,
      analytics: true,
      white_label: true,
      unlimited_users: true,
    },
  },
  {
    name: "Podium",
    price: "₹20,000/mo",
    highlight: false,
    features: {
      ai_replies: false,
      google_business: true,
      play_store: false,
      sms_campaigns: true,
      analytics: true,
      white_label: false,
      unlimited_users: false,
    },
  },
  {
    name: "AppFollow",
    price: "₹15,000/mo",
    highlight: false,
    features: {
      ai_replies: true,
      google_business: false,
      play_store: true,
      sms_campaigns: false,
      analytics: true,
      white_label: false,
      unlimited_users: false,
    },
  },
];

const FEATURE_LABELS: Record<string, string> = {
  ai_replies: "AI Auto-Replies",
  google_business: "Google Business",
  play_store: "Play Store",
  sms_campaigns: "SMS Campaigns",
  analytics: "Sentiment Analytics",
  white_label: "White-Label",
  unlimited_users: "Unlimited Team Seats",
};

export function ComparisonTable() {
  return (
    <section className="py-20 sm:py-28 bg-background">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="font-heading text-3xl font-bold sm:text-4xl">
            Why Pay <span className="text-teal-500">10x More</span>?
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">
            Get more features at a fraction of the price.
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr>
                <th className="text-left p-4 font-heading font-semibold">
                  Feature
                </th>
                {COMPETITORS.map((c) => (
                  <th
                    key={c.name}
                    className={`p-4 text-center font-heading font-semibold ${
                      c.highlight
                        ? "bg-teal-50 dark:bg-teal-950/30 text-teal-700 dark:text-teal-400 rounded-t-lg"
                        : ""
                    }`}
                  >
                    <div>{c.name}</div>
                    <div
                      className={`text-xs mt-1 ${
                        c.highlight
                          ? "text-teal-600 dark:text-teal-400"
                          : "text-muted-foreground"
                      }`}
                    >
                      {c.price}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {Object.entries(FEATURE_LABELS).map(([key, label]) => (
                <tr key={key} className="border-t">
                  <td className="p-4 text-muted-foreground">{label}</td>
                  {COMPETITORS.map((c) => (
                    <td
                      key={c.name}
                      className={`p-4 text-center ${
                        c.highlight
                          ? "bg-teal-50/50 dark:bg-teal-950/20"
                          : ""
                      }`}
                    >
                      {c.features[key as keyof typeof c.features] ? (
                        <Check className="h-5 w-5 text-teal-500 mx-auto" />
                      ) : (
                        <X className="h-5 w-5 text-muted-foreground/40 mx-auto" />
                      )}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}
