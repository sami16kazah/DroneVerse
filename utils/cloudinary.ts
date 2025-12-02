export const getOptimizedImageUrl = (
  url: string,
  publicId: string,
  width: number = 200,
  height: number = 200,
  quality: "best" | "good" | "eco" | "low" | "auto" = "auto"
) => {
  const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
  if (!cloudName || !publicId) return url;

  // If it's already a cloudinary URL, we can construct the optimized version
  // Standard format: https://res.cloudinary.com/<cloud_name>/image/upload/<transformations>/<public_id>
  
  const qualityParam = quality === "auto" ? "q_auto" : `q_auto:${quality}`;
  
  return `https://res.cloudinary.com/${cloudName}/image/upload/c_fill,w_${width},h_${height},f_auto,${qualityParam}/${publicId}`;
};
