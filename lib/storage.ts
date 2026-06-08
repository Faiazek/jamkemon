// Uploading report photos to Supabase Storage.
//
// Phone photos are several megabytes — too heavy for Dhaka mobile data and the
// free Storage tier — so we downscale and re-encode to a modest JPEG in the
// browser BEFORE uploading. Requires the "report-photos" bucket (supabase/storage.sql).

import { supabase } from "./supabaseClient";
import { getReporterToken } from "./reports";

const BUCKET = "report-photos";
const MAX_DIM = 1280; // longest edge, px
const QUALITY = 0.7;

// Shrink a chosen image to at most MAX_DIM on its longest side and re-encode as
// JPEG. Falls back to the original file if anything goes wrong.
async function downscale(file: File): Promise<Blob> {
  try {
    const dataUrl: string = await new Promise((res, rej) => {
      const fr = new FileReader();
      fr.onload = () => res(fr.result as string);
      fr.onerror = rej;
      fr.readAsDataURL(file);
    });
    const img: HTMLImageElement = await new Promise((res, rej) => {
      const i = new Image();
      i.onload = () => res(i);
      i.onerror = rej;
      i.src = dataUrl;
    });
    let { width, height } = img;
    if (width > MAX_DIM || height > MAX_DIM) {
      const scale = MAX_DIM / Math.max(width, height);
      width = Math.round(width * scale);
      height = Math.round(height * scale);
    }
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    if (!ctx) return file;
    ctx.drawImage(img, 0, 0, width, height);
    const blob: Blob | null = await new Promise((res) =>
      canvas.toBlob(res, "image/jpeg", QUALITY)
    );
    return blob ?? file;
  } catch {
    return file;
  }
}

// Upload a photo and return its public URL, or null if it couldn't be saved.
export async function uploadReportPhoto(file: File): Promise<string | null> {
  if (!supabase) return null;
  try {
    const blob = await downscale(file);
    const path = `${getReporterToken()}/${crypto.randomUUID()}.jpg`;
    const { error } = await supabase.storage
      .from(BUCKET)
      .upload(path, blob, { contentType: "image/jpeg", upsert: false });
    if (error) {
      console.error("photo upload failed:", error);
      return null;
    }
    return supabase.storage.from(BUCKET).getPublicUrl(path).data.publicUrl;
  } catch (e) {
    console.error("photo processing failed:", e);
    return null;
  }
}
