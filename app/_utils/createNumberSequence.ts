export function createNumberSequence(length: number) {
  return [...Array(length)].map((_, i) => i);
}
