"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check, X, Loader2 } from "lucide-react";

interface ApprovalsSectionProps {
  ticketId: string;
  projectId: string;
  approvals: {
    owner?: boolean;
    client?: boolean;
  };
  ticketStatus: string;
  isOwner: boolean;
  isClient: boolean;
  clients: {
    id: string;
    name: string | null;
    email: string;
  }[];
  canEdit: boolean;
}

export function ApprovalsSection({
  ticketId,
  projectId,
  approvals,
  ticketStatus,
  isOwner,
  isClient,
  clients,
  canEdit,
}: ApprovalsSectionProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [localApprovals, setLocalApprovals] = useState(approvals || {});

  const handleApprove = async (type: "owner" | "client") => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/projects/${projectId}/tickets/${ticketId}/approve`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to approve");
      }

      const { ticket } = await response.json();
      setLocalApprovals(ticket.approvals || {});
      toast.success(`${type === "owner" ? "Owner" : "Client"} approved!`);
      router.refresh();
    } catch (error) {
      console.error("Error approving:", error);
      toast.error("Failed to approve");
    } finally {
      setIsLoading(false);
    }
  };

  const handleReject = async (type: "owner" | "client") => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/projects/${projectId}/tickets/${ticketId}/reject`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to reject");
      }

      toast.success("Ticket rejected!");
      router.refresh();
    } catch (error) {
      console.error("Error rejecting:", error);
      toast.error("Failed to reject");
    } finally {
      setIsLoading(false);
    }
  };

  const isInReview = ticketStatus === "REVIEW";
  const ownerApproved = localApprovals?.owner === true;
  const clientApproved = localApprovals?.client === true;
  const allApproved = ownerApproved && clientApproved;

  return (
    <div className="space-y-6">
      <div className="rounded-lg border p-6">
        <h3 className="font-semibold mb-4">Approval Status</h3>

        {!isInReview && ticketStatus !== "DONE" && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
            <p className="text-sm text-yellow-800">
              This ticket is not in review status. Mark the ticket as Done to start approval workflow.
            </p>
          </div>
        )}

        {ticketStatus === "DONE" && allApproved && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
            <p className="text-sm text-green-800">
              ✓ This ticket has been fully approved and completed!
            </p>
          </div>
        )}

        {/* Owner Approval */}
        <div className="flex items-center justify-between p-4 border rounded-lg mb-2">
          <div className="flex items-center gap-3">
            <Badge variant={ownerApproved ? "default" : "secondary"}>
              {ownerApproved ? "Approved" : "Pending"}
            </Badge>
            <div>
              <p className="font-medium">Owner Approval</p>
              <p className="text-sm text-muted-foreground">
                {ownerApproved ? "Owner has approved this work" : "Awaiting owner approval"}
              </p>
            </div>
          </div>
          {isInReview && isOwner && (
            <div className="flex gap-2">
              <Button
                variant={ownerApproved ? "outline" : "default"}
                size="sm"
                onClick={() => handleApprove("owner")}
                disabled={isLoading || ownerApproved}
              >
                <Check className="h-4 w-4 mr-1" />
                {ownerApproved ? "Approved" : "Approve"}
              </Button>
              {!ownerApproved && (
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => handleReject("owner")}
                  disabled={isLoading}
                >
                  <X className="h-4 w-4 mr-1" />
                  Reject
                </Button>
              )}
            </div>
          )}
        </div>

        {/* Client Approval */}
        <div className="flex items-center justify-between p-4 border rounded-lg">
          <div className="flex items-center gap-3">
            <Badge variant={clientApproved ? "default" : "secondary"}>
              {clientApproved ? "Approved" : "Pending"}
            </Badge>
            <div>
              <p className="font-medium">Client Approval</p>
              <p className="text-sm text-muted-foreground">
                {clientApproved 
                  ? "Client has approved this work" 
                  : clients.length > 0 
                    ? "Awaiting client approval" 
                    : "No client assigned to this project"}
              </p>
            </div>
          </div>
          {isInReview && isClient && (
            <div className="flex gap-2">
              <Button
                variant={clientApproved ? "outline" : "default"}
                size="sm"
                onClick={() => handleApprove("client")}
                disabled={isLoading || !ownerApproved || clientApproved}
              >
                <Check className="h-4 w-4 mr-1" />
                {clientApproved ? "Approved" : "Approve"}
              </Button>
              {!clientApproved && ownerApproved && (
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => handleReject("client")}
                  disabled={isLoading}
                >
                  <X className="h-4 w-4 mr-1" />
                  Reject
                </Button>
              )}
            </div>
          )}
        </div>

        {isInReview && !isOwner && !isClient && (
          <p className="text-sm text-muted-foreground mt-4 text-center">
            Only project owner and clients can approve tickets in review.
          </p>
        )}

        {clients.length === 0 && isInReview && (
          <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 mt-4">
            <p className="text-sm text-orange-800">
              No clients in this project. Add a client to enable client approval.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
