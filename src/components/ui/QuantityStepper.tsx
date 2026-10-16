import { Minus, Plus } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'

interface QuantityStepperProps {
  value: number
  onChange: (value: number) => void
  min?: number
  max?: number
  label: string
  className?: string
}

// Número é input, não texto: com 9 edições ninguém vai clicar 9x no +.
export function QuantityStepper({
  value,
  onChange,
  min = 1,
  max = 99,
  label,
  className,
}: QuantityStepperProps) {
  const clamp = (next: number) => Math.min(max, Math.max(min, next))

  return (
    <div className={cn('flex items-center gap-3', className)} role="group" aria-label={label}>
      <Button
        size="icon-sm"
        onClick={() => onChange(clamp(value - 1))}
        disabled={value <= min}
        aria-label="Diminuir quantidade"
        className="rounded-full"
      >
        <Minus className="size-3" strokeWidth={2.5} />
      </Button>

      <Input
        type="number"
        inputMode="numeric"
        value={value}
        min={min}
        max={max}
        aria-label={label}
        onChange={(event) => {
          const parsed = Number(event.target.value)
          if (Number.isFinite(parsed)) onChange(clamp(parsed))
        }}
        // sem borda nem spinner: o controle visível são os dois redondos
        className="tabular w-8 [appearance:textfield] border-0 p-0 text-center text-sm [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
      />

      <Button
        size="icon-sm"
        onClick={() => onChange(clamp(value + 1))}
        disabled={value >= max}
        aria-label="Aumentar quantidade"
        className="rounded-full"
      >
        <Plus className="size-3" strokeWidth={2.5} />
      </Button>
    </div>
  )
}
