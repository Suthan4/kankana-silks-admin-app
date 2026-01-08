import React, { useState, useEffect } from "react";
import { Upload, X, Loader2, Video } from "lucide-react";

interface ImageUploadProps {
  value?: File | string | null;
  onChange: (file: File | null) => void;
  accept?: string;
  maxSizeMB?: number;
  className?: string;
}

export const ImageUpload: React.FC<ImageUploadProps> = ({
  value,
  onChange,
  accept = "image/*",
  maxSizeMB = 10,
  className = "",
}) => {
  const [preview, setPreview] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const isVideo = accept.includes("video");

  useEffect(() => {
    if (value instanceof File) {
      const url = URL.createObjectURL(value);
      setPreview(url);
      return () => URL.revokeObjectURL(url);
    }

    if (typeof value === "string") {
      setPreview(value);
    }
  }, [value]);

  const handleFile = (file: File) => {
    setError(null);

    if (file.size / (1024 * 1024) > maxSizeMB) {
      setError(`Max file size is ${maxSizeMB}MB`);
      return;
    }

    onChange(file);
  };

  return (
    <div className={`space-y-2 ${className}`}>
      {!preview ? (
        <label className="border-2 border-dashed rounded-lg p-6 block cursor-pointer text-center">
          <input
            type="file"
            accept={accept}
            hidden
            onChange={(e) => e.target.files && handleFile(e.target.files[0])}
          />
          {isVideo ? (
            <Video className="mx-auto mb-2 text-gray-400" />
          ) : (
            <Upload className="mx-auto mb-2 text-gray-400" />
          )}
          <p className="text-sm">Click to upload</p>
        </label>
      ) : (
        <div className="relative">
          <div className="object-contain w-[400px] h-[400px]">
            {isVideo ? (
              <video src={preview} controls className="rounded-lg" />
            ) : (
              <img src={preview} className="rounded-lg object-cover" />
            )}

            <button
              type="button"
              onClick={() => onChange(null)}
              className="absolute top-2 right-2 bg-red-600 text-white p-1 rounded-full"
            >
              <X size={14} />
            </button>
          </div>
        </div>
      )}

      {error && <p className="text-sm text-red-600">{error}</p>}
    </div>
  );
};
