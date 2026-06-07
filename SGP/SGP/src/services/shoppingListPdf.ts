import { jsPDF } from 'jspdf';
import type { Ingredient } from '../types';

const GROUP_LABEL: Record<string, string> = {
  frutas: 'Frutas', verduras: 'Verduras', legumbres: 'Legumbres', carnes: 'Carnes',
  lacteos: 'Lácteos', bebidas: 'Bebidas', abarrotes: 'Abarrotes',
};

// Genera la lista de mandado del día siguiente: ingredientes por debajo del
// umbral, con cantidad sugerida (capacity - stock), logo Ventum y casillas
// de check para que el comprador marque a medida que adquiere.
export function generateShoppingListPdf(ingredients: Ingredient[], thresholdPct = 0.3) {
  const doc = new jsPDF({ unit: 'pt', format: 'a4' });
  const W = doc.internal.pageSize.getWidth();
  const margin = 40;
  let y = 50;

  // ---- Logo Ventum (dibujado) ----
  doc.setFillColor(107, 15, 30); // #6b0f1e
  doc.roundedRect(margin, y - 18, 34, 34, 8, 8, 'F');
  doc.setTextColor(243, 236, 236);
  doc.setFont('times', 'italic');
  doc.setFontSize(22);
  doc.text('V', margin + 11, y + 6);
  doc.setTextColor(107, 15, 30);
  doc.setFont('times', 'normal');
  doc.setFontSize(26);
  doc.text('Ventum', margin + 46, y + 6);

  // ---- Título ----
  y += 44;
  doc.setTextColor(40, 20, 26);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(15);
  doc.text('Lista de Mandado', margin, y);

  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(120, 90, 95);
  doc.text(`Para: ${tomorrow.toLocaleDateString('es-CO', { weekday: 'long', day: 'numeric', month: 'long' })}`, margin, y + 16);
  doc.text(`Generado: ${new Date().toLocaleString('es-CO')}`, W - margin, y + 16, { align: 'right' });

  y += 38;
  doc.setDrawColor(215, 177, 184);
  doc.line(margin, y, W - margin, y);
  y += 10;

  // ---- Filtrar bajo umbral ----
  const low = ingredients
    .filter((i) => i.stock / i.capacity < thresholdPct)
    .sort((a, b) => a.group.localeCompare(b.group) || a.name.localeCompare(b.name));

  if (low.length === 0) {
    doc.setTextColor(60, 60, 60);
    doc.setFontSize(11);
    doc.text('Todo el inventario está por encima del umbral. ¡No hay compras urgentes! 🎉', margin, y + 20);
  } else {
    let currentGroup = '';
    low.forEach((ing) => {
      if (y > 760) {
        doc.addPage();
        y = 50;
      }
      if (ing.group !== currentGroup) {
        currentGroup = ing.group;
        y += 14;
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(11);
        doc.setTextColor(107, 15, 30);
        doc.text(GROUP_LABEL[ing.group] ?? ing.group, margin, y);
        y += 6;
      }
      y += 18;
      // Casilla de check
      doc.setDrawColor(120, 90, 95);
      doc.setLineWidth(1);
      doc.rect(margin + 6, y - 9, 11, 11);
      // Nombre + faltante
      const faltante = Math.max(0, ing.capacity - ing.stock);
      const pct = Math.round((ing.stock / ing.capacity) * 100);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10.5);
      doc.setTextColor(40, 30, 32);
      doc.text(ing.name, margin + 28, y);
      doc.setTextColor(140, 100, 105);
      doc.text(`Comprar ~ ${faltante} ${ing.unit}  ·  nivel actual ${pct}%`, W - margin, y, { align: 'right' });
    });
  }

  // ---- Pie ----
  doc.setFont('helvetica', 'italic');
  doc.setFontSize(8.5);
  doc.setTextColor(150, 120, 125);
  doc.text('Ventum · Generado automáticamente por el módulo de inventario inteligente.', margin, 812);

  const dateStr = new Date().toISOString().slice(0, 10);
  doc.save(`Ventum_Lista_de_Mandado_${dateStr}.pdf`);
}
