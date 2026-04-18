"use client";

import { useState } from "react";
import { AppContextForm } from "@/components/dashboard/AppContextForm";
import { AppSwitcher } from "@/components/dashboard/AppSwitcher";
import { useConnections } from "@/hooks/useConnection";
import { useTeamRole } from "@/hooks/useTeamRole";
import { Loader2, Lock } from "lucide-react";

export default function AIConfigPage() {
 const { connections, loading } = useConnections();
 const { isReadOnly } = useTeamRole();
 const [selectedConnId, setSelectedConnId] = useState<string | null>(null);

 const activeConnections = connections.filter((c) => c.is_active);
 const resolvedConnId = selectedConnId ?? activeConnections[0]?.id ?? null;

 return (
 <div className="space-y-6">
 <div>
 <h1 className="font-sans text- font-semibold tracking-tight">AI Configuration</h1>
 <p className="text-sm text-muted-foreground mt-1">
 Configure your App Context Profile to help AI generate better replies.
 </p>
 </div>

 {isReadOnly && (
 <div className="flex items-center gap-3 rounded-lg border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-700 dark:text-amber-400">
 <Lock className="h-4 w-4 shrink-0" />
 Your role is read-only. You can view AI settings but cannot make changes.
 </div>
 )}

 {/* App switcher — only shown when 2+ connections are active */}
 {!loading && activeConnections.length > 1 && (
 <div className="flex flex-col gap-1.5">
 <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
 Configuring for
 </p>
 <AppSwitcher
 connections={activeConnections}
 activeId={resolvedConnId}
 onChange={(id) => setSelectedConnId(id)}
 showAllApps={false}
 className="rounded-lg border bg-card"
 />
 </div>
 )}

 {loading && (
 <div className="flex items-center gap-2 text-sm text-muted-foreground">
 <Loader2 className="h-4 w-4 animate-spin" />
 Loading connections…
 </div>
 )}

 {/* Mount a fresh form when the selected connection changes */}
 {resolvedConnId && (
 <AppContextForm key={resolvedConnId} connectionId={resolvedConnId} disabled={isReadOnly} />
 )}
 {!loading && !resolvedConnId && (
 <AppContextForm disabled={isReadOnly} />
 )}
 </div>
 );
}
