import { Facebook, Instagram, Linkedin, Twitter, Youtube } from 'lucide-react'

import { Container } from './Container'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

// Os selos são letras no Figma (placeholder de ícone). Mantidos assim.
const FEATURES = [
  {
    mark: 'W',
    title: 'Segurança da carteira',
    text: 'Proteja sua carteira e colecione arte digital verificada com confiança.',
  },
  {
    mark: 'C',
    title: 'Criadores em destaque',
    text: 'Conheça artistas, estúdios e comunidades que moldam a cultura digital na rede.',
  },
  {
    mark: 'D',
    title: 'Alertas de lançamentos',
    text: 'Receba calendários de cunhagem, novidades de listas de acesso e análises do mercado.',
  },
] as const

const LINK_COLUMNS = [
  {
    title: 'Meu perfil',
    links: ['Meu perfil', 'Minha coleção', 'Atividade', 'Estúdio do criador', 'Lista de interesse'],
  },
  {
    title: 'Central de ajuda',
    links: [
      'Central de ajuda',
      'Como comprar NFTs',
      'Carteira e segurança',
      'Política do mercado',
      'Denunciar item',
    ],
  },
  {
    title: 'Coleções',
    links: ['Arte digital', 'Fotografia', 'Música', 'Arte 3D', 'Utilidade'],
  },
] as const

const SOCIAL = [
  { Icon: Facebook, label: 'Facebook' },
  { Icon: Instagram, label: 'Instagram' },
  { Icon: Twitter, label: 'Twitter' },
  { Icon: Linkedin, label: 'LinkedIn' },
  { Icon: Youtube, label: 'YouTube' },
] as const

export function Footer() {
  return (
    <footer className="pb-6">
      <Container>
        <div className="bg-surface-card rounded-card overflow-hidden">
          {/* 3 colunas de 266px + newsletter de 306px, dentro dos 1200 */}
          <div className="grid gap-10 p-8 lg:grid-cols-[repeat(3,minmax(0,1fr))_minmax(0,1.15fr)] lg:gap-0">
            {FEATURES.map((feature, index) => (
              <div
                key={feature.mark}
                className={index > 0 ? 'border-border-soft lg:border-l lg:pl-6' : ''}
              >
                <span
                  aria-hidden
                  className="bg-primary text-ink text-heading flex size-[65px] items-center justify-center rounded-full font-bold"
                >
                  {feature.mark}
                </span>
                <h3 className="text-foreground mt-6 text-base font-bold">{feature.title}</h3>
                <p className="text-text-secondary mt-3 max-w-[215px] text-xs">{feature.text}</p>
              </div>
            ))}

            <div className="border-border-soft lg:border-l lg:pl-6">
              <h3 className="text-foreground text-md font-bold">
                Antecipe-se ao próximo lançamento
              </h3>
              {/* a borda e o anel de foco ficam no invólucro: campo e botão são
                  um controle só no design, e destacar só o campo parecia quebrado */}
              <form
                className="border-border-soft rounded-btn focus-within:outline-primary mt-4 flex overflow-hidden border focus-within:outline-2 focus-within:outline-offset-2"
                onSubmit={(event) => {
                  event.preventDefault()
                }}
              >
                <Label htmlFor="newsletter-email" className="sr-only">
                  Seu e-mail
                </Label>
                <Input
                  id="newsletter-email"
                  type="email"
                  placeholder="digite seu e-mail..."
                  // dentro de um invólucro que já desenha a borda
                  className="bg-surface-dark/60 rounded-none border-0 py-2.5"
                />
                <Button type="submit" size="attached" className="shrink-0">
                  Enviar
                </Button>
              </form>
              <p className="text-text-secondary mt-4 text-xs">
                Receba lançamentos selecionados, histórias de criadores e novidades do mercado.
              </p>
            </div>
          </div>

          <div className="bg-surface-dark grid gap-4 px-8 py-6 text-xs sm:grid-cols-2 lg:grid-cols-4 lg:items-center">
            <span className="text-foreground font-bold tracking-[0.18em]">KURIO</span>
            <span className="text-text-secondary">
              Feito para colecionadores, criadores e cultura
            </span>
            <a
              href="mailto:contato@email.com"
              className="text-text-secondary hover:text-text-accent"
            >
              contato@email.com
            </a>
            <a href="tel:+551140028922" className="text-text-secondary hover:text-text-accent">
              +55 11 4002 8922
            </a>
          </div>

          <div className="grid gap-10 p-8 sm:grid-cols-2 lg:grid-cols-4">
            {LINK_COLUMNS.map((column) => (
              <nav key={column.title} aria-label={column.title}>
                <h3 className="text-foreground text-md font-bold">{column.title}</h3>
                <ul className="mt-5 space-y-3">
                  {column.links.map((link) => (
                    <li key={link}>
                      <a href="#" className="text-text-secondary hover:text-text-accent text-xs">
                        {link}
                      </a>
                    </li>
                  ))}
                </ul>
              </nav>
            ))}

            <div>
              <h3 className="text-foreground text-md font-bold">Redes sociais</h3>
              <ul className="mt-5 flex gap-2.5">
                {SOCIAL.map(({ Icon, label }) => (
                  <li key={label}>
                    <a
                      href="#"
                      aria-label={label}
                      className="border-primary text-primary hover:bg-primary hover:text-ink rounded-input flex size-[30px] items-center justify-center border transition-colors"
                    >
                      <Icon className="size-3.5" strokeWidth={1.75} />
                    </a>
                  </li>
                ))}
              </ul>

              <h3 className="text-foreground text-md mt-8 font-bold">Carteiras compatíveis</h3>
              <div className="border-border-soft text-text-secondary rounded-input text-micro mt-4 flex items-center gap-2 border px-3 py-2 tracking-[0.1em]">
                <span>METAMASK</span>
                <span aria-hidden>·</span>
                <span>WALLETCONNECT</span>
                <span aria-hidden>·</span>
                <span>COINBASE</span>
              </div>
            </div>
          </div>
        </div>

        <p className="text-text-secondary mt-6 text-center text-xs">
          © 2026 Kurio. Propriedade digital para todos.
        </p>
      </Container>
    </footer>
  )
}
