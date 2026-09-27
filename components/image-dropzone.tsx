"use client";

import { useRef, useState } from "react";
import { ImageSquare } from "@phosphor-icons/react";
import { useAsyncAction } from "@/hooks/use-async-action";
import { uploadImage } from "@/lib/upload-image";
import { cn } from "@/lib/utils";

/** Drag-and-drop image uploader — click or drop a file, uploads it to
 * /api/upload (the business's own storage, or the shared one), and reports
 * the resulting URL back via onChange. Used for both dish photos and the
 * workspace logo. With `onFile`, it hands over the file instead of uploading
 * (for onboarding, before the business and its storage exist). */
export function ImageDropzone({
  value,
  onChange,
  className,
  imageClassName,
  placeholder = "Drag & drop an image, or click to browse",
  compact = false,
  onFile,
  label = "image",
}: {
  value: string;
  onChange: (url: string) => void;
  className?: string;
  imageClassName?: string;
  placeholder?: string;
  /** Icon-only, no placeholder text — for small inline pickers where a full
   * sentence would overflow (e.g. a 44px badge next to a form field). */
  compact?: boolean;
  /** Called with the chosen file instead of uploading it; the parent sets `value` (e.g. a preview URL). */
  onFile?: (file: File) => void;
  /** What the image is, for its accessible name ("Choose logo" / "Replace logo"). */
  label?: string;
}) {
  const { run, isPending } = useAsyncAction();
  const [dragActive, setDragActive] = useState(false);
  const [imageError, setImageError] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const pickFile = async (file: File) => {
    if (onFile) {
      setImageError(false);
      onFile(file);
      return;
    }
    await run("upload-image", async () => {
      const url = await uploadImage(file);
      setImageError(false);
      onChange(url);
    }, "Failed to upload image.");
  };

  const trimmed = value.trim();

  return (
    <div>
      <div
        role="button"
        tabIndex={0}
        aria-label={`${trimmed ? "Replace" : "Choose"} ${label}`}
        aria-busy={isPending("upload-image") || undefined}
        onClick={() => fileInputRef.current?.click()}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault(); // Space would scroll the page
            fileInputRef.current?.click();
          }
        }}
        onDragOver={(e) => {
          e.preventDefault();
          setDragActive(true);
        }}
        onDragLeave={() => setDragActive(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragActive(false);
          const file = e.dataTransfer.files?.[0];
          if (file) pickFile(file);
        }}
        className={cn(
          "relative flex cursor-pointer flex-col items-center justify-center gap-2 overflow-hidden rounded-lg border-2 border-dashed text-center transition-colors",
          dragActive ? "border-primary bg-primary/5" : "border-input-border bg-secondary hover:bg-secondary/70",
          className,
        )}
      >
        {trimmed && !imageError ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            key={trimmed}
            src={trimmed}
            alt=""
            className={cn("absolute inset-0 size-full object-contain", imageClassName)}
            onError={() => setImageError(true)}
          />
        ) : compact ? (
          <ImageSquare size={16} className="text-muted-foreground" />
        ) : (
          <>
            <ImageSquare size={24} className="text-muted-foreground" />
            <p className="px-4 text-xs text-muted-foreground">{placeholder}</p>
          </>
        )}
        {trimmed && !isPending("upload-image") && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/0 p-1 text-center opacity-0 transition-opacity hover:bg-black/40 hover:opacity-100">
            <span className="text-xs font-medium text-white">{compact ? "Edit" : "Replace image"}</span>
          </div>
        )}
        {isPending("upload-image") && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/40 p-1 text-center">
            <span className="text-xs font-medium text-white">{compact ? "…" : "Uploading…"}</span>
          </div>
        )}
      </div>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp,image/gif"
        // Opened by the drop area above, which is the control people use.
        hidden
        tabIndex={-1}
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) pickFile(file);
          e.target.value = "";
        }}
      />
    </div>
  );
}
