"use client";

import { useState, useRef } from "react";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { storage } from "@/lib/firebase";

// Types for the hook
interface UseAvatarUploadProps {
  userId: string | null;
  initialAvatarUrl?: string | null;
}

interface UseAvatarUploadReturn {
  avatarUrl: string | null;
  avatarFile: File | null;
  isUploading: boolean;
  showCropper: boolean;
  cropperImage: string | null;
  error: string | null;
  handleFileSelect: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleCropComplete: (croppedBlob: Blob) => void;
  handleCropCancel: () => void;
  uploadAvatar: () => Promise<string | null>;
}

export function useAvatarUpload({
  userId,
  initialAvatarUrl = null,
}: UseAvatarUploadProps): UseAvatarUploadReturn {
  const [avatarUrl, setAvatarUrl] = useState<string | null>(initialAvatarUrl);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [cropperImage, setCropperImage] = useState<string | null>(null);
  const [showCropper, setShowCropper] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  
  // Handle file selection from input
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    
    if (files && files.length > 0) {
      const file = files[0];
      
      // Validate file is an image
      if (!file.type.startsWith("image/")) {
        setError("Please upload an image file");
        return;
      }
      
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        setError("Image size should be less than 5MB");
        return;
      }
      
      setError(null);
      
      // Store the file directly
      setAvatarFile(file);
      
      // Revoke any previous blob URL before creating a new one
      if (cropperImage) {
        URL.revokeObjectURL(cropperImage);
      }
      
      // Create a new URL for the image to be used by the cropper
      const imageUrl = URL.createObjectURL(file);
      setCropperImage(imageUrl);
      setShowCropper(true);
      
      // Reset the file input to allow selecting the same file again
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };
  
  // Handle when cropping is complete
  const handleCropComplete = async (croppedBlob: Blob) => {
    try {
      // Log the received blob details
      console.log("Received cropped blob:", croppedBlob.size, "bytes,", croppedBlob.type);
      
      // Verify the cropped image dimensions to make sure it's 200x200
      const verifyDimensions = async (blob: Blob): Promise<boolean> => {
        return new Promise((resolve) => {
          const img = new Image();
          img.onload = () => {
            const isCorrectSize = img.width === 200 && img.height === 200;
            console.log(`Cropped image dimensions: ${img.width}x${img.height} (expected 200x200)`);
            resolve(isCorrectSize);
            URL.revokeObjectURL(img.src);
          };
          img.onerror = () => {
            resolve(false);
            URL.revokeObjectURL(img.src);
          };
          img.src = URL.createObjectURL(blob);
        });
      };
      
      const isCorrectSize = await verifyDimensions(croppedBlob);
      if (!isCorrectSize) {
        console.warn("Cropped image is not exactly 200x200 pixels. This may cause inconsistent display.");
      }
      
      // Create file from the cropped blob (should already be 200x200)
      const fileName = `avatar-${Date.now()}.jpg`;
      const croppedFile = new File([croppedBlob], fileName, { 
        type: "image/jpeg",
        lastModified: Date.now() 
      });
      
      // Set the file and clean up
      setAvatarFile(croppedFile);
      setShowCropper(false);
      
      // Clean up previous cropperImage URL
      if (cropperImage) {
        URL.revokeObjectURL(cropperImage);
        setCropperImage(null);
      }
      
      // Upload the avatar
      try {
        setIsUploading(true);
        const uploadedUrl = await uploadAvatar();
        if (uploadedUrl) {
          setAvatarUrl(uploadedUrl);
        }
      } catch (error) {
        console.error("Error uploading avatar:", error);
        setError("Failed to upload avatar. Please try again.");
      } finally {
        setIsUploading(false);
      }
    } catch (error) {
      console.error("Error processing cropped image:", error);
      setError("Failed to process avatar. Please try again.");
      setShowCropper(false);
    }
  };
  
  // Handle when cropping is cancelled
  const handleCropCancel = () => {
    setShowCropper(false);
    
    // Cleanup the cropper image URL
    if (cropperImage) {
      URL.revokeObjectURL(cropperImage);
      setCropperImage(null);
    }
  };
  
  // Upload the avatar to Firebase Storage
  const uploadAvatar = async (): Promise<string | null> => {
    if (!userId || !avatarFile) {
      return avatarUrl;
    }
    
    try {
      setError(null);
      
      // Add specific metadata to preserve image type and dimensions
      const metadata = {
        contentType: 'image/jpeg',
        customMetadata: {
          'width': '200',
          'height': '200',
          'resized': 'true',
          'version': '2',
          'timestamp': Date.now().toString()
        }
      };
      
      // Generate a unique storage path with timestamp to prevent caching issues
      // Ensure userId is the first part before any underscore to match storage rules
      const timestamp = Date.now();
      const random = Math.floor(Math.random() * 10000);
      
      // Using userId directly as the first segment to match the storage rules pattern
      // The rule expects userId to be before the first underscore: userId.split('_')[0]
      const storageRef = ref(storage, `avatars/${userId}_${timestamp}_${random}`);
      
      console.log(`Uploading avatar (${avatarFile.size} bytes) to ${storageRef.fullPath}`);
      
      try {
        // Upload with metadata
        await uploadBytes(storageRef, avatarFile, metadata);
        
        // Get the download URL
        const downloadUrl = await getDownloadURL(storageRef);
        
        // Add cache buster query parameter with both timestamp and random number
        const cacheBustedUrl = `${downloadUrl}?v=${timestamp}_${random}`;
        
        console.log("Avatar uploaded successfully:", cacheBustedUrl);
        return cacheBustedUrl;
      } catch (uploadError: any) {
        // Log detailed error for debugging
        console.error("Firebase storage error:", uploadError.code, uploadError.message);
        
        if (uploadError.code === 'storage/unauthorized') {
          setError("Permission denied. Please check your login status and try again.");
        } else {
          setError(uploadError.message || "Failed to upload avatar");
        }
        return null;
      }
    } catch (error: any) {
      console.error("Error uploading avatar:", error);
      setError(error.message || "Failed to upload avatar");
      return null;
    }
  };
  
  return {
    avatarUrl,
    avatarFile,
    isUploading,
    showCropper,
    cropperImage,
    error,
    handleFileSelect,
    handleCropComplete,
    handleCropCancel,
    uploadAvatar,
  };
} 