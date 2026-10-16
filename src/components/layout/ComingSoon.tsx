import { Link } from '@tanstack/react-router'

import { Container } from './Container'

/**
 * O Figma traz Criadores e Aprenda na navegação, mas não tem tela para
 * nenhum dos dois. Em vez de um link que parece quebrado ou de sumir com o
 * item e descolar do design, a rota existe e diz o que é.
 */
export function ComingSoon({ title, description }: { title: string; description: string }) {
  return (
    <Container className="py-24 text-center">
      <p className="text-text-accent text-xs font-bold tracking-[0.18em]">EM BREVE</p>
      <h1 className="text-foreground text-heading mt-4">{title}</h1>
      <p className="text-text-secondary mx-auto mt-4 max-w-[460px] text-xs">{description}</p>
      <Link
        to="/mercado"
        className="bg-primary text-ink rounded-btn mt-10 inline-block px-6 py-2.5 text-xs font-bold tracking-[0.06em]"
      >
        IR PARA O MERCADO
      </Link>
    </Container>
  )
}
