import { zodResolver } from '@hookform/resolvers/zod'
import { useId } from 'react'
import { useForm, type UseFormRegisterReturn } from 'react-hook-form'

import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'
import type { CheckoutForm as CheckoutValues } from '../model/checkout'
import { NETWORKS, WALLET_TYPES, checkoutFormSchema } from '../model/checkout'

interface CheckoutFormProps {
  formId: string
  onSubmit: (values: CheckoutValues) => void
}

export function CheckoutForm({ formId, onSubmit }: CheckoutFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<CheckoutValues>({
    resolver: zodResolver(checkoutFormSchema),
    mode: 'onBlur',
  })

  return (
    <form
      id={formId}
      noValidate
      aria-labelledby={`${formId}-title`}
      onSubmit={(e) => void handleSubmit(onSubmit)(e)}
    >
      <h2 id={`${formId}-title`} className="text-foreground text-base font-bold">
        Perfil do colecionador
      </h2>

      <div className="mt-4 grid gap-x-6 gap-y-5 sm:grid-cols-2">
        <Field label="Nome de exibição" required error={errors.displayName?.message}>
          {(props) => <Input {...register('displayName')} {...props} />}
        </Field>
        <Field label="Nome de usuário" required error={errors.username?.message}>
          {(props) => <Input {...register('username')} {...props} />}
        </Field>

        <Field label="Rede" required error={errors.network?.message}>
          {(props) => (
            <Select {...register('network')} {...props} defaultValue="">
              <option value="" disabled>
                Selecione uma rede
              </option>
              {NETWORKS.map((network) => (
                <option key={network.value} value={network.value}>
                  {network.label}
                </option>
              ))}
            </Select>
          )}
        </Field>
        <Field label="Nome do perfil" required error={errors.profileName?.message}>
          {(props) => <Input {...register('profileName')} {...props} />}
        </Field>

        <Field label="Endereço da carteira" required error={errors.walletAddress?.message}>
          {(props) => (
            <Input
              placeholder="Endereço 0x da carteira"
              {...register('walletAddress')}
              {...props}
            />
          )}
        </Field>
        <Field label="Carteira secundária" hideLabel error={errors.secondaryWallet?.message}>
          {(props) => (
            <Input
              placeholder="ENS ou carteira secundária (opcional)"
              {...register('secondaryWallet')}
              {...props}
            />
          )}
        </Field>

        <Field label="Tipo de carteira" required error={errors.walletType?.message}>
          {(props) => (
            <Select {...register('walletType')} {...props} defaultValue="">
              <option value="" disabled>
                Selecione uma carteira
              </option>
              {WALLET_TYPES.map((wallet) => (
                <option key={wallet.value} value={wallet.value}>
                  {wallet.label}
                </option>
              ))}
            </Select>
          )}
        </Field>
        <Field label="Código de indicação" required error={errors.referralCode?.message}>
          {(props) => <Input {...register('referralCode')} {...props} />}
        </Field>

        <Field label="E-mail" required error={errors.email?.message}>
          {(props) => <Input type="email" {...register('email')} {...props} />}
        </Field>
        <Field label="Nome ENS" required error={errors.ensName?.message}>
          {(props) => (
            <div className="flex gap-2">
              <span className="border-border text-text-secondary rounded-input flex items-center border px-3 text-xs">
                .eth
              </span>
              <Input className="flex-1" {...register('ensName')} {...props} />
            </div>
          )}
        </Field>
      </div>

      <div className="mt-5">
        <Field label="Observação do colecionador (opcional)" error={errors.note?.message}>
          {(props) => (
            <textarea
              rows={6}
              {...register('note')}
              {...props}
              className="border-border text-foreground rounded-input w-full border bg-transparent px-3 py-2 text-xs"
            />
          )}
        </Field>
      </div>
    </form>
  )
}

interface FieldChildProps {
  id: string
  'aria-invalid': boolean
  'aria-describedby': string | undefined
}

function Field({
  label,
  required,
  hideLabel,
  error,
  children,
}: {
  label: string
  required?: boolean
  hideLabel?: boolean
  error?: string | undefined
  children: (props: FieldChildProps) => React.ReactNode
}) {
  const id = useId()
  const errorId = `${id}-error`

  return (
    <div>
      <Label htmlFor={id} className={cn('text-foreground block text-xs', hideLabel && 'sr-only')}>
        {label}
        {required && (
          <span className="text-danger" aria-hidden>
            *
          </span>
        )}
      </Label>
      <div className={hideLabel ? '' : 'mt-2'}>
        {children({
          id,
          'aria-invalid': !!error,
          'aria-describedby': error ? errorId : undefined,
        })}
      </div>
      {error && (
        <p id={errorId} role="alert" className="text-3xs text-danger mt-1">
          {error}
        </p>
      )}
    </div>
  )
}

type SelectProps = UseFormRegisterReturn &
  FieldChildProps &
  React.SelectHTMLAttributes<HTMLSelectElement>

function Select({ className, children, ...props }: SelectProps) {
  return (
    <select
      {...props}
      className={cn(
        'border-border text-text-secondary rounded-input w-full border bg-transparent px-3 py-2 text-xs',
        'aria-[invalid=true]:border-danger',
        className,
      )}
    >
      {children}
    </select>
  )
}
