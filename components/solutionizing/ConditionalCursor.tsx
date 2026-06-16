"use client";

import { usePathname } from 'next/navigation';
import Cursor from '@/components/ui/Cursor';

export default function ConditionalCursor() {
  const pathname = usePathname();
  
  if (pathname === '/') {
    return null;
  }
  
  return <Cursor />;
}
