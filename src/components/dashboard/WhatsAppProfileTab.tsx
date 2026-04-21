"use client";

import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/components/ui/use-toast";
import { Loader2, AlertTriangle, Save } from "lucide-react";

interface Profile {
  description?: string;
  about?: string;
  email?: string;
  address?: string;
}

export function WhatsAppProfileTab({ connectionId }: { connectionId: string }) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [loadError, setLoadError] = useState("");
  const [saveError, setSaveError] = useState("");
  const [description, setDescription] = useState("");
  const [about, setAbout] = useState("");
  const [email, setEmail] = useState("");
  const [address, setAddress] = useState("");

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setLoadError("");
      try {
        const res = await fetch(
          `/api/whatsapp/profile?connectionId=${encodeURIComponent(connectionId)}`
        );
        const data = await res.json();
        if (cancelled) return;
        if (!res.ok) {
          setLoadError(data.error || "Failed to load business profile");
          return;
        }
        const p: Profile = data.profile || {};
        setDescription(p.description || "");
        setAbout(p.about || "");
        setEmail(p.email || "");
        setAddress(p.address || "");
      } catch (e) {
        if (!cancelled)
          setLoadError(e instanceof Error ? e.message : "Unexpected error");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [connectionId]);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaveError("");
    setSaving(true);
    try {
      const res = await fetch("/api/whatsapp/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          connectionId,
          description,
          about,
          email,
          address,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setSaveError(data.error || "Failed to save profile");
        return;
      }
      toast({
        title: "Business profile updated",
        description: "Changes are live on your WhatsApp Business profile.",
      });
    } catch (e) {
      setSaveError(e instanceof Error ? e.message : "Unexpected error");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center gap-2 py-10 justify-center text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" /> Loading business profile…
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="p-6">
        <div className="mb-4">
          <h3 className="font-sans text-base font-semibold tracking-tight">
            Business profile
          </h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            Shown to customers who open your WhatsApp contact card.
          </p>
        </div>

        {loadError && (
          <div className="rounded-lg border border-red-200 bg-red-50 dark:bg-red-950/20 dark:border-red-800 p-3 flex items-start gap-2.5 text-sm mb-4">
            <AlertTriangle className="h-4 w-4 text-red-500 mt-0.5 shrink-0" />
            <p className="text-red-700 dark:text-red-400 break-words flex-1">
              {loadError}
            </p>
          </div>
        )}

        <form onSubmit={handleSave} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="wa-description">Business description</Label>
            <Textarea
              id="wa-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              maxLength={512}
            />
            <p className="text-xs text-muted-foreground text-right">
              {description.length}/512
            </p>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="wa-about">About</Label>
            <Input
              id="wa-about"
              value={about}
              onChange={(e) => setAbout(e.target.value)}
              maxLength={139}
            />
            <p className="text-xs text-muted-foreground text-right">
              {about.length}/139
            </p>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="wa-email">Business email</Label>
            <Input
              id="wa-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="hello@example.com"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="wa-address">Address</Label>
            <Input
              id="wa-address"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="Street, city, state"
            />
          </div>

          {saveError && (
            <div className="rounded-lg border border-red-200 bg-red-50 dark:bg-red-950/20 dark:border-red-800 p-3 flex items-start gap-2.5 text-sm">
              <AlertTriangle className="h-4 w-4 text-red-500 mt-0.5 shrink-0" />
              <p className="text-red-700 dark:text-red-400 break-words flex-1">
                {saveError}
              </p>
            </div>
          )}

          <div className="flex justify-end">
            <Button type="submit" disabled={saving}>
              {saving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving…
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" /> Save changes
                </>
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
