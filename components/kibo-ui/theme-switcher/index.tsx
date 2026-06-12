"use client"

import { useControllableState } from "@radix-ui/react-use-controllable-state"
import { Moon, Sun, Desktop } from "@phosphor-icons/react"
import { motion } from "motion/react"
import { useCallback, useEffect, useState } from "react"
import { cn } from "@/lib/utils"
import type { PhosphorIcon } from "@/lib/icons"

const themes = [
  {
    key: "light",
    icon: Sun,
    label: "Light theme",
  },
  {
    key: "system",
    icon: Desktop,
    label: "System theme",
  },
  {
    key: "dark",
    icon: Moon,
    label: "Dark theme",
  },
] as const satisfies ReadonlyArray<{
  key: "light" | "dark" | "system"
  icon: PhosphorIcon
  label: string
}>

export type ThemeSwitcherProps = {
  value?: "light" | "dark" | "system"
  onChange?: (theme: "light" | "dark" | "system") => void
  defaultValue?: "light" | "dark" | "system"
  className?: string
}

export function ThemeSwitcher({
  value,
  onChange,
  defaultValue = "light",
  className,
}: ThemeSwitcherProps) {
  const [theme, setTheme] = useControllableState({
    defaultProp: defaultValue ?? "light",
    prop: value,
    onChange,
  })
  const [mounted, setMounted] = useState(false)

  const handleThemeClick = useCallback(
    (themeKey: "light" | "dark" | "system") => {
      setTheme(themeKey)
    },
    [setTheme]
  )

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return <div className={cn("h-7 w-[4rem] rounded-full bg-muted/50", className)} />
  }

  return (
    <div
      className={cn(
        "relative isolate flex items-center h-7 rounded-full bg-muted/50 p-0.5 ring-1 ring-border",
        className
      )}
    >
      {themes.map(({ key, icon: ThemeIcon, label }) => {
        const isActive = theme === key

        return (
          <button
            aria-label={label}
            aria-pressed={isActive}
            className="relative h-5 w-5 rounded-full"
            key={key}
            onClick={() => handleThemeClick(key)}
            type="button"
          >
            {isActive && (
              <motion.div
                className="absolute inset-0 rounded-full bg-background shadow-sm"
                layoutId="activeTheme"
                transition={{ type: "spring", duration: 0.45, bounce: 0.15 }}
              />
            )}
            <ThemeIcon
              className={cn(
                "relative z-10 m-auto size-3",
                isActive ? "text-foreground" : "text-muted-foreground"
              )}
            />
          </button>
        )
      })}
    </div>
  )
}
