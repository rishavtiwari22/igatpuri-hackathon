import ssim from "ssim.js";
import resemble from "resemblejs";

/**
 * Compare two images using MS-SSIM (structure) and Resemble.js (visual diff).
 * @param {string} img1 - URL or base64 string of the first image
 * @param {string} img2 - URL or base64 string of the second image
 * @returns {Promise<{ mssim: number, diffUrl: string }>}
 */
export async function hybridCompare(img1, img2) {
  // helper: load an image into ImageData for ssim.js
  const loadImageData = (src) =>
    new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.onload = () => {
        const canvas = document.createElement("canvas");
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0);
        resolve(ctx.getImageData(0, 0, img.width, img.height));
      };
      img.onerror = reject;
      img.src = src;
    });

  // 1. Structural similarity via ssim.js
  const [data1, data2] = await Promise.all([
    loadImageData(img1),
    loadImageData(img2),
  ]);
  const result = await ssim(data1, data2);

  // 2. Visual diff via resemble.js
  const diffUrl = await new Promise((resolve) => {
    resemble(img1)
      .compareTo(img2)
      .ignoreColors() // removes color influence; drop this line to include color diffs
      .onComplete((data) => {
        resolve(data.getImageDataUrl());
      });
  });

  return { mssim: result.mssim, diffUrl };
}
