import { Card, CardContent } from "@/components/ui/card";
import { Star } from "lucide-react";

const TESTIMONIALS = [
  {
    name: "Dr. Priya Mehta",
    role: "Dentist, Mumbai",
    avatar: "PM",
    quote:
      "ReviewPilot helped us go from 3.8 to 4.6 stars in just 3 months. The AI replies sound exactly like us — patients can't tell the difference. We've saved hours every week.",
    rating: 5,
  },
  {
    name: "Arjun Krishnamurthy",
    role: "App Developer, Bangalore",
    avatar: "AK",
    quote:
      "Managing Play Store reviews for 3 apps used to take me all morning. Now I review AI-generated replies in 10 minutes and publish them all. Game changer for indie devs.",
    rating: 5,
  },
  {
    name: "Nisha Agarwal",
    role: "Marketing Agency, Delhi",
    avatar: "NA",
    quote:
      "We manage reviews for 15 local businesses. ReviewPilot's agency plan saves us ₹2 lakh per month compared to Birdeye. The white-label feature is perfect for our clients.",
    rating: 5,
  },
];

export function TestimonialCarousel() {
  return (
    <section className="py-20 sm:py-28 bg-secondary/30">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="font-heading text-3xl font-bold sm:text-4xl">
            Loved by Businesses &amp; Developers
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">
            See why hundreds of businesses trust ReviewPilot.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          {TESTIMONIALS.map((t) => (
            <Card key={t.name} className="hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <div className="flex gap-0.5 mb-4">
                  {Array.from({ length: t.rating }).map((_, i) => (
                    <Star
                      key={i}
                      className="h-4 w-4 fill-amber-400 text-amber-400"
                    />
                  ))}
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed mb-6">
                  &ldquo;{t.quote}&rdquo;
                </p>
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-teal-100 dark:bg-teal-900 flex items-center justify-center text-teal-700 dark:text-teal-300 font-bold text-sm">
                    {t.avatar}
                  </div>
                  <div>
                    <p className="text-sm font-semibold">{t.name}</p>
                    <p className="text-xs text-muted-foreground">{t.role}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
