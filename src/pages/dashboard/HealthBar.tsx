/** A stacked bar of counts. It is a picture only: the numbers always appear in words beside it. */
export default function HealthBar({ parts }: { parts: { key: string; count: number }[] }) {
  return (
    <div className="health-bar" aria-hidden="true">
      {parts.map((p) => (
        <i key={p.key} className={p.key} style={{ flexGrow: p.count }} />
      ))}
    </div>
  )
}
