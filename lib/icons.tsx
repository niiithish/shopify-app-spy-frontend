import type { ForwardRefExoticComponent, RefAttributes } from "react"
import type { IconProps } from "@phosphor-icons/react"
import { cn } from "@/lib/utils"

export type PhosphorIcon = ForwardRefExoticComponent<IconProps & RefAttributes<SVGSVGElement>>

export function Icon({
  icon: IconComponent,
  className,
  weight = "regular",
  ...props
}: IconProps & { icon: PhosphorIcon }) {
  return (
    <IconComponent weight={weight} className={cn("size-4 shrink-0", className)} {...props} />
  )
}
