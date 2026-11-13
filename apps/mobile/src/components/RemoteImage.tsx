import { Image } from 'react-native';
import React, { ComponentProps } from 'react';
import { supabase } from '@/lib/supabase';

type RemoteImageProps = {
  path?: string | null;
  fallback: string;
} & Omit<ComponentProps<typeof Image>, 'source'>;

// product-images is a public bucket, so a plain URL is enough and the native image cache does the rest
const RemoteImage = ({ path, fallback, ...imageProps }: RemoteImageProps) => {
  const uri = path
    ? supabase.storage.from('product-images').getPublicUrl(path).data.publicUrl
    : fallback;

  return <Image source={{ uri }} {...imageProps} />;
};

export default RemoteImage;
