// Renders an avatar that's either a single emoji or an uploaded data URL image.
// Same call site whether the user picked an emoji from the palette or uploaded
// a photo — keeps the rest of the UI agnostic.
interface Props {
  value: string | undefined | null
  size: number
  rounded?: boolean
}

export function Avatar({ value, size, rounded = true }: Props) {
  const v = value || '🧸'
  const isImg = typeof v === 'string' && v.startsWith('data:')
  if (isImg) {
    return (
      <img
        src={v}
        alt=""
        style={{
          width: size,
          height: size,
          borderRadius: rounded ? size / 2 : 6,
          objectFit: 'cover',
          display: 'block',
          flexShrink: 0,
        }}
      />
    )
  }
  return (
    <span style={{
      fontSize: Math.round(size * 0.7),
      width: size,
      height: size,
      lineHeight: size + 'px',
      display: 'inline-block',
      textAlign: 'center',
      flexShrink: 0,
    }}>{v}</span>
  )
}
