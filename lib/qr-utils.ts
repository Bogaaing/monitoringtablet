export function generateUniqueQrCode(): string {
  const random = Math.floor(100000 + Math.random() * 900000);
  return `QR-TAB-${random}`;
}

export async function downloadQrCanvas(elementId: string, filename: string = "tablet-qr-code.png") {
  if (typeof window === "undefined") return;

  const container = document.getElementById(elementId);
  if (!container) return;

  try {
    const html2canvas = (await import("html2canvas")).default;
    const canvas = await html2canvas(container, {
      scale: 3,
      useCORS: true,
      backgroundColor: "#FFFFFF",
    } as any);
    const image = canvas.toDataURL("image/png");
    const link = document.createElement("a");
    link.href = image;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    return;
  } catch (err) {
    console.warn("html2canvas fallback:", err);
  }

  const canvas = container.querySelector("canvas");
  if (canvas) {
    const image = canvas.toDataURL("image/png");
    const link = document.createElement("a");
    link.href = image;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  } else {
    // If rendered as SVG
    const svg = container.querySelector("svg");
    if (!svg) return;

    const xml = new XMLSerializer().serializeToString(svg);
    const svg64 = btoa(unescape(encodeURIComponent(xml)));
    const image64 = `data:image/svg+xml;base64,${svg64}`;

    const img = new Image();
    img.onload = () => {
      const canvasEl = document.createElement("canvas");
      canvasEl.width = svg.clientWidth || 300;
      canvasEl.height = svg.clientHeight || 300;
      const ctx = canvasEl.getContext("2d");
      if (ctx) {
        ctx.fillStyle = "#FFFFFF";
        ctx.fillRect(0, 0, canvasEl.width, canvasEl.height);
        ctx.drawImage(img, 0, 0);
        const pngUrl = canvasEl.toDataURL("image/png");
        const link = document.createElement("a");
        link.href = pngUrl;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }
    };
    img.src = image64;
  }
}

export function printQrSticker() {
  if (typeof window !== "undefined") {
    window.print();
  }
}
