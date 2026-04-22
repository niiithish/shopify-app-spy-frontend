import { HugeiconsIcon, HugeiconsIconProps } from "@hugeicons/react"

export function Icon({
  icon,
  className,
  ...props
}: { icon: HugeiconsIconProps["icon"] } & Omit<HugeiconsIconProps, "icon">) {
  return <HugeiconsIcon icon={icon} className={className} {...props} />
}
