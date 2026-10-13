export default function ClothIcon({ item, className, style }) {
  const { Shape } = item
  return (
    <svg viewBox="0 0 100 100" className={className} style={style} aria-hidden="true" focusable="false">
      <Shape c={item.color} d={item.detail} />
    </svg>
  )
}
