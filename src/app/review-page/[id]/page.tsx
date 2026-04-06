"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Star, CheckCircle2, ExternalLink } from "lucide-react";
import { cn } from "@/lib/utils";

export default function ReviewPage({ params }: { params: { id: string } }) {
  const [rating, setRating] = useState(0);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [feedback, setFeedback] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [step, setStep] = useState<"rate" | "redirect" | "feedback">("rate");

  function handleRatingSelect(r: number) {
    setRating(r);
    if (r >= 4) {
      setStep("redirect");
    } else {
      setStep("feedback");
    }
  }

  async function handleFeedbackSubmit() {
    // In production, this would save to the database
    console.log("[Review Page] Private feedback:", { campaignId: params.id, rating, feedback });
    setSubmitted(true);
  }

  if (submitted) {
    return (
      <PageContainer>
        <CheckCircle2 className="h-16 w-16 text-teal-500 mx-auto mb-6" />
        <h2 className="font-heading text-2xl font-bold mb-2">Thank You!</h2>
        <p className="text-muted-foreground">
          Your feedback has been received. We appreciate you taking the time to share your thoughts.
        </p>
      </PageContainer>
    );
  }

  if (step === "redirect") {
    return (
      <PageContainer>
        <div className="flex gap-1 justify-center mb-6">
          {[1, 2, 3, 4, 5].map((i) => (
            <Star
              key={i}
              className={cn(
                "h-8 w-8",
                i <= rating ? "fill-amber-400 text-amber-400" : "text-muted-foreground/30"
              )}
            />
          ))}
        </div>
        <h2 className="font-heading text-2xl font-bold mb-2">
          We&apos;re Glad You&apos;re Happy!
        </h2>
        <p className="text-muted-foreground mb-6">
          Would you mind leaving us a review? It helps others discover us!
        </p>
        <div className="space-y-3">
          <Button className="w-full" size="lg" asChild>
            <a href="https://g.page/review" target="_blank" rel="noopener noreferrer">
              <ExternalLink className="mr-2 h-4 w-4" />
              Leave a Google Review
            </a>
          </Button>
          <Button variant="outline" className="w-full" onClick={() => { setSubmitted(true); }}>
            No thanks
          </Button>
        </div>
      </PageContainer>
    );
  }

  if (step === "feedback") {
    return (
      <PageContainer>
        <div className="flex gap-1 justify-center mb-6">
          {[1, 2, 3, 4, 5].map((i) => (
            <Star
              key={i}
              className={cn(
                "h-8 w-8",
                i <= rating ? "fill-amber-400 text-amber-400" : "text-muted-foreground/30"
              )}
            />
          ))}
        </div>
        <h2 className="font-heading text-2xl font-bold mb-2">
          We&apos;re Sorry to Hear That
        </h2>
        <p className="text-muted-foreground mb-6">
          Please tell us what went wrong so we can improve. Your feedback is private and won&apos;t be posted publicly.
        </p>
        <Textarea
          placeholder="What could we do better?"
          value={feedback}
          onChange={(e) => setFeedback(e.target.value)}
          rows={4}
          className="mb-4"
        />
        <Button className="w-full" onClick={handleFeedbackSubmit} disabled={!feedback}>
          Send Feedback
        </Button>
      </PageContainer>
    );
  }

  // Rate step
  return (
    <PageContainer>
      <h2 className="font-heading text-2xl font-bold mb-2">How Was Your Experience?</h2>
      <p className="text-muted-foreground mb-8">
        Tap a star to rate us. Your feedback helps us improve!
      </p>
      <div className="flex gap-2 justify-center mb-8">
        {[1, 2, 3, 4, 5].map((i) => (
          <button
            key={i}
            onClick={() => handleRatingSelect(i)}
            onMouseEnter={() => setHoveredRating(i)}
            onMouseLeave={() => setHoveredRating(0)}
            className="transition-transform hover:scale-110"
          >
            <Star
              className={cn(
                "h-12 w-12 transition-colors",
                i <= (hoveredRating || rating)
                  ? "fill-amber-400 text-amber-400"
                  : "text-muted-foreground/30"
              )}
            />
          </button>
        ))}
      </div>
      <p className="text-sm text-muted-foreground">
        Powered by{" "}
        <span className="font-heading font-semibold text-teal-600">ReviewPilot</span>
      </p>
    </PageContainer>
  );
}

function PageContainer({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-6">
      <div className="w-full max-w-md text-center">
        <div className="flex items-center justify-center gap-2 mb-8">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-teal-500 text-white font-heading font-bold text-sm">
            RP
          </div>
        </div>
        {children}
      </div>
    </div>
  );
}
