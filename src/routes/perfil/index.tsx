import { useQuery } from '@tanstack/react-query'
import { createFileRoute } from '@tanstack/react-router'
import { useState } from 'react'

import { meQuery, useUpdateProfile } from '@/features/auth'
import { ArtImage } from '@/components/ui/ArtImage'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupChip } from '@/components/ui/radio-group'
import { cn } from '@/lib/utils'

// O design não tem upload de imagem, e inventar um seria sair dele. As artes
// da própria casa servem de avatar: é o que uma galeria de NFT faria mesmo.
const AVATARS = ['emerald-ape', 'sage-nomad', 'ivory-baron', 'golden-beat'] as const

export const Route = createFileRoute('/perfil/')({
  component: ProfileDataPage,
})

function ProfileDataPage() {
  const { data: user } = useQuery(meQuery)
  const update = useUpdateProfile()
  const [saved, setSaved] = useState(false)

  if (!user) return null

  return (
    <section aria-label="Perfil do colecionador">
      <h1 className="text-foreground text-base font-bold">Perfil do colecionador</h1>

      <AvatarPicker
        value={user.avatar}
        onChange={(avatar) => update.mutate({ avatar }, { onSuccess: () => setSaved(true) })}
      />

      <form
        className="mt-5"
        onSubmit={(event) => {
          event.preventDefault()
          const data = new FormData(event.currentTarget)
          update.mutate(
            {
              displayName: text(data, 'displayName'),
              username: text(data, 'username'),
              email: text(data, 'email'),
              ensName: text(data, 'ensName'),
              walletNickname: text(data, 'walletNickname'),
            },
            { onSuccess: () => setSaved(true) },
          )
        }}
      >
        <div className="grid gap-x-10 gap-y-5 sm:grid-cols-2">
          <Field
            label="Nome de exibição"
            name="displayName"
            defaultValue={user.displayName}
            required
          />
          <Field label="Nome de usuário" name="username" defaultValue={user.username} required />
          <Field label="E-mail" name="email" type="email" defaultValue={user.email} required />
          <Field label="Nome ENS" name="ensName" defaultValue={user.ensName ?? ''} required />
          <Field
            label="Apelido da carteira"
            name="walletNickname"
            defaultValue={user.walletNickname ?? ''}
            required
          />
        </div>

        {saved && !update.isPending && (
          <p role="status" className="text-text-accent mt-4 text-xs">
            Perfil salvo.
          </p>
        )}

        <Button type="submit" disabled={update.isPending} className="mt-8 px-8">
          {update.isPending ? 'Salvando...' : 'Salvar'}
        </Button>
      </form>
    </section>
  )
}

function Field({
  label,
  name,
  defaultValue,
  type = 'text',
  required,
}: {
  label: string
  name: string
  defaultValue: string
  type?: string
  required?: boolean
}) {
  return (
    <div>
      <Label htmlFor={name} className="text-foreground block text-xs">
        {label}
        {required && (
          <span className="text-danger" aria-hidden>
            *
          </span>
        )}
      </Label>
      <Input
        id={name}
        name={name}
        type={type}
        defaultValue={defaultValue}
        required={required}
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

function AvatarPicker({
  value,
  onChange,
}: {
  value: string | null
  onChange: (avatar: string | null) => void
}) {
  return (
    <div className="mt-5">
      <p className="text-foreground text-xs font-bold">Avatar</p>
      <RadioGroup
        aria-label="Avatar"
        value={value ?? 'none'}
        onValueChange={(next) => onChange(next === 'none' ? null : String(next))}
        className="mt-3 flex flex-wrap items-center gap-3"
      >
        {AVATARS.map((art) => (
          <RadioGroupChip
            key={art}
            value={art}
            aria-label={art.replace('-', ' ')}
            className={cn(
              'size-14 overflow-hidden rounded-full border-2 p-0',
              value === art && 'border-primary',
            )}
          >
            <ArtImage
              art={art}
              alt=""
              width={56}
              height={56}
              sizes="56px"
              className="size-full object-cover"
            />
          </RadioGroupChip>
        ))}

        <RadioGroupChip value="none" className="text-3xs px-3 py-2">
          Sem avatar
        </RadioGroupChip>
      </RadioGroup>
    </div>
  )
}
