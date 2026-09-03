interface MediaFrameProps {
  src: string
  alt: string
  ratio?: '3 / 2' | '4 / 3' | '1 / 1' | '16 / 9'
  className?: string
  eager?: boolean
}

export default function MediaFrame({
  src,
  alt,
  ratio = '3 / 2',
  className = '',
  eager = false,
}: MediaFrameProps) {
  return (
    <div
      className={`media-frame${className ? ` ${className}` : ''}`}
      style={{ aspectRatio: ratio }}
    >
      <img
        src={src}
        alt={alt}
        width={900}
        height={600}
        loading={eager ? 'eager' : 'lazy'}
        decoding="async"
      />
    </div>
  )
}
