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
        {/* Avatar Input UI */}
        <div className={`${className}`}>
          {variant === "full" ? (
            <div className="flex flex-col items-center space-y-4 sm:flex-row sm:space-y-0 sm:space-x-6">
              <div
                className={`relative ${sizeClasses[size]} overflow-hidden rounded-full border-2 border-gray-200 bg-gray-100 flex items-center justify-center`}
              >
                {avatarUrl ? (
                  <Image
                    src={avatarUrl}
                    alt="Avatar"
                    fill
                    className="object-cover"
                    onError={(e) => {
                      // Fallback to default avatar icon if image fails to load
                      e.currentTarget.style.display = 'none';
                      e.currentTarget.nextElementSibling?.classList.remove('hidden');
                    }}
                  />
                ) : null}
                <User
                  className={`text-gray-400 ${
                    size === "sm" ? "h-10 w-10" : size === "md" ? "h-14 w-14" : "h-20 w-20"
                  } ${avatarUrl ? 'hidden' : ''}`}
                />
              </div>

              <div className="flex-1">
                <label
                  htmlFor="avatar-upload"
                  className="flex w-full cursor-pointer flex-col items-center rounded-md border border-dashed border-gray-300 px-4 py-6 text-center hover:bg-gray-50 sm:items-start"
                >
                  <Upload className="mx-auto h-8 w-8 text-gray-400 sm:mx-0" />
                  <span className="mt-2 block text-sm font-medium text-gray-700">
                    {avatarUrl ? "Change profile picture" : "Upload a profile picture"}
                  </span>
                  <span className="mt-1 block text-xs text-gray-500">
                    JPEG, PNG, or GIF up to 5MB
                  </span>
                </label>
                {error && <p className="mt-2 text-sm text-red-500">{error}</p>}
              </div>
            </div>
          ) : (
            // Compact variant
            <div className="flex flex-col items-center space-y-3">
              <div
                className={`relative ${sizeClasses[size]} overflow-hidden rounded-full border-2 border-gray-200 bg-gray-100 flex items-center justify-center`}
              >
                {avatarUrl ? (
                  <Image
                    src={avatarUrl}
                    alt="Avatar"
                    fill
                    className="object-cover"
                    onError={(e) => {
                      // Fallback to default avatar icon if image fails to load
                      e.currentTarget.style.display = 'none';
                      e.currentTarget.nextElementSibling?.classList.remove('hidden');
                    }}
                  />
                ) : null}
                <User
                  className={`text-gray-400 ${
                    size === "sm" ? "h-10 w-10" : size === "md" ? "h-14 w-14" : "h-20 w-20"
                  } ${avatarUrl ? 'hidden' : ''}`}
                />
              </div>

              <div>
                <label
                  htmlFor="avatar-upload"
                  className="inline-block cursor-pointer rounded-md bg-gray-100 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200"
                >
                  {avatarUrl ? "Change Photo" : "Upload Photo"}
                </label>
                {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
              </div>
            </div>
          )}

          <input
            id="avatar-upload"
            ref={ref}
            type="file"
            accept="image/*"
            onChange={handleFileSelect}
            className="sr-only"
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