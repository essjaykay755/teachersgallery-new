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
          'resized': 'true'
        }
      };
      
      // Generate a unique storage path
      const timestamp = Date.now();
      const random = Math.floor(Math.random() * 10000);
      const storageRef = ref(storage, `avatars/${userId}_${timestamp}_${random}`);
      
      console.log(`Uploading avatar (${avatarFile.size} bytes) to ${storageRef.fullPath}`);
      
      // Upload with metadata
      await uploadBytes(storageRef, avatarFile, metadata);
      
      // Get the download URL
      const downloadUrl = await getDownloadURL(storageRef);
      
      // Add cache buster query parameter
      const cacheBustedUrl = `${downloadUrl}?v=${timestamp}_${random}`;
      
      console.log("Avatar uploaded successfully:", cacheBustedUrl);
      return cacheBustedUrl;
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