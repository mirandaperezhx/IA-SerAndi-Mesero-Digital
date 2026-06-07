// Formato de moneda colombiana (COP) sin decimales: 18900 -> "$ 18.900"
export function formatCOP(value: number): string {
  const rounded = Math.round(value || 0);
  const withSeparators = rounded.toLocaleString('es-CO');
  return `$ ${withSeparators}`;
}

export default formatCOP;
