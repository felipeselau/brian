"use client";

import { useState, useCallback } from "react";
import { Loader2, Upload, X, File, Image as ImageIcon } from "lucide-react";
import { Button } from "@/components/ui/button";

interface FileWithPreview {
  file: File;
  preview?: string;
  progress: number;
  url?: string;
  error?: string;
}

interface FileDropzoneProps {
  onUpload: (files: File[]) => Promise<void>;
  accept?: string;
  maxFiles?: number;
  maxSize?: number; // in bytes
  className?: string;
  disabled?: boolean;
}

export function FileDropzone({
  onUpload,
  accept = "image/*,.pdf,.doc,.docx,.xls,.xlsx,.txt,.zip",
  maxFiles = 10,
  maxSize = 10 * 1024 * 1024, // 10MB default
  className = "",
  disabled = false,
}: FileDropzoneProps) {
  const [files, setFiles] = useState<FileWithPreview[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  const validateFile = useCallback(
    (file: File): string | null => {
      if (file.size > maxSize) {
        return `File is too large (max ${Math.round(maxSize / 1024 / 1024)}MB)`;
      }
      return null;
    },
    [maxSize]
  );

  const handleFiles = useCallback(
    (newFiles: FileList | File[]) => {
      const validFiles: FileWithPreview[] = [];
      const fileArray = Array.from(newFiles);

      for (const file of fileArray) {
        if (files.length + validFiles.length >= maxFiles) break;

        const error = validateFile(file);
        const fileWithPreview: FileWithPreview = {
          file,
          progress: 0,
          error: error || undefined,
        };

        // Create preview for images
        if (file.type.startsWith("image/") && !error) {
          fileWithPreview.preview = URL.createObjectURL(file);
        }

        validFiles.push(fileWithPreview);
      }

      setFiles((prev) => [...prev, ...validFiles]);
    },
    [files.length, maxFiles, validateFile]
  );

  const removeFile = useCallback((index: number) => {
    setFiles((prev) => {
      const newFiles = [...prev];
      if (newFiles[index].preview) {
        URL.revokeObjectURL(newFiles[index].preview!);
      }
      newFiles.splice(index, 1);
      return newFiles;
    });
  }, []);

  const handleUpload = useCallback(async () => {
    const validFiles = files.filter((f) => !f.error);
    if (validFiles.length === 0) return;

    setIsUploading(true);
    try {
      await onUpload(validFiles.map((f) => f.file));
      // Clean up previews
      files.forEach((f) => {
        if (f.preview) URL.revokeObjectURL(f.preview);
      });
      setFiles([]);
    } catch (error) {
      console.error("Upload failed:", error);
    } finally {
      setIsUploading(false);
    }
  }, [files, onUpload]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      handleFiles(e.dataTransfer.files);
    },
    [handleFiles]
  );

  const handleBrowse = useCallback(() => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = accept;
    input.multiple = true;
    input.onchange = (e) => {
      const target = e.target as HTMLInputElement;
      if (target.files) {
        handleFiles(target.files);
      }
    };
    input.click();
  }, [accept, handleFiles]);

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div className={className}>
      {/* Drop zone */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={handleBrowse}
        className={`
          border-2 border-dashed rounded-lg p-8 text-center cursor-pointer
          transition-colors duration-200
          ${
            isDragging
              ? "border-primary bg-primary/5"
              : "border-muted-foreground/25 hover:border-muted-foreground/50 hover:bg-muted/50"
          }
          ${disabled ? "opacity-50 cursor-not-allowed" : ""}
        `}
      >
        <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
        <p className="text-sm font-medium">
          Drag & drop files here, or click to browse
        </p>
        <p className="text-xs text-muted-foreground mt-1">
          Max {maxFiles} files, up to {Math.round(maxSize / 1024 / 1024)}MB each
        </p>
      </div>

      {/* File list */}
      {files.length > 0 && (
        <div className="mt-3 space-y-2">
          {files.map((fileWithPreview, index) => (
            <div
              key={index}
              className="flex items-center gap-3 p-2 rounded-lg border bg-card"
            >
              {/* Thumbnail or icon */}
              {fileWithPreview.preview ? (
                <img
                  src={fileWithPreview.preview}
                  alt={fileWithPreview.file.name}
                  className="h-10 w-10 rounded object-cover"
                />
              ) : (
                <div className="h-10 w-10 rounded bg-muted flex items-center justify-center">
                  {fileWithPreview.file.type.startsWith("image/") ? (
                    <ImageIcon className="h-5 w-5 text-muted-foreground" />
                  ) : (
                    <File className="h-5 w-5 text-muted-foreground" />
                  )}
                </div>
              )}

              {/* File info */}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">
                  {fileWithPreview.file.name}
                </p>
                <p className="text-xs text-muted-foreground">
                  {formatFileSize(fileWithPreview.file.size)}
                  {fileWithPreview.error && (
                    <span className="text-destructive ml-2">
                      {fileWithPreview.error}
                    </span>
                  )}
                </p>
              </div>

              {/* Remove button */}
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0"
                onClick={(e) => {
                  e.stopPropagation();
                  removeFile(index);
                }}
                disabled={isUploading}
              >
                <X className="h-3 w-3" />
              </Button>
            </div>
          ))}

          {/* Upload button */}
          <div className="flex justify-end">
            <Button
              type="button"
              size="sm"
              onClick={handleUpload}
              disabled={
                isUploading || files.every((f) => f.error) || disabled
              }
            >
              {isUploading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Uploading...
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4 mr-2" />
                  Upload {files.filter((f) => !f.error).length} file(s)
                </>
              )}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
