"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { MessageSquare, Mail, Plus, Trash2, Send } from "lucide-react";
import { toast } from "@/components/ui/use-toast";

interface Recipient {
 id: string;
 name: string;
 contact: string;
}

export function CampaignBuilder() {
 const [campaignType, setCampaignType] = useState<"sms" | "email">("sms");
 const [name, setName] = useState("");
 const [message, setMessage] = useState(
 "Hi {{name}}, we hope you enjoyed your experience! We'd love your feedback. Leave us a review here: {{link}}"
 );
 const [recipients, setRecipients] = useState<Recipient[]>([
 { id: "1", name: "Rahul Sharma", contact: "+919876543210" },
 { id: "2", name: "Priya Patel", contact: "+919876543211" },
 ]);
 const [newName, setNewName] = useState("");
 const [newContact, setNewContact] = useState("");
 const [sending, setSending] = useState(false);

 function addRecipient() {
 if (!newName || !newContact) return;
 setRecipients([
 ...recipients,
 { id: Date.now().toString(), name: newName, contact: newContact },
 ]);
 setNewName("");
 setNewContact("");
 }

 function removeRecipient(id: string) {
 setRecipients(recipients.filter((r) => r.id !== id));
 }

 async function handleSend() {
 setSending(true);
 const endpoint = campaignType === "sms" ? "/api/campaigns/send-sms" : "/api/campaigns/send-email";
 try {
 await fetch(endpoint, {
 method: "POST",
 headers: { "Content-Type": "application/json" },
 body: JSON.stringify({ name, message, recipients, type: campaignType }),
 });
 toast({ title: "Campaign sent", description: `${recipients.length} ${campaignType.toUpperCase()} message${recipients.length !== 1 ? "s" : ""} queued for delivery.` });
 } catch {
 toast({ title: "Failed to send", description: "Something went wrong. Please try again.", variant: "destructive" });
 } finally {
 setSending(false);
 }
 }

 return (
 <div className="space-y-6">
 <Tabs value={campaignType} onValueChange={(v) => setCampaignType(v as "sms" | "email")}>
 <TabsList>
 <TabsTrigger value="sms">
 <MessageSquare className="mr-2 h-4 w-4" />
 SMS Campaign
 </TabsTrigger>
 <TabsTrigger value="email">
 <Mail className="mr-2 h-4 w-4" />
 Email Campaign
 </TabsTrigger>
 </TabsList>

 <TabsContent value="sms" className="space-y-6 mt-6">
 <CampaignForm
 name={name}
 setName={setName}
 message={message}
 setMessage={setMessage}
 contactLabel="Phone Number"
 contactPlaceholder="+91 98765 43210"
 />
 </TabsContent>

 <TabsContent value="email" className="space-y-6 mt-6">
 <CampaignForm
 name={name}
 setName={setName}
 message={message}
 setMessage={setMessage}
 contactLabel="Email Address"
 contactPlaceholder="customer@email.com"
 />
 </TabsContent>
 </Tabs>

 {/* Recipients */}
 <Card>
 <CardHeader className="pb-3">
 <CardTitle className="text-base font-semibold flex items-center gap-2">
 Recipients
 <Badge variant="secondary">{recipients.length}</Badge>
 </CardTitle>
 </CardHeader>
 <CardContent className="space-y-3">
 <div className="flex gap-2">
 <Input
 placeholder="Name"
 value={newName}
 onChange={(e) => setNewName(e.target.value)}
 className="flex-1"
 />
 <Input
 placeholder={campaignType === "sms" ? "+91 98765 43210" : "email@example.com"}
 value={newContact}
 onChange={(e) => setNewContact(e.target.value)}
 className="flex-1"
 />
 <Button size="icon" variant="outline" onClick={addRecipient}>
 <Plus className="h-4 w-4" />
 </Button>
 </div>

 <div className="space-y-2 max-h-48 overflow-y-auto">
 {recipients.map((r) => (
 <div
 key={r.id}
 className="flex items-center justify-between rounded-lg border p-2.5 text-sm"
 >
 <div>
 <span className="font-medium">{r.name}</span>
 <span className="text-muted-foreground ml-2">{r.contact}</span>
 </div>
 <button
 onClick={() => removeRecipient(r.id)}
 className="text-muted-foreground hover:text-destructive"
 >
 <Trash2 className="h-4 w-4" />
 </button>
 </div>
 ))}
 </div>
 </CardContent>
 </Card>

 <Button onClick={handleSend} disabled={sending || !name || recipients.length === 0} className="w-full">
 <Send className="mr-2 h-4 w-4" />
 {sending ? "Sending..." : `Send ${campaignType.toUpperCase()} to ${recipients.length} recipients`}
 </Button>
 </div>
 );
}

function CampaignForm({
 name,
 setName,
 message,
 setMessage,
}: {
 name: string;
 setName: (v: string) => void;
 message: string;
 setMessage: (v: string) => void;
 contactLabel?: string;
 contactPlaceholder?: string;
}) {
 return (
 <Card>
 <CardContent className="p-6 space-y-4">
 <div className="space-y-2">
 <Label>Campaign Name</Label>
 <Input
 placeholder="March Review Request"
 value={name}
 onChange={(e) => setName(e.target.value)}
 />
 </div>
 <div className="space-y-2">
 <Label>Message Template</Label>
 <Textarea
 value={message}
 onChange={(e) => setMessage(e.target.value)}
 rows={4}
 />
 <p className="text-xs text-muted-foreground">
 Use {"{{name}}"} for recipient name and {"{{link}}"} for the review link.
 </p>
 </div>
 </CardContent>
 </Card>
 );
}
