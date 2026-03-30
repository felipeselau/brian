"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { MarkdownEditor } from "@/components/ui/markdown-editor";
import { MarkdownRenderer } from "@/components/ui/markdown-renderer";
import { ReactionPicker } from "@/components/tickets/reaction-picker";
import { Loader2, Trash2, Pencil, X, Check } from "lucide-react";

interface ReactionUser {
  id: string;
  name: string | null;
  image: string | null;
}

interface Reaction {
  id: string;
  emoji: string;
  userId: string;
  commentId: string;
  createdAt: string;
  user: ReactionUser;
}

interface Comment {
  id: string;
  content: string;
  createdAt: Date;
  updatedAt: Date;
  mentions?: string[] | null;
  user: {
    id: string;
    name: string | null;
    email: string;
    image: string | null;
  };
  reactions?: Reaction[];
}

interface CommentsSectionProps {
  projectId: string;
  ticketId: string;
  comments: Comment[];
  currentUserId: string;
  isOwner: boolean;
}

// Extract @username patterns from content to build mentions array
function extractMentions(content: string, members: { id: string; name: string | null; email: string }[]): string[] {
  const mentionRegex = /@(\w+)/g;
  const mentions: string[] = [];
  let match;

  while ((match = mentionRegex.exec(content)) !== null) {
    const name = match[1].toLowerCase();
    const member = members.find(
      (m) =>
        (m.name && m.name.toLowerCase().replace(/\s+/g, "") === name) ||
        m.email.split("@")[0].toLowerCase() === name
    );
    if (member && !mentions.includes(member.id)) {
      mentions.push(member.id);
    }
  }

  return mentions;
}

