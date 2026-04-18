"use client";

import { Smartphone, Globe } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Connection } from "@/types/connection";

interface AppSwitcherProps {
 connections: Connection[];
 activeId: string | null; // null = "All Apps"
 onChange: (id: string | null) => void;
 showAllApps?: boolean;
 className?: string;
}

export function AppSwitcher({
 connections,
 activeId,
 onChange,
 showAllApps = true,
 className,
}: AppSwitcherProps) {
 return (
 <div className={cn("relative", className)}>
 <div className="flex gap-1.5 overflow-x-auto scrollbar-hide px-3 py-2.5">
 {showAllApps && (
 <button
 onClick={() => onChange(null)}
 className={cn(
 "shrink-0 rounded-full px-3 py-1.5 text-xs font-medium transition-all duration-150",
 activeId === null
 ? "bg-accent text-white shadow-sm"
 : "bg-secondary text-muted-foreground hover:text-foreground"
 )}
 >
 All Apps
 </button>
 )}
 {connections.map((conn) => (
 <button
 key={conn.id}
 onClick={() => onChange(conn.id)}
 className={cn(
 "shrink-0 rounded-full px-3 py-1.5 text-xs font-medium transition-all duration-150 flex items-center gap-1.5",
 activeId === conn.id
 ? "bg-accent text-white shadow-sm"
 : "bg-secondary text-muted-foreground hover:text-foreground"
 )}
 >
 {conn.type === "play_store" ? (
 <Smartphone className="h-3 w-3 shrink-0" />
 ) : (
 <Globe className="h-3 w-3 shrink-0" />
 )}
 {conn.name}
 </button>
 ))}
 </div>
 {/* Right-edge fade to signal overflow */}
 <div className="pointer-events-none absolute right-0 top-0 h-full w-8 bg-gradient-to-l from-card to-transparent" />
 </div>
 );
}
