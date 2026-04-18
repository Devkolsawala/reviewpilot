"use client";

import { useEffect, useState, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { usePlan } from "@/hooks/usePlan";
import { useTeamRole } from "@/hooks/useTeamRole";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
 Dialog,
 DialogContent,
 DialogDescription,
 DialogFooter,
 DialogHeader,
 DialogTitle,
} from "@/components/ui/dialog";
import {
 Select,
 SelectContent,
 SelectItem,
 SelectTrigger,
 SelectValue,
} from "@/components/ui/select";
import { Plus, Trash2, Crown, Loader2, Clock, Users } from "lucide-react";

interface Member {
 id: string;
 email: string;
 role: "admin" | "read_only";
 status: "pending" | "active";
 invited_at: string;
 accepted_at: string | null;
 member_id: string | null;
}

export default function TeamPage() {
 const { plan, planId, isLoading: planLoading } = usePlan();
 const { isOwner } = useTeamRole();

 const [ownerEmail, setOwnerEmail] = useState("");
 const [ownerId, setOwnerId] = useState<string | null>(null);
 const [currentUserId, setCurrentUserId] = useState<string | null>(null);
 const [members, setMembers] = useState<Member[]>([]);
 const [loading, setLoading] = useState(true);

 const [inviteEmail, setInviteEmail] = useState("");
 const [inviteRole, setInviteRole] = useState<"admin" | "read_only">("admin");
 const [inviting, setInviting] = useState(false);
 const [inviteError, setInviteError] = useState("");
 const [inviteSuccess, setInviteSuccess] = useState("");

 const [removingId, setRemovingId] = useState<string | null>(null);
 const [updatingRoleId, setUpdatingRoleId] = useState<string | null>(null);
 const [confirmDelete, setConfirmDelete] = useState<Member | null>(null);

 const maxSeats = plan.limits.team_members;
 const usedSeats = members.filter((m) => m.status === "active" || m.status === "pending").length + 1; // +1 for owner
 const seatsFull = usedSeats >= maxSeats;

 const fetchMembers = useCallback(async () => {
 setLoading(true);
 const res = await fetch("/api/team/members");
 if (res.ok) {
 const data = await res.json();
 setMembers(data.members ?? []);
 // API returns ownerEmail + ownerId so non-owners see the correct workspace owner
 if (data.ownerEmail) setOwnerEmail(data.ownerEmail);
 if (data.ownerId) setOwnerId(data.ownerId);
 }
 setLoading(false);
 }, []);

 useEffect(() => {
 async function init() {
 // Track current user so we can show "You" on the correct row
 const supabase = createClient();
 const { data: { user } } = await supabase.auth.getUser();
 setCurrentUserId(user?.id ?? null);
 setOwnerEmail(user?.email ?? "");
 await fetchMembers();
 }
 init();
 }, [fetchMembers]);

 async function handleInvite() {
 setInviteError("");
 setInviteSuccess("");
 if (!inviteEmail) return;

 setInviting(true);
 const res = await fetch("/api/team/invite", {
 method: "POST",
 headers: { "Content-Type": "application/json" },
 body: JSON.stringify({ email: inviteEmail, role: inviteRole }),
 });
 const data = await res.json();
 setInviting(false);

 if (!res.ok) {
 setInviteError(data.message ?? data.error ?? "Failed to send invite.");
 return;
 }

 setInviteSuccess(`Invite sent to ${inviteEmail}`);
 setInviteEmail("");
 await fetchMembers();
 setTimeout(() => setInviteSuccess(""), 3000);
 }

 async function handleRemove(member: Member) {
 setConfirmDelete(member);
 }

 async function confirmRemove() {
 if (!confirmDelete) return;
 setRemovingId(confirmDelete.id);
 setConfirmDelete(null);
 await fetch(`/api/team/members/${confirmDelete.id}`, { method: "DELETE" });
 setRemovingId(null);
 await fetchMembers();
 }

 async function handleRoleChange(memberId: string, role: "admin" | "read_only") {
 setUpdatingRoleId(memberId);
 await fetch(`/api/team/members/${memberId}/role`, {
 method: "PATCH",
 headers: { "Content-Type": "application/json" },
 body: JSON.stringify({ role }),
 });
 setUpdatingRoleId(null);
 await fetchMembers();
 }

 const isPageLoading = loading || planLoading;

 return (
 <div className="space-y-6 max-w-2xl">
 <div>
 <h1 className="font-sans text- font-semibold tracking-tight">Team</h1>
 <p className="text-sm text-muted-foreground mt-1">
 Manage team members who can access your ReviewPilot workspace.
 </p>
 </div>

 {/* Seat counter */}
 <div className="flex items-center gap-2 text-sm text-muted-foreground">
 <Users className="h-4 w-4" />
 <span>
 <span className={seatsFull ? "text-amber-500 font-medium" : "text-foreground font-medium"}>
 {usedSeats}
 </span>
 {" / "}
 {maxSeats} seats used
 {" "}
 <span className="capitalize text-xs">({planId} plan)</span>
 </span>
 {seatsFull && (
 <Badge variant="outline" className="ml-1 text-amber-500 border-amber-500/40 text-xs">
 Seats full
 </Badge>
 )}
 </div>

 {/* Invite form — owner only */}
 {isOwner && <Card>
 <CardHeader>
 <CardTitle className="text-base">Invite Team Member</CardTitle>
 <CardDescription>
 {seatsFull
 ? `You've used all ${maxSeats} seats on your ${planId} plan. Upgrade to invite more.`
 : `Send a magic-link invite. ${maxSeats - usedSeats} seat${maxSeats - usedSeats === 1 ? "" : "s"} remaining.`}
 </CardDescription>
 </CardHeader>
 <CardContent className="space-y-3">
 <div className="grid grid-cols-1 sm:grid-cols-[1fr_auto_auto] gap-2 items-end">
 <div className="space-y-1.5">
 <Label htmlFor="inviteEmail">Email address</Label>
 <Input
 id="inviteEmail"
 type="email"
 placeholder="teammate@company.com"
 value={inviteEmail}
 onChange={(e) => {
 setInviteEmail(e.target.value);
 setInviteError("");
 setInviteSuccess("");
 }}
 disabled={seatsFull || inviting}
 />
 </div>
 <div className="space-y-1.5">
 <Label>Role</Label>
 <Select
 value={inviteRole}
 onValueChange={(v) => setInviteRole(v as "admin" | "read_only")}
 disabled={seatsFull || inviting}
 >
 <SelectTrigger className="w-32">
 <SelectValue />
 </SelectTrigger>
 <SelectContent>
 <SelectItem value="admin">Admin</SelectItem>
 <SelectItem value="read_only">Read-only</SelectItem>
 </SelectContent>
 </Select>
 </div>
 <Button
 onClick={handleInvite}
 disabled={seatsFull || inviting || !inviteEmail}
 >
 {inviting ? (
 <Loader2 className="mr-2 h-4 w-4 animate-spin" />
 ) : (
 <Plus className="mr-2 h-4 w-4" />
 )}
 {inviting ? "Sending…" : "Invite"}
 </Button>
 </div>

 {inviteError && (
 <p className="text-sm text-destructive">{inviteError}</p>
 )}
 {inviteSuccess && (
 <p className="text-sm text-emerald-500">{inviteSuccess}</p>
 )}
 </CardContent>
 </Card>}

 {/* Member list */}
 <Card>
 <CardHeader>
 <CardTitle className="text-base">
 Members ({isPageLoading ? "…" : members.length + 1})
 </CardTitle>
 </CardHeader>
 <CardContent className="space-y-2">
 {/* Owner row — always first */}
 <div className="flex items-center justify-between rounded-lg border p-3">
 <div className="flex items-center gap-3">
 <Avatar className="h-9 w-9">
 <AvatarFallback className="bg-amber-100 text-amber-700 text-xs">
 {ownerEmail ? ownerEmail[0].toUpperCase() : "?"}
 </AvatarFallback>
 </Avatar>
 <div>
 <p className="text-sm font-medium flex items-center gap-1.5">
 {/* Show "You" only if the current user IS the owner */}
 {currentUserId && ownerId && currentUserId === ownerId ? (
 <>You <Crown className="h-3 w-3 text-amber-500" /></>
 ) : (
 <>{ownerEmail} <Crown className="h-3 w-3 text-amber-500" /></>
 )}
 </p>
 <p className="text-xs text-muted-foreground">{ownerEmail}</p>
 </div>
 </div>
 <Badge variant="secondary" className="text-xs">Owner</Badge>
 </div>

 {/* Team member rows */}
 {isPageLoading ? (
 <div className="flex items-center gap-2 py-4 text-sm text-muted-foreground">
 <Loader2 className="h-4 w-4 animate-spin" />
 Loading members…
 </div>
 ) : members.length === 0 ? (
 <p className="text-sm text-muted-foreground py-3 text-center">
 No team members yet. Send an invite above.
 </p>
 ) : (
 members.map((member) => (
 <div
 key={member.id}
 className="flex items-center justify-between rounded-lg border p-3"
 >
 <div className="flex items-center gap-3">
 <Avatar className="h-9 w-9">
 <AvatarFallback className="bg-accent/10 text-accent text-xs">
 {member.email[0].toUpperCase()}
 </AvatarFallback>
 </Avatar>
 <div>
 <p className="text-sm font-medium flex items-center gap-1.5">
 {member.email}
 {/* Mark this row as "You" if the current user is this member */}
 {currentUserId && member.member_id === currentUserId && (
 <span className="text-xs text-accent font-semibold">(You)</span>
 )}
 {member.status === "pending" && (
 <span className="inline-flex items-center gap-0.5 text-xs text-amber-500">
 <Clock className="h-3 w-3" />
 Pending
 </span>
 )}
 </p>
 <p className="text-xs text-muted-foreground">
 Invited {new Date(member.invited_at).toLocaleDateString()}
 {member.accepted_at && (
 <> · Joined {new Date(member.accepted_at).toLocaleDateString()}</>
 )}
 </p>
 </div>
 </div>

 <div className="flex items-center gap-2">
 {isOwner ? (
 <>
 {/* Role selector — owner only */}
 <Select
 value={member.role}
 onValueChange={(v) => handleRoleChange(member.id, v as "admin" | "read_only")}
 disabled={updatingRoleId === member.id}
 >
 <SelectTrigger className="h-8 w-28 text-xs">
 {updatingRoleId === member.id ? (
 <Loader2 className="h-3 w-3 animate-spin" />
 ) : (
 <SelectValue />
 )}
 </SelectTrigger>
 <SelectContent>
 <SelectItem value="admin">Admin</SelectItem>
 <SelectItem value="read_only">Read-only</SelectItem>
 </SelectContent>
 </Select>

 {/* Remove button — owner only */}
 <Button
 variant="ghost"
 size="icon"
 onClick={() => handleRemove(member)}
 disabled={removingId === member.id}
 className="h-8 w-8"
 >
 {removingId === member.id ? (
 <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
 ) : (
 <Trash2 className="h-4 w-4 text-muted-foreground" />
 )}
 </Button>
 </>
 ) : (
 <Badge variant="secondary" className="text-xs capitalize">
 {member.role === "read_only" ? "Read-only" : "Admin"}
 </Badge>
 )}
 </div>
 </div>
 ))
 )}
 </CardContent>
 </Card>

 {/* Role legend */}
 <Card>
 <CardContent className="pt-4 pb-4">
 <p className="text-xs font-medium text-muted-foreground mb-2">Role permissions</p>
 <div className="grid grid-cols-2 gap-x-6 gap-y-1 text-xs text-muted-foreground">
 <div><span className="font-medium text-foreground">Admin</span> — view + reply + AI config</div>
 <div><span className="font-medium text-foreground">Read-only</span> — view only, no actions</div>
 </div>
 </CardContent>
 </Card>

 {/* Delete confirmation dialog */}
 <Dialog open={!!confirmDelete} onOpenChange={(open) => { if (!open) setConfirmDelete(null); }}>
 <DialogContent>
 <DialogHeader>
 <DialogTitle>Remove team member?</DialogTitle>
 <DialogDescription>
 This will remove <strong>{confirmDelete?.email}</strong> from your workspace.
 They will lose access immediately and their account will be downgraded to the
 <strong> Free plan</strong>. This action cannot be undone.
 </DialogDescription>
 </DialogHeader>
 <DialogFooter>
 <Button variant="outline" onClick={() => setConfirmDelete(null)}>
 Cancel
 </Button>
 <Button variant="destructive" onClick={confirmRemove} disabled={!!removingId}>
 {removingId ? "Removing…" : "Yes, remove member"}
 </Button>
 </DialogFooter>
 </DialogContent>
 </Dialog>
 </div>
 );
}
