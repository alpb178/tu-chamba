'use client';

import { cn } from '@/lib/cn';
import Image from 'next/image';
import React, { useState } from 'react';

/**
 * Image that enters with a soft blur and sharpens once it finishes loading.
 * Ported from Iris Natural (without the legacy `layout` prop, removed in
 * modern next/image).
 */
export const BlurImage = (props: React.ComponentProps<typeof Image>) => {
  const [isLoading, setLoading] = useState(true);

  const { src, alt, className, ...rest } = props;
  return (
    <Image
      className={cn(
        'transition duration-300',
        isLoading ? 'blur-sm' : 'blur-0',
        className
      )}
      onLoad={() => setLoading(false)}
      src={src}
      loading="lazy"
      decoding="async"
      alt={alt ? alt : ''}
      {...rest}
    />
  );
};
