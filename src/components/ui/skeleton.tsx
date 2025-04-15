
function Skeleton({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={`animate-pulse-strong rounded-md bg-light ${className}`}
      role="status"
      aria-live="polite"
      {...props}
    />
  )
}

export { Skeleton }