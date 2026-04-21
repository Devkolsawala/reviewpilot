"use client";

import Link from "next/link";
import { ArrowLeft, MessageCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { WhatsAppTemplatesTab } from "@/components/dashboard/WhatsAppTemplatesTab";
import { WhatsAppProfileTab } from "@/components/dashboard/WhatsAppProfileTab";

const WHATSAPP_GREEN = "#25D366";

export interface ConnectionDetailProps {
  id: string;
  type: string;
  name: string;
  createdAtFormatted: string;
  wabaId: string | null;
  phoneNumberId: string | null;
  displayPhoneNumber: string | null;
}

export function ConnectionDetailClient({
  connection,
}: {
  connection: ConnectionDetailProps;
}) {
  return (
    <div className="container mx-auto max-w-5xl px-4 py-8 space-y-6">
      <div>
        <Link
          href="/dashboard/settings/connections"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Back to Connections
        </Link>
      </div>

      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <div
            className="rounded-lg p-2.5"
            style={{ backgroundColor: `${WHATSAPP_GREEN}22` }}
          >
            <MessageCircle className="h-5 w-5" style={{ color: WHATSAPP_GREEN }} />
          </div>
          <div>
            <h1 className="font-sans text-2xl font-semibold tracking-tight">
              {connection.name}
            </h1>
            <div className="mt-1.5 flex flex-wrap items-center gap-2">
              <Badge
                variant="secondary"
                className="text-[10px]"
                style={{ backgroundColor: `${WHATSAPP_GREEN}22`, color: WHATSAPP_GREEN }}
              >
                WhatsApp Business
              </Badge>
              {connection.displayPhoneNumber && (
                <span className="text-xs text-muted-foreground font-mono">
                  {connection.displayPhoneNumber}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      <Tabs defaultValue="overview" className="w-full">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="templates">Templates</TabsTrigger>
          <TabsTrigger value="profile">Business Profile</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-4">
          <Card>
            <CardContent className="p-6 space-y-4">
              <OverviewRow
                label="Display phone number"
                value={connection.displayPhoneNumber || "—"}
                mono
              />
              <OverviewRow label="Verified name" value={connection.name || "—"} />
              <OverviewRow
                label="WhatsApp Business Account ID"
                value={connection.wabaId || "—"}
                mono
              />
              <OverviewRow
                label="Phone number ID"
                value={connection.phoneNumberId || "—"}
                mono
              />
              <OverviewRow
                label="Connected on"
                value={connection.createdAtFormatted}
              />
              <OverviewRow
                label="Webhook status"
                value={
                  <Badge variant="outline" className="text-[10px]">
                    Configured in Meta App Dashboard
                  </Badge>
                }
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="templates" className="mt-4">
          <WhatsAppTemplatesTab connectionId={connection.id} />
        </TabsContent>

        <TabsContent value="profile" className="mt-4">
          <WhatsAppProfileTab connectionId={connection.id} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function OverviewRow({
  label,
  value,
  mono,
}: {
  label: string;
  value: React.ReactNode;
  mono?: boolean;
}) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-[220px_1fr] gap-1 sm:gap-4 sm:items-center border-b border-border/60 pb-3 last:border-0 last:pb-0">
      <div className="text-xs uppercase tracking-[0.12em] text-muted-foreground">
        {label}
      </div>
      <div
        className={
          mono
            ? "text-sm font-mono text-foreground break-all"
            : "text-sm text-foreground"
        }
      >
        {value}
      </div>
    </div>
  );
}
