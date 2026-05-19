"use client";

import { useMemo, useState } from "react";
import type { ReactNode } from "react";
import { AlertTriangle, Clock, Star, TrendingUp } from "lucide-react";
import { Input } from "@/components/ui/input";

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function formatWeeks(weeks: number) {
  if (!Number.isFinite(weeks)) return "unknown";
  if (weeks < 1) return "under 1";
  if (weeks < 10) return weeks.toFixed(1);
  return Math.ceil(weeks).toString();
}

export function RatingCalculator() {
  const [currentRating, setCurrentRating] = useState(3.8);
  const [currentCount, setCurrentCount] = useState(1000);
  const [targetRating, setTargetRating] = useState(4.5);
  const [reviewsPerWeek, setReviewsPerWeek] = useState(10);

  const result = useMemo(() => {
    const rating = clamp(currentRating || 1, 1, 5);
    const count = Math.max(1, Math.floor(currentCount || 1));
    const target = clamp(targetRating || 1, 1, 5);
    const pace = Math.max(0, reviewsPerWeek || 0);

    const alreadyThere = target <= rating;
    const unreachable = target >= 5 && rating < 5;
    const needed =
      alreadyThere || unreachable
        ? 0
        : Math.max(
            0,
            Math.ceil(((target - rating) * count) / (5 - target)),
          );

    const weeks = pace > 0 && needed > 0 ? needed / pace : Number.POSITIVE_INFINITY;
    const dropTarget = Math.max(1.01, rating - 0.1);
    const oneStars =
      rating <= 1
        ? 0
        : Math.max(
            1,
            Math.ceil(((rating - dropTarget) * count) / (dropTarget - 1)),
          );
    const damagedRating = (rating * count + oneStars) / (count + oneStars);

    return {
      alreadyThere,
      unreachable,
      needed,
      weeks,
      oneStars,
      damagedRating,
      currentMarker: ((rating - 1) / 4) * 100,
      targetMarker: ((target - 1) / 4) * 100,
    };
  }, [currentRating, currentCount, targetRating, reviewsPerWeek]);

  return (
    <div className="overflow-hidden rounded-2xl border border-border/60 bg-card/40 p-5 shadow-2xl shadow-black/10 backdrop-blur-sm sm:p-6">
      <div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
        <div className="rounded-xl border border-border/60 bg-background/50 p-4">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-accent" />
            <h2 className="font-sans text-lg font-semibold tracking-tight">
              Enter your rating goal
            </h2>
          </div>

          <div className="mt-5 space-y-4">
            <NumberField
              label="Current rating"
              value={currentRating}
              min={1}
              max={5}
              step={0.01}
              onChange={setCurrentRating}
            />
            <NumberField
              label="Current number of reviews"
              value={currentCount}
              min={1}
              step={1}
              onChange={setCurrentCount}
            />
            <NumberField
              label="Target rating"
              value={targetRating}
              min={1}
              max={5}
              step={0.01}
              onChange={setTargetRating}
            />
            <NumberField
              label="New reviews per week"
              value={reviewsPerWeek}
              min={0}
              step={1}
              onChange={setReviewsPerWeek}
            />
          </div>
        </div>

        <div className="space-y-4">
          <div className="rounded-xl border border-brand-500/30 bg-[linear-gradient(135deg,rgba(99,102,241,0.16),rgba(217,70,239,0.12))] p-5">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
              Rating lift required
            </div>
            {result.alreadyThere ? (
              <p className="mt-3 text-2xl font-semibold tracking-tight">
                You are already at or above that target.
              </p>
            ) : result.unreachable ? (
              <p className="mt-3 text-2xl font-semibold tracking-tight">
                A perfect 5.00 target is not reachable with old ratings included.
              </p>
            ) : (
              <p className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">
                You need{" "}
                <span className="text-gradient-brand">
                  {result.needed.toLocaleString("en-IN")}
                </span>{" "}
                new 5-star reviews
              </p>
            )}
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <OutputCard
              icon={<Clock className="h-4 w-4 text-accent" />}
              label="Time estimate"
              value={
                result.needed > 0
                  ? `~${formatWeeks(result.weeks)} weeks`
                  : "No lift needed"
              }
              detail={`At ${reviewsPerWeek || 0} reviews/week, this is your rough recovery window.`}
            />
            <OutputCard
              icon={<AlertTriangle className="h-4 w-4 text-amber-400" />}
              label="Damage warning"
              value={`${result.oneStars.toLocaleString("en-IN")} new 1-stars`}
              detail={`Could pull you down to ${result.damagedRating.toFixed(2)} if they arrive before recovery.`}
            />
          </div>

          <div className="rounded-xl border border-border/60 bg-background/50 p-5">
            <div className="flex items-center justify-between gap-3 text-xs text-muted-foreground">
              <span>1.0</span>
              <span>Current to target</span>
              <span>5.0</span>
            </div>
            <div className="relative mt-4 h-4 rounded-full bg-muted">
              <div
                className="absolute inset-y-0 left-0 rounded-full bg-[linear-gradient(90deg,#6366f1,#d946ef)]"
                style={{
                  width: `${clamp(result.targetMarker, result.currentMarker, 100)}%`,
                }}
              />
              <div
                className="absolute top-1/2 h-7 w-1 -translate-y-1/2 rounded-full bg-foreground"
                style={{ left: `${clamp(result.currentMarker, 0, 100)}%` }}
                aria-label="Current rating marker"
              />
              <div
                className="absolute top-1/2 h-7 w-1 -translate-y-1/2 rounded-full bg-fuchsia-300"
                style={{ left: `${clamp(result.targetMarker, 0, 100)}%` }}
                aria-label="Target rating marker"
              />
            </div>
            <div className="mt-3 flex items-center justify-between text-xs">
              <span>Current: {currentRating.toFixed(2)}</span>
              <span>Target: {targetRating.toFixed(2)}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function NumberField({
  label,
  value,
  min,
  max,
  step,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max?: number;
  step: number;
  onChange: (value: number) => void;
}) {
  return (
    <label className="block">
      <span className="text-sm font-medium text-foreground">{label}</span>
      <Input
        type="number"
        value={value}
        min={min}
        max={max}
        step={step}
        onChange={(event) => onChange(Number(event.target.value))}
        className="mt-2 bg-background/80"
      />
    </label>
  );
}

function OutputCard({
  icon,
  label,
  value,
  detail,
}: {
  icon: ReactNode;
  label: string;
  value: string;
  detail: string;
}) {
  return (
    <div className="rounded-xl border border-border/60 bg-background/50 p-4">
      <div className="flex items-center gap-2 text-xs uppercase tracking-wider text-muted-foreground">
        {icon}
        {label}
      </div>
      <p className="mt-2 text-xl font-semibold tracking-tight">{value}</p>
      <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
        {detail}
      </p>
    </div>
  );
}
