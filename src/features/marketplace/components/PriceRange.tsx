import { useId } from 'react'

interface PriceRangeProps {
  bounds: { min: number; max: number }
  value: { min: number; max: number }
  onChange: (value: { min: number; max: number }) => void
}

const STEP = 0.01

// Dois input[type=range] sobrepostos em vez de slider de biblioteca: já vem
// com teclado e leitor de tela. pointer-events só nos polegares, senão o de
// cima rouba o clique do de baixo.
export function PriceRange({ bounds, value, onChange }: PriceRangeProps) {
  const id = useId()
  const span = bounds.max - bounds.min
  const leftPercent = ((value.min - bounds.min) / span) * 100
  const rightPercent = ((value.max - bounds.min) / span) * 100

  return (
    <div>
      <div className="relative h-11">
        <div className="bg-border-soft absolute inset-x-0 top-1/2 h-[3px] -translate-y-1/2 rounded-full" />
        <div
          className="bg-primary absolute top-1/2 h-[3px] -translate-y-1/2 rounded-full"
          style={{ left: `${leftPercent}%`, right: `${100 - rightPercent}%` }}
        />

        <input
          id={`${id}-min`}
          type="range"
          min={bounds.min}
          max={bounds.max}
          step={STEP}
          value={value.min}
          aria-label="Preço mínimo em ETH"
          onChange={(event) => {
            const next = Math.min(Number(event.target.value), value.max - STEP)
            onChange({ ...value, min: next })
          }}
          className="range-thumb absolute inset-x-0 top-0 h-11 w-full appearance-none bg-transparent"
        />
        <input
          id={`${id}-max`}
          type="range"
          min={bounds.min}
          max={bounds.max}
          step={STEP}
          value={value.max}
          aria-label="Preço máximo em ETH"
          onChange={(event) => {
            const next = Math.max(Number(event.target.value), value.min + STEP)
            onChange({ ...value, max: next })
          }}
          className="range-thumb absolute inset-x-0 top-0 h-11 w-full appearance-none bg-transparent"
        />
      </div>

      <p className="text-text-secondary mt-3 text-xs">
        Preço: {value.min.toFixed(2).replace('.', ',')} - {value.max.toFixed(2).replace('.', ',')}{' '}
        ETH
      </p>
    </div>
  )
}
