"use client";

import { useState } from 'react';

interface UserAvatarProps {
  url?: string;
  name: string;
  className?: string;
}

export function UserAvatar({ url, name, className = "" }: UserAvatarProps) {
  const [error, setError] = useState(false);
  
  const initial = name ? name.charAt(0).toUpperCase() : 'U';

  if (!url || error) {
    return (
      <div 
        className={`flex items-center justify-center bg-muted text-muted-foreground font-medium rounded-full select-none ${className}`}
        role="img"
        aria-label={name || "User avatar"}
      >
        {initial}
      </div>
    );
  }

  return (
    <img 
      src={url} 
      alt={name} 
      onError={() => setError(true)}
      className={`rounded-full object-cover ${className}`} 
    />
  );
}
