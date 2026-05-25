import { getSupabaseServerClient } from "@/lib/supabase/server";

type SignedUrlOptions = {
  bucket?: string;
  expiresIn?: number;
};

export async function createSignedStorageUrl(
  storagePath: string,
  options: SignedUrlOptions = {}
): Promise<string | null> {
  const bucket = options.bucket || "user";
  const expiresIn = options.expiresIn ?? 60 * 10;
  const supabase = getSupabaseServerClient();

  const { data, error } = await supabase.storage.from(bucket).createSignedUrl(storagePath, expiresIn);

  if (error || !data?.signedUrl) {
    return null;
  }

  return data.signedUrl;
}

export async function downloadStorageObject(storagePath: string, bucket = "user"): Promise<ArrayBuffer> {
  const supabase = getSupabaseServerClient();
  const { data, error } = await supabase.storage.from(bucket).download(storagePath);

  if (error || !data) {
    throw new Error(error?.message || "Failed to download storage object.");
  }

  return data.arrayBuffer();
}

export function extractStoragePathFromPublicUrl(url: string, bucket = "user"): string | null {
  try {
    const parsed = new URL(url);
    const marker = `/storage/v1/object/public/${bucket}/`;
    const index = parsed.pathname.indexOf(marker);

    if (index < 0) {
      return null;
    }

    return decodeURIComponent(parsed.pathname.slice(index + marker.length));
  } catch {
    return null;
  }
}

/**
 * Resolves a stored value (which may be an old public URL or a raw storage path)
 * into a raw storage path suitable for creating signed URLs or downloading.
 */
export function resolveStoragePath(storedValue: string | null | undefined, bucket = "user"): string | null {
  if (!storedValue) return null;

  // If it looks like a URL (starts with http), extract the path from it
  if (storedValue.startsWith("http")) {
    return extractStoragePathFromPublicUrl(storedValue, bucket);
  }

  // Otherwise it's already a raw storage path
  return storedValue;
}

/**
 * One-call helper: takes a stored value (public URL or raw path) and returns
 * a fresh signed URL. Returns null if the value is empty or signing fails.
 */
export async function resolveSignedUrl(
  storedValue: string | null | undefined,
  options: SignedUrlOptions = {}
): Promise<string | null> {
  const path = resolveStoragePath(storedValue, options.bucket || "user");
  if (!path) return null;
  return createSignedStorageUrl(path, options);
}
