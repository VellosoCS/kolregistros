import { useCachedImage } from "@/hooks/use-cached-image";

interface CachedImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  src: string;
}

export default function CachedImage({ src, ...props }: CachedImageProps) {
  const cachedSrc = useCachedImage(src);
  return <img {...props} src={cachedSrc} />;
}
