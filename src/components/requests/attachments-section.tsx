"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Loader2, File, Trash2 } from "lucide-react";

interface Attachment {
  id: string;
  name: string;
  url: string;
  size: number | null;
  type: string | null;
  createdAt: Date;
}

interface AttachmentsSectionProps {
  requestId: string;
  attachments: Attachment[];
  isOwner: boolean;
}

export function AttachmentsSection({
  requestId,
  attachments: initialAttachments,
  isOwner,
}: AttachmentsSectionProps) {
  const router = useRouter();
  const [attachments, setAttachments] = useState(initialAttachments);
  const [isLoading, setIsLoading] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newAttachment, setNewAttachment] = useState({
    name: "",
    url: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAttachment.name || !newAttachment.url) return;

    setIsLoading(true);

    try {
      const response = await fetch(`/api/projects/PROJECT_ID_PLACEHOLDER/requests/${requestId}/attachments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newAttachment),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to add attachment");
      }

      const { attachment } = await response.json();
      setAttachments([attachment, ...attachments]);
      setNewAttachment({ name: "", url: "" });
      setIsDialogOpen(false);
      toast.success("Attachment added");
    } catch (error) {
      console.error("Error adding attachment:", error);
      toast.error("Failed to add attachment");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (attachmentId: string) => {
    if (!confirm("Delete this attachment?")) return;

    try {
      const response = await fetch(`/api/projects/PROJECT_ID_PLACEHOLDER/requests/${requestId}/attachments?attachmentId=${attachmentId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to delete attachment");
      }

      setAttachments(attachments.filter((a) => a.id !== attachmentId));
      toast.success("Attachment deleted");
    } catch (error) {
      console.error("Error deleting attachment:", error);
      toast.error("Failed to delete attachment");
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold">Attachments ({attachments.length})</h3>
        {isOwner && (
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm">
                Add Attachment
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add Attachment</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">File Name</Label>
                  <Input
                    id="name"
                    value={newAttachment.name}
                    onChange={(e) => setNewAttachment({ ...newAttachment, name: e.target.value })}
                    placeholder="screenshot.png"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="url">URL</Label>
                  <Input
                    id="url"
                    type="url"
                    value={newAttachment.url}
                    onChange={(e) => setNewAttachment({ ...newAttachment, url: e.target.value })}
                    placeholder="https://..."
                    required
                  />
                </div>
                <div className="flex justify-end gap-2">
                  <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={isLoading}>
                    {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                    Add
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        )}
      </div>

      <div className="grid gap-2">
        {attachments.map((attachment) => (
          <div
            key={attachment.id}
            className="flex items-center justify-between p-3 rounded-lg border"
          >
            <a
              href={attachment.url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 hover:underline"
            >
              <File className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="font-medium text-sm">{attachment.name}</p>
                {attachment.size && (
                  <p className="text-xs text-muted-foreground">
                    {(attachment.size / 1024).toFixed(1)} KB
                  </p>
                )}
              </div>
            </a>
            {isOwner && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => handleDelete(attachment.id)}
                className="text-muted-foreground hover:text-destructive"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
          </div>
        ))}

        {attachments.length === 0 && (
          <p className="text-sm text-muted-foreground text-center py-8">
            No attachments yet
          </p>
        )}
      </div>
    </div>
  );
}
