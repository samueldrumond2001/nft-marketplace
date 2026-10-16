import { useQuery } from '@tanstack/react-query'
import { createFileRoute } from '@tanstack/react-router'
import { useState } from 'react'

import { NETWORKS } from '@/features/checkout'
import type { Wallet } from '@/features/auth'
import { useCreateWallet, useUpdateWallet, walletsQuery } from '@/features/auth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export const Route = createFileRoute('/perfil/carteiras')({
  loader: ({ context }) => context.queryClient.ensureQueryData(walletsQuery),
  component: WalletsPage,
})

function WalletsPage() {
  const { data: wallets } = useQuery(walletsQuery)
  const create = useCreateWallet()
  const [editing, setEditing] = useState<string | null>(null)

  return (
    <section aria-label="Carteiras">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-foreground text-base font-bold">Carteira principal</h1>
          <p className="text-text-secondary mt-1 text-xs">
            Estas carteiras ficam disponíveis no pagamento e para receber NFTs comprados.
          </p>
        </div>
      </div>

      <form
        className="mt-5"
        onSubmit={(event) => {
          event.preventDefault()
          const form = event.currentTarget
          const data = new FormData(form)
          create.mutate(
            {
              nickname: text(data, 'nickname'),
              address: text(data, 'address'),
              network: text(data, 'network'),
              profileName: text(data, 'profileName'),
            },
            { onSuccess: () => form.reset() },
          )
        }}
      >
        <div className="grid gap-x-10 gap-y-5 sm:grid-cols-2">
          <Field label="Apelido da carteira" name="nickname" required />
          <Field label="Nome do perfil" name="profileName" required />

          <div>
            <Label htmlFor="network" className="text-foreground block text-xs">
              Rede
              <span className="text-danger" aria-hidden>
                *
              </span>
            </Label>
            <select
              id="network"
              name="network"
              required
              defaultValue=""
              className="border-border text-text-secondary rounded-input mt-2 w-full border bg-transparent px-3 py-2 text-xs"
            >
              <option value="" disabled>
                Selecione uma rede
              </option>
              {NETWORKS.map((network) => (
                <option key={network.value} value={network.value}>
                  {network.label}
                </option>
              ))}
            </select>
          </div>

          <Field
            label="Endereço da carteira"
            name="address"
            placeholder="Endereço 0x da carteira"
            required
          />
        </div>

        <Button type="submit" disabled={create.isPending} className="mt-8 px-8">
          {create.isPending ? 'Salvando...' : 'Salvar carteira'}
        </Button>
      </form>

      <h2 className="text-foreground mt-12 text-base font-bold">Carteiras cadastradas</h2>
      {!wallets || wallets.length === 0 ? (
        <p className="text-text-secondary mt-2 text-xs">
          Você ainda não adicionou uma carteira secundária.
        </p>
      ) : (
        <ul className="mt-4 space-y-2">
          {wallets.map((wallet) => (
            <li key={wallet.id} className="bg-surface-card rounded-card px-4 py-3">
              {editing === wallet.id ? (
                <WalletEditor wallet={wallet} onDone={() => setEditing(null)} />
              ) : (
                <div className="flex items-center justify-between gap-4">
                  <div className="min-w-0">
                    <p className="text-foreground text-xs font-bold">
                      {wallet.nickname}
                      {wallet.primary && (
                        <span className="text-text-accent text-micro ml-2">principal</span>
                      )}
                    </p>
                    <p className="text-text-secondary text-micro truncate">
                      {wallet.address} · {wallet.network}
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setEditing(wallet.id)}
                    aria-label={`Editar ${wallet.nickname}`}
                  >
                    Editar
                  </Button>
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}

function Field({
  label,
  name,
  placeholder,
  required,
  defaultValue,
  // o formulário de cadastro e o de edição coexistem na página; sem prefixo os
  // dois teriam campos com o mesmo id e o rótulo apontaria para o errado
  idPrefix = '',
}: {
  label: string
  name: string
  placeholder?: string
  required?: boolean
  defaultValue?: string
  idPrefix?: string
}) {
  const id = `${idPrefix}${name}`

  return (
    <div>
      <Label htmlFor={id} className="text-foreground block text-xs">
        {label}
        {required && (
          <span className="text-danger" aria-hidden>
            *
          </span>
        )}
      </Label>
      <Input
        id={id}
        name={name}
        placeholder={placeholder}
        required={required}
        defaultValue={defaultValue}
        className="mt-2"
      />
    </div>
  )
}

/** FormData devolve string | File; aqui só existem campos de texto. */
function text(data: FormData, name: string): string {
  const value = data.get(name)
  return typeof value === 'string' ? value : ''
}

/*
 * Edição acontece na própria linha, não numa tela à parte: são três campos e
 * a lista ao lado é a referência de quem é quem.
 */
function WalletEditor({ wallet, onDone }: { wallet: Wallet; onDone: () => void }) {
  const update = useUpdateWallet()

  return (
    <form
      aria-label={`Editar ${wallet.nickname}`}
      onSubmit={(event) => {
        event.preventDefault()
        const data = new FormData(event.currentTarget)
        update.mutate(
          {
            id: wallet.id,
            nickname: text(data, 'nickname'),
            address: text(data, 'address'),
            network: text(data, 'network'),
            primary: data.get('primary') === 'on',
          },
          { onSuccess: onDone },
        )
      }}
    >
      <div className="grid gap-3 sm:grid-cols-3">
        <Field
          label="Apelido"
          name="nickname"
          defaultValue={wallet.nickname}
          idPrefix={`${wallet.id}-`}
          required
        />
        <Field
          label="Endereço"
          name="address"
          defaultValue={wallet.address}
          idPrefix={`${wallet.id}-`}
          required
        />
        <div>
          <Label htmlFor={`network-${wallet.id}`} className="text-foreground block text-xs">
            Rede
          </Label>
          <select
            id={`network-${wallet.id}`}
            name="network"
            defaultValue={wallet.network}
            className="border-border text-text-secondary rounded-input mt-2 w-full border bg-transparent px-3 py-2 text-xs"
          >
            {NETWORKS.map((network) => (
              <option key={network.value} value={network.value} className="bg-surface-card">
                {network.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <Label className="text-text-secondary mt-3 gap-2 text-xs">
        <input
          type="checkbox"
          name="primary"
          defaultChecked={wallet.primary}
          className="accent-primary size-3.5"
        />
        Usar como carteira principal
      </Label>

      <div className="mt-4 flex gap-2">
        <Button type="submit" size="sm" disabled={update.isPending}>
          {update.isPending ? 'Salvando...' : 'Salvar'}
        </Button>
        <Button variant="ghost" size="sm" onClick={onDone}>
          Cancelar
        </Button>
      </div>
    </form>
  )
}
