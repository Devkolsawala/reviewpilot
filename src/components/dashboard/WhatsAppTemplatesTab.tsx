"use client";

import { useCallback, useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "@/components/ui/use-toast";
import { Loader2, Plus, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";

interface Template {
  id: string;
  name: string;
  category: "UTILITY" | "MARKETING" | "AUTHENTICATION";
  status: "PENDING" | "APPROVED" | "REJECTED" | "PAUSED";
  language: string;
  components: unknown[];
}

const NAME_REGEX = /^[a-z0-9_]+$/;

export function WhatsAppTemplatesTab({ connectionId }: { connectionId: string }) {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [open, setOpen] = useState(false);

  const loadTemplates = useCallback(async () => {
    setLoading(true);
    setLoadError("");
    try {
      const res = await fetch(
        `/api/whatsapp/templates?connectionId=${encodeURIComponent(connectionId)}`
      );
      const data = await res.json();
      if (!res.ok) {
        setLoadError(data.error || "Failed to load templates");
        setTemplates([]);
        return;
      }
      setTemplates(data.templates || []);
    } catch (e) {
      setLoadError(e instanceof Error ? e.message : "Unexpected error");
      setTemplates([]);
    } finally {
      setLoading(false);
    }
  }, [connectionId]);

  useEffect(() => {
    loadTemplates();
  }, [loadTemplates]);

  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-between gap-3 mb-4">
          <div>
            <h3 className="font-sans text-base font-semibold tracking-tight">
              Message templates
            </h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              Pre-approved messages for conversations outside the 24-hour window.
            </p>
          </div>
          <Button size="sm" onClick={() => setOpen(true)}>
            <Plus className="mr-1.5 h-3.5 w-3.5" /> Create template
          </Button>
        </div>

        {loading ? (
          <div className="flex items-center gap-2 py-10 justify-center text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" /> Loading templates…
          </div>
        ) : loadError ? (
          <div className="rounded-lg border border-red-200 bg-red-50 dark:bg-red-950/20 dark:border-red-800 p-3 flex items-start gap-2.5 text-sm">
            <AlertTriangle className="h-4 w-4 text-red-500 mt-0.5 shrink-0" />
            <p className="text-red-700 dark:text-red-400 break-words flex-1">
              {loadError}
            </p>
          </div>
        ) : templates.length === 0 ? (
          <div className="py-10 text-center text-sm text-muted-foreground">
            No templates yet. Click <strong>Create template</strong> to submit your first one to Meta for approval.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left text-[11px] uppercase tracking-[0.12em] text-muted-foreground">
                  <th className="pb-2 pr-4 font-medium">Name</th>
                  <th className="pb-2 pr-4 font-medium">Category</th>
                  <th className="pb-2 pr-4 font-medium">Language</th>
                  <th className="pb-2 font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {templates.map((t) => (
                  <tr key={t.id} className="border-b border-border/60 last:border-0">
                    <td className="py-3 pr-4 font-mono text-xs break-all">{t.name}</td>
                    <td className="py-3 pr-4">
                      <Badge variant="outline" className="text-[10px]">
                        {t.category.toLowerCase()}
                      </Badge>
                    </td>
                    <td className="py-3 pr-4 text-xs text-muted-foreground">
                      {t.language}
                    </td>
                    <td className="py-3">
                      <StatusPill status={t.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>

      <CreateTemplateDialog
        open={open}
        onOpenChange={setOpen}
        connectionId={connectionId}
        onCreated={() => {
          toast({
            title: "Template submitted",
            description: "Awaiting Meta approval — this usually takes a few minutes.",
          });
          loadTemplates();
        }}
      />
    </Card>
  );
}

function StatusPill({ status }: { status: Template["status"] }) {
  const styles: Record<Template["status"], string> = {
    APPROVED:
      "bg-green-100 text-green-800 dark:bg-green-950/40 dark:text-green-300 border-green-200 dark:border-green-900",
    PENDING:
      "bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300 border-amber-200 dark:border-amber-900",
    REJECTED:
      "bg-red-100 text-red-800 dark:bg-red-950/40 dark:text-red-300 border-red-200 dark:border-red-900",
    PAUSED:
      "bg-gray-100 text-gray-800 dark:bg-gray-800/40 dark:text-gray-300 border-gray-200 dark:border-gray-700",
  };
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-medium",
        styles[status]
      )}
    >
      {status.toLowerCase()}
    </span>
  );
}

function CreateTemplateDialog({
  open,
  onOpenChange,
  connectionId,
  onCreated,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  connectionId: string;
  onCreated: () => void;
}) {
  const [name, setName] = useState("");
  const [category, setCategory] = useState<"UTILITY" | "MARKETING" | "AUTHENTICATION">(
    "UTILITY"
  );
  const [language] = useState("en");
  const [bodyText, setBodyText] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  function reset() {
    setName("");
    setCategory("UTILITY");
    setBodyText("");
    setError("");
    setSubmitting(false);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (!NAME_REGEX.test(name)) {
      setError("Template name must use only lowercase letters, digits, and underscores.");
      return;
    }
    if (!bodyText.trim()) {
      setError("Body text is required.");
      return;
    }
    if (bodyText.length > 1024) {
      setError("Body text exceeds 1024 characters.");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/whatsapp/templates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ connectionId, name, category, language, bodyText }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to submit template.");
        return;
      }
      reset();
      onOpenChange(false);
      onCreated();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unexpected error");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        if (!v) reset();
        onOpenChange(v);
      }}
    >
      <DialogContent className="sm:max-w-lg">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Create message template</DialogTitle>
            <DialogDescription>
              Submit to Meta for approval. Approval typically takes a few minutes.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-1.5">
              <Label htmlFor="tpl-name">Template name</Label>
              <Input
                id="tpl-name"
                placeholder="order_confirmation"
                value={name}
                onChange={(e) => setName(e.target.value.trim().toLowerCase())}
                pattern="^[a-z0-9_]+$"
                required
              />
              <p className="text-xs text-muted-foreground">
                Lowercase letters, digits, and underscores only.
              </p>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="tpl-category">Category</Label>
              <select
                id="tpl-category"
                value={category}
                onChange={(e) =>
                  setCategory(
                    e.target.value as "UTILITY" | "MARKETING" | "AUTHENTICATION"
                  )
                }
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              >
                <option value="UTILITY">Utility</option>
                <option value="MARKETING">Marketing</option>
                <option value="AUTHENTICATION">Authentication</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="tpl-language">Language</Label>
              <select
                id="tpl-language"
                value={language}
                disabled
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-muted-foreground"
              >
                <option value="en">English (en)</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="tpl-body">Body text</Label>
              <Textarea
                id="tpl-body"
                placeholder="Hi {{1}}, your order {{2}} is confirmed."
                value={bodyText}
                onChange={(e) => setBodyText(e.target.value)}
                rows={4}
                maxLength={1024}
                required
              />
              <div className="flex items-center justify-between">
                <p className="text-xs text-muted-foreground">
                  Use {"{{1}}"}, {"{{2}}"} for variables.
                </p>
                <p className="text-xs text-muted-foreground">
                  {bodyText.length}/1024
                </p>
              </div>
            </div>

            {error && (
              <div className="rounded-lg border border-red-200 bg-red-50 dark:bg-red-950/20 dark:border-red-800 p-3 flex items-start gap-2.5 text-sm">
                <AlertTriangle className="h-4 w-4 text-red-500 mt-0.5 shrink-0" />
                <p className="text-red-700 dark:text-red-400 break-words flex-1">
                  {error}
                </p>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={submitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Submitting…
                </>
              ) : (
                "Submit for approval"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
