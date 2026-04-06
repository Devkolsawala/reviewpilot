"use client";

import { useState, useEffect } from "react";
import { CampaignBuilder } from "@/components/dashboard/CampaignBuilder";
import { PageTransition } from "@/components/dashboard/PageTransition";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Plus, MessageSquare, Mail, CheckCircle2, Clock, XCircle, Megaphone } from "lucide-react";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";

interface Campaign {
  id: string;
  name: string;
  type: "sms" | "email";
  total_sent: number;
  total_clicked: number;
  created_at: string;
  status: "draft" | "active" | "paused" | "completed";
}

function useCampaigns() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchCampaigns() {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("campaigns")
        .select("id, name, type, total_sent, total_clicked, created_at, status")
        .order("created_at", { ascending: false });

      if (error) {
        console.error("[useCampaigns] Error:", error);
        setCampaigns([]);
      } else {
        setCampaigns((data as Campaign[]) || []);
      }
      setLoading(false);
    }
    fetchCampaigns();
  }, []);

  return { campaigns, loading };
}

const statusIcon = {
  completed: CheckCircle2,
  sending: Clock,
  active: Clock,
  paused: Clock,
  failed: XCircle,
  draft: Clock,
};
const statusColor = {
  completed: "text-green-600 bg-green-50 dark:text-green-400 dark:bg-green-950/30",
  active: "text-teal-600 bg-teal-50 dark:text-teal-400 dark:bg-teal-950/30",
  sending: "text-amber-600 bg-amber-50 dark:text-amber-400 dark:bg-amber-950/30",
  paused: "text-amber-600 bg-amber-50 dark:text-amber-400 dark:bg-amber-950/30",
  failed: "text-red-600 bg-red-50 dark:text-red-400 dark:bg-red-950/30",
  draft: "text-muted-foreground bg-secondary",
};

export default function CampaignsPage() {
  const [showBuilder, setShowBuilder] = useState(false);
  const { campaigns, loading } = useCampaigns();

  return (
    <PageTransition>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-heading text-2xl font-bold">Campaigns</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Send SMS or email campaigns to collect reviews from your customers.
            </p>
          </div>
          <Button onClick={() => setShowBuilder(!showBuilder)}>
            <Plus className="mr-2 h-4 w-4" />
            {showBuilder ? "Cancel" : "Create Campaign"}
          </Button>
        </div>

        {showBuilder && (
          <Card>
            <CardContent className="p-6">
              <CampaignBuilder />
            </CardContent>
          </Card>
        )}

        {/* Campaign history */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold">Campaign History</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {loading ? (
              <div className="space-y-3 p-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="flex items-center gap-3">
                    <Skeleton className="h-4 w-48" />
                    <Skeleton className="h-4 w-16" />
                    <Skeleton className="h-4 w-12" />
                    <Skeleton className="h-4 w-12" />
                  </div>
                ))}
              </div>
            ) : campaigns.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center px-6">
                <div className="rounded-2xl bg-secondary/60 p-4 mb-4">
                  <Megaphone className="h-8 w-8 text-muted-foreground/50 mx-auto" />
                </div>
                <p className="text-sm font-medium mb-1">No campaigns yet</p>
                <p className="text-xs text-muted-foreground mb-4">
                  Create your first SMS or email campaign to collect reviews from customers.
                </p>
                <Button size="sm" onClick={() => setShowBuilder(true)}>
                  <Plus className="mr-2 h-3.5 w-3.5" />
                  Create Campaign
                </Button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b text-xs text-muted-foreground">
                      <th className="text-left font-medium p-3 pl-6">Campaign</th>
                      <th className="text-left font-medium p-3">Type</th>
                      <th className="text-left font-medium p-3">Sent</th>
                      <th className="text-left font-medium p-3">Clicked</th>
                      <th className="text-left font-medium p-3">Date</th>
                      <th className="text-left font-medium p-3 pr-6">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {campaigns.map((c) => {
                      const StatusIcon = statusIcon[c.status as keyof typeof statusIcon] || Clock;
                      const clickRate = c.total_sent > 0 ? Math.round((c.total_clicked / c.total_sent) * 100) : 0;
                      return (
                        <tr key={c.id} className="border-b last:border-0 hover:bg-secondary/30 transition-colors">
                          <td className="p-3 pl-6">
                            <span className="text-sm font-medium">{c.name}</span>
                          </td>
                          <td className="p-3">
                            <Badge variant="secondary" className="text-[10px] capitalize">
                              {c.type === "sms" ? (
                                <MessageSquare className="mr-1 h-3 w-3" />
                              ) : (
                                <Mail className="mr-1 h-3 w-3" />
                              )}
                              {c.type}
                            </Badge>
                          </td>
                          <td className="p-3 text-sm">{c.total_sent}</td>
                          <td className="p-3">
                            <div className="flex items-center gap-2">
                              <span className="text-sm">{c.total_clicked}</span>
                              <span className="text-xs text-muted-foreground">({clickRate}%)</span>
                            </div>
                          </td>
                          <td className="p-3 text-sm text-muted-foreground">
                            {new Date(c.created_at).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                          </td>
                          <td className="p-3 pr-6">
                            <Badge
                              variant="secondary"
                              className={cn("text-[10px] capitalize gap-1", statusColor[c.status as keyof typeof statusColor])}
                            >
                              <StatusIcon className="h-3 w-3" />
                              {c.status}
                            </Badge>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Cost estimate */}
        <Card className="bg-gradient-to-r from-teal-50 to-emerald-50 dark:from-teal-950/20 dark:to-emerald-950/20 border-teal-200/50 dark:border-teal-800/30">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-teal-800 dark:text-teal-300">SMS Pricing</p>
                <p className="text-xs text-teal-700/70 dark:text-teal-400/60 mt-0.5">
                  Approximately ₹0.60 per SMS. Email campaigns are free on all plans.
                </p>
              </div>
              <Button variant="outline" size="sm" className="border-teal-300 dark:border-teal-700 text-teal-700 dark:text-teal-300" asChild>
                <a href="/dashboard/settings/billing">View Pricing</a>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </PageTransition>
  );
}
