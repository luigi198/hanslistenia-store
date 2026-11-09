"use client";

import Image from "next/image";
import { useState } from "react";
import { requestImageUploadAction } from "../actions";
import {
  ACCEPTED_IMAGE_TYPES,
  IMAGE_FORMATS_LABEL,
  MAX_IMAGE_MB,
  MAX_PRODUCT_IMAGES,
} from "../image-rules";
import styles from "../products.module.css";
import type { EditableImage } from "./form-types";

type ImagesUpdate = (images: EditableImage[]) => EditableImage[];

interface Props {
  images: EditableImage[];
  /** Receives an updater so concurrent edits never overwrite each other. */
  onChange: (update: ImagesUpdate) => void;
  onUploadingChange: (uploading: boolean) => void;
}

const UPLOAD_FAILED = "No se pudo subir la foto. Intente de nuevo.";
const TOO_MANY = `Máximo ${MAX_PRODUCT_IMAGES} fotos por producto.`;

/** Uploads one file straight to storage; returns the image or an error. */
async function upload(file: File): Promise<EditableImage | string> {
  const ticket = await requestImageUploadAction({
    contentType: file.type,
    bytes: file.size,
  });
  if (!ticket.ok) return ticket.error;
  const response = await fetch(ticket.uploadUrl, {
    method: "PUT",
    headers: { "Content-Type": file.type },
    body: file,
  });
  return response.ok
    ? { key: ticket.key, url: ticket.publicUrl }
    : UPLOAD_FAILED;
}

function moved(images: EditableImage[], from: number, to: number) {
  const next = [...images];
  const [item] = next.splice(from, 1);
  next.splice(to, 0, item);
  return next;
}

/** Photo list: upload, reorder (first = cover) and remove. */
export function ImagesEditor({ images, onChange, onUploadingChange }: Props) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function addFiles(files: File[]) {
    // Uploading past the limit would leave photos the save then rejects.
    const room = MAX_PRODUCT_IMAGES - images.length;
    const accepted = files.slice(0, Math.max(room, 0));
    setError(accepted.length < files.length ? TOO_MANY : null);
    if (!accepted.length) return;
    setUploading(true);
    onUploadingChange(true);
    for (const file of accepted) {
      const result = await upload(file).catch(() => UPLOAD_FAILED);
      if (typeof result === "string") setError(`${file.name}: ${result}`);
      // Appended to the list as it is *now*, so removals or reorders made
      // during the upload are kept.
      else onChange((current) => [...current, result]);
    }
    setUploading(false);
    onUploadingChange(false);
  }

  return (
    <fieldset className={styles.fieldset}>
      <legend>Fotos (la primera es la portada)</legend>
      <ol className={styles.images}>
        {images.map((image, i) => (
          <li key={image.key} className={styles.image}>
            <Image
              src={image.url}
              alt={`Foto ${i + 1}`}
              width={96}
              height={96}
            />
            <div className={styles.row}>
              <button
                type="button"
                aria-label={`Mover foto ${i + 1} antes`}
                disabled={i === 0}
                onClick={() => onChange((current) => moved(current, i, i - 1))}
              >
                ←
              </button>
              <button
                type="button"
                aria-label={`Mover foto ${i + 1} después`}
                disabled={i === images.length - 1}
                onClick={() => onChange((current) => moved(current, i, i + 1))}
              >
                →
              </button>
              <button
                type="button"
                aria-label={`Quitar foto ${i + 1}`}
                onClick={() =>
                  onChange((current) => current.filter((_, j) => j !== i))
                }
              >
                ✕
              </button>
            </div>
          </li>
        ))}
      </ol>
      <label className={styles.upload}>
        {uploading ? "Subiendo…" : "Agregar fotos"}
        <input
          type="file"
          accept={ACCEPTED_IMAGE_TYPES}
          multiple
          disabled={uploading || images.length >= MAX_PRODUCT_IMAGES}
          onChange={(e) => {
            const files = Array.from(e.target.files ?? []);
            e.target.value = "";
            if (files.length) void addFiles(files);
          }}
        />
      </label>
      <p className={styles.hint}>
        {IMAGE_FORMATS_LABEL}, máximo {MAX_IMAGE_MB} MB por foto y{" "}
        {MAX_PRODUCT_IMAGES} fotos.
      </p>
      {error && <p className={styles.error}>{error}</p>}
    </fieldset>
  );
}
