// ── Share card generation ───────────────────────────────────

/**
 * Capture the garden container as a PNG blob.
 * Finds the <canvas> element inside and exports it directly,
 * since html2canvas cannot capture 2D/WebGL canvas content.
 */
export async function generateShareCard(
  element: HTMLElement,
  gardenName: string,
): Promise<Blob> {
  // Find the actual canvas element rendered by GardenCanvas
  const sourceCanvas = element.querySelector('canvas');
  if (!sourceCanvas) throw new Error('No canvas element found in garden container');

  // Create a high-res output canvas with a nice frame
  const pad = 40;
  const footerH = 56;
  const outW = sourceCanvas.width + pad * 2;
  const outH = sourceCanvas.height + pad * 2 + footerH;

  const out = document.createElement('canvas');
  out.width = outW;
  out.height = outH;
  const ctx = out.getContext('2d')!;

  // Background
  ctx.fillStyle = '#F5F0E8';
  ctx.fillRect(0, 0, outW, outH);

  // Draw the garden canvas content
  ctx.drawImage(sourceCanvas, pad, pad);

  // Subtle border around the garden
  ctx.strokeStyle = 'rgba(61, 47, 36, 0.1)';
  ctx.lineWidth = 2;
  ctx.roundRect(pad - 1, pad - 1, sourceCanvas.width + 2, sourceCanvas.height + 2, 12);
  ctx.stroke();

  // Footer text
  ctx.fillStyle = 'rgba(61, 47, 36, 0.5)';
  ctx.font = '600 20px "Nunito", sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(`${gardenName} — grown in bloom`, outW / 2, outH - 18);

  return new Promise((resolve) => {
    out.toBlob((blob) => {
      resolve(blob!);
    }, 'image/png');
  });
}

/**
 * Download a blob as a file.
 */
export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Share via Web Share API (mobile) or fall back to download.
 */
export async function shareOrDownload(blob: Blob, gardenName: string) {
  const file = new File([blob], `${gardenName}-bloom.png`, { type: 'image/png' });

  if (navigator.share && navigator.canShare?.({ files: [file] })) {
    try {
      await navigator.share({
        title: `${gardenName} - grown in bloom`,
        files: [file],
      });
      return;
    } catch {
      // User cancelled or share failed — fall back
    }
  }

  downloadBlob(blob, `${gardenName}-bloom.png`);
}
