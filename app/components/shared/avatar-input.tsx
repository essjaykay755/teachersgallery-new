"use client";

import { forwardRef, useEffect } from "react";
import Image from "next/image";
import { User, Upload } from "lucide-react";
import { useAvatarUpload } from "@/app/hooks/use-avatar-upload";
import ImageCropper from "./image-cropper";

interface AvatarInputProps {
  userId: string | null;
  initialAvatarUrl?: string | null;
  onChange?: (url: string | null) => void;
  className?: string;
  size?: "sm" | "md" | "lg";
  variant?: "compact" | "full";
}

const sizeClasses = {
  sm: "h-20 w-20",
  md: "h-24 w-24 sm:h-32 sm:w-32",
  lg: "h-32 w-32 sm:h-40 sm:w-40",
};

const AvatarInput = forwardRef<HTMLInputElement, AvatarInputProps>(
  (
    {
      userId,
      initialAvatarUrl = null,
      onChange,
      className = "",
      size = "md",
      variant = "full",
    },
    ref
  ) => {
    const {
      avatarUrl,
      isUploading,
      showCropper,
      cropperImage,
      error,
      handleFileSelect,
      handleCropComplete,
      handleCropCancel,
    } = useAvatarUpload({
      userId,
      initialAvatarUrl,
    });

    // Move the onChange call to useEffect
    useEffect(() => {
      if (onChange && avatarUrl !== initialAvatarUrl) {
        onChange(avatarUrl);
      }
    }, [avatarUrl, initialAvatarUrl, onChange]);

    return (
      <>
        <div
          className={`${className} flex flex-col ${
            variant === "compact" ? "gap-3 sm:flex-row sm:items-center" : "gap-3"
          }`}
        >
          <div
            className={`relative overflow-hidden rounded-full bg-gray-100 ${
              sizeClasses[size]
            }`}
          >
            {avatarUrl ? (
              <Image
                src={avatarUrl}
                alt="Avatar"
                fill
                className="object-cover"
                sizes={`${
                  size === "sm" ? "5rem" : size === "md" ? "8rem" : "10rem"
                }`}
                priority
                unoptimized={avatarUrl.startsWith('blob:')}
                onLoad={(e) => {
                  const img = e.target as HTMLImageElement;
                  console.log("Avatar loaded with dimensions:", img.naturalWidth, "x", img.naturalHeight);
                  
                  // Check if image is not 200x200, log a warning
                  if (img.naturalWidth !== 200 || img.naturalHeight !== 200) {
                    console.warn("Avatar image is not 200x200 pixels:", img.naturalWidth, "x", img.naturalHeight);
                  }
                }}
                onError={(e) => {
                  console.error("Avatar image failed to load:", e);
                  const target = e.target as HTMLImageElement;
                  target.onerror = null;
                  target.src = "/images/default-avatar.png";
                }}
              />
            ) : (
              <User
                className={`absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-gray-400 ${
                  size === "sm" ? "h-10 w-10" : size === "md" ? "h-14 w-14" : "h-20 w-20"
                } ${avatarUrl ? 'hidden' : ''}`}
              />
            )}

            {isUploading && (
              <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-40">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-white border-t-transparent"></div>
              </div>
            )}
          </div>

          {variant === "compact" ? (
            <div className="flex flex-col space-y-1">
              <div>
                <label
                  htmlFor={`avatar-upload-${userId}`}
                  className={`inline-block cursor-pointer rounded-md bg-gray-100 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200 ${isUploading ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  {isUploading ? "Uploading..." : avatarUrl ? "Change Photo" : "Upload Photo"}
                </label>
                {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
              </div>
            </div>
          ) : (
            <div className="flex w-full flex-col items-center justify-center">
              <div
                className={`flex ${
                  sizeClasses[size]
                } cursor-pointer items-center justify-center rounded-full border-2 border-dashed border-gray-300 bg-gray-50 hover:bg-gray-100 ${
                  isUploading ? "opacity-50 cursor-not-allowed" : ""
                }`}
              >
                <label
                  htmlFor={`avatar-upload-${userId}`}
                  className="flex h-full w-full cursor-pointer flex-col items-center justify-center p-2 text-center"
                >
                  <Upload className="mb-1 h-6 w-6 text-gray-500" />
                  <span className="text-xs font-medium text-gray-500">
                    {isUploading ? "Uploading..." : "Upload"}
                  </span>
                </label>
              </div>
              <p className="mt-2 text-center text-xs text-gray-500">
                PNG, JPG or JPEG (max. 5MB)
              </p>
              {error && <p className="mt-1 text-xs text-center text-red-500">{error}</p>}
            </div>
          )}

          <input
            id={`avatar-upload-${userId}`}
            ref={ref}
            type="file"
            accept="image/*"
            onChange={handleFileSelect}
            className="sr-only"
            disabled={isUploading}
          />
        </div>

        {/* Image Cropper Modal */}
        {showCropper && cropperImage && (
          <ImageCropper
            image={cropperImage}
            onCropComplete={handleCropComplete}
            onCancel={handleCropCancel}
          />
        )}
      </>
    );
  }
);

AvatarInput.displayName = "AvatarInput";

export default AvatarInput; 