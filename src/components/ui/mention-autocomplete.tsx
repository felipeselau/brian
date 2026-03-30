"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface Member {
  id: string;
  name: string | null;
  email: string;
  image: string | null;
  role: string;
}

interface MentionDropdownProps {
  members: Member[];
  isOpen: boolean;
  query: string;
  selectedIndex: number;
  position: { top: number; left: number };
  onSelect: (member: Member) => void;
  onClose: () => void;
  onHover: (index: number) => void;
}

function MentionDropdown({
  members,
  isOpen,
  query,
  selectedIndex,
  position,
  onSelect,
  onClose,
  onHover,
}: MentionDropdownProps) {
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Filter members by query
  const filteredMembers = members.filter((m) => {
    if (!query) return true;
    const q = query.toLowerCase();
    const name = (m.name || "").toLowerCase();
    const email = m.email.toLowerCase();
    return name.includes(q) || email.includes(q);
  }).slice(0, 5);

  // Close on click outside
  useEffect(() => {
    if (!isOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen, onClose]);

  if (!isOpen || filteredMembers.length === 0) return null;

  return (
    <div
      ref={dropdownRef}
      className="absolute z-50 w-64 bg-popover border rounded-lg shadow-lg py-1 overflow-auto"
      style={{
        top: `${position.top}px`,
        left: `${position.left}px`,
        maxHeight: "200px",
      }}
    >
      {filteredMembers.map((member, index) => (
        <button
          key={member.id}
          type="button"
          className={`flex items-center gap-2 w-full px-3 py-2 text-left text-sm hover:bg-accent transition-colors ${
            index === selectedIndex ? "bg-accent" : ""
          }`}
          onClick={() => onSelect(member)}
          onMouseEnter={() => onHover(index)}
        >
          <Avatar className="h-6 w-6 shrink-0">
            <AvatarImage src={member.image || undefined} />
            <AvatarFallback className="text-xs">
              {member.name?.[0]?.toUpperCase() ||
                member.email[0].toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <div className="font-medium truncate">
              {member.name || member.email}
            </div>
            {member.name && (
              <div className="text-xs text-muted-foreground truncate">
                {member.email}
              </div>
            )}
          </div>
        </button>
      ))}
    </div>
  );
}

interface MentionAutocompleteState {
  isOpen: boolean;
  query: string;
  startIndex: number;
  selectedIndex: number;
  position: { top: number; left: number };
  members: Member[];
}

export function useMentionAutocomplete(projectId?: string) {
  const [state, setState] = useState<MentionAutocompleteState>({
    isOpen: false,
    query: "",
    startIndex: -1,
    selectedIndex: 0,
    position: { top: 0, left: 0 },
    members: [],
  });

  // Fetch members once
  useEffect(() => {
    if (!projectId) return;
    let cancelled = false;

    async function fetchMembers() {
      try {
        const res = await fetch(`/api/projects/${projectId}/members`);
        if (!res.ok) return;
        const data = await res.json();
        if (!cancelled) {
          setState((prev) => ({ ...prev, members: data.members || [] }));
        }
      } catch (error) {
        console.error("Failed to fetch members:", error);
      }
    }

    fetchMembers();
    return () => { cancelled = true; };
  }, [projectId]);

  // Check for @ mention trigger in text
  const checkForMention = useCallback(
    (text: string, cursorPos: number, textarea: HTMLTextAreaElement | null) => {
      const textBeforeCursor = text.substring(0, cursorPos);
      const lastAtIndex = textBeforeCursor.lastIndexOf("@");

      if (lastAtIndex !== -1) {
        const charBefore = lastAtIndex > 0 ? textBeforeCursor[lastAtIndex - 1] : " ";
        const isMentionStart =
          charBefore === " " || charBefore === "\n" || lastAtIndex === 0;

        if (isMentionStart) {
          const query = textBeforeCursor.substring(lastAtIndex + 1);
          if (!query.includes(" ") && query.length <= 30) {
            // Calculate position for dropdown
            const lines = textBeforeCursor.split("\n");
            const lineNumber = lines.length;
            const charInLine = lines[lines.length - 1].length;
            const lineHeight = 20;
            const charWidth = 7.2;
            const top = lineNumber * lineHeight + 24;
            const left = Math.min(
              charInLine * charWidth,
              (textarea?.clientWidth || 300) - 200
            );

            setState((prev) => ({
              ...prev,
              isOpen: true,
              query,
              startIndex: lastAtIndex,
              selectedIndex: 0,
              position: { top, left },
            }));
            return true;
          }
        }
      }

      // No mention trigger found
      setState((prev) => ({ ...prev, isOpen: false }));
      return false;
    },
    []
  );

  // Filter members by current query
  const filteredMembers = state.members
    .filter((m) => {
      if (!state.query) return true;
      const q = state.query.toLowerCase();
      const name = (m.name || "").toLowerCase();
      const email = m.email.toLowerCase();
      return name.includes(q) || email.includes(q);
    })
    .slice(0, 5);

  // Select a member (inserts @name)
  const selectMember = useCallback(
    (
      member: Member,
      value: string,
      onChange: (value: string) => void,
      textareaRef: React.RefObject<HTMLTextAreaElement | null>
    ) => {
      const textarea = textareaRef.current;
      if (!textarea) return { newValue: value, memberId: member.id };

      const before = value.substring(0, state.startIndex);
      const cursorPos = textarea.selectionStart;
      const after = value.substring(cursorPos);

      const mentionName = member.name || member.email.split("@")[0];
      const mentionText = `@${mentionName} `;
      const newValue = before + mentionText + after;

      onChange(newValue);

      // Restore focus and cursor position
      requestAnimationFrame(() => {
        if (textarea) {
          const newCursorPos = before.length + mentionText.length;
          textarea.focus();
          textarea.setSelectionRange(newCursorPos, newCursorPos);
        }
      });

      setState((prev) => ({ ...prev, isOpen: false }));
      return { newValue, memberId: member.id };
    },
    [state.startIndex]
  );

  // Handle keyboard navigation
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (!state.isOpen || filteredMembers.length === 0) return false;

      switch (e.key) {
        case "ArrowDown":
          e.preventDefault();
          setState((prev) => ({
            ...prev,
            selectedIndex:
              prev.selectedIndex < filteredMembers.length - 1
                ? prev.selectedIndex + 1
                : 0,
          }));
          return true;
        case "ArrowUp":
          e.preventDefault();
          setState((prev) => ({
            ...prev,
            selectedIndex:
              prev.selectedIndex > 0
                ? prev.selectedIndex - 1
                : filteredMembers.length - 1,
          }));
          return true;
        case "Enter":
        case "Tab":
          // Don't handle here - let the caller handle selection
          return false;
        case "Escape":
          e.preventDefault();
          setState((prev) => ({ ...prev, isOpen: false }));
          return true;
      }
      return false;
    },
    [state.isOpen, filteredMembers]
  );

  // Close dropdown
  const close = useCallback(() => {
    setState((prev) => ({ ...prev, isOpen: false }));
  }, []);

  // Set selected index
  const setSelectedIndex = useCallback((index: number) => {
    setState((prev) => ({ ...prev, selectedIndex: index }));
  }, []);

  return {
    isOpen: state.isOpen,
    selectedIndex: state.selectedIndex,
    position: state.position,
    filteredMembers,
    checkForMention,
    selectMember,
    handleKeyDown,
    close,
    setSelectedIndex,
  };
}

// Re-export the dropdown for direct use
export { MentionDropdown };
export type { MentionDropdownProps, Member };
