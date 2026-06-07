export function cn(...inputs: (string | undefined | null | boolean | number)[]) {
  return inputs.filter(Boolean).join(' ');
}
export default cn;
