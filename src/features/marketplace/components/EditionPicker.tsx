import { RadioGroup, RadioGroupChip } from '@/components/ui/radio-group'
import type { Edition } from '../model/nft'

interface EditionPickerProps {
  editions: Edition[]
  value: string
  onChange: (editionId: string) => void
}

// radiogroup, não botões soltos: escolha única e setas funcionam.
// Esgotada fica desabilitada, não escondida.
export function EditionPicker({ editions, value, onChange }: EditionPickerProps) {
  return (
    <RadioGroup
      aria-label="Edição"
      value={value}
      onValueChange={(next) => onChange(String(next))}
      className="flex flex-wrap items-center gap-2.5"
    >
      {editions.map((edition) => {
        const soldOut = edition.remaining === 0

        return (
          <RadioGroupChip key={edition.id} value={edition.id} disabled={soldOut}>
            {edition.label}
            {soldOut && <span className="sr-only"> (esgotada)</span>}
          </RadioGroupChip>
        )
      })}
    </RadioGroup>
  )
}
