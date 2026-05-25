type UploadValidationOptions = {
  allowedExtensions: string[];
  allowedMimeTypes: string[];
  maxBytes: number;
};

type UploadValidationResult = {
  extension: string;
  mimeType: string;
};

function normalizeExtension(name: string): string {
  return name.split(".").pop()?.toLowerCase() || "";
}

export function validateUpload(file: File, options: UploadValidationOptions): UploadValidationResult {
  const extension = normalizeExtension(file.name);
  const mimeType = file.type || "application/octet-stream";

  if (!extension || !options.allowedExtensions.includes(extension)) {
    throw new Error("Unsupported file extension.");
  }

  if (file.type && !options.allowedMimeTypes.includes(file.type)) {
    throw new Error("Unsupported file type.");
  }

  if (file.size > options.maxBytes) {
    throw new Error("File exceeds size limit.");
  }

  return { extension, mimeType };
}
