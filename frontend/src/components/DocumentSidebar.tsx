"use client";

import { useState, useCallback, useRef } from "react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Upload, FileText, Trash2, Loader2, X } from "lucide-react";

const RAW_API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";
const API_URL = (
  RAW_API_URL.startsWith("http") ? RAW_API_URL : `https://${RAW_API_URL}`
).replace(/\/+$/, "");

interface Document {
  documentId: string;
  filename: string;
  chunkCount: number;
  createdAt: string;
  status: string;
}

interface DocumentSidebarProps {
  documents: Document[];
  onDocumentsChange: () => void;
}

export function DocumentSidebar({
  documents,
  onDocumentsChange,
}: DocumentSidebarProps) {
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleUpload = useCallback(
    async (file: File) => {
      setUploading(true);
      setUploadError(null);
      const formData = new FormData();
      formData.append("file", file);

      try {
        const res = await fetch(`${API_URL}/api/documents/upload`, {
          method: "POST",
          body: formData,
        });
        const data = await res.json();
        if (!res.ok) {
          setUploadError(data.error || "Upload failed");
          return;
        }
        onDocumentsChange();
      } catch {
        setUploadError("Failed to connect to server");
      } finally {
        setUploading(false);
      }
    },
    [onDocumentsChange]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragOver(false);
      const file = e.dataTransfer.files[0];
      if (file) {
        handleUpload(file);
      }
    },
    [handleUpload]
  );

  const handleDelete = useCallback(
    async (documentId: string) => {
      setDeletingId(documentId);
      try {
        await fetch(`${API_URL}/api/documents/${documentId}`, {
          method: "DELETE",
        });
        onDocumentsChange();
      } catch {
        console.error("Failed to delete document");
      } finally {
        setDeletingId(null);
      }
    },
    [onDocumentsChange]
  );

  return (
    <div className="flex flex-col gap-3 py-3">
      {/* Upload Drop Zone */}
      <div className="px-3">
        <div
          className={`flex flex-col items-center gap-2 rounded-xl border-2 border-dashed px-4 py-5 text-center transition-all duration-200 cursor-pointer ${
            dragOver
              ? "border-violet-500 bg-violet-500/5 scale-[1.02]"
              : "border-border/50 hover:border-violet-500/40 hover:bg-muted/30"
          }`}
          onDragOver={(e) => {
            e.preventDefault();
            setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
        >
          {uploading ? (
            <Loader2 className="h-6 w-6 animate-spin text-violet-500" />
          ) : (
            <Upload className="h-6 w-6 text-muted-foreground/60" />
          )}
          <div>
            <p className="text-xs font-medium">
              {uploading ? "Indexing..." : "Drop files or click"}
            </p>
            <p className="mt-0.5 text-[10px] text-muted-foreground/50">
              .md .txt .pdf — max 10MB
            </p>
          </div>
        </div>
        <input
          ref={fileInputRef}
          type="file"
          className="hidden"
          accept=".md,.txt,.pdf"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) {
              handleUpload(file);
            }
            e.target.value = "";
          }}
        />
      </div>

      {/* Upload Error */}
      {uploadError && (
        <div className="mx-3 flex items-center gap-2 rounded-lg bg-destructive/10 px-3 py-2 text-xs text-destructive">
          <span className="flex-1">{uploadError}</span>
          <button onClick={() => setUploadError(null)}>
            <X className="h-3 w-3" />
          </button>
        </div>
      )}

      {/* Document List */}
      <ScrollArea className="flex-1 px-2">
        {documents.length === 0 ? (
          <p className="px-3 py-6 text-center text-sm text-muted-foreground">
            No documents yet. Upload files to get started.
          </p>
        ) : (
          <div className="flex flex-col gap-1.5">
            {documents.map((doc) => (
              <div
                key={doc.documentId}
                className="group flex items-center gap-2.5 rounded-lg px-3 py-2.5 transition-colors hover:bg-accent"
              >
                <FileText className="h-4 w-4 shrink-0 text-violet-500/70" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{doc.filename}</p>
                  <p className="text-[10px] text-muted-foreground">
                    {doc.chunkCount} chunks
                    {doc.status === "indexing" && (
                      <span className="ml-1.5 text-amber-500">Indexing...</span>
                    )}
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                  onClick={() => handleDelete(doc.documentId)}
                  disabled={deletingId === doc.documentId}
                >
                  {deletingId === doc.documentId ? (
                    <Loader2 className="h-3 w-3 animate-spin" />
                  ) : (
                    <Trash2 className="h-3 w-3" />
                  )}
                </Button>
              </div>
            ))}
          </div>
        )}
      </ScrollArea>
    </div>
  );
}
