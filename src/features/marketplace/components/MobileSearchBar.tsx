import { Search, SlidersHorizontal, X } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

interface MobileSearchBarProps {
  value: string
  onSearch: (term: string) => void
  onOpenFilters: () => void
}

/** Topo do mobile: busca e o botão que abre os filtros em gaveta. */
export function MobileSearchBar({ value, onSearch, onOpenFilters }: MobileSearchBarProps) {
  const [term, setTerm] = useState(value)

  // o campo é local e só vira busca depois de 350ms parado: sem isso cada
  // tecla digitada viraria uma requisição e uma entrada no histórico
  useEffect(() => {
    if (term === value) return
    const id = setTimeout(() => onSearch(term), 350)
    return () => clearTimeout(id)
  }, [term, value, onSearch])

  // mudou por fora (voltar do navegador, limpar filtro): acompanha
  useEffect(() => setTerm(value), [value])

  return (
    <div className="flex items-center gap-3 py-4 md:hidden">
      {/* o foco fica no invólucro, não no campo: o raio é dele, e no campo o
          anel saía quadrado em volta de uma caixa arredondada */}
      <div className="border-border focus-within:outline-primary relative flex-1 rounded-full border focus-within:outline-2 focus-within:outline-offset-2">
        <Search
          className="text-text-secondary pointer-events-none absolute top-1/2 left-4 size-4 -translate-y-1/2"
          strokeWidth={1.75}
        />
        <Label htmlFor="mobile-search" className="sr-only">
          Explorar coleções
        </Label>
        <Input
          id="mobile-search"
          type="search"
          value={term}
          onChange={(event) => setTerm(event.target.value)}
          placeholder="Explorar coleções"
          // o invólucro desenha a pílula e o anel de foco. O Chrome põe um X
          // próprio no type=search; some com ele, já temos o nosso, que
          // também limpa o filtro
          className="rounded-none border-0 py-3 pr-10 pl-11 [&::-webkit-search-cancel-button]:appearance-none"
        />
        {term && (
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={() => {
              setTerm('')
              onSearch('')
            }}
            aria-label="Limpar busca"
            className="hover:text-text-accent absolute top-1/2 right-4 -translate-y-1/2"
          >
            <X className="size-4" />
          </Button>
        )}
      </div>

      <Button
        size="icon"
        onClick={onOpenFilters}
        aria-label="Abrir filtros"
        className="rounded-input size-11 shrink-0"
      >
        <SlidersHorizontal className="size-5" strokeWidth={1.75} />
      </Button>
    </div>
  )
}
