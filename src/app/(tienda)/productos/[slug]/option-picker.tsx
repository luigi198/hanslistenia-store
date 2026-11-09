"use client";

import { useState } from "react";
import { formatCRC } from "@/app/_lib/format";
import { whatsappLink } from "@/app/_lib/store-info";
import type { OptionGroup } from "@/domain/products/product";
import { computeUnitPrice } from "@/domain/products/price";
import styles from "./option-picker.module.css";

interface Props {
  productName: string;
  basePrice: number;
  fromPrice: number;
  optionGroups: OptionGroup[];
}

/** Square option chips (a radio group per option) and the live price. */
export function OptionPicker({
  productName,
  basePrice,
  fromPrice,
  optionGroups,
}: Props) {
  // Nothing preselected: a default size would too easily end up in an order.
  const [selection, setSelection] = useState<Record<string, string>>({});
  const complete = optionGroups.every((g) => selection[g.name]);
  const price = complete
    ? computeUnitPrice({ basePrice, optionGroups }, selection)
    : null;
  const chosen = optionGroups
    .map((g) => selection[g.name] && `${g.name}: ${selection[g.name]}`)
    .filter(Boolean)
    .join(", ");

  return (
    <div className={styles.picker}>
      <p className={styles.price} aria-live="polite" data-testid="price">
        {price === null ? `Desde ${formatCRC(fromPrice)}` : formatCRC(price)}
      </p>
      {optionGroups.map((group) => (
        <fieldset key={group.name} className={styles.group}>
          <legend className={styles.legend}>{group.name}</legend>
          <div className={styles.chips}>
            {group.values.map((value) => (
              <label key={value.label} className={styles.chip}>
                <input
                  type="radio"
                  name={group.name}
                  value={value.label}
                  checked={selection[group.name] === value.label}
                  onChange={() =>
                    setSelection((s) => ({ ...s, [group.name]: value.label }))
                  }
                />
                <span>{value.label}</span>
                {value.priceDelta > 0 && (
                  <span className={styles.delta}>
                    +{formatCRC(value.priceDelta)}
                  </span>
                )}
              </label>
            ))}
          </div>
        </fieldset>
      ))}
      <a
        className={styles.cta}
        href={whatsappLink(
          `Hola, me interesa: ${productName}${chosen ? ` (${chosen})` : ""}.`,
        )}
        target="_blank"
        rel="noopener noreferrer"
      >
        Consultar por WhatsApp
      </a>
    </div>
  );
}
