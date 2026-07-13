import type { Area } from "react-easy-crop";

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("Could not load the image."));
    img.src = src;
  });
}

// Draw the selected area of the source image onto a canvas at the output
// size and encode it as a JPEG blob. Downscaling here keeps phone-camera
// originals out of storage.
export async function renderCroppedImage(
  imageSrc: string,
  cropAreaPixels: Area,
  outputWidth: number,
  outputHeight: number
): Promise<Blob> {
  const image = await loadImage(imageSrc);

  const canvas = document.createElement("canvas");
  canvas.width = outputWidth;
  canvas.height = outputHeight;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Image cropping is not supported in this browser.");

  // JPEG has no alpha channel — fill white so transparent PNGs don't go black.
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, outputWidth, outputHeight);
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(
    image,
    cropAreaPixels.x,
    cropAreaPixels.y,
    cropAreaPixels.width,
    cropAreaPixels.height,
    0,
    0,
    outputWidth,
    outputHeight
  );

  return await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (blob) =>
        blob ? resolve(blob) : reject(new Error("Could not process the image.")),
      "image/jpeg",
      0.85
    );
  });
}
