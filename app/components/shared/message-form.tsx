"use client";

import React, { useState } from 'react';
import { Send } from 'lucide-react';

interface MessageFormProps {
  recipientId: string;
  recipientName: string;
  onSend: (message: string) => Promise<void>;
  className?: string;
}

export function MessageForm({ 
  recipientId, 
  recipientName, 
  onSend, 
  className 
}: MessageFormProps) {
  const [message, setMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!message.trim()) {
      setError('Please enter a message');
      return;
    }
    
    try {
      setIsSending(true);
      setError(null);
      await onSend(message);
      setMessage('');
      setShowSuccess(true);
      
      // Hide success message after 3 seconds
      setTimeout(() => {
        setShowSuccess(false);
      }, 3000);
    } catch (err) {
      setError('Failed to send message. Please try again.');
      console.error('Error sending message:', err);
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className={`bg-white rounded-lg shadow-sm p-4 ${className}`}>
      <h3 className="font-medium text-gray-900 mb-2">
        Send a message to {recipientName}
      </h3>
      
      <form onSubmit={handleSubmit}>
        <div className="mb-4">
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder={`Hi ${recipientName}, I'm interested in your teaching services...`}
            rows={4}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            disabled={isSending}
          />
          {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
        </div>
        
        <div className="flex items-center justify-between">
          <p className="text-xs text-gray-500">
            {message.length} / 500 characters
          </p>
          
          <button
            type="submit"
            disabled={isSending || !message.trim()}
            className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Send className="h-4 w-4" />
            <span>{isSending ? 'Sending...' : 'Send Message'}</span>
          </button>
        </div>
      </form>
      
      {showSuccess && (
        <div className="mt-4 p-3 bg-green-50 text-green-700 rounded-md">
          Message sent successfully! {recipientName} will be notified.
        </div>
      )}
    </div>
  );
} 