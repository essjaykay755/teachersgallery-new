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
      
      // Create a URL for the image to be used by the cropper
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
  const handleCropComplete = (croppedBlob: Blob) => {
    // Convert Blob to File for upload
    const fileName = `avatar-${Date.now()}.jpg`;
    const croppedFile = new File([croppedBlob], fileName, { type: "image/jpeg" });
    
    setAvatarFile(croppedFile);
    setAvatarUrl(URL.createObjectURL(croppedBlob));
    setShowCropper(false);
    
    // Cleanup the cropper image URL
    if (cropperImage) {
      URL.revokeObjectURL(cropperImage);
      setCropperImage(null);
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
      setIsUploading(true);
      setError(null);
      
      // Create a reference to Firebase Storage
      const storageRef = ref(storage, `avatars/${userId}`);
      
      // Upload the cropped image
      await uploadBytes(storageRef, avatarFile);
      
      // Get the download URL
      const downloadUrl = await getDownloadURL(storageRef);
      
      // Update the state
      setAvatarUrl(downloadUrl);
      
      return downloadUrl;
    } catch (error: any) {
      console.error("Error uploading avatar:", error);
      setError(error.message || "Failed to upload avatar");
      return null;
    } finally {
      setIsUploading(false);
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