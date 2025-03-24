"use client";

import { useState, useCallback, useEffect } from "react";
import Cropper from "react-easy-crop";
import { X } from "lucide-react";

interface Point {
  x: number;
  y: number;
}

interface Area {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface ImageCropperProps {
  image: string;
  onCropComplete: (croppedImage: Blob) => void;
  onCancel: () => void;
}

export default function ImageCropper({ image, onCropComplete, onCancel }: ImageCropperProps) {
  const [crop, setCrop] = useState<Point>({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [imageObj, setImageObj] = useState<HTMLImageElement | null>(null);

  // Create image object when component mounts to ensure it's loaded
  useEffect(() => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.src = image;
    img.onload = () => {
      setImageObj(img);
    };
    img.onerror = (error) => {
      console.error("Error loading image for cropper:", error);
      onCancel(); // Close the cropper if the image fails to load
    };

    return () => {
      img.onload = null;
      img.onerror = null;
    };
  }, [image, onCancel]);

  const onCropChange = useCallback((newCrop: Point) => {
    setCrop(newCrop);
  }, []);

  const onZoomChange = useCallback((newZoom: number) => {
    setZoom(newZoom);
  }, []);

  const onCropAreaChange = useCallback((croppedArea: Area, croppedAreaPixels: Area) => {
    setCroppedAreaPixels(croppedAreaPixels);
  }, []);

  const createImage = (url: string): Promise<HTMLImageElement> =>
    new Promise((resolve, reject) => {
      // Use our pre-loaded image if available
      if (imageObj && imageObj.src === url) {
        resolve(imageObj);
        return;
      }
      
      const image = new Image();
      image.crossOrigin = "anonymous";
      image.addEventListener("load", () => resolve(image));
      image.addEventListener("error", (error) => {
        console.error("Error creating image:", error);
        reject(error);
      });
      image.src = url;
    });

  const getCroppedImg = async (
    imageSrc: string,
    pixelCrop: Area,
    rotation = 0
  ): Promise<Blob> => {
    try {
      // Create a new image from the source
      const image = await createImage(imageSrc);
      console.log("Original image dimensions:", image.width, "x", image.height);
      console.log("Crop area:", pixelCrop);
      
      // Create a canvas directly at the target size (200x200)
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");
      
      if (!ctx) {
        throw new Error("Could not get canvas context");
      }
      
      // Set canvas dimensions to our target 200x200 pixels
      canvas.width = 200;
      canvas.height = 200;
      
      // Fill with white background for transparent images
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      // Draw the cropped portion of the image directly to the 200x200 canvas
      // This combines cropping and resizing in one step
      ctx.drawImage(
        image,
        pixelCrop.x,
        pixelCrop.y,
        pixelCrop.width,
        pixelCrop.height,
        0,
        0,
        200,
        200
      );
      
      console.log("Final canvas dimensions:", canvas.width, "x", canvas.height);
      
      // Create blob with optimized compression
      return new Promise((resolve, reject) => {
        canvas.toBlob(
          (blob) => {
            if (!blob) {
              reject(new Error("Canvas toBlob error"));
              return;
            }
            
            console.log("Generated avatar blob:", blob.size, "bytes,", blob.type);
            resolve(blob);
          },
          "image/jpeg",
          0.8  // Slightly more compression for smaller file size
        );
      });
    } catch (error) {
      console.error("Error generating cropped image:", error);
      throw error;
    }
  };

  const handleComplete = async () => {
    try {
      setIsProcessing(true);
      if (!croppedAreaPixels) {
        throw new Error("No crop area selected");
      }
      const croppedImage = await getCroppedImg(image, croppedAreaPixels);
      onCropComplete(croppedImage);
    } catch (e) {
      console.error("Error generating cropped image:", e);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black bg-opacity-70 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full overflow-hidden">
        <div className="flex justify-between items-center p-4 border-b">
          <h2 className="text-lg font-semibold">Crop Profile Picture</h2>
          <button
            onClick={onCancel}
            className="text-gray-500 hover:text-gray-700"
            disabled={isProcessing}
          >
            <X size={20} />
          </button>
        </div>

        <div className="relative h-80 w-full">
          <Cropper
            image={image}
            crop={crop}
            zoom={zoom}
            aspect={1}
            cropShape="round"
            showGrid={false}
            onCropChange={onCropChange}
            onZoomChange={onZoomChange}
            onCropComplete={onCropAreaChange}
          />
        </div>

        <div className="p-4 space-y-4">
          <div className="space-y-1">
            <label htmlFor="zoom" className="text-sm font-medium text-gray-700">
              Zoom
            </label>
            <input
              id="zoom"
              type="range"
              min={1}
              max={3}
              step={0.1}
              value={zoom}
              onChange={(e) => setZoom(Number(e.target.value))}
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
            />
          </div>

          <div className="flex space-x-2 justify-end">
            <button
              onClick={onCancel}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
              disabled={isProcessing}
            >
              Cancel
            </button>
            <button
              onClick={handleComplete}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700"
              disabled={isProcessing}
            >
              {isProcessing ? "Processing..." : "Apply"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
} 