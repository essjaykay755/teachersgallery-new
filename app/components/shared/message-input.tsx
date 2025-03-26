"use client";

import { useState, useRef, ChangeEvent } from 'react';
import { Send, Paperclip, X, ImageIcon, FileText } from 'lucide-react';
import Image from 'next/image';
import { Button } from "@/app/components/ui/button";
import { Textarea } from "@/app/components/ui/textarea";
import { Badge } from "@/app/components/ui/badge";

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

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + ' B';
    else if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
    else return (bytes / 1048576).toFixed(1) + ' MB';
  };

  return (
    <div className="w-full">
      {/* File previews */}
      {files.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-3">
          {files.map((file, index) => (
            <Badge 
              key={index} 
              variant="outline" 
              className="pl-2 pr-1 py-1 h-auto bg-background flex items-center gap-2 border-muted"
            >
              {filePreviewUrls[index] ? (
                <div className="relative w-5 h-5 mr-1">
                  <Image 
                    src={filePreviewUrls[index]} 
                    alt={file.name} 
                    width={20} 
                    height={20} 
                    className="object-cover rounded" 
                  />
                </div>
              ) : (
                <FileText className="h-3.5 w-3.5 text-muted-foreground" />
              )}
              
              <span className="text-xs max-w-[160px] truncate">{file.name}</span>
              <span className="text-xs text-muted-foreground ml-1">
                {formatFileSize(file.size)}
              </span>
              
              <Button
                type="button"
                onClick={() => removeFile(index)}
                variant="ghost"
                size="icon"
                className="h-5 w-5 rounded-full ml-1 p-0"
              >
                <X className="h-3 w-3" />
              </Button>
            </Badge>
          ))}
        </div>
      )}
      
      <form onSubmit={handleSubmit} className="flex items-end gap-2">
        <div className="relative flex-1 overflow-hidden rounded-lg border">
          <div className="flex w-full items-center">
            <Button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              variant="ghost"
              size="icon"
              className="h-9 w-9 rounded-md"
              disabled={disabled}
              title="Attach files"
            >
              <Paperclip className="h-4 w-4 text-muted-foreground" />
            </Button>
            
            <input
              ref={fileInputRef}
              type="file"
              multiple
              onChange={handleFileChange}
              className="hidden"
              accept="image/*, application/pdf, application/msword, application/vnd.openxmlformats-officedocument.wordprocessingml.document"
              disabled={disabled}
            />
            
            <Textarea
              value={message}
              onChange={(e) => {
                setMessage(e.target.value);
                // Call onTyping on every keystroke to update typing status
                onTyping();
              }}
              onKeyDown={handleKeyDown}
              placeholder="Type your message..."
              className="min-h-10 border-0 focus-visible:ring-0 resize-none py-2 px-3"
              rows={1}
              disabled={disabled}
            />
          </div>
        </div>
        
        <Button
          type="submit"
          disabled={isLoading || disabled || (!message.trim() && files.length === 0)}
          size="icon"
          className="h-10 w-10 rounded-full shrink-0"
        >
          {isLoading ? (
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
          ) : (
            <Send className="h-4 w-4" />
          )}
        </Button>
      </form>
    </div>
  );
} 