import { zodResolver } from '@hookform/resolvers/zod'
import { createFileRoute } from '@tanstack/react-router'
import { useForm } from 'react-hook-form'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import type { ChangePasswordValues } from '@/features/auth'
import { changePasswordSchema, useChangePassword } from '@/features/auth'
import { ApiError } from '@/lib/http'

export const Route = createFileRoute('/perfil/seguranca')({
  component: SecurityPage,
})

function SecurityPage() {
  const change = useChangePassword()
  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors },
  } = useForm<ChangePasswordValues>({ resolver: zodResolver(changePasswordSchema), mode: 'onBlur' })

  return (
    <section aria-label="Segurança">
      <h1 className="text-foreground text-base font-bold">Segurança</h1>
      <p className="text-text-secondary mt-2 text-xs">
        Trocar a senha não derruba a sessão atual: só a próxima entrada usa a senha nova.
      </p>

      <form
        className="mt-5 max-w-[420px] space-y-5"
        noValidate
        onSubmit={(event) =>
          void handleSubmit((values) =>
            change.mutate(values, {
              onSuccess: () => reset(),
              // o servidor é quem sabe se a senha atual confere; o erro volta
              // para o campo que o causou, não para um aviso solto no topo
              onError: (error) => {
                if (error instanceof ApiError && error.fields) {
                  for (const [field, message] of Object.entries(error.fields)) {
                    setError(field as keyof ChangePasswordValues, { message })
                  }
                }
              },
            }),
          )(event)
        }
      >
        <PasswordField
          label="Senha atual"
          error={errors.currentPassword?.message}
          {...register('currentPassword')}
        />
        <PasswordField
          label="Nova senha"
          error={errors.newPassword?.message}
          {...register('newPassword')}
        />
        <PasswordField
          label="Confirmar nova senha"
          error={errors.confirmPassword?.message}
          {...register('confirmPassword')}
        />

        {change.isSuccess && (
          <p role="status" className="text-text-accent text-xs">
            Senha alterada.
          </p>
        )}

        <Button type="submit" disabled={change.isPending} className="px-8">
          {change.isPending ? 'Salvando...' : 'Alterar senha'}
        </Button>
      </form>
    </section>
  )
}

function PasswordField({
  label,
  error,
  name,
  ...registration
}: { label: string; error?: string | undefined } & ReturnType<
  ReturnType<typeof useForm<ChangePasswordValues>>['register']
>) {
  const errorId = `${name}-erro`

  return (
    <div>
      <Label htmlFor={name} className="text-foreground block text-xs">
        {label}
      </Label>
      <Input
        id={name}
        name={name}
        type="password"
        autoComplete={name === 'currentPassword' ? 'current-password' : 'new-password'}
        aria-invalid={!!error}
        {...(error ? { 'aria-describedby': errorId } : {})}
        {...registration}
        className="mt-2"
      />
      {error && (
        <p id={errorId} role="alert" className="text-3xs text-danger mt-1">
          {error}
        </p>
      )}
    </div>
  )
}
