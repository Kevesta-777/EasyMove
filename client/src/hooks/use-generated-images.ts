import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import type { VanSize } from '@/lib/types';

interface ImageResponse {
  path: string;
}

// Hook to fetch a generated van image
export function useVanImage(vanSize: VanSize) {
  return useQuery({
    queryKey: ['vanImage', vanSize],
    queryFn: async () => {
      const response = await fetch(`/api/images/van/${vanSize}`);
      if (!response.ok) {
        console.error('Failed to fetch van image:', response.statusText);
        return { path: '' };
      }
      return await response.json() as ImageResponse;
    },
    staleTime: Infinity, // Images don't change often
    retry: 1,
  });
}

// Hook to fetch a generated service image
export function useServiceImage(serviceType: string) {
  return useQuery({
    queryKey: ['serviceImage', serviceType],
    queryFn: async () => {
      const response = await fetch(`/api/images/service/${serviceType}`);
      if (!response.ok) {
        console.error('Failed to fetch service image:', response.statusText);
        return { path: '' };
      }
      return await response.json() as ImageResponse;
    },
    staleTime: Infinity,
    retry: 1,
  });
}

// Hook to fetch all van images at once
export function useAllVanImages() {
  const smallVan = useVanImage('small');
  const mediumVan = useVanImage('medium');
  const largeVan = useVanImage('large');
  const lutonVan = useVanImage('luton');
  
  const isLoading = 
    smallVan.isLoading || 
    mediumVan.isLoading || 
    largeVan.isLoading || 
    lutonVan.isLoading;
  
  const isError = 
    smallVan.isError || 
    mediumVan.isError || 
    largeVan.isError || 
    lutonVan.isError;
  
  const images = {
    small: smallVan.data?.path || '',
    medium: mediumVan.data?.path || '',
    large: largeVan.data?.path || '',
    luton: lutonVan.data?.path || '',
  };
  
  return { images, isLoading, isError };
}

// Hook to handle image loading state and fallbacks
export function useImageWithFallback(imagePath: string, fallbackImage: string) {
  const [imageUrl, setImageUrl] = useState<string>(fallbackImage);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [hasError, setHasError] = useState<boolean>(false);
  
  useEffect(() => {
    if (!imagePath) {
      setImageUrl(fallbackImage);
      setIsLoading(false);
      return;
    }
    
    const img = new Image();
    img.onload = () => {
      setImageUrl(imagePath);
      setIsLoading(false);
      setHasError(false);
    };
    
    img.onerror = () => {
      setImageUrl(fallbackImage);
      setIsLoading(false);
      setHasError(true);
    };
    
    img.src = imagePath;
    
    return () => {
      img.onload = null;
      img.onerror = null;
    };
  }, [imagePath, fallbackImage]);
  
  return { imageUrl, isLoading, hasError };
}