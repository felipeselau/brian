"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { UserRole } from "@prisma/client";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { UserMinus, Loader2, Copy, Mail, Check, RefreshCw } from "lucide-react";

interface ProjectMember {
  id: string;
  role: UserRole;
  user: {
    id: string;
    name: string | null;
    email: string;
    image: string | null;
  };
}

interface PendingInvite {
  id: string;
  email: string;
  role: UserRole;
  token: string;
  status: string;
  createdAt: string;
}

interface ProjectSettingsProps {
  projectId: string;
  members: ProjectMember[];
  isOwner: boolean;
  currentUserId: string;
}

export function ProjectSettings({
  projectId,
  members,
  isOwner,
  currentUserId,
}: ProjectSettingsProps) {
  const router = useRouter();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newMemberEmail, setNewMemberEmail] = useState("");
  const [newMemberRole, setNewMemberRole] = useState<"WORKER" | "CLIENT">("WORKER");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastInviteUrl, setLastInviteUrl] = useState<string | null>(null);
  const [copied, setCopied] = useState<string | null>(null);
  const [pendingInvites, setPendingInvites] = useState<PendingInvite[]>([]);
  const [resendingId, setResendingId] = useState<string | null>(null);

  // Fetch pending invites
  const fetchPendingInvites = async () => {
    try {
      const response = await fetch(`/api/invites?projectId=${projectId}`);
      if (response.ok) {
        const data = await response.json();
        setPendingInvites(
          data.invites.filter((i: PendingInvite) => i.status === "PENDING")
        );
      }
    } catch (err) {
      console.error("Error fetching pending invites:", err);
    }
  };

  useEffect(() => {
    if (isOwner) {
      fetchPendingInvites();
    }
  }, [projectId, isOwner]);

  const handleInviteMember = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/invites", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectId,
          email: newMemberEmail,
          role: newMemberRole,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to send invite");
      }

      setLastInviteUrl(data.inviteUrl);
      toast.success("Invite sent! Email has been delivered.");
      fetchPendingInvites();
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  const handleResend = async (invite: PendingInvite) => {
    setResendingId(invite.id);

    try {
      const response = await fetch("/api/invites", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectId,
          email: invite.email,
          role: invite.role,
          resend: true,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to resend invite");
      }

      toast.success(`Invite resent to ${invite.email}`);
      fetchPendingInvites();
    } catch (err) {
      console.error(err);
      toast.error(err instanceof Error ? err.message : "Failed to resend invite");
    } finally {
      setResendingId(null);
    }
  };

  const handleCopyLink = async (token: string) => {
    const inviteUrl = `${window.location.origin}/register?token=${token}`;
    try {
      await navigator.clipboard.writeText(inviteUrl);
      setCopied(token);
      toast.success("Invite link copied to clipboard!");
      setTimeout(() => setCopied(null), 2000);
    } catch {
      toast.error("Failed to copy link");
    }
  };

  const handleRemoveMember = async (userId: string) => {
    setIsLoading(true);

    try {
      const response = await fetch(`/api/projects/${projectId}/members`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId }),
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || "Failed to remove member");
      }

      toast.success("Member removed successfully!");
      router.refresh();
    } catch (err) {
      console.error(err);
      toast.error(err instanceof Error ? err.message : "Failed to remove member");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDialogClose = (open: boolean) => {
    setIsDialogOpen(open);
    if (!open) {
      setNewMemberEmail("");
      setNewMemberRole("WORKER");
      setError(null);
      setLastInviteUrl(null);
      setCopied(null);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold mb-2">Team Members</h2>
        <p className="text-muted-foreground">
          Manage who has access to this project
        </p>
      </div>

      {isOwner && (
        <Dialog open={isDialogOpen} onOpenChange={handleDialogClose}>
          <DialogTrigger asChild>
            <Button variant="outline" className="mr-2">
              <Mail className="h-4 w-4 mr-2" />
              Invite Member
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Invite Team Member</DialogTitle>
              <DialogDescription>
                Send an email invitation to join this project
              </DialogDescription>
            </DialogHeader>

            {!lastInviteUrl ? (
              <form onSubmit={handleInviteMember} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email Address *</Label>
                  <Input
                    id="email"
                    type="email"
                    value={newMemberEmail}
                    onChange={(e) => setNewMemberEmail(e.target.value)}
                    placeholder="user@example.com"
                    required
                    disabled={isLoading}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="role">Role *</Label>
                  <Select
                    value={newMemberRole}
                    onValueChange={(v: "WORKER" | "CLIENT") => setNewMemberRole(v)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="WORKER">Worker (Developer)</SelectItem>
                      <SelectItem value="CLIENT">Client</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {error && (
                  <p className="text-sm text-destructive">{error}</p>
                )}

                <div className="flex justify-end gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => handleDialogClose(false)}
                    disabled={isLoading}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" disabled={isLoading}>
                    {isLoading ? (
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    ) : null}
                    {isLoading ? "Sending..." : "Send Invite"}
                  </Button>
                </div>
              </form>
            ) : (
              <div className="space-y-4">
                <div className="rounded-lg bg-green-50 border border-green-200 p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Check className="h-5 w-5 text-green-600" />
                    <p className="font-medium text-green-800">
                      Invite sent successfully!
                    </p>
                  </div>
                  <p className="text-sm text-green-700">
                    An email has been sent to <strong>{newMemberEmail}</strong>.
                  </p>
                </div>

                <div className="space-y-2">
                  <Label>Invite Link (backup)</Label>
                  <div className="flex gap-2">
                    <Input
                      value={lastInviteUrl}
                      readOnly
                      className="text-sm"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      onClick={() => navigator.clipboard.writeText(lastInviteUrl).then(() => {
                        setCopied("last");
                        toast.success("Link copied!");
                        setTimeout(() => setCopied(null), 2000);
                      })}
                    >
                      {copied === "last" ? (
                        <Check className="h-4 w-4" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    You can share this link directly if the email doesn&apos;t
                    arrive.
                  </p>
                </div>

                <div className="flex justify-end">
                  <Button onClick={() => handleDialogClose(false)}>
                    Done
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      )}

      {/* Members List */}
      <div className="space-y-3">
        {!members.length ? (
          <p className="text-muted-foreground text-sm">No members yet</p>
        ) : (
          members.map((member) => (
            <div
              key={member.id}
              className="flex items-center justify-between p-3 rounded-lg border"
            >
              <div className="flex items-center gap-3">
                <Avatar>
                  <AvatarImage src={member.user.image || undefined} />
                  <AvatarFallback>
                    {member.user.name?.[0] || member.user.email[0].toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-medium">
                    {member.user.name || "Unknown User"}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {member.user.email}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant={member.role === "OWNER" ? "default" : "secondary"}>
                  {member.role}
                </Badge>
                {member.role !== "OWNER" && isOwner && member.user.id !== currentUserId && (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleRemoveMember(member.user.id)}
                    className="text-destructive"
                    disabled={isLoading}
                  >
                    <UserMinus className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Pending Invites */}
      {isOwner && pendingInvites.length > 0 && (
        <div className="mt-8">
          <h3 className="text-lg font-semibold mb-3">Pending Invites</h3>
          <div className="space-y-3">
            {pendingInvites.map((invite) => (
              <div
                key={invite.id}
                className="flex items-center justify-between p-3 rounded-lg border bg-muted/50"
              >
                <div className="flex items-center gap-3">
                  <div className="h-9 w-9 rounded-full bg-muted flex items-center justify-center">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="font-medium">{invite.email}</p>
                    <p className="text-sm text-muted-foreground">
                      {invite.role} · Invited {new Date(invite.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline">Pending</Badge>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleCopyLink(invite.token)}
                    disabled={copied === invite.token}
                  >
                    {copied === invite.token ? (
                      <Check className="h-4 w-4 mr-1" />
                    ) : (
                      <Copy className="h-4 w-4 mr-1" />
                    )}
                    {copied === invite.token ? "Copied" : "Copy Link"}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleResend(invite)}
                    disabled={resendingId === invite.id}
                  >
                    {resendingId === invite.id ? (
                      <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                    ) : (
                      <RefreshCw className="h-4 w-4 mr-1" />
                    )}
                    {resendingId === invite.id ? "Sending..." : "Resend"}
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
