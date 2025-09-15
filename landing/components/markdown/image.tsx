import { ComponentProps } from "react";
import NextImage from "next/image";

type Height = ComponentProps<typeof NextImage>["height"];
type Width = ComponentProps<typeof NextImage>["width"];

interface ImageProps {
  src?: string;
  alt?: string;
  width?: number;
  height?: number;
}

export default function Image({
  src,
  alt = "alt",
  width = 800,
  height = 350,
  ...props
}: ImageProps) {
  if (!src || typeof src !== 'string') return null;
  return (
    <NextImage
      src={src}
      alt={alt}
      width={width as Width}
      height={height as Height}
      quality={40}
      {...props}
    />
  );
}
