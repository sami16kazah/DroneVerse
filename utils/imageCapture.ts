import { Annotation } from "../components/ZoomableImage";

export const captureImageWithAnnotations = async (
  imageUrl: string,
  annotations: Annotation[],
  filters: string
): Promise<Blob | null> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.src = imageUrl;

    img.onload = () => {
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");

      if (!ctx) {
        reject(new Error("Could not get canvas context"));
        return;
      }

      // Set canvas size to image natural size
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;

      // Apply filters
      ctx.filter = filters;

      // Draw image
      ctx.drawImage(img, 0, 0);

      // Reset filter for annotations (we don't want to blur/grayscale the annotations)
      ctx.filter = "none";

      // Draw Annotations
      annotations.forEach((ann) => {
        drawAnnotation(ctx, ann, canvas.width, canvas.height);
      });

      // Convert to Blob
      canvas.toBlob((blob) => {
        if (blob) {
          resolve(blob);
        } else {
          reject(new Error("Canvas to Blob failed"));
        }
      }, "image/jpeg", 0.9);
    };

    img.onerror = (err) => {
      reject(err);
    };
  });
};

const drawAnnotation = (
  ctx: CanvasRenderingContext2D,
  ann: Annotation,
  width: number,
  height: number
) => {
  const { type, points, color, crackLevel } = ann;

  if (points.length < 2) return;

  // Convert % points to pixels
  const pixelPoints = points.map((p) => [
    (p[0] / 100) * width,
    (p[1] / 100) * height,
  ]);

  ctx.save();
  ctx.beginPath();

  if (type === "square") {
    const [p1, p2] = pixelPoints;
    const x = Math.min(p1[0], p2[0]);
    const y = Math.min(p1[1], p2[1]);
    const w = Math.abs(p1[0] - p2[0]);
    const h = Math.abs(p1[1] - p2[1]);
    ctx.rect(x, y, w, h);
  } else {
    // Polygon
    ctx.moveTo(pixelPoints[0][0], pixelPoints[0][1]);
    for (let i = 1; i < pixelPoints.length; i++) {
      ctx.lineTo(pixelPoints[i][0], pixelPoints[i][1]);
    }
    ctx.closePath();
  }

  // Fill
  ctx.fillStyle = color;
  ctx.fill();

  // Stroke
  ctx.strokeStyle = "orange";
  ctx.lineWidth = Math.max(2, width * 0.002); // Scale stroke with image size
  ctx.stroke();
  ctx.restore();

  // Crack Level Indicator
  if (crackLevel) {
    const minX = Math.min(...pixelPoints.map((p) => p[0]));
    const minY = Math.min(...pixelPoints.map((p) => p[1]));
    
    // Size: 3% of width, similar to component
    const size = width * 0.03;
    const x = minX - size - (width * 0.005); // Offset
    const y = minY;

    // Draw Red Square
    ctx.save();
    ctx.fillStyle = "red";
    ctx.strokeStyle = "white";
    ctx.lineWidth = width * 0.002;
    
    // Rounded rect helper (simple version)
    const r = size * 0.1;
    ctx.beginPath();
    ctx.roundRect(x, y, size, size, r);
    ctx.fill();
    ctx.stroke();

    // Draw Number
    ctx.fillStyle = "white";
    ctx.font = `bold ${size * 0.6}px Arial`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(crackLevel.toString(), x + size / 2, y + size / 2);
    
    ctx.restore();
  }
};
