import { getDownloadURL, ref } from "firebase/storage";
import { storage } from "../firebase/firebase";

export function normalizeImageUrl(url?: string | null) {
  if (!url) return null;
  let trimmed = url.trim();
  if (!trimmed) return null;

  // Handle data URIs (base64 images) directly
  if (trimmed.startsWith("data:")) {
    return trimmed;
  }

  // Handle protocol-relative URLs (e.g. //cdn.jsdelivr.net/...)
  if (trimmed.startsWith("//")) {
    trimmed = "https:" + trimmed;
  }

  // Handle Twitter Twemoji SVG specifically
  if (trimmed.includes("cdn.jsdelivr.net/gh/twitter/twemoji") && trimmed.endsWith(".svg")) {
    const fileName = trimmed.split("/").pop()?.replace(".svg", ".png");
    return fileName ? `https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/72x72/${fileName}` : trimmed;
  }

  // Resolve relative URLs to the public hosted domain
  if (!trimmed.startsWith("http://") && !trimmed.startsWith("https://") && !trimmed.startsWith("file://") && !trimmed.startsWith("gs://")) {
    if (trimmed.startsWith("media/") || trimmed.startsWith("/media")) {
      const path = trimmed.startsWith("/") ? trimmed : `/${trimmed}`;
      trimmed = `https://project-ha152.web.app${path}`;
    }
  }

  // Handle other SVG images using the images.weserv.nl proxy to convert them to PNG on the fly
  const lowerUrl = trimmed.toLowerCase();
  const isRemote = lowerUrl.startsWith("http://") || lowerUrl.startsWith("https://");
  const isSvg = lowerUrl.includes(".svg") || lowerUrl.includes("/svg") || lowerUrl.includes("format=svg");
  if (isRemote && isSvg) {
    return `https://images.weserv.nl/?url=${encodeURIComponent(trimmed)}&output=png`;
  }

  return trimmed;
}

export async function resolveImageUrl(url?: string | null) {
  const normalized = normalizeImageUrl(url);
  if (!normalized) return null;

  try {
    if (normalized.startsWith("data:")) {
      return normalized;
    }

    if (normalized.startsWith("gs://")) {
      return await getDownloadURL(ref(storage, normalized));
    }

    if (!normalized.startsWith("http://") && !normalized.startsWith("https://") && !normalized.startsWith("file://")) {
      return await getDownloadURL(ref(storage, normalized));
    }

    return normalized;
  } catch {
    return normalized.startsWith("http") || normalized.startsWith("data:") ? normalized : null;
  }
}
