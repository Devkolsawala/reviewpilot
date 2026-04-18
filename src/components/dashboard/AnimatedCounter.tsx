"use client";

import { useEffect, useRef, useState } from "react";

interface AnimatedCounterProps {
 value: number;
 duration?: number;
 decimals?: number;
 prefix?: string;
 suffix?: string;
 className?: string;
}

export function AnimatedCounter({
 value,
 duration = 800,
 decimals = 0,
 prefix = "",
 suffix = "",
 className,
}: AnimatedCounterProps) {
 const [display, setDisplay] = useState(0);
 const ref = useRef<HTMLSpanElement>(null);
 const hasAnimated = useRef(false);

 useEffect(() => {
 if (hasAnimated.current) {
 setDisplay(value);
 return;
 }

 const observer = new IntersectionObserver(
 ([entry]) => {
 if (entry.isIntersecting && !hasAnimated.current) {
 hasAnimated.current = true;
 const start = performance.now();
 const from = 0;
 const to = value;

 const tick = (now: number) => {
 const elapsed = now - start;
 const progress = Math.min(elapsed / duration, 1);
 const eased = 1 - Math.pow(1 - progress, 3);
 setDisplay(from + (to - from) * eased);
 if (progress < 1) requestAnimationFrame(tick);
 };

 requestAnimationFrame(tick);
 observer.disconnect();
 }
 },
 { threshold: 0.3 }
 );

 if (ref.current) observer.observe(ref.current);
 return () => observer.disconnect();
 }, [value, duration]);

 return (
 <span ref={ref} className={className}>
 {prefix}
 {display.toFixed(decimals)}
 {suffix}
 </span>
 );
}
