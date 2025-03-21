"use client";

import { useState, useRef, ChangeEvent } from 'react';
import { Send, Paperclip, X, ImageIcon } from 'lucide-react';
import Image from 'next/image';

interface MessageInputProps {
  onSend: (message: string, files?: File[]) => Promise<void>;
  onTyping: () => void;
  isLoading?: boolean;
  disabled?: boolean;
}

export function MessageInput({ 
  onSend, 
  onTyping, 
  isLoading = false, 
  disabled = false 
}: MessageInputProps) {
  const [message, setMessage] = useState('');
  const [files, setFiles] = useState<File[]>([]);
  const [filePreviewUrls, setFilePreviewUrls] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if ((!message.trim() && files.length === 0) || isLoading) {
      return;
    }
    
    try {
      await onSend(message, files);
      setMessage('');
      setFiles([]);
      setFilePreviewUrls([]);
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = e.target.files;
    if (!selectedFiles || selectedFiles.length === 0) return;
    
    const newFiles: File[] = [];
    const newPreviewUrls: string[] = [];
    
    Array.from(selectedFiles).forEach(file => {
      newFiles.push(file);
      
      // Generate preview URL for images
      if (file.type.startsWith('image/')) {
        const url = URL.createObjectURL(file);
        newPreviewUrls.push(url);
      } else {
        // For non-image files, we don't need a preview
        newPreviewUrls.push('');
      }
    });
    
    setFiles(prevFiles => [...prevFiles, ...newFiles]);
    setFilePreviewUrls(prevUrls => [...prevUrls, ...newPreviewUrls]);
    
    // Reset the file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const removeFile = (index: number) => {
    setFiles(prevFiles => {
      const newFiles = [...prevFiles];
      newFiles.splice(index, 1);
      return newFiles;
    });
    
    setFilePreviewUrls(prevUrls => {
      const newUrls = [...prevUrls];
      
      // Revoke the object URL to avoid memory leaks
      if (newUrls[index]) {
        URL.revokeObjectURL(newUrls[index]);
      }
      
      newUrls.splice(index, 1);
      return newUrls;
    });
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  return (
    <div className="w-full">
      {/* File previews */}
      {files.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-2">
          {files.map((file, index) => (
            <div key={index} className="relative bg-gray-100 rounded-md p-2 flex items-center">
              {filePreviewUrls[index] ? (
                <div className="relative w-10 h-10 mr-2">
                  <Image 
                    src={filePreviewUrls[index]} 
                    alt={file.name} 
                    width={40} 
                    height={40} 
                    className="object-cover rounded-md" 
                  />
                </div>
              ) : (
                <Paperclip className="h-5 w-5 mr-2 text-gray-500" />
              )}
              <div className="mr-6 max-w-[150px]">
                <p className="text-xs font-medium truncate">{file.name}</p>
                <p className="text-xs text-gray-500">
                  {(file.size / 1024 / 1024).toFixed(2)} MB
                </p>
              </div>
              <button
                type="button"
                onClick={() => removeFile(index)}
                className="absolute top-1 right-1 p-1 bg-gray-200 rounded-full hover:bg-gray-300"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          ))}
        </div>
      )}
      
      <form onSubmit={handleSubmit} className="flex">
        <div className="flex-1 flex items-center border border-gray-300 rounded-l-md overflow-hidden bg-white">
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="p-2 text-gray-500 hover:text-gray-700"
            disabled={disabled}
          >
            <Paperclip className="h-5 w-5" />
          </button>
          
          <input
            ref={fileInputRef}
            type="file"
            multiple
            onChange={handleFileChange}
            className="hidden"
            accept="image/*, application/pdf, application/msword, application/vnd.openxmlformats-officedocument.wordprocessingml.document"
            disabled={disabled}
          />
          
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyUp={onTyping}
            onKeyDown={handleKeyDown}
            placeholder="Type your message..."
            className="flex-1 py-2 px-3 focus:outline-none resize-none h-[40px] max-h-[120px] overflow-y-auto"
            rows={1}
            disabled={disabled}
          />
        </div>
        
        <button
          type="submit"
          disabled={isLoading || disabled || (!message.trim() && files.length === 0)}
          className="flex items-center justify-center px-4 py-2 bg-blue-600 text-white rounded-r-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? (
            <div className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full" />
          ) : (
            <Send className="h-5 w-5" />
          )}
        </button>
      </form>
    </div>
  );
} 