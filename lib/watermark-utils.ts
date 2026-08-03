export interface WatermarkMetadata {
  inspectionDate: string; // e.g. "02 Agustus 2026"
  inspectionTime: string; // e.g. "09:35:28 WIB"
  assignedLocation: string; // e.g. "Gudang Utama A"
  tabletCode: string; // e.g. "TAB-001"
  gpsCoords?: string | null; // e.g. "-6.914744, 107.609810"
  picName: string; // e.g. "Ahmad Rizky (PIC)"
  deviceModel?: string; // e.g. "Exproof (P9000)"
  capturedFrom?: "Camera" | "Gallery";
}

export interface WatermarkResult {
  file: File;
  blob: Blob;
  previewUrl: string;
  filename: string;
  metadata: WatermarkMetadata;
}

/**
 * Format Date to Indonesian long date string (e.g., "02 Agustus 2026")
 */
export function formatIndonesianDate(date: Date = new Date()): string {
  const months = [
    "Januari", "Februari", "Maret", "April", "Mei", "Juni",
    "Juli", "Agustus", "September", "Oktober", "November", "Desember"
  ];
  const day = String(date.getDate()).padStart(2, "0");
  const month = months[date.getMonth()];
  const year = date.getFullYear();
  return `${day} ${month} ${year}`;
}

/**
 * Format Time to WIB time string (e.g., "09:35:28 WIB")
 */
export function formatIndonesianTime(date: Date = new Date()): string {
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  const seconds = String(date.getSeconds()).padStart(2, "0");
  return `${hours}:${minutes}:${seconds} WIB`;
}

/**
 * Generate formatted filename: TAB-001_20260802_093528.jpg
 */
export function generatePhotoFilename(tabletCode: string, date: Date = new Date()): string {
  const cleanCode = tabletCode.replace(/[^a-zA-Z0-9_-]/g, "_");
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const dd = String(date.getDate()).padStart(2, "0");
  const hh = String(date.getHours()).padStart(2, "0");
  const min = String(date.getMinutes()).padStart(2, "0");
  const ss = String(date.getSeconds()).padStart(2, "0");
  return `${cleanCode}_${yyyy}${mm}${dd}_${hh}${min}${ss}.jpg`;
}

/**
 * Apply automatic glassmorphism inspection watermark on HTML5 Canvas
 */
export async function applyInspectionWatermark(
  imageSource: File | Blob | string,
  metadata: WatermarkMetadata
): Promise<WatermarkResult> {
  return new Promise((resolve, reject) => {
    const img = new Image();

    img.onload = () => {
      try {
        // 1. Calculate Target Canvas Dimensions (Max width 1600px)
        const MAX_WIDTH = 1600;
        let width = img.width;
        let height = img.height;

        if (width > MAX_WIDTH) {
          height = Math.round((height * MAX_WIDTH) / width);
          width = MAX_WIDTH;
        }

        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext("2d");
        if (!ctx) {
          reject(new Error("Gagal menginisialisasi Canvas Context 2D."));
          return;
        }

        // 2. Draw Base Image
        ctx.drawImage(img, 0, 0, width, height);

        // 3. Calculate Watermark Card Dimensions
        // Width: ~30-35% of image width, min 340px, max 520px
        const cardWidth = Math.max(340, Math.min(520, Math.round(width * 0.32)));
        const marginX = Math.round(width * 0.035);
        const marginY = Math.round(height * 0.035);

        // Calculate card height based on items to display
        const hasGps = Boolean(metadata.gpsCoords && metadata.gpsCoords.trim().length > 0);
        const fontBaseSize = Math.max(12, Math.round(cardWidth * 0.036));
        const lineHeight = Math.round(fontBaseSize * 1.55);
        const padding = Math.round(cardWidth * 0.055);

        // Lines count: Date, Time, Location, Tablet, [GPS], PIC + Divider + Branding Footer
        const textLinesCount = hasGps ? 6 : 5;
        const bodyHeight = textLinesCount * lineHeight;
        const footerHeight = Math.round(fontBaseSize * 3.4);
        const cardHeight = padding * 2 + bodyHeight + Math.round(lineHeight * 0.5) + footerHeight;

        const cardX = marginX;
        const cardY = height - marginY - cardHeight;
        const borderRadius = Math.max(16, Math.round(cardWidth * 0.06)); // ~24px rounded

        // 4. Draw Glassmorphism Card Background
        ctx.save();
        
        // Soft outer purple glow
        ctx.shadowColor = "rgba(46, 42, 123, 0.45)";
        ctx.shadowBlur = Math.round(cardWidth * 0.06);
        ctx.shadowOffsetX = 0;
        ctx.shadowOffsetY = Math.round(cardWidth * 0.02);

        // Rounded Rect Path
        ctx.beginPath();
        if (typeof ctx.roundRect === "function") {
          ctx.roundRect(cardX, cardY, cardWidth, cardHeight, borderRadius);
        } else {
          ctx.rect(cardX, cardY, cardWidth, cardHeight);
        }

        // Dark semi-transparent slate background
        const bgGradient = ctx.createLinearGradient(cardX, cardY, cardX + cardWidth, cardY + cardHeight);
        bgGradient.addColorStop(0, "rgba(15, 23, 42, 0.88)");
        bgGradient.addColorStop(1, "rgba(30, 27, 75, 0.85)");
        ctx.fillStyle = bgGradient;
        ctx.fill();

        // Thin white & purple border
        ctx.shadowColor = "transparent";
        ctx.lineWidth = Math.max(1.5, Math.round(cardWidth * 0.005));
        const borderGradient = ctx.createLinearGradient(cardX, cardY, cardX + cardWidth, cardY + cardHeight);
        borderGradient.addColorStop(0, "rgba(255, 255, 255, 0.35)");
        borderGradient.addColorStop(0.5, "rgba(99, 102, 241, 0.4)");
        borderGradient.addColorStop(1, "rgba(255, 255, 255, 0.15)");
        ctx.strokeStyle = borderGradient;
        ctx.stroke();

        ctx.restore();

        // 5. Render Text & Metadata inside Card
        ctx.save();
        const contentX = cardX + padding;
        let currentY = cardY + padding + fontBaseSize;

        ctx.font = `600 ${fontBaseSize}px 'Plus Jakarta Sans', 'Inter', sans-serif`;
        ctx.textBaseline = "middle";

        const items: { icon: string; text: string; highlight?: boolean }[] = [
          { icon: "📅", text: metadata.inspectionDate },
          { icon: "🕒", text: metadata.inspectionTime },
          { icon: "📍", text: metadata.assignedLocation },
          { icon: "📱", text: `${metadata.tabletCode}${metadata.deviceModel ? ` (${metadata.deviceModel})` : ""}`, highlight: true },
        ];

        if (hasGps) {
          items.push({ icon: "🌍", text: metadata.gpsCoords! });
        }

        items.push({ icon: "👤", text: metadata.picName });

        items.forEach((item) => {
          // Draw Emoji Icon
          ctx.font = `${fontBaseSize}px sans-serif`;
          ctx.fillStyle = "#FFFFFF";
          ctx.fillText(item.icon, contentX, currentY);

          // Draw Text Label
          ctx.font = item.highlight
            ? `800 ${fontBaseSize}px 'Plus Jakarta Sans', sans-serif`
            : `600 ${fontBaseSize}px 'Plus Jakarta Sans', sans-serif`;
          ctx.fillStyle = item.highlight ? "#818CF8" : "#F8FAFC";
          
          const iconSpacing = Math.round(fontBaseSize * 1.5);
          ctx.fillText(item.text, contentX + iconSpacing, currentY);

          currentY += lineHeight;
        });

        // 6. Draw Horizontal Divider Line
        currentY += Math.round(lineHeight * 0.1);
        ctx.beginPath();
        ctx.moveTo(contentX, currentY);
        ctx.lineTo(cardX + cardWidth - padding, currentY);
        ctx.strokeStyle = "rgba(255, 255, 255, 0.18)";
        ctx.lineWidth = 1;
        ctx.stroke();

        // 7. Draw Company Branding Footer
        currentY += Math.round(lineHeight * 0.65);
        const logoSize = Math.round(fontBaseSize * 2.1);
        const logoX = contentX;
        const logoY = currentY;

        // Draw Propan 3-Circle Symbol Icon
        drawPropanSymbolOnCanvas(ctx, logoX, logoY, logoSize, "#818CF8", "#0F172A");

        // Footer Text (Center)
        const textX = logoX + logoSize + Math.round(fontBaseSize * 0.6);
        ctx.font = `800 ${Math.round(fontBaseSize * 0.95)}px 'Plus Jakarta Sans', sans-serif`;
        ctx.fillStyle = "#FFFFFF";
        ctx.fillText("TabMonitor Inspection", textX, currentY - Math.round(fontBaseSize * 0.35));

        ctx.font = `500 ${Math.round(fontBaseSize * 0.75)}px 'Plus Jakarta Sans', sans-serif`;
        ctx.fillStyle = "#94A3B8";
        ctx.fillText("Bukti Dokumentasi Resmi", textX, currentY + Math.round(fontBaseSize * 0.55));

        // Right Badge: 🛡 Verified
        const badgeX = cardX + cardWidth - padding;
        ctx.font = `700 ${Math.round(fontBaseSize * 0.85)}px 'Plus Jakarta Sans', sans-serif`;
        ctx.fillStyle = "#34D399"; // Emerald green
        ctx.textAlign = "right";
        ctx.fillText("🛡 Verified", badgeX, currentY);

        ctx.restore();

        // 8. Export Canvas to JPEG Blob (90% Quality)
        canvas.toBlob(
          (blob) => {
            if (!blob) {
              reject(new Error("Gagal mengompresi foto hasil watermark."));
              return;
            }

            const now = new Date();
            const filename = generatePhotoFilename(metadata.tabletCode, now);
            const watermarkedFile = new File([blob], filename, { type: "image/jpeg" });
            const previewUrl = URL.createObjectURL(blob);

            resolve({
              file: watermarkedFile,
              blob,
              previewUrl,
              filename,
              metadata,
            });
          },
          "image/jpeg",
          0.90
        );
      } catch (err) {
        reject(err);
      }
    };

    img.onerror = () => reject(new Error("Gagal memuat gambar untuk proses watermark."));

    // Handle Input Source
    if (typeof imageSource === "string") {
      img.src = imageSource;
    } else {
      img.src = URL.createObjectURL(imageSource);
    }
  });
}

/**
 * Draw Propan 3-Circle Symbol onto Canvas Context
 */
function drawPropanSymbolOnCanvas(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  size: number,
  color: string,
  holeColor: string
) {
  ctx.save();
  const cx = x + size / 2;
  const cy = y;

  const rOuter = size * 0.23;
  const rInner = size * 0.08;
  const lw = Math.max(1, size * 0.035);

  const topC = { x: cx, y: cy - size * 0.22 };
  const botLC = { x: cx - size * 0.22, y: cy + size * 0.16 };
  const botRC = { x: cx + size * 0.22, y: cy + size * 0.16 };

  [topC, botLC, botRC].forEach((c) => {
    // Outer Circle
    ctx.beginPath();
    ctx.arc(c.x, c.y, rOuter, 0, Math.PI * 2);
    ctx.fillStyle = color;
    ctx.fill();

    // Inner Hole
    ctx.beginPath();
    ctx.arc(c.x, c.y, rInner, 0, Math.PI * 2);
    ctx.fillStyle = holeColor;
    ctx.fill();
  });

  // Top Circle Lines
  ctx.strokeStyle = holeColor;
  ctx.lineWidth = lw;

  ctx.beginPath();
  ctx.moveTo(topC.x, topC.y + rInner); ctx.lineTo(topC.x, topC.y + rOuter);
  ctx.moveTo(topC.x - rInner*0.7, topC.y + rInner*0.7); ctx.lineTo(topC.x - rOuter*0.7, topC.y + rOuter*0.7);
  ctx.moveTo(topC.x + rInner*0.7, topC.y + rInner*0.7); ctx.lineTo(topC.x + rOuter*0.7, topC.y + rOuter*0.7);
  ctx.stroke();

  // Bottom-Left Circle Lines
  ctx.beginPath();
  ctx.moveTo(botLC.x, botLC.y - rInner); ctx.lineTo(botLC.x, botLC.y - rOuter);
  ctx.moveTo(botLC.x + rInner*0.7, botLC.y + rInner*0.7); ctx.lineTo(botLC.x + rOuter*0.7, botLC.y + rOuter*0.7);
  ctx.moveTo(botLC.x + rInner*0.8, botLC.y - rInner*0.5); ctx.lineTo(botLC.x + rOuter*0.8, botLC.y - rOuter*0.5);
  ctx.stroke();

  // Bottom-Right Circle Lines
  ctx.beginPath();
  ctx.moveTo(botRC.x, botRC.y - rInner); ctx.lineTo(botRC.x, botRC.y - rOuter);
  ctx.moveTo(botRC.x - rInner*0.7, botRC.y + rInner*0.7); ctx.lineTo(botRC.x - rOuter*0.7, botRC.y + rOuter*0.7);
  ctx.moveTo(botRC.x - rInner*0.8, botRC.y - rInner*0.5); ctx.lineTo(botRC.x - rOuter*0.8, botRC.y - rOuter*0.5);
  ctx.stroke();

  ctx.restore();
}
