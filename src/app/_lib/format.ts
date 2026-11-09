const crc = new Intl.NumberFormat("es-CR", {
  style: "currency",
  currency: "CRC",
  maximumFractionDigits: 0,
});

/** Integer colones for display, e.g. ₡12 000. */
export function formatCRC(colones: number): string {
  return crc.format(colones);
}
