'use client';

import { cn } from '@/lib/cn';
import Image from 'next/image';
import React, { useState } from 'react';

/**
 * Imagen que entra con un desenfoque suave y se aclara al terminar de cargar.
 * Portado de Iris Natural (sin la prop legacy `layout`, retirada en next/image
 * moderno).
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
