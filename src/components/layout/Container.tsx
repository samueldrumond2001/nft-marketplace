import type { ElementType, ReactNode } from 'react'

import { cn } from '@/lib/utils'

interface ContainerProps {
  as?: ElementType
  className?: string
  children: ReactNode
}

/** 1200px centrados, como no Figma (x=120 a x=1320 num frame de 1440). */
export function Container({ as: Tag = 'div', className, children }: ContainerProps) {
  return <Tag className={cn('mx-auto w-full max-w-[1200px] px-4', className)}>{children}</Tag>
}
