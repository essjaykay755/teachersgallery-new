"use client";

import { useState } from 'react';
import AvatarInput from './shared/avatar-input';
import { Button } from './ui/button';

export default function AvatarTest() {
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [userId] = useState<string>('test-user-' + Math.floor(Math.random() * 1000));

  return (
    <div className="p-8 max-w-md mx-auto">
      <h2 className="text-xl font-bold mb-6">Avatar Upload Test</h2>
      
      <div className="space-y-8">
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-lg font-semibold mb-4">Upload & Crop Avatar</h3>
          <p className="text-sm text-gray-500 mb-4">
            Select an image to upload. The image will be cropped to 200x200 pixels 
            before being uploaded to Firebase.
          </p>
          
          <AvatarInput 
            userId={userId}
            initialAvatarUrl={avatarUrl}
            onChange={setAvatarUrl}
            size="lg"
          />
          
          {avatarUrl && (
            <div className="mt-6 flex flex-col items-center">
              <p className="text-sm font-medium mb-2">Current Avatar URL:</p>
              <div className="bg-gray-50 p-3 rounded text-xs text-gray-600 w-full overflow-hidden text-ellipsis whitespace-nowrap">
                {avatarUrl}
              </div>
              <Button 
                variant="outline"
                className="mt-4" 
                onClick={() => setAvatarUrl(null)}
              >
                Remove Avatar
              </Button>
            </div>
          )}
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-lg font-semibold mb-4">Avatar Preview</h3>
          
          <div className="flex items-center space-x-6">
            <div>
              <p className="text-sm text-gray-500 mb-2">Original Size</p>
              <div className="h-24 w-24 rounded-full overflow-hidden bg-gray-200 border border-gray-300">
                {avatarUrl ? (
                  <img 
                    src={avatarUrl} 
                    alt="Avatar Preview" 
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="h-full w-full flex items-center justify-center text-gray-400">
                    No Image
                  </div>
                )}
              </div>
            </div>
            
            <div>
              <p className="text-sm text-gray-500 mb-2">Large (128px)</p>
              <div className="h-32 w-32 rounded-full overflow-hidden bg-gray-200 border border-gray-300">
                {avatarUrl ? (
                  <img 
                    src={avatarUrl} 
                    alt="Avatar Preview" 
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="h-full w-full flex items-center justify-center text-gray-400">
                    No Image
                  </div>
                )}
              </div>
            </div>
            
            <div>
              <p className="text-sm text-gray-500 mb-2">Small (64px)</p>
              <div className="h-16 w-16 rounded-full overflow-hidden bg-gray-200 border border-gray-300">
                {avatarUrl ? (
                  <img 
                    src={avatarUrl} 
                    alt="Avatar Preview" 
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="h-full w-full flex items-center justify-center text-gray-400">
                    No Image
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 