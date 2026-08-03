export interface WatermarkMetadata {
  inspectionDate: string; // e.g. "02 Agustus 2026"
  inspectionTime: string; // e.g. "09:35:28 WIB"
  assignedLocation: string; // e.g. "Gudang Utama A"
  tabletCode: string; // e.g. "TB-04" or "TAB-001"
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
 * Apply refined glassmorphism inspection watermark on HTML5 Canvas
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

        // 3. Responsive Scaling Ratio relative to 1000px base width
        const scale = Math.max(0.75, Math.min(1.6, width / 1000));

        // Target Card Size: Width ~280–300px (scaled), Max 28% of image width
        const targetWidthPx = 320 * scale;
        const maxAllowedWidth = width * 0.32;
        const cardWidth = Math.round(Math.min(targetWidthPx, maxAllowedWidth));

        // Safe Margins: Left 24px, Bottom 24px (scaled)
        const marginX = Math.round(24 * scale);
        const marginY = Math.round(24 * scale);

        // Spacing & Sizes
        const padding = Math.round(16 * scale);
        const rowGap = Math.round(8 * scale);
        const iconSize = Math.round(14 * scale);

        // Font Sizes: Header 14px, Body 13px, Footer 12px
        const fontHeaderSize = Math.round(14 * scale);
        const fontBodySize = Math.round(13 * scale);
        const fontFooterSize = Math.round(12 * scale);

        // Calculate Rows
        const hasGps = Boolean(metadata.gpsCoords && metadata.gpsCoords.trim().length > 0);
        const textRowsCount = hasGps ? 6 : 5;

        const rowHeight = Math.round(fontBodySize * 1.5);
        const bodyHeight = textRowsCount * rowHeight + (textRowsCount - 1) * (rowGap * 0.3);
        const logoHeight = Math.round(30 * scale); // 28-32px
        const footerHeight = Math.max(logoHeight, Math.round(fontHeaderSize * 2.2));
        const dividerGap = Math.round(10 * scale);

        const cardHeight = padding * 2 + bodyHeight + dividerGap * 2 + 1 + footerHeight;
        const cardX = marginX;
        const cardY = height - marginY - cardHeight;
        const borderRadius = Math.round(18 * scale); // 18px radius

        // 4. Draw Glassmorphism Card Background
        ctx.save();

        // Shadow: 0 8px 24px rgba(0,0,0,.28)
        ctx.shadowColor = "rgba(0, 0, 0, 0.35)";
        ctx.shadowBlur = Math.round(24 * scale);
        ctx.shadowOffsetX = 0;
        ctx.shadowOffsetY = Math.round(8 * scale);

        // Rounded Rect Path
        ctx.beginPath();
        if (typeof ctx.roundRect === "function") {
          ctx.roundRect(cardX, cardY, cardWidth, cardHeight, borderRadius);
        } else {
          ctx.rect(cardX, cardY, cardWidth, cardHeight);
        }

        // Glassmorphism Fill: rgba(16,18,35,0.72)
        ctx.fillStyle = "rgba(16, 18, 35, 0.75)";
        ctx.fill();

        // Border: 1px solid rgba(255,255,255,0.18)
        ctx.shadowColor = "transparent";
        ctx.lineWidth = Math.max(1, Math.round(1 * scale));
        ctx.strokeStyle = "rgba(255, 255, 255, 0.22)";
        ctx.stroke();

        ctx.restore();

        // 5. Render Hierarchy Text inside Card
        ctx.save();
        const contentX = cardX + padding;
        let currentY = cardY + padding + fontBodySize * 0.7;

        ctx.textBaseline = "middle";

        const infoItems: {
          iconType: string;
          label: string;
          isTabletCode?: boolean;
          subLabel?: string;
        }[] = [
          { iconType: "date", label: metadata.inspectionDate },
          { iconType: "time", label: metadata.inspectionTime },
          { iconType: "location", label: metadata.assignedLocation },
          {
            iconType: "tablet",
            label: metadata.tabletCode,
            isTabletCode: true,
            subLabel: metadata.deviceModel ? ` ${metadata.deviceModel}` : "",
          },
          { iconType: "user", label: metadata.picName },
        ];

        if (hasGps) {
          infoItems.push({ iconType: "gps", label: metadata.gpsCoords! });
        }

        infoItems.forEach((item) => {
          // Draw Outline Icon (14px)
          drawLucideOutlineIcon(
            ctx,
            item.iconType,
            contentX,
            currentY,
            iconSize,
            "rgba(255, 255, 255, 0.85)"
          );

          const textStartX = contentX + iconSize + Math.round(10 * scale);

          if (item.isTabletCode) {
            // Tablet Code: Visually Stronger (Bold, #5B4CF6 Primary Purple Accent)
            ctx.font = `800 ${fontHeaderSize}px 'Inter', 'Plus Jakarta Sans', sans-serif`;
            ctx.fillStyle = "#5B4CF6"; // Primary Purple Accent
            ctx.fillText(item.label, textStartX, currentY);

            const tabletCodeWidth = ctx.measureText(item.label).width;

            if (item.subLabel) {
              ctx.font = `500 ${fontBodySize}px 'Inter', 'Plus Jakarta Sans', sans-serif`;
              ctx.fillStyle = "rgba(255, 255, 255, 0.78)";
              ctx.fillText(item.subLabel, textStartX + tabletCodeWidth + Math.round(4 * scale), currentY);
            }
          } else {
            // Body Item Text: rgba(255,255,255,.78), Weight 500
            ctx.font = `500 ${fontBodySize}px 'Inter', 'Plus Jakarta Sans', sans-serif`;
            ctx.fillStyle = "rgba(255, 255, 255, 0.88)";
            ctx.fillText(item.label, textStartX, currentY);
          }

          currentY += rowHeight + Math.round(rowGap * 0.2);
        });

        // 6. Draw Divider Line (1px rgba(255,255,255,.12))
        currentY += Math.round(4 * scale);
        ctx.beginPath();
        ctx.moveTo(contentX, currentY);
        ctx.lineTo(cardX + cardWidth - padding, currentY);
        ctx.strokeStyle = "rgba(255, 255, 255, 0.14)";
        ctx.lineWidth = 1;
        ctx.stroke();

        // 7. Draw Branding Footer (Logo height 28–32px)
        currentY += Math.round(dividerGap * 0.8) + Math.round(logoHeight / 2);
        const logoX = contentX;
        const logoY = currentY - Math.round(logoHeight / 2);

        // Draw Official Propan Emblem Logo (Height 28-32px)
        drawPropanOfficialEmblem(ctx, logoX, logoY, logoHeight, "#5B4CF6", "#FFFFFF");

        // Footer Branding Text (Next to logo)
        const brandTextX = logoX + logoHeight + Math.round(10 * scale);
        ctx.font = `600 ${fontHeaderSize}px 'Inter', 'Plus Jakarta Sans', sans-serif`;
        ctx.fillStyle = "#FFFFFF";
        ctx.fillText("PT. PROPAN RAYA ICC", brandTextX, currentY - Math.round(fontFooterSize * 0.45));

        ctx.font = `500 ${fontFooterSize}px 'Inter', 'Plus Jakarta Sans', sans-serif`;
        ctx.fillStyle = "rgba(255, 255, 255, 0.72)";
        ctx.fillText("Inspection Documentation", brandTextX, currentY + Math.round(fontFooterSize * 0.55));

        // Right Side Badge: Green Verified Shield Icon + Text "Verified" (#22C55E)
        const badgeRightX = cardX + cardWidth - padding;
        const shieldSize = Math.round(14 * scale);

        ctx.font = `600 ${fontFooterSize}px 'Inter', 'Plus Jakarta Sans', sans-serif`;
        ctx.fillStyle = "#22C55E";
        ctx.textAlign = "right";
        ctx.fillText("Verified", badgeRightX, currentY);

        const textWidth = ctx.measureText("Verified").width;
        const shieldX = badgeRightX - textWidth - Math.round(18 * scale);

        drawShieldIcon(ctx, shieldX, currentY, shieldSize, "#22C55E");

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
 * Draw Lucide-style Outline Icons on Canvas
 */
function drawLucideOutlineIcon(
  ctx: CanvasRenderingContext2D,
  type: string,
  x: number,
  y: number,
  size: number,
  color: string
) {
  ctx.save();
  ctx.strokeStyle = color;
  ctx.fillStyle = color;
  ctx.lineWidth = Math.max(1.3, size * 0.1);
  ctx.lineCap = "round";
  ctx.lineJoin = "round";

  const half = size / 2;
  const cx = x + half;
  const cy = y;

  if (type === "date") {
    // Calendar Icon
    ctx.beginPath();
    ctx.rect(cx - half * 0.7, cy - half * 0.55, size * 0.7, size * 0.65);
    ctx.moveTo(cx - half * 0.7, cy - half * 0.15);
    ctx.lineTo(cx + half * 0.7, cy - half * 0.15);
    ctx.moveTo(cx - half * 0.35, cy - half * 0.75);
    ctx.lineTo(cx - half * 0.35, cy - half * 0.55);
    ctx.moveTo(cx + half * 0.35, cy - half * 0.75);
    ctx.lineTo(cx + half * 0.35, cy - half * 0.55);
    ctx.stroke();
  } else if (type === "time") {
    // Clock Icon
    ctx.beginPath();
    ctx.arc(cx, cy, half * 0.75, 0, Math.PI * 2);
    ctx.moveTo(cx, cy);
    ctx.lineTo(cx, cy - half * 0.4);
    ctx.moveTo(cx, cy);
    ctx.lineTo(cx + half * 0.35, cy);
    ctx.stroke();
  } else if (type === "location") {
    // Map Pin Icon
    ctx.beginPath();
    ctx.arc(cx, cy - half * 0.2, half * 0.45, 0, Math.PI * 2);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(cx - half * 0.45, cy - half * 0.15);
    ctx.quadraticCurveTo(cx, cy + half * 0.75, cx, cy + half * 0.75);
    ctx.quadraticCurveTo(cx, cy + half * 0.75, cx + half * 0.45, cy - half * 0.15);
    ctx.stroke();
  } else if (type === "tablet") {
    // Smartphone / Tablet Icon
    ctx.beginPath();
    ctx.rect(cx - half * 0.45, cy - half * 0.7, size * 0.45, size * 0.7);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(cx, cy + half * 0.45, Math.max(1, size * 0.05), 0, Math.PI * 2);
    ctx.fill();
  } else if (type === "user") {
    // User Icon
    ctx.beginPath();
    ctx.arc(cx, cy - half * 0.35, half * 0.35, 0, Math.PI * 2);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(cx, cy + half * 0.65, half * 0.55, Math.PI, 0);
    ctx.stroke();
  } else if (type === "gps") {
    // Globe / GPS Icon
    ctx.beginPath();
    ctx.arc(cx, cy, half * 0.75, 0, Math.PI * 2);
    ctx.moveTo(cx - half * 0.75, cy); ctx.lineTo(cx + half * 0.75, cy);
    ctx.moveTo(cx, cy - half * 0.75); ctx.lineTo(cx, cy + half * 0.75);
    ctx.stroke();
  }
  ctx.restore();
}

/**
 * Draw Green Verified Shield Icon on Canvas Context
 */
function drawShieldIcon(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  size: number,
  color: string
) {
  ctx.save();
  ctx.strokeStyle = color;
  ctx.fillStyle = color;
  ctx.lineWidth = Math.max(1.4, size * 0.12);
  ctx.lineCap = "round";
  ctx.lineJoin = "round";

  const half = size / 2;
  const cx = x + half;
  const cy = y;

  // Shield Path
  ctx.beginPath();
  ctx.moveTo(cx, cy - half * 0.75);
  ctx.lineTo(cx + half * 0.65, cy - half * 0.5);
  ctx.quadraticCurveTo(cx + half * 0.65, cy + half * 0.3, cx, cy + half * 0.8);
  ctx.quadraticCurveTo(cx - half * 0.65, cy + half * 0.3, cx - half * 0.65, cy - half * 0.5);
  ctx.closePath();
  ctx.stroke();

  // Checkmark inside shield
  ctx.beginPath();
  ctx.moveTo(cx - half * 0.3, cy - half * 0.05);
  ctx.lineTo(cx - half * 0.05, cy + half * 0.2);
  ctx.lineTo(cx + half * 0.35, cy - half * 0.25);
  ctx.stroke();

  ctx.restore();
}

/**
 * Draw Official Propan 3-Circle Symbol Icon
 */
function drawPropanOfficialEmblem(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  height: number,
  color: string,
  holeColor: string
) {
  ctx.save();
  const size = height;
  const cx = x + size / 2;
  const cy = y + size / 2;

  const rOuter = size * 0.23;
  const rInner = size * 0.08;
  const lw = Math.max(1, size * 0.04);

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

  // Lines
  ctx.strokeStyle = holeColor;
  ctx.lineWidth = lw;

  // Top Circle Lines
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
