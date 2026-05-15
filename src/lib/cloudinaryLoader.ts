const CLOUDINARY_CLOUD_NAME = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || "glamo-nepal";

export function cloudinaryLoader({
  src,
  width,
  quality,
}: {
  src: string;
  width: number;
  quality?: number;
}): string {
  if (src.startsWith("http")) return src;
  const params = ["f_auto", "c_limit", `w_${width}`, `q_${quality || "auto"}`];
  return `https://res.cloudinary.com/${CLOUDINARY_CLOUD_NAME}/image/upload/${params.join(",")}${src}`;
}