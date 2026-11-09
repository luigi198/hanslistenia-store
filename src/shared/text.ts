const COMBINING_MARKS = /[̀-ͯ]/g;

/** "Cédula Ñandú" → "Cedula Nandu": accents removed, letters kept. */
export function stripDiacritics(text: string): string {
  return text.normalize("NFD").replace(COMBINING_MARKS, "");
}
