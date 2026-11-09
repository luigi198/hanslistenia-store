"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import type { ProductFormState } from "../actions";
import { ADMIN_PRODUCTS_PATH } from "../paths";
import styles from "../products.module.css";
import type { ProductFormValues } from "./form-types";
import { ImagesEditor } from "./images-editor";
import { OptionGroupsEditor } from "./option-groups-editor";

type SaveAction = (
  previous: ProductFormState,
  form: FormData,
) => Promise<ProductFormState>;

interface Props {
  action: SaveAction;
  initial: ProductFormValues;
  submitLabel: string;
}

const NO_ERRORS: ProductFormState = { errors: [] };

/**
 * Fully controlled so nothing typed is lost when the server returns errors
 * (React resets uncontrolled fields after a form action).
 */
export function ProductForm({ action, initial, submitLabel }: Props) {
  const [state, formAction, pending] = useActionState(action, NO_ERRORS);
  const [values, setValues] = useState(initial);
  const [uploading, setUploading] = useState(false);
  const set = <K extends keyof ProductFormValues>(
    key: K,
    value: ProductFormValues[K],
  ) => setValues((v) => ({ ...v, [key]: value }));

  return (
    <form action={formAction} className={styles.form}>
      {state.errors.length > 0 && (
        <ul role="alert" className={styles.errors}>
          {state.errors.map((message) => (
            <li key={message}>{message}</li>
          ))}
        </ul>
      )}
      <label className={styles.field}>
        Nombre
        <input
          name="name"
          required
          value={values.name}
          onChange={(e) => set("name", e.target.value)}
        />
      </label>
      <label className={styles.field}>
        Descripción
        <textarea
          name="description"
          rows={5}
          value={values.description}
          onChange={(e) => set("description", e.target.value)}
        />
      </label>
      <label className={styles.field}>
        Precio base (₡)
        <input
          name="basePrice"
          type="number"
          min={1}
          step={1}
          required
          value={values.basePrice}
          onChange={(e) => set("basePrice", e.target.value)}
        />
      </label>
      <label className={styles.field}>
        Tiempo de producción (opcional)
        <input
          name="productionNote"
          placeholder="Ej.: Lista en 2 semanas"
          value={values.productionNote}
          onChange={(e) => set("productionNote", e.target.value)}
        />
      </label>

      <OptionGroupsEditor
        groups={values.optionGroups}
        onChange={(groups) => set("optionGroups", groups)}
      />
      <ImagesEditor
        images={values.images}
        onChange={(update) =>
          setValues((v) => ({ ...v, images: update(v.images) }))
        }
        onUploadingChange={setUploading}
      />

      <input
        type="hidden"
        name="optionGroups"
        value={JSON.stringify(values.optionGroups)}
      />
      <input
        type="hidden"
        name="images"
        value={JSON.stringify(values.images.map(({ key }) => ({ key })))}
      />

      <div className={styles.row}>
        <button
          type="submit"
          disabled={pending || uploading}
          className={styles.primary}
        >
          {pending ? "Guardando…" : uploading ? "Subiendo fotos…" : submitLabel}
        </button>
        <Link href={ADMIN_PRODUCTS_PATH}>Cancelar</Link>
      </div>
    </form>
  );
}
