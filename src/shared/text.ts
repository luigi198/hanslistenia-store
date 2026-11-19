const COMBINING_MARKS = /[̀-ͯ]/g;

/** "Cédula Ñandú" → "Cedula Nandu": accents removed, letters kept. */
export function stripDiacritics(text: string): string {
  return text.normalize("NFD").replace(COMBINING_MARKS, "");
}

const ELLIPSIS = "…";
const WHITESPACE_RUN = /\s+/g;
const TRAILING_PUNCTUATION = /[\s.,;:!?¡¿—–-]+$/u;

/**
 * Text on one line, at most `maxLength` characters. Longer text is cut at the
 * last whole word that fits and marked with "…" (e.g. meta descriptions).
 */
export function summarize(text: string, maxLength: number): string {
  if (maxLength <= ELLIPSIS.length) {
    throw new RangeError(`maxLength must exceed ${ELLIPSIS.length}`);
  }
  const flat = text.replace(WHITESPACE_RUN, " ").trim();
  if (flat.length <= maxLength) return flat;

  const hardCut = flat.slice(0, maxLength - ELLIPSIS.length);
  const lastSpace = hardCut.lastIndexOf(" ");
  const wordCut = lastSpace > 0 ? hardCut.slice(0, lastSpace) : hardCut;
  return wordCut.replace(TRAILING_PUNCTUATION, "") + ELLIPSIS;
}
