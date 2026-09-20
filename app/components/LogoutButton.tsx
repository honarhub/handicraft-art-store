'use client';

import React from 'react';
import { signOut } from 'next-auth/react';

interface LogoutButtonProps {
  callbackUrl: string;
  className?: string;
  children: React.ReactNode;
}

export default function LogoutButton({ callbackUrl, className, children }: LogoutButtonProps) {
  return (
    <button 
      onClick={() => signOut({ callbackUrl })} 
      className={className}
    >
      {children}
    </button>
  );
}
