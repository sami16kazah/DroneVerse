import { Annotation } from "../components/ZoomableImage";

export const processImageWithAnnotations = async (
  imageUrl: string,
  annotations: Annotation[],
  filters?: {
    brightness: number;
    contrast: number;
    saturate: number;
    blur: number;
    grayscale: number;
    hueRotate: number;
  }
): Promise<Blob | null> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous"; // Important for Cloudinary
    img.src = imageUrl;

    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      const ctx = canvas.getContext("2d");

      if (!ctx) {
        reject(new Error("Could not get canvas context"));
        return;
      }

      // 1. Apply Filters
      if (filters) {
        ctx.filter = `brightness(${filters.brightness}%) contrast(${filters.contrast}%) saturate(${filters.saturate}%) blur(${filters.blur}px) grayscale(${filters.grayscale}%) hue-rotate(${filters.hueRotate}deg)`;
      }

      // 2. Draw Image
      ctx.drawImage(img, 0, 0);
      ctx.filter = "none"; // Reset filter for annotations

      // 3. Draw Annotations
      annotations.forEach((ann) => {
        const { type, points, color, crackLevel } = ann;

        ctx.beginPath();
        ctx.lineWidth = 5; // Thicker line for high-res output
        ctx.strokeStyle = "orange";
        ctx.fillStyle = "rgba(128, 128, 128, 0.5)";

        if (type === "square") {
          if (points.length < 2) return;
          const [p1, p2] = points;
          // Convert % to px
          const x = (Math.min(p1[0], p2[0]) / 100) * canvas.width;
          const y = (Math.min(p1[1], p2[1]) / 100) * canvas.height;
          const w = (Math.abs(p1[0] - p2[0]) / 100) * canvas.width;
          const h = (Math.abs(p1[1] - p2[1]) / 100) * canvas.height;

          ctx.rect(x, y, w, h);
        } else {
          // Polygon
          if (points.length < 2) return;
          const start = points[0];
          ctx.moveTo((start[0] / 100) * canvas.width, (start[1] / 100) * canvas.height);
          for (let i = 1; i < points.length; i++) {
            const p = points[i];
            ctx.lineTo((p[0] / 100) * canvas.width, (p[1] / 100) * canvas.height);
          }
          ctx.closePath();
        }

        ctx.fill();
        ctx.stroke();

        // 4. Draw Crack Level Indicator
        if (crackLevel) {
          // Calculate position (Top-Right of bounding box)
          const xs = points.map((p) => (p[0] / 100) * canvas.width);
          const ys = points.map((p) => (p[1] / 100) * canvas.height);
          const maxX = Math.max(...xs);
          const minY = Math.min(...ys);

          const squareSize = canvas.width * 0.015; // 1.5% of width
          const gap = squareSize * 0.2;
          const startX = maxX;
          const startY = minY - squareSize * 1.5; // Slightly above

          ctx.font = `bold ${squareSize * 0.6}px Arial`;
          ctx.textAlign = "center";
          ctx.textBaseline = "middle";

          for (let i = 1; i <= 5; i++) {
            const bx = startX + (i - 1) * (squareSize + gap);
            const by = startY;

            ctx.fillStyle = i <= crackLevel ? "red" : "gray";
            ctx.strokeStyle = "white";
            ctx.lineWidth = 2;
            
            ctx.fillRect(bx, by, squareSize, squareSize);
            ctx.strokeRect(bx, by, squareSize, squareSize);

            ctx.fillStyle = "white";
            ctx.fillText(i.toString(), bx + squareSize / 2, by + squareSize / 2);
          }
        }
      });

      // 5. Export
      canvas.toBlob((blob) => {
        if (blob) resolve(blob);
        else reject(new Error("Canvas to Blob failed"));
      }, "image/jpeg", 0.9);
    };

    img.onerror = (err) => reject(err);
  });
};
