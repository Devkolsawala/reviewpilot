"use client";

import { AppContextForm } from "@/components/dashboard/AppContextForm";

export default function AIConfigPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-2xl font-bold">AI Configuration</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Configure your App Context Profile to help AI generate better replies.
        </p>
      </div>
      <AppContextForm />
    </div>
  );
}
