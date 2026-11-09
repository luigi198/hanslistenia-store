"use client";

import { useState } from "react";
import { formatCRC } from "@/app/_lib/format";
import { whatsappLink } from "@/app/_lib/store-info";
import type { OptionGroup } from "@/domain/products/product";
import { computeUnitPrice } from "@/domain/products/price";
import styles from "../catalog.module.css";

interface Props {
  productName: string;
  basePrice: number;
  fromPrice: number;
  optionGroups: OptionGroup[];
}

/** Option selects with the price for the current choice. */
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
    <div className={styles.purchase}>
      <p className={styles.price} aria-live="polite" data-testid="price">
        {price === null ? `Desde ${formatCRC(fromPrice)}` : formatCRC(price)}
      </p>
      {optionGroups.map((group) => (
        <label key={group.name} className={styles.option}>
          {group.name}
          <select
            value={selection[group.name] ?? ""}
            onChange={(e) =>
              setSelection((s) => ({ ...s, [group.name]: e.target.value }))
            }
          >
            <option value="" disabled>
              Elija {group.name.toLowerCase()}
            </option>
            {group.values.map((value) => (
              <option key={value.label} value={value.label}>
                {value.label}
                {value.priceDelta > 0
                  ? ` (+${formatCRC(value.priceDelta)})`
                  : ""}
              </option>
            ))}
          </select>
        </label>
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
