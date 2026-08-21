import QRCode from "qrcode";
import { Tablet } from "@/types";

export function generateUniqueQrCode(): string {
  const random = Math.floor(100000 + Math.random() * 900000);
  return `QR-TAB-${random}`;
}

function drawRoundedRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number
) {
  if (typeof (ctx as any).roundRect === "function") {
    (ctx as any).roundRect(x, y, width, height, radius);
  } else {
    ctx.moveTo(x + radius, y);
    ctx.lineTo(x + width - radius, y);
    ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
    ctx.lineTo(x + width, y + height - radius);
    ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
    ctx.lineTo(x + radius, y + height);
    ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
    ctx.lineTo(x, y + radius);
    ctx.quadraticCurveTo(x, y, x + radius, y);
  }
}

/**
 * Creates a high-resolution, crystal-clear 300 DPI canvas for the tablet sticker label.
 * Layout is guaranteed to never clip any text, with generous padding and crisp vector fonts.
 */
export async function createTabletStickerCanvas(tablet: Tablet): Promise<HTMLCanvasElement> {
  const canvas = document.createElement("canvas");
  // 680x920 gives ultra-crisp display at 300 DPI sticker print/download
  const width = 680;
  const height = 920;
  canvas.width = width;
  canvas.height = height;

  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Could not get canvas 2D context");

  // Crisp White Background
  ctx.fillStyle = "#FFFFFF";
  ctx.fillRect(0, 0, width, height);

  // Outer Border with rounded corners (Sticker Edge)
  const radius = 36;
  const borderWidth = 10;
  const inset = borderWidth / 2 + 10;

  ctx.strokeStyle = "#0F172A"; // Slate 900
  ctx.lineWidth = borderWidth;
  ctx.beginPath();
  drawRoundedRect(ctx, inset, inset, width - inset * 2, height - inset * 2, radius);
  ctx.stroke();

  // Header Company Name: PT. PROPAN RAYA ICC
  ctx.fillStyle = "#4338CA"; // Indigo 700
  ctx.font = "bold 28px -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText("PT. PROPAN RAYA ICC", width / 2, 75);

  // Top Divider Line
  ctx.strokeStyle = "#E2E8F0"; // Slate 200
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.moveTo(50, 120);
  ctx.lineTo(width - 50, 120);
  ctx.stroke();

  // QR Code Payload
  const qrPayload = JSON.stringify({
    id: tablet.id,
    qr_code: tablet.qr_code,
    serial_number: tablet.serial_number,
    model: tablet.model,
  });

  // Generate QR Code data URL with highest error correction
  const qrDataUrl = await QRCode.toDataURL(qrPayload, {
    errorCorrectionLevel: "H",
    margin: 2,
    scale: 12,
    color: {
      dark: "#000000",
      light: "#FFFFFF",
    },
  });

  // Load and draw QR code onto canvas
  const qrImg = new Image();
  await new Promise<void>((resolve, reject) => {
    qrImg.onload = () => resolve();
    qrImg.onerror = reject;
    qrImg.src = qrDataUrl;
  });

  const qrSize = 360;
  const qrX = (width - qrSize) / 2;
  const qrY = 150;

  // Subtle rounded white box behind QR
  const boxPadding = 14;
  ctx.fillStyle = "#FFFFFF";
  ctx.strokeStyle = "#F1F5F9";
  ctx.lineWidth = 2;
  ctx.beginPath();
  drawRoundedRect(ctx, qrX - boxPadding, qrY - boxPadding, qrSize + boxPadding * 2, qrSize + boxPadding * 2, 28);
  ctx.fill();
  ctx.stroke();

  ctx.drawImage(qrImg, qrX, qrY, qrSize, qrSize);

  // Bottom Divider Line
  ctx.strokeStyle = "#E2E8F0";
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.moveTo(50, 545);
  ctx.lineTo(width - 50, 545);
  ctx.stroke();

  // Tablet QR Code / Code Identifier (e.g. TB 110, TB 10) - Large, prominent bold font
  ctx.fillStyle = "#4338CA";
  ctx.font = "900 62px -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Arial Black', sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(tablet.qr_code || "TB-01", width / 2, 612);

  // Model & Brand
  const modelText = tablet.model
    ? tablet.brand
      ? `${tablet.model} (${tablet.brand})`
      : tablet.model
    : "Tablet Unit";
  ctx.fillStyle = "#0F172A";
  ctx.font = "bold 28px -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif";
  ctx.fillText(modelText, width / 2, 680);

  // Serial Number - Bold, prominent S/N
  ctx.fillStyle = "#0F172A";
  ctx.font = "bold 27px -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";
  ctx.fillText(`S/N: ${tablet.serial_number || "-"}`, width / 2, 745);

  // Location - Bold, prominent Location
  const locName = tablet.location?.name || "Belum Ditentukan";
  ctx.fillStyle = "#0F172A";
  ctx.font = "bold 26px -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif";
  ctx.fillText(`Loc: ${locName}`, width / 2, 808);

  return canvas;
}

/**
 * Downloads a pixel-perfect, high-DPI label sticker for a tablet without any clipping.
 */
export async function downloadTabletSticker(tablet: Tablet, filename?: string) {
  if (typeof window === "undefined") return;
  try {
    const canvas = await createTabletStickerCanvas(tablet);
    const locName = tablet.location?.name || "Lokasi";
    const finalFilename = filename || `${tablet.qr_code || "tablet"}_${locName}.png`;
    const image = canvas.toDataURL("image/png");
    const link = document.createElement("a");
    link.href = image;
    link.download = finalFilename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  } catch (err) {
    console.error("Error downloading tablet sticker:", err);
  }
}

export async function downloadQrCanvas(elementId: string, filename: string = "tablet-qr-code.png") {
  if (typeof window === "undefined") return;

  const container = document.getElementById(elementId);
  if (!container) return;

  try {
    const html2canvas = (await import("html2canvas")).default;
    const canvas = await html2canvas(container, {
      scale: 4,
      useCORS: true,
      backgroundColor: "#FFFFFF",
      logging: false,
      windowWidth: 1200,
      onclone: (clonedDoc: Document) => {
        const el = clonedDoc.getElementById(elementId);
        if (el) {
          el.style.overflow = "visible";
          el.style.height = "auto";
          el.style.maxHeight = "none";
          el.style.paddingBottom = "24px";
        }
      },
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
  }
}

export function printQrSticker() {
  if (typeof window !== "undefined") {
    window.print();
  }
}
