"use client";

import { useId, useState } from "react";

import { cn } from "@/lib/utils";

/**
 * Client-side image upload field with `URL.createObjectURL`-driven
 * preview (Unit 16.4) per ADR-0017 D-C + Unit 16.0 D-14 lean.
 *
 * The ONLY client-side JS in Phase 16. ~50 lines; isolated to a small
 * `"use client"` boundary on `/[locale]/profile` to keep First Load JS
 * shared chunk UNCHANGED at 103 kB end-to-end through every Phase 9-16
 * unit.
 *
 * Behavior:
 *   - Renders a circular preview adjacent to the `<input type="file">`.
 *   - On file select, swaps the preview to a local object URL.
 *   - On unmount, browser garbage-collects the object URL.
 *   - The `<form>` parent + submit button live in the server component;
 *     this component just provides the field + preview UI.
 */

export interface ProfileImageUploadFieldProps {
  /** Form field name (typically `"image"`). */
  name: string;
  /** Server-rendered initial avatar (overrides → GitHub → null). */
  currentSrc: string | null;
  /** Accept attribute (typically `"image/jpeg,image/png,image/webp"`). */
  accept: string;
  /** i18n strings (resolved server-side; passed in pre-localized). */
  labels: {
    field: string;
    hint: string;
    currentImage: string;
  };
}

export function ProfileImageUploadField(props: ProfileImageUploadFieldProps) {
  const id = useId();
  const [previewSrc, setPreviewSrc] = useState<string | null>(null);
  const displaySrc = previewSrc ?? props.currentSrc;

  return (
    <div className="space-y-3">
      <label htmlFor={id} className="block">
        <span className="text-foreground text-sm font-medium">{props.labels.field}</span>
      </label>
      <div className="flex items-center gap-4">
        {displaySrc ? (
          <img
            src={displaySrc}
            alt={props.labels.currentImage}
            width={64}
            height={64}
            className="size-16 shrink-0 rounded-full object-cover"
          />
        ) : (
          <div
            aria-hidden
            className="border-border bg-muted size-16 shrink-0 rounded-full border"
          />
        )}
        <input
          id={id}
          type="file"
          name={props.name}
          accept={props.accept}
          onChange={(e) => {
            const file = e.target.files?.[0] ?? null;
            setPreviewSrc(file ? URL.createObjectURL(file) : null);
          }}
          className={cn(
            "text-foreground/90 file:border-border file:bg-background file:text-foreground hover:file:bg-muted block w-full text-sm",
            "file:mr-3 file:h-9 file:cursor-pointer file:rounded-md file:border file:px-3 file:text-xs file:font-medium file:transition-colors",
            "focus-visible:ring-ring focus-visible:ring-2 focus-visible:outline-none",
          )}
        />
      </div>
      <p className="text-muted-foreground text-xs">{props.labels.hint}</p>
    </div>
  );
}
