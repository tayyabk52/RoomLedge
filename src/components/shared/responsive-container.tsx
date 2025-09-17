'use client'

import { cn } from '@/lib/utils'

interface ResponsiveContainerProps {
  children: React.ReactNode
  className?: string
  variant?: 'mobile' | 'desktop' | 'auto'
}

export function ResponsiveContainer({
  children,
  className,
  variant = 'auto'
}: ResponsiveContainerProps) {
  const baseClasses = "mx-auto"

  const variantClasses = {
    mobile: "max-w-md bg-white min-h-screen",
    desktop: "max-w-7xl bg-transparent",
    auto: "max-w-md lg:max-w-7xl bg-white lg:bg-transparent min-h-screen lg:min-h-0"
  }

  return (
    <div className={cn(baseClasses, variantClasses[variant], className)}>
      {children}
    </div>
  )
}