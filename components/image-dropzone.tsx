"use client";

import { useRef, useState } from "react";
import { ImageSquare } from "@phosphor-icons/react";
import { useAsyncAction } from "@/hooks/use-async-action";
import { cn } from "@/lib/utils";

/** Drag-and-drop image uploader — click or drop a file, uploads it to
 * /api/upload, and reports the resulting URL back via onChange. Used for both
 * dish photos and the workspace logo. */
export function ImageDropzone({
  value,
  onChange,
  className,
  imageClassName,
  placeholder = "Drag & drop an image, or click to browse",
}: {
  value: string;
  onChange: (url: string) => void;
  className?: string;
  imageClassName?: string;
  placeholder?: string;
}) {
  const { run, isPending } = useAsyncAction();
  const [dragActive, setDragActive] = useState(false);
  const [imageError, setImageError] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const uploadImage = async (file: File) => {
    await run("upload-image", async () => {
      const res = await fetch("/api/upload", {
        method: "POST",
        headers: { "Content-Type": file.type, "X-Filename": file.name },
        body: file,
      });
      if (!res.ok) {
        const body = await res.json().catch(() => null);
        throw new Error(body?.error || "Failed to upload image.");
      }
      const { url } = await res.json();
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
        onClick={() => fileInputRef.current?.click()}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") fileInputRef.current?.click();
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
          if (file) uploadImage(file);
        }}
        className={cn(
          "relative flex cursor-pointer flex-col items-center justify-center gap-2 overflow-hidden rounded-lg border-2 border-dashed text-center transition-colors",
          dragActive ? "border-primary bg-primary/5" : "border-input bg-secondary hover:bg-secondary/70",
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
        ) : (
          <>
            <ImageSquare size={24} className="text-muted-foreground" />
            <p className="px-4 text-xs text-muted-foreground">{placeholder}</p>
          </>
        )}
        {trimmed && !isPending("upload-image") && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/0 opacity-0 transition-opacity hover:bg-black/40 hover:opacity-100">
            <span className="text-xs font-medium text-white">Replace image</span>
          </div>
        )}
        {isPending("upload-image") && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/40">
            <span className="text-xs font-medium text-white">Uploading…</span>
          </div>
        )}
      </div>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp,image/gif"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) uploadImage(file);
          e.target.value = "";
        }}
      />
    </div>
  );
}
