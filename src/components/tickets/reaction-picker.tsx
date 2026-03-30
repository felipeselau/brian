"use client";

import { useState } from "react";
import { ALLOWED_EMOJIS } from "@/lib/validations/reaction";
import { SmilePlus } from "lucide-react";

interface ReactionPickerProps {
  projectId: string;
  ticketId: string;
  commentId: string;
  onReactionToggle?: (emoji: string, action: "added" | "removed") => void;
  className?: string;
}

export function ReactionPicker({
  projectId,
  ticketId,
  commentId,
  onReactionToggle,
  className = "",
}: ReactionPickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleReaction = async (emoji: string) => {
    setIsLoading(true);
    try {
      const res = await fetch(
        `/api/projects/${projectId}/tickets/${ticketId}/comments/${commentId}/reactions`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ emoji }),
        }
      );

      if (!res.ok) {
        throw new Error("Failed to toggle reaction");
      }

      const data = await res.json();
      onReactionToggle?.(emoji, data.action);
    } catch (error) {
      console.error("Error toggling reaction:", error);
    } finally {
      setIsLoading(false);
      setIsOpen(false);
    }
  };

  return (
    <div className={`relative inline-block ${className}`}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        disabled={isLoading}
        className="h-7 w-7 flex items-center justify-center rounded hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
        title="Add reaction"
      >
        <SmilePlus className="h-4 w-4" />
      </button>

      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />

          {/* Emoji picker popover */}
          <div className="absolute z-50 bottom-full left-0 mb-1 bg-popover border rounded-lg shadow-lg p-2">
            <div className="flex gap-1 flex-wrap max-w-[240px]">
              {ALLOWED_EMOJIS.map((emoji) => (
                <button
                  key={emoji}
                  type="button"
                  onClick={() => handleReaction(emoji)}
                  disabled={isLoading}
                  className="h-8 w-8 flex items-center justify-center rounded hover:bg-accent transition-colors text-lg"
                  title={`React with ${emoji}`}
                >
                  {emoji}
                </button>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
