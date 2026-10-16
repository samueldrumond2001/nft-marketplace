import { ArrowRight } from 'lucide-react'

import { ArtImage } from '@/components/ui/ArtImage'

// Conteúdo fixo no design; vira dado quando houver um endpoint de posts.
const POSTS = [
  {
    art: 'ivory-baron',
    date: '12 de setembro',
    reading: 'Leitura de 6 min',
    title: 'Como funciona a propriedade de NFTs',
    text: 'Aprenda a colecionar, negociar e verificar ativos digitais.',
  },
  {
    art: 'emerald-ape',
    date: '13 de setembro',
    reading: 'Leitura de 2 min',
    title: '10 artistas digitais para acompanhar',
    text: 'Conheça criadores que moldam a cultura digital.',
  },
  {
    art: 'sage-nomad',
    date: '15 de setembro',
    reading: 'Leitura de 3 min',
    title: 'Raridade, atributos e procedência',
    text: 'Entenda raridade, procedência, direitos autorais e utilidade.',
  },
  {
    art: 'golden-beat',
    date: '15 de setembro',
    reading: 'Leitura de 2 min',
    title: 'Como proteger sua carteira',
    text: 'Proteja sua carteira, seus ativos e sua identidade.',
  },
] as const

export function JournalSection() {
  return (
    <section aria-label="Diário da Cunhagem" className="mt-16">
      <h2 className="text-foreground text-heading text-center">Diário da Cunhagem</h2>
      <p className="text-text-secondary text-3xs mt-3 text-center">
        Histórias, guias e insights para colecionadores sobre o universo da propriedade digital.
      </p>

      <ul className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {POSTS.map((post) => (
          <li key={post.title} className="bg-surface-card rounded-card overflow-hidden">
            <ArtImage
              art={post.art}
              alt=""
              width={268}
              height={160}
              sizes="(min-width: 1024px) 268px, 45vw"
              className="aspect-[268/160] w-full object-cover"
            />

            <div className="px-4 py-4">
              <p className="text-text-secondary text-micro">
                {post.date} <span aria-hidden>|</span> {post.reading}
              </p>
              <h3 className="text-foreground mt-2 text-xs leading-snug font-bold">{post.title}</h3>
              <p className="text-text-secondary text-micro mt-2">{post.text}</p>
              <a
                href="#"
                className="text-text-accent text-micro mt-3 inline-flex items-center gap-1.5"
              >
                Ler mais
                <ArrowRight className="size-3" strokeWidth={2} />
                <span className="sr-only">sobre {post.title}</span>
              </a>
            </div>
          </li>
        ))}
      </ul>
    </section>
  )
}
