import React from 'react';
import type { Ingredient } from '../../../types';

// Lógica de color: >30% verde, 10–30% amarillo, >0–10% rojo, 0% gris.
export function supplyColor(pct: number): { bar: string; text: string; label: string } {
  if (pct <= 0) return { bar: 'bg-neutral-400', text: 'text-neutral-400', label: 'Agotado' };
  if (pct <= 10) return { bar: 'bg-red-500', text: 'text-red-500', label: 'Crítico' };
  if (pct <= 30) return { bar: 'bg-yellow-400', text: 'text-yellow-500', label: 'Bajo' };
  return { bar: 'bg-emerald-500', text: 'text-emerald-500', label: 'Óptimo' };
}

export const SupplyBar: React.FC<{ ingredient: Ingredient }> = ({ ingredient }) => {
  const pct = Math.round((ingredient.stock / ingredient.capacity) * 100);
  const c = supplyColor(pct);

  return (
    <div className="flex items-center gap-3 py-2">
      <div className="min-w-0 flex-1">
        <div className="flex justify-between items-baseline mb-1">
          <span className="text-xs font-semibold text-brand-50 truncate">{ingredient.name}</span>
          <span className={`text-[11px] font-bold ${c.text} shrink-0 ml-2`}>{pct}%</span>
        </div>
        <div className="h-2 rounded-full bg-ink-950/60 overflow-hidden">
          <div
            className={`h-full rounded-full ${c.bar} transition-all duration-500`}
            style={{ width: `${Math.max(pct, pct > 0 ? 3 : 0)}%` }}
          />
        </div>
      </div>
      <span className="text-[10px] text-brand-300/70 w-16 text-right shrink-0">
        {ingredient.stock} {ingredient.unit}
      </span>
    </div>
  );
};

export default SupplyBar;
