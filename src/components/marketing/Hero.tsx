import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowRight, Star, MessageSquare, BarChart3 } from "lucide-react";

export function Hero() {
  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-background to-secondary/30 py-20 sm:py-32">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid gap-12 lg:grid-cols-2 lg:gap-8 items-center">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 rounded-full bg-teal-500/10 px-3 py-1 text-sm text-teal-600 mb-6">
              <Star className="h-3.5 w-3.5 fill-teal-500 text-teal-500" />
              🇮🇳 Made in India · Play Store + Google ready
            </div>

            <h1 className="font-heading text-4xl font-bold tracking-tight text-foreground sm:text-5xl lg:text-6xl">
              Never lose a customer to a{" "}
              <span className="text-teal-500">bad review</span> again.
            </h1>

            <p className="mt-6 text-lg text-muted-foreground leading-relaxed">
              ReviewPilot is AI review management built for Indian SMBs and app
              makers — replying to every Google Business Profile and Play Store
              review in seconds, lifting your rating automatically. From{" "}
              <span className="font-semibold text-foreground">₹1,500/month</span>
              , roughly{" "}
              <span className="font-semibold text-foreground">
                17× cheaper
              </span>{" "}
              than Birdeye or Podium.
            </p>

            <div className="mt-8 flex flex-col sm:flex-row gap-4">
              <Button size="lg" asChild>
                <Link href="/signup">
                  Start Free Trial
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <Link href="/demo">Request a Demo</Link>
              </Button>
            </div>

            <p className="mt-4 text-sm text-muted-foreground">
              7-day free trial. No credit card required. Setup in under 5 minutes.
            </p>
          </div>

          {/* Dashboard mockup */}
          <div className="relative hidden lg:block">
            <div className="rounded-xl border bg-card shadow-2xl p-6">
              <div className="flex items-center gap-2 mb-4">
                <div className="h-3 w-3 rounded-full bg-red-400" />
                <div className="h-3 w-3 rounded-full bg-amber-400" />
                <div className="h-3 w-3 rounded-full bg-green-400" />
                <span className="ml-2 text-xs text-muted-foreground">ReviewPilot Dashboard</span>
              </div>

              {/* Mock review card */}
              <div className="space-y-4">
                <div className="rounded-lg border bg-background p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="h-8 w-8 rounded-full bg-teal-100 flex items-center justify-center text-teal-700 text-xs font-bold">RS</div>
                    <div>
                      <p className="text-sm font-medium">Rahul Sharma</p>
                      <div className="flex gap-0.5">
                        {[1,2,3,4,5].map(i => (
                          <Star key={i} className={`h-3 w-3 ${i <= 1 ? "fill-amber-400 text-amber-400" : "text-muted-foreground/30"}`} />
                        ))}
                      </div>
                    </div>
                    <span className="ml-auto text-xs text-muted-foreground">2h ago</span>
                  </div>
                  <p className="text-sm text-muted-foreground mb-3">App crashes every time I try to download a status. Please fix!</p>
                  <div className="rounded-md bg-teal-50 dark:bg-teal-950/30 p-3 border border-teal-200 dark:border-teal-800">
                    <div className="flex items-center gap-1.5 mb-1">
                      <MessageSquare className="h-3.5 w-3.5 text-teal-600" />
                      <span className="text-xs font-medium text-teal-700 dark:text-teal-400">AI-Generated Reply</span>
                    </div>
                    <p className="text-sm text-teal-900 dark:text-teal-200">We&apos;re sorry about the crashes, Rahul. Our team has identified the issue and a fix is coming in the next update. Thank you for your patience!</p>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div className="rounded-lg border bg-background p-3 text-center">
                    <BarChart3 className="h-4 w-4 mx-auto text-teal-500 mb-1" />
                    <p className="text-lg font-bold">4.1</p>
                    <p className="text-[10px] text-muted-foreground">Avg Rating</p>
                  </div>
                  <div className="rounded-lg border bg-background p-3 text-center">
                    <MessageSquare className="h-4 w-4 mx-auto text-teal-500 mb-1" />
                    <p className="text-lg font-bold">78%</p>
                    <p className="text-[10px] text-muted-foreground">Response Rate</p>
                  </div>
                  <div className="rounded-lg border bg-background p-3 text-center">
                    <Star className="h-4 w-4 mx-auto text-amber-500 mb-1" />
                    <p className="text-lg font-bold">247</p>
                    <p className="text-[10px] text-muted-foreground">Reviews</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
