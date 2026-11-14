/** Index of the slide in view, from a scroll-snap carousel's position. */
export function slideAt(
  scrollLeft: number,
  slideWidth: number,
  count: number,
): number {
  if (slideWidth <= 0 || count <= 0) return 0;
  const nearest = Math.round(scrollLeft / slideWidth);
  return Math.min(Math.max(nearest, 0), count - 1);
}
