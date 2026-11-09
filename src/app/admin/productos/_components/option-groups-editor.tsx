"use client";

import type { OptionGroup } from "@/domain/products/product";
import styles from "../products.module.css";

interface Props {
  groups: OptionGroup[];
  onChange: (groups: OptionGroup[]) => void;
}

const emptyValue = () => ({ label: "", priceDelta: 0 });

/** Edits option groups (e.g. "Talla") and their values with extra price. */
export function OptionGroupsEditor({ groups, onChange }: Props) {
  const setGroup = (g: number, group: OptionGroup) =>
    onChange(groups.map((old, i) => (i === g ? group : old)));
  const removeGroup = (g: number) => onChange(groups.filter((_, i) => i !== g));

  return (
    <fieldset className={styles.fieldset}>
      <legend>Opciones (talla, color…)</legend>
      {groups.map((group, g) => (
        <div key={g} className={styles.group}>
          <div className={styles.row}>
            <input
              aria-label={`Nombre de la opción ${g + 1}`}
              placeholder="Ej.: Talla"
              value={group.name}
              onChange={(e) => setGroup(g, { ...group, name: e.target.value })}
            />
            <button type="button" onClick={() => removeGroup(g)}>
              Quitar opción
            </button>
          </div>
          {group.values.map((value, v) => {
            const setValue = (next: typeof value) =>
              setGroup(g, {
                ...group,
                values: group.values.map((old, i) => (i === v ? next : old)),
              });
            return (
              <div key={v} className={styles.row}>
                <input
                  aria-label={`Opción ${g + 1}, valor ${v + 1}`}
                  placeholder="Ej.: M"
                  value={value.label}
                  onChange={(e) =>
                    setValue({ ...value, label: e.target.value })
                  }
                />
                <input
                  aria-label={`Precio extra de opción ${g + 1}, valor ${v + 1}`}
                  type="number"
                  min={0}
                  step={1}
                  value={value.priceDelta}
                  onChange={(e) =>
                    setValue({
                      ...value,
                      // Empty field means no extra price.
                      priceDelta: Number.isNaN(e.target.valueAsNumber)
                        ? 0
                        : e.target.valueAsNumber,
                    })
                  }
                />
                <button
                  type="button"
                  aria-label={`Quitar valor ${v + 1} de opción ${g + 1}`}
                  onClick={() =>
                    setGroup(g, {
                      ...group,
                      values: group.values.filter((_, i) => i !== v),
                    })
                  }
                >
                  ✕
                </button>
              </div>
            );
          })}
          <button
            type="button"
            onClick={() =>
              setGroup(g, { ...group, values: [...group.values, emptyValue()] })
            }
          >
            Agregar valor
          </button>
        </div>
      ))}
      <button
        type="button"
        onClick={() =>
          onChange([...groups, { name: "", values: [emptyValue()] }])
        }
      >
        Agregar opción
      </button>
      <p className={styles.hint}>
        El precio extra se suma al precio base (0 si no cambia el precio).
      </p>
    </fieldset>
  );
}
