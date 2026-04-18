import { Star, Quote } from "lucide-react";

// TODO(marketing): swap to real customer testimonials when we have sign-offs.
const TESTIMONIALS = [
  {
    name: "Dr. Priya Mehta",
    role: "Dentist · Mumbai",
    avatar: "PM",
    quote:
      "We went from 3.8 to 4.6 stars in 3 months. The AI sounds like us — patients can't tell we didn't type every word ourselves.",
    rating: 5,
    featured: true,
  },
  {
    name: "Arjun K.",
    role: "Indie dev · Bangalore",
    avatar: "AK",
    quote:
      "Managing Play Store reviews for 3 apps used to eat my morning. Now it's 10 minutes of bulk-approve.",
    rating: 5,
  },
  {
    name: "Nisha Agarwal",
    role: "Marketing agency · Delhi",
    avatar: "NA",
    quote:
      "The agency plan saves us ₹2L/mo vs Birdeye. White-label reports are genuinely white — our logo, clean handoff.",
    rating: 5,
  },
  {
    name: "Sameer V.",
    role: "Restaurant owner · Pune",
    avatar: "SV",
    quote:
      "My staff used to ignore 1-star reviews. Now ReviewPilot replies overnight and I read the summary with my morning chai.",
    rating: 5,
  },
  {
    name: "Farhan R.",
    role: "Salon chain · Hyderabad",
    avatar: "FR",
    quote:
      "Response rate went from 15% to 96%. Google Maps traffic is up noticeably in the last quarter.",
    rating: 5,
  },
];

export function TestimonialCarousel() {
  return (
    <section className="relative py-24 sm:py-32 bg-muted/20">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
            Customer stories
          </p>
          <h2 className="mt-3 font-sans text-3xl font-semibold tracking-tight sm:text-4xl">
            Quiet wins, from the dashboards that
            <br className="hidden sm:block" />
            <span className="text-gradient-brand">opened our first tabs.</span>
          </h2>
        </div>

        <div className="mt-14 columns-1 gap-4 sm:columns-2 lg:columns-3 [column-fill:_balance]">
          {TESTIMONIALS.map((t) => (
            <article
              key={t.name}
              className="mb-4 break-inside-avoid rounded-2xl border border-border/60 bg-card/60 p-6 backdrop-blur-sm transition-colors hover:border-accent/30"
            >
              <Quote
                aria-hidden
                className="h-5 w-5 text-accent/60"
              />
              <p
                className={
                  t.featured
                    ? "mt-3 text-base leading-relaxed text-foreground"
                    : "mt-3 text-sm leading-relaxed text-foreground/90"
                }
              >
                &ldquo;{t.quote}&rdquo;
              </p>
              <div className="mt-5 flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[linear-gradient(135deg,#6366f1,#d946ef)] text-xs font-semibold text-white">
                  {t.avatar}
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium">{t.name}</p>
                  <p className="text-xs text-muted-foreground">{t.role}</p>
                </div>
                <div className="flex gap-0.5" aria-label={`${t.rating} star rating`}>
                  {Array.from({ length: t.rating }).map((_, i) => (
                    <Star
                      key={i}
                      className="h-3 w-3 fill-amber-400 text-amber-400"
                    />
                  ))}
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
