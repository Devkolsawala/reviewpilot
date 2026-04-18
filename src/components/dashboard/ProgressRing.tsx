"use client";

interface ProgressRingProps {
 value: number; // 0-100
 size?: number;
 strokeWidth?: number;
 className?: string;
}

export function ProgressRing({ value, size = 48, strokeWidth = 4, className }: ProgressRingProps) {
 const radius = (size - strokeWidth) / 2;
 const circumference = 2 * Math.PI * radius;
 const offset = circumference - (value / 100) * circumference;

 return (
 <svg width={size} height={size} className={className}>
 <circle
 cx={size / 2}
 cy={size / 2}
 r={radius}
 fill="none"
 stroke="currentColor"
 strokeWidth={strokeWidth}
 className="text-border"
 />
 <circle
 cx={size / 2}
 cy={size / 2}
 r={radius}
 fill="none"
 stroke="currentColor"
 strokeWidth={strokeWidth}
 strokeLinecap="round"
 strokeDasharray={circumference}
 strokeDashoffset={offset}
 className="text-accent transition-all duration-700 ease-out"
 transform={`rotate(-90 ${size / 2} ${size / 2})`}
 />
 </svg>
 );
}
