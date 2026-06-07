import QRCode from 'qrcode';

// Genera el dataURL de un QR real que apunta al acceso de la mesa.
// Al escanearlo, el cliente cae en la landing de la mesa -> menú de compra.
export async function generateTableQrDataUrl(slug: string, tableId: string): Promise<string> {
  const origin = typeof window !== 'undefined' ? window.location.origin : 'https://ventum.app';
  const url = `${origin}/s/${slug}/t/${tableId}`;
  return QRCode.toDataURL(url, {
    width: 360,
    margin: 1,
    color: { dark: '#6b0f1e', light: '#f3ecec' },
    errorCorrectionLevel: 'M',
  });
}

export function tableQrTargetUrl(slug: string, tableId: string): string {
  const origin = typeof window !== 'undefined' ? window.location.origin : 'https://ventum.app';
  return `${origin}/s/${slug}/t/${tableId}`;
}
