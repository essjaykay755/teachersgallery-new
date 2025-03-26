"use client";

import { useState, useCallback } from "react";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { storage } from "@/lib/firebase";

// Types for the hook
interface UseAvatarUploadProps {
  userId: string | null;
  initialAvatarUrl?: string | null;
}

interface UseAvatarUploadReturn {
  avatarUrl: string | null;
  isUploading: boolean;
  showCropper: boolean;
  cropperImage: string | null;
  error: string | null;
  handleFileSelect: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleCropComplete: (croppedBlob: Blob) => void;
  handleCropCancel: () => void;
}

export function useAvatarUpload({
  userId,
  initialAvatarUrl = null,
}: UseAvatarUploadProps): UseAvatarUploadReturn {
  const [avatarUrl, setAvatarUrl] = useState<string | null>(initialAvatarUrl);
  const [cropperImage, setCropperImage] = useState<string | null>(null);
  const [showCropper, setShowCropper] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Handle file selection from input
  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
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
      
      // Create a new URL for the image to be used by the cropper
      const imageUrl = URL.createObjectURL(file);
      setCropperImage(imageUrl);
      setShowCropper(true);
      
      // Reset the file input
      e.target.value = "";
    }
  }, []);
  
  // Handle when cropping is complete
  const handleCropComplete = useCallback(async (croppedBlob: Blob) => {
    if (!userId) {
      setError("User ID is required for upload");
      setShowCropper(false);
      return;
    }

    try {
      setIsUploading(true);
      
      // Convert blob to File for upload
      const fileName = `avatar-${Date.now()}.jpg`;
      const croppedFile = new File([croppedBlob], fileName, { 
        type: "image/jpeg",
        lastModified: Date.now() 
      });
      
      // Create a temporary data URL for immediate display
      const reader = new FileReader();
      reader.readAsDataURL(croppedBlob);
      
      reader.onload = async () => {
        const dataUrl = reader.result as string;
        
        // Update UI with data URL first for instant feedback
        setAvatarUrl(dataUrl);
        setShowCropper(false);
        
        try {
          // Upload to Firebase Storage
          const timestamp = Date.now();
          const random = Math.floor(Math.random() * 10000);
          const path = `avatars/${userId}_${timestamp}_${random}`;
          
          const storageRef = ref(storage, path);
          
          // Upload the file
          await uploadBytes(storageRef, croppedFile, {
            contentType: 'image/jpeg'
          });
          
          // Get the download URL
          const downloadUrl = await getDownloadURL(storageRef);
          console.log("Avatar uploaded successfully:", downloadUrl);
          
          // Keep the data URL for display but save the Firebase URL for persistence
          setAvatarUrl(downloadUrl);
        } catch (uploadError: any) {
          console.error("Error uploading avatar:", uploadError);
          setError("Failed to upload avatar to storage. Please try again.");
          // Keep the data URL for display even if upload fails
        } finally {
          setIsUploading(false);
        }
      };
      
      reader.onerror = () => {
        setError("Failed to process the cropped image");
        setIsUploading(false);
        setShowCropper(false);
      };
    } catch (error) {
      console.error("Error in avatar processing:", error);
      setError("Failed to process avatar. Please try again.");
      setIsUploading(false);
      setShowCropper(false);
    }
  }, [userId]);
  
  // Handle when cropping is cancelled
  const handleCropCancel = useCallback(() => {
    setShowCropper(false);
    
    // Cleanup the cropper image URL
    if (cropperImage) {
      URL.revokeObjectURL(cropperImage);
      setCropperImage(null);
    }
  }, [cropperImage]);
  
  return {
    avatarUrl,
    isUploading,
    showCropper,
    cropperImage,
    error,
    handleFileSelect,
    handleCropComplete,
    handleCropCancel,
  };
} 