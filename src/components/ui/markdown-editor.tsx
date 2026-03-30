"use client";

import { useState, useRef, useCallback } from "react";
import TextareaAutosize from "react-textarea-autosize";
import { Button } from "@/components/ui/button";
import { MarkdownRenderer } from "./markdown-renderer";
import {
  useMentionAutocomplete,
  MentionDropdown,
  type Member,
} from "./mention-autocomplete";
import {
  Bold,
  Italic,
  Strikethrough,
  Code,
  Link,
  List,
  ListOrdered,
  Quote,
  Heading1,
  Heading2,
  Heading3,
  Eye,
  EyeOff,
  ImagePlus,
} from "lucide-react";

interface MarkdownEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  minRows?: number;
  maxRows?: number;
  className?: string;
  showPreview?: boolean;
  onImageUpload?: (file: File) => Promise<string>;
  projectId?: string;
  onMentionSelect?: (memberId: string) => void;
}

interface ToolbarButton {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  action: () => void;
  shortcut?: string;
}

export function MarkdownEditor({
  value,
  onChange,
  placeholder = "Write something...",
  disabled = false,
  minRows = 3,
  maxRows = 15,
  className = "",
  showPreview = true,
  onImageUpload,
  projectId,
  onMentionSelect,
}: MarkdownEditorProps) {
  const [isPreview, setIsPreview] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Mention autocomplete hook
  const mention = useMentionAutocomplete(projectId);

  const insertText = useCallback(
    (before: string, after: string = "") => {
      const textarea = textareaRef.current;
      if (!textarea) return;

      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const selectedText = value.substring(start, end);
      const newText =
        value.substring(0, start) +
        before +
        selectedText +
        after +
        value.substring(end);

      onChange(newText);

      // Restore cursor position
      requestAnimationFrame(() => {
        textarea.focus();
        const newCursorPos = start + before.length + selectedText.length;
        textarea.setSelectionRange(
          start + before.length,
          start + before.length + selectedText.length
        );
      });
    },
    [value, onChange]
  );

  const wrapSelection = useCallback(
    (wrapper: string) => {
      const textarea = textareaRef.current;
      if (!textarea) return;

      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const selectedText = value.substring(start, end);
      const isWrapped =
        value.substring(start - wrapper.length, start) === wrapper &&
        value.substring(end, end + wrapper.length) === wrapper;

      if (isWrapped) {
        // Remove wrapper
        const newText =
          value.substring(0, start - wrapper.length) +
          selectedText +
          value.substring(end + wrapper.length);
        onChange(newText);
      } else {
        // Add wrapper
        insertText(wrapper, wrapper);
      }
    },
    [value, onChange, insertText]
  );

  const insertAtLineStart = useCallback(
    (prefix: string) => {
      const textarea = textareaRef.current;
      if (!textarea) return;

      const start = textarea.selectionStart;
      const lineStart = value.lastIndexOf("\n", start - 1) + 1;
      const newText =
        value.substring(0, lineStart) + prefix + value.substring(lineStart);
      onChange(newText);

      requestAnimationFrame(() => {
        textarea.focus();
        textarea.setSelectionRange(
          lineStart + prefix.length,
          lineStart + prefix.length
        );
      });
    },
    [value, onChange]
  );

  const handleImagePaste = useCallback(
    async (e: React.ClipboardEvent) => {
      const items = e.clipboardData?.items;
      if (!items || !onImageUpload) return;

      for (let i = 0; i < items.length; i++) {
        const item = items[i];
        if (item.type.startsWith("image/")) {
          e.preventDefault();
          const file = item.getAsFile();
          if (!file) continue;

          setIsUploading(true);
          try {
            const url = await onImageUpload(file);
            insertText(`![${file.name}](${url})`);
          } catch (error) {
            console.error("Failed to upload image:", error);
          } finally {
            setIsUploading(false);
          }
          break;
        }
      }
    },
    [onImageUpload, insertText]
  );

  const handleImageDrop = useCallback(
    async (e: React.DragEvent) => {
      const files = e.dataTransfer?.files;
      if (!files || !onImageUpload) return;

      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        if (file.type.startsWith("image/")) {
          e.preventDefault();
          setIsUploading(true);
          try {
            const url = await onImageUpload(file);
            insertText(`![${file.name}](${url})`);
          } catch (error) {
            console.error("Failed to upload image:", error);
          } finally {
            setIsUploading(false);
          }
        }
      }
    },
    [onImageUpload, insertText]
  );

  const handleImageButtonClick = useCallback(async () => {
    if (!onImageUpload) return;

    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*";
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;

      setIsUploading(true);
      try {
        const url = await onImageUpload(file);
        insertText(`![${file.name}](${url})`);
      } catch (error) {
        console.error("Failed to upload image:", error);
      } finally {
        setIsUploading(false);
      }
    };
    input.click();
  }, [onImageUpload, insertText]);

  // Handle textarea input for mention detection
  const handleTextareaInput = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      const newValue = e.target.value;
      onChange(newValue);

      // Check for @ mention trigger
      if (projectId) {
        const cursorPos = e.target.selectionStart;
        mention.checkForMention(newValue, cursorPos, textareaRef.current);
      }
    },
    [onChange, projectId, mention]
  );

  // Handle textarea key events
  const handleTextareaKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      // Handle mention navigation first
      if (mention.isOpen) {
        if (mention.handleKeyDown(e)) return;

        // Handle Enter/Tab for mention selection
        if ((e.key === "Enter" || e.key === "Tab") && mention.filteredMembers.length > 0) {
          e.preventDefault();
          const selected = mention.filteredMembers[mention.selectedIndex];
          if (selected) {
            mention.selectMember(selected, value, onChange, textareaRef);
            onMentionSelect?.(selected.id);
          }
          return;
        }
      }

      // Handle markdown shortcuts
      if (e.metaKey || e.ctrlKey) {
        switch (e.key) {
          case "b":
            e.preventDefault();
            wrapSelection("**");
            break;
          case "i":
            e.preventDefault();
            wrapSelection("*");
            break;
          case "k":
            e.preventDefault();
            insertText("[", "](url)");
            break;
        }
      }
    },
    [mention, value, onChange, onMentionSelect, wrapSelection, insertText]
  );

  // Handle mention selection from dropdown click
  const handleMentionSelect = useCallback(
    (member: Member) => {
      mention.selectMember(member, value, onChange, textareaRef);
      onMentionSelect?.(member.id);
    },
    [mention, value, onChange, onMentionSelect]
  );

  const toolbarButtons: ToolbarButton[] = [
    {
      icon: Bold,
      label: "Bold",
      action: () => wrapSelection("**"),
      shortcut: "⌘B",
    },
    {
      icon: Italic,
      label: "Italic",
      action: () => wrapSelection("*"),
      shortcut: "⌘I",
    },
    {
      icon: Strikethrough,
      label: "Strikethrough",
      action: () => wrapSelection("~~"),
    },
    { icon: Code, label: "Code", action: () => wrapSelection("`") },
    {
      icon: Link,
      label: "Link",
      action: () => insertText("[", "](url)"),
      shortcut: "⌘K",
    },
    {
      icon: Heading1,
      label: "Heading 1",
      action: () => insertAtLineStart("# "),
    },
    {
      icon: Heading2,
      label: "Heading 2",
      action: () => insertAtLineStart("## "),
    },
    {
      icon: Heading3,
      label: "Heading 3",
      action: () => insertAtLineStart("### "),
    },
    { icon: List, label: "Bullet List", action: () => insertAtLineStart("- ") },
    {
      icon: ListOrdered,
      label: "Numbered List",
      action: () => insertAtLineStart("1. "),
    },
    { icon: Quote, label: "Quote", action: () => insertAtLineStart("> ") },
  ];

  return (
    <div className={`border rounded-lg overflow-hidden ${className}`}>
      {/* Toolbar */}
      <div className="flex items-center gap-0.5 px-2 py-1 border-b bg-muted/50">
        {toolbarButtons.map((btn) => (
          <Button
            key={btn.label}
            type="button"
            variant="ghost"
            size="sm"
            className="h-7 w-7 p-0"
            onClick={btn.action}
            disabled={disabled || isPreview}
            title={btn.shortcut ? `${btn.label} (${btn.shortcut})` : btn.label}
          >
            <btn.icon className="h-3.5 w-3.5" />
          </Button>
        ))}

        {onImageUpload && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-7 w-7 p-0"
            onClick={handleImageButtonClick}
            disabled={disabled || isUploading || isPreview}
            title="Upload image"
          >
            <ImagePlus className="h-3.5 w-3.5" />
          </Button>
        )}

        <div className="flex-1" />

        {showPreview && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-7 px-2 text-xs gap-1"
            onClick={() => setIsPreview(!isPreview)}
            disabled={disabled}
          >
            {isPreview ? (
              <>
                <EyeOff className="h-3.5 w-3.5" />
                Edit
              </>
            ) : (
              <>
                <Eye className="h-3.5 w-3.5" />
                Preview
              </>
            )}
          </Button>
        )}
      </div>

      {/* Editor / Preview */}
      <div className="relative">
        {isPreview ? (
          <div className="p-3 min-h-[120px]">
            {value ? (
              <MarkdownRenderer content={value} />
            ) : (
              <p className="text-muted-foreground text-sm">Nothing to preview</p>
            )}
          </div>
        ) : (
          <>
            <TextareaAutosize
              ref={textareaRef}
              value={value}
              onChange={handleTextareaInput}
              placeholder={placeholder}
              disabled={disabled}
              minRows={minRows}
              maxRows={maxRows}
              className="w-full resize-none bg-transparent p-3 text-sm focus:outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50"
              onKeyDown={handleTextareaKeyDown}
              onPaste={handleImagePaste}
              onDrop={handleImageDrop}
            />

            {/* Mention dropdown */}
            <MentionDropdown
              members={mention.filteredMembers}
              isOpen={mention.isOpen}
              query=""
              selectedIndex={mention.selectedIndex}
              position={mention.position}
              onSelect={handleMentionSelect}
              onClose={mention.close}
              onHover={mention.setSelectedIndex}
            />
          </>
        )}
      </div>

      {/* Upload indicator */}
      {isUploading && (
        <div className="px-3 py-1.5 text-xs text-muted-foreground border-t bg-muted/30">
          Uploading image...
        </div>
      )}
    </div>
  );
}
