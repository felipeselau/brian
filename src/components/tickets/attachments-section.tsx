"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { FileDropzone } from "@/components/ui/file-dropzone";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Loader2,
  File,
  FileText,
  FileSpreadsheet,
  FileArchive,
  FileImage,
  Trash2,
  Upload,
  ExternalLink,
  Download,
} from "lucide-react";

interface Attachment {
  id: string;
  name: string;
  url: string;
  size: number | null;
  type: string | null;
  createdAt: Date;
}

interface AttachmentsSectionProps {
  projectId: string;
  ticketId: string;
  attachments: Attachment[];
  isOwner: boolean;
}

export function AttachmentsSection({
  projectId,
  ticketId,
  attachments: initialAttachments,
  isOwner,
}: AttachmentsSectionProps) {
  const router = useRouter();
  const [attachments, setAttachments] = useState(initialAttachments);
  const [isLoading, setIsLoading] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const handleUpload = useCallback(
    async (files: File[]) => {
      setIsLoading(true);

      try {
        const formData = new FormData();
        for (const file of files) {
          formData.append("files", file);
        }

        const response = await fetch(
          `/api/projects/${projectId}/tickets/${ticketId}/attachments/upload`,
          {
            method: "POST",
            body: formData,
          }
        );

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || "Failed to upload files");
        }

        const { attachments: newAttachments } = await response.json();
        setAttachments([...newAttachments, ...attachments]);
        toast.success(
          `${newAttachments.length} file(s) uploaded successfully`
        );
        setIsDialogOpen(false);
      } catch (error) {
        console.error("Error uploading files:", error);
        toast.error(
          error instanceof Error ? error.message : "Failed to upload files"
        );
      } finally {
        setIsLoading(false);
      }
    },
    [projectId, ticketId, attachments]
  );

  const handleDelete = async (attachmentId: string) => {
    if (!confirm("Delete this attachment?")) return;

    try {
      const response = await fetch(
        `/api/projects/${projectId}/tickets/${ticketId}/attachments?attachmentId=${attachmentId}`,
        {
          method: "DELETE",
        }
      );

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

  const getFileIcon = (type: string | null, name: string) => {
    if (!type) return <File className="h-5 w-5 text-muted-foreground" />;
    if (type.startsWith("image/"))
      return <FileImage className="h-5 w-5 text-blue-500" />;
    if (type === "application/pdf" || name.endsWith(".pdf"))
      return <FileText className="h-5 w-5 text-red-500" />;
    if (type.includes("spreadsheet") || name.match(/\.(xlsx?|csv)$/))
      return <FileSpreadsheet className="h-5 w-5 text-green-500" />;
    if (type.includes("zip") || name.match(/\.(zip|rar|7z|tar|gz)$/))
      return <FileArchive className="h-5 w-5 text-yellow-600" />;
    if (type.includes("word") || name.match(/\.docx?$/))
      return <FileText className="h-5 w-5 text-blue-600" />;
    return <File className="h-5 w-5 text-muted-foreground" />;
  };

  const isImage = (type: string | null) => type?.startsWith("image/") ?? false;

  const formatFileSize = (bytes: number | null) => {
    if (!bytes) return "";
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const formatDate = (date: Date | string) => {
    return new Date(date).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  // Separate images and files
  const imageAttachments = attachments.filter((a) => isImage(a.type));
  const fileAttachments = attachments.filter((a) => !isImage(a.type));

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold">
          Attachments ({attachments.length})
        </h3>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button variant="outline" size="sm">
              <Upload className="h-4 w-4 mr-2" />
              Upload
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Upload Attachments</DialogTitle>
            </DialogHeader>
            <FileDropzone
              onUpload={handleUpload}
              disabled={isLoading}
              maxSize={10 * 1024 * 1024}
              maxFiles={10}
            />
          </DialogContent>
        </Dialog>
      </div>

      {/* Image thumbnails */}
      {imageAttachments.length > 0 && (
        <div className="grid grid-cols-3 gap-2">
          {imageAttachments.map((attachment) => (
            <div
              key={attachment.id}
              className="group relative aspect-square rounded-lg overflow-hidden border bg-muted"
            >
              <img
                src={attachment.url}
                alt={attachment.name}
                className="w-full h-full object-cover"
                loading="lazy"
              />
              {/* Overlay */}
              <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                <a
                  href={attachment.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2 bg-white/20 rounded-full hover:bg-white/40 transition-colors"
                  title="Open"
                >
                  <ExternalLink className="h-4 w-4 text-white" />
                </a>
                <a
                  href={attachment.url}
                  download={attachment.name}
                  className="p-2 bg-white/20 rounded-full hover:bg-white/40 transition-colors"
                  title="Download"
                >
                  <Download className="h-4 w-4 text-white" />
                </a>
                {isOwner && (
                  <button
                    onClick={() => handleDelete(attachment.id)}
                    className="p-2 bg-white/20 rounded-full hover:bg-red-500/60 transition-colors"
                    title="Delete"
                  >
                    <Trash2 className="h-4 w-4 text-white" />
                  </button>
                )}
              </div>
              {/* Filename on hover */}
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <p className="text-xs text-white truncate">
                  {attachment.name}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* File list */}
      {fileAttachments.length > 0 && (
        <div className="space-y-2">
          {fileAttachments.map((attachment) => (
            <div
              key={attachment.id}
              className="group flex items-center gap-3 p-3 rounded-lg border bg-card hover:bg-muted/50 transition-colors"
            >
              {getFileIcon(attachment.type, attachment.name)}

              <div className="flex-1 min-w-0">
                <a
                  href={attachment.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-medium text-sm hover:underline block truncate"
                >
                  {attachment.name}
                </a>
                <p className="text-xs text-muted-foreground">
                  {formatFileSize(attachment.size)}
                  {attachment.size && " · "}
                  {formatDate(attachment.createdAt)}
                </p>
              </div>

              <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                <a
                  href={attachment.url}
                  download={attachment.name}
                  className="p-1.5 rounded hover:bg-muted transition-colors"
                  title="Download"
                >
                  <Download className="h-4 w-4 text-muted-foreground" />
                </a>
                {isOwner && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 text-muted-foreground hover:text-destructive"
                    onClick={() => handleDelete(attachment.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Empty state */}
      {attachments.length === 0 && (
        <div className="text-center py-8 text-muted-foreground text-sm">
          No attachments yet. Upload files or paste images directly.
        </div>
      )}
    </div>
  );
}