export function CommentsSection({
  projectId,
  ticketId,
  comments: initialComments,
  currentUserId,
  isOwner,
}: CommentsSectionProps) {
  const router = useRouter();
  const [comments, setComments] = useState(initialComments);
  const [newComment, setNewComment] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // Editing state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  // Track mention selections from autocomplete
  const [mentionIds, setMentionIds] = useState<string[]>([]);
  const [editMentionIds, setEditMentionIds] = useState<string[]>([]);

  // Image upload helper for paste support
  const handleImageUpload = useCallback(
    async (file: File): Promise<string> => {
      const attachmentFormData = new FormData();
      attachmentFormData.append("files", file);

      const response = await fetch(
        `/api/projects/${projectId}/tickets/${ticketId}/attachments/upload`,
        {
          method: "POST",
          body: attachmentFormData,
        }
      );

      if (!response.ok) {
        throw new Error("Failed to upload image");
      }

      const { attachments } = await response.json();
      const url = attachments[0]?.url;

      // Refresh to show the new attachment
      router.refresh();

      return url;
    },
    [projectId, ticketId, router]
  );

  const handleMentionSelect = useCallback((memberId: string) => {
    setMentionIds((prev) => {
      if (prev.includes(memberId)) return prev;
      return [...prev, memberId];
    });
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    setIsLoading(true);

    try {
      const response = await fetch(
        `/api/projects/${projectId}/tickets/${ticketId}/comments`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            content: newComment,
            mentions: mentionIds,
          }),
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to add comment");
      }

      const { comment } = await response.json();
      setComments([{ ...comment, reactions: [] }, ...comments]);
      setNewComment("");
      setMentionIds([]);
      toast.success("Comment added");
    } catch (error) {
      console.error("Error adding comment:", error);
      toast.error("Failed to add comment");
    } finally {
      setIsLoading(false);
    }
  };

  const handleEdit = (comment: Comment) => {
    setEditingId(comment.id);
    setEditContent(comment.content);
    setEditMentionIds(comment.mentions || []);
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditContent("");
    setEditMentionIds([]);
  };

  const handleSaveEdit = async (commentId: string) => {
    if (!editContent.trim()) return;

    setIsSaving(true);

    try {
      const response = await fetch(
        `/api/projects/${projectId}/tickets/${ticketId}/comments/${commentId}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            content: editContent,
            mentions: editMentionIds,
          }),
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to update comment");
      }

      const { comment } = await response.json();
      setComments(
        comments.map((c) => (c.id === commentId ? { ...c, ...comment } : c))
      );
      setEditingId(null);
      setEditContent("");
      setEditMentionIds([]);
      toast.success("Comment updated");
    } catch (error) {
      console.error("Error updating comment:", error);
      toast.error("Failed to update comment");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (commentId: string) => {
    if (!confirm("Delete this comment?")) return;

    try {
      const response = await fetch(
        `/api/projects/${projectId}/tickets/${ticketId}/comments?commentId=${commentId}`,
        {
          method: "DELETE",
        }
      );

      if (!response.ok) {
        throw new Error("Failed to delete comment");
      }

      setComments(comments.filter((c) => c.id !== commentId));
      toast.success("Comment deleted");
    } catch (error) {
      console.error("Error deleting comment:", error);
      toast.error("Failed to delete comment");
    }
  };

  // Handle reaction toggle from ReactionPicker
  const handleReactionToggle = useCallback(
    (commentId: string, emoji: string, action: "added" | "removed") => {
      setComments((prev) =>
        prev.map((comment) => {
          if (comment.id !== commentId) return comment;

          const reactions = comment.reactions || [];

          if (action === "removed") {
            // Remove current user's reaction for this emoji
            return {
              ...comment,
              reactions: reactions.filter(
                (r) => !(r.emoji === emoji && r.userId === currentUserId)
              ),
            };
          } else {
            // Add reaction - fetch it from the API response
            // For simplicity, we'll refetch by toggling optimistic update
            // The ReactionPicker's API already handles the toggle
            // We just need to refresh data
            router.refresh();
            return comment;
          }
        })
      );
    },
    [currentUserId, router]
  );

  // Group reactions by emoji
  const groupReactions = (reactions: Reaction[]) => {
    const grouped: Record<string, { count: number; users: ReactionUser[]; userReacted: boolean }> = {};

    for (const reaction of reactions) {
      if (!grouped[reaction.emoji]) {
        grouped[reaction.emoji] = { count: 0, users: [], userReacted: false };
      }
      grouped[reaction.emoji].count++;
      grouped[reaction.emoji].users.push(reaction.user);
      if (reaction.userId === currentUserId) {
        grouped[reaction.emoji].userReacted = true;
      }
    }

    return grouped;
  };

  const formatDate = (date: Date | string) => {
    const d = new Date(date);
    const now = new Date();
    const diff = now.getTime() - d.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return "just now";
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    return d.toLocaleDateString();
  };

  return (
    <div className="space-y-4">
      <h3 className="font-semibold">Comments ({comments.length})</h3>

      {/* New comment form */}
      <form onSubmit={handleSubmit} className="space-y-2">
        <MarkdownEditor
          value={newComment}
          onChange={setNewComment}
          placeholder="Write a comment... (Markdown supported, @ to mention)"
          disabled={isLoading}
          minRows={2}
          maxRows={8}
          onImageUpload={handleImageUpload}
          projectId={projectId}
          onMentionSelect={handleMentionSelect}
        />
        <div className="flex justify-end">
          <Button
            type="submit"
            disabled={isLoading || !newComment.trim()}
            size="sm"
          >
            {isLoading && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
            Comment
          </Button>
        </div>
      </form>

      {/* Comments list */}
      <div className="space-y-3">
        {comments.map((comment) => {
          const canEdit =
            comment.user.id === currentUserId || isOwner;
          const isEditing = editingId === comment.id;
          const reactions = comment.reactions || [];
          const groupedReactions = groupReactions(reactions);

          return (
            <div
              key={comment.id}
              className="group flex gap-3 p-3 rounded-lg border hover:bg-muted/30 transition-colors"
            >
              <Avatar className="h-8 w-8 shrink-0">
                <AvatarImage src={comment.user.image || undefined} />
                <AvatarFallback className="text-xs">
                  {comment.user.name?.[0]?.toUpperCase() ||
                    comment.user.email[0].toUpperCase()}
                </AvatarFallback>
              </Avatar>

              <div className="flex-1 min-w-0 space-y-1">
                {/* Header */}
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-medium text-sm">
                    {comment.user.name || comment.user.email}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {formatDate(comment.createdAt)}
                  </span>
                  {new Date(comment.updatedAt) > new Date(comment.createdAt) &&
                    !isEditing && (
                      <span className="text-xs text-muted-foreground italic">
                        (edited)
                      </span>
                    )}
                </div>

                {/* Content - edit mode or display */}
                {isEditing ? (
                  <div className="space-y-2">
                    <MarkdownEditor
                      value={editContent}
                      onChange={setEditContent}
                      disabled={isSaving}
                      minRows={2}
                      maxRows={10}
                      onImageUpload={handleImageUpload}
                      projectId={projectId}
                      onMentionSelect={(id) =>
                        setEditMentionIds((prev) =>
                          prev.includes(id) ? prev : [...prev, id]
                        )
                      }
                    />
                    <div className="flex gap-1">
                      <Button
                        type="button"
                        size="sm"
                        onClick={() => handleSaveEdit(comment.id)}
                        disabled={isSaving || !editContent.trim()}
                      >
                        {isSaving ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <Check className="h-3.5 w-3.5" />
                        )}
                        Save
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={handleCancelEdit}
                        disabled={isSaving}
                      >
                        <X className="h-3.5 w-3.5" />
                        Cancel
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="text-sm">
                    <MarkdownRenderer content={comment.content} />
                  </div>
                )}

                {/* Reactions */}
                {!isEditing && (
                  <div className="flex flex-wrap items-center gap-1.5 mt-1.5">
                    {Object.entries(groupedReactions).map(
                      ([emoji, data]) => (
                        <button
                          key={emoji}
                          onClick={async () => {
                            try {
                              await fetch(
                                `/api/projects/${projectId}/tickets/${ticketId}/comments/${comment.id}/reactions`,
                                {
                                  method: "POST",
                                  headers: { "Content-Type": "application/json" },
                                  body: JSON.stringify({ emoji }),
                                }
                              );
                              router.refresh();
                            } catch (error) {
                              console.error("Error toggling reaction:", error);
                            }
                          }}
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs border transition-colors ${
                            data.userReacted
                              ? "bg-blue-50 border-blue-200 text-blue-700 dark:bg-blue-950 dark:border-blue-800 dark:text-blue-300"
                              : "bg-muted/50 border-border hover:bg-muted"
                          }`}
                          title={data.users
                            .map((u) => u.name || "Unknown")
                            .join(", ")}
                        >
                          <span>{emoji}</span>
                          {data.count > 1 && (
                            <span className="font-medium">{data.count}</span>
                          )}
                        </button>
                      )
                    )}
                    <ReactionPicker
                      projectId={projectId}
                      ticketId={ticketId}
                      commentId={comment.id}
                      onReactionToggle={(emoji, action) =>
                        handleReactionToggle(comment.id, emoji, action)
                      }
                    />
                  </div>
                )}
              </div>

              {/* Actions - only visible on hover */}
              {!isEditing && (
                <div className="flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                  {canEdit && comment.user.id === currentUserId && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 text-muted-foreground hover:text-foreground"
                      onClick={() => handleEdit(comment)}
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                  )}
                  {canEdit && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 text-muted-foreground hover:text-destructive"
                      onClick={() => handleDelete(comment.id)}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  )}
                </div>
              )}
            </div>
          );
        })}

        {comments.length === 0 && (
          <div className="text-center py-8 text-muted-foreground text-sm">
            No comments yet. Be the first to comment!
          </div>
        )}
      </div>
    </div>
  );
}
