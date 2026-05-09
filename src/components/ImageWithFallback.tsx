import { useState } from 'react';
import { hashHue, initials } from '@/lib/hashColor';

export function ImageWithFallback(props: {
  src: string;
  alt: string;
  title: string;
  className?: string;
  imgClassName?: string;
}): React.ReactElement {
  const { src, alt, title, className = '', imgClassName = '' } = props;
  const [loaded, setLoaded] = useState(false);
  const [failed, setFailed] = useState(!src);

  if (failed || !src) {
    return (
      <div
        className={`flex items-center justify-center font-semibold text-white/90 ${className}`}
        style={{ background: hashHue(title) }}
      >
        {initials(title)}
      </div>
    );
  }

  return (
    <div className={`relative overflow-hidden ${className}`}>
      {!loaded ? (
        <div className="absolute inset-0 animate-pulse bg-white/10" aria-hidden />
      ) : null}
      <img
        src={src}
        alt={alt}
        className={`h-full w-full object-cover ${imgClassName}`}
        onLoad={() => setLoaded(true)}
        onError={() => setFailed(true)}
      />
    </div>
  );
}
