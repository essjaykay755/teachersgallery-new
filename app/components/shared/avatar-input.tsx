"use client";

import { forwardRef, useEffect } from "react";
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
              <div className="relative w-full h-full">
                <img
                  src={avatarUrl}
                  alt="Avatar"
                  className="absolute inset-0 h-full w-full object-cover rounded-full"
                  onError={(e) => {
                    console.error("Avatar image failed to load:", e);
                    
                    // Display fallback icon if image fails to load
                    const target = e.target as HTMLImageElement;
                    target.style.display = 'none';
                    
                    // Find parent container and add fallback icon
                    const container = target.closest('.relative');
                    if (container) {
                      const existingFallback = container.querySelector('.avatar-fallback');
                      if (!existingFallback) {
                        const fallback = document.createElement('div');
                        fallback.className = 'avatar-fallback flex h-full w-full items-center justify-center bg-gray-200 text-gray-500';
                        fallback.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="h-8 w-8"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>';
                        container.appendChild(fallback);
                      }
                    }
                  }}
                />
              </div>
            ) : (
              <div className="flex h-full w-full items-center justify-center">
                <User className="h-8 w-8 text-gray-400" />
              </div>
            )}
          </div>

          {variant === "compact" ? (
            <div className="flex flex-col space-y-1">
              <div>
                <label
                  htmlFor={`avatar-upload-${userId || 'new'}`}
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
                  htmlFor={`avatar-upload-${userId || 'new'}`}
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
            id={`avatar-upload-${userId || 'new'}`}
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