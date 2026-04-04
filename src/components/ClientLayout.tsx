"use client";

import React, { useState, useEffect } from 'react';

export function ClientLayout({ children }: { children: React.ReactNode }) {
  const [hasMounted, setHasMounted] = useState(false);

  useEffect(() => {
    setHasMounted(true);
    
    // Suprimir específicamente los avisos de hidratación causados por extensiones (ej: bis_skin_checked)
    const originalError = console.error;
    console.error = (...args) => {
      const msg = args[0]?.toString() || "";
      if (
        msg.includes('hydration-mismatch') || 
        msg.includes('bis_skin_checked') ||
        msg.includes('Text content did not match') ||
        msg.includes('Prop `hidden` did not match')
      ) {
        return;
      }
      originalError.apply(console, args);
    };

    return () => {
      console.error = originalError;
    };
  }, []);

  if (!hasMounted) {
    return (
      <div className="flex bg-[#0d0d0f] h-screen w-full items-center justify-center" suppressHydrationWarning={true}>
        <div className="w-8 h-8 rounded-full border-2 border-primary/20 border-t-primary animate-spin" suppressHydrationWarning={true} />
      </div>
    );
  }

  return <>{children}</>;
}
