import { zodResolver } from '@hookform/resolvers/zod'
import { Eye, EyeOff, X } from 'lucide-react'
import { cloneElement, useState } from 'react'
import type { UseFormRegisterReturn } from 'react-hook-form'
import { useForm } from 'react-hook-form'

import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { ApiError } from '@/lib/http'
import { cn } from '@/lib/utils'
import { useLogin, useRegister } from '../api/auth'
import type { LoginValues, RegisterValues } from '../model/auth'
import { loginSchema, registerSchema } from '../model/auth'
import { FacebookIcon, GoogleIcon } from './SocialIcons'

export type AuthMode = 'login' | 'register'

interface AuthDialogProps {
  mode: AuthMode
  onModeChange: (mode: AuthMode) => void
  onClose: () => void
  onSuccess: () => void
}

// O design muda de forma entre os dois tamanhos: no desktop é um modal com
// abas sobre a página; no celular é tela cheia, com título e a troca por um
// link no rodapé. Os dois lados usam os mesmos formulários.
const COPY = {
  login: {
    title: 'Entrar',
    subtitle: 'Entre para gerenciar sua carteira, coleção e perfil de criador.',
    switchPrefix: 'Novo na Kurio?',
    switchAction: 'Crie uma conta',
  },
  register: {
    title: 'Criar perfil de colecionador',
    subtitle: 'Crie seu perfil de colecionador e conecte uma carteira quando quiser.',
    switchPrefix: 'Já tem uma conta?',
    switchAction: 'Entre',
  },
} as const

export function AuthDialog({ mode, onModeChange, onClose, onSuccess }: AuthDialogProps) {
  const copy = COPY[mode]
  const other: AuthMode = mode === 'login' ? 'register' : 'login'

  return (
    <Dialog
      open
      onOpenChange={(open) => {
        if (!open) onClose()
      }}
    >
      <DialogContent
        showCloseButton={false}
        className={cn(
          'bg-surface-card gap-0 overflow-y-auto p-0 ring-0',
          // celular: ocupa a tela inteira, sem cantos nem respiro em volta
          'top-0 left-0 h-dvh max-h-dvh w-full max-w-none translate-x-0 translate-y-0 rounded-none',
          // desktop: o modal do design, centrado
          'sm:rounded-modal sm:top-1/2 sm:left-1/2 sm:h-auto sm:max-h-[calc(100dvh-2rem)] sm:max-w-[500px] sm:-translate-x-1/2 sm:-translate-y-1/2',
        )}
      >
        <DialogClose
          aria-label="Fechar"
          render={
            <Button
              variant="ghost"
              size="icon-sm"
              className="hover:text-text-accent absolute top-4 right-4 z-10"
            />
          }
        >
          <X className="size-4" />
        </DialogClose>

        <div className="flex flex-1 flex-col justify-center px-8 py-12 sm:px-10 sm:py-10">
          <p className="text-foreground text-heading mb-14 text-center font-bold tracking-[0.18em] sm:hidden">
            KURIO
          </p>

          {/* desktop: abas */}
          <div
            role="tablist"
            aria-label="Entrar ou criar conta"
            className="hidden items-center justify-center gap-3 text-lg sm:flex"
          >
            <Tab active={mode === 'login'} onClick={() => onModeChange('login')}>
              Entrar
            </Tab>
            <span aria-hidden className="text-border-soft">
              |
            </span>
            <Tab active={mode === 'register'} onClick={() => onModeChange('register')}>
              Criar conta
            </Tab>
          </div>

          {/* O nome acessível do diálogo vem daqui: `aria-labelledby` tem
              precedência sobre `aria-label`, então o título é curto e estável
              enquanto o texto visível do celular pode ser mais longo. */}
          <DialogTitle className="sr-only">
            {mode === 'login' ? 'Entrar' : 'Criar conta'}
          </DialogTitle>

          {/* celular: título */}
          <h2 className="text-foreground text-md text-center font-bold sm:hidden">{copy.title}</h2>

          <DialogDescription className="text-text-secondary mt-4 text-center text-xs">
            {copy.subtitle}
          </DialogDescription>

          {mode === 'login' ? (
            <LoginForm onSuccess={onSuccess} />
          ) : (
            <RegisterForm onSuccess={onSuccess} />
          )}

          <div className="border-border mt-8 flex items-center border-t pt-4">
            <span className="bg-surface-card text-text-secondary mx-auto -mt-7 px-3 text-xs">
              Ou continue com
            </span>
          </div>

          <div className="space-y-2.5">
            <SocialButton label="Continuar com Google" icon={<GoogleIcon className="size-4" />} />
            <SocialButton
              label="Continuar com Facebook"
              icon={<FacebookIcon className="size-4" />}
            />
          </div>

          {/* celular: troca pelo rodapé, como no design */}
          <p className="text-text-secondary mt-8 text-center text-xs sm:hidden">
            {copy.switchPrefix}{' '}
            <Button
              variant="link"
              size="sm"
              onClick={() => onModeChange(other)}
              className="h-auto p-0 text-xs"
            >
              {copy.switchAction}
            </Button>
          </p>
        </div>

        <div className="bg-primary h-1.5 shrink-0" />
      </DialogContent>
    </Dialog>
  )
}

function Tab({
  active,
  onClick,
  children,
}: {
  active: boolean
  onClick: () => void
  children: string
}) {
  return (
    <Button
      variant="ghost"
      role="tab"
      onClick={onClick}
      aria-selected={active}
      tabIndex={active ? 0 : -1}
      className={cn(
        'h-auto p-0 text-lg',
        active ? 'text-text-accent' : 'text-foreground hover:text-text-accent',
      )}
    >
      {children}
    </Button>
  )
}

function LoginForm({ onSuccess }: { onSuccess: () => void }) {
  const login = useLogin()
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginValues>({ resolver: zodResolver(loginSchema), mode: 'onBlur' })

  const failure = login.error instanceof ApiError ? login.error.message : null

  return (
    <form
      className="mt-6 space-y-3"
      noValidate
      onSubmit={(event) =>
        void handleSubmit((values) => login.mutate(values, { onSuccess }))(event)
      }
    >
      <Field label="E-mail" placeholder="contato@email.com" error={errors.email?.message}>
        <Input type="email" {...register('email')} />
      </Field>
      <Password
        label="Senha"
        error={errors.password?.message}
        registration={register('password')}
      />

      <p className="text-right">
        <a href="#" className="text-text-accent text-xs hover:underline">
          Esqueceu a senha?
        </a>
      </p>

      {failure && (
        <p role="alert" className="text-3xs text-danger">
          {failure}
        </p>
      )}

      <Button type="submit" disabled={login.isPending} className="w-full">
        {login.isPending ? 'Entrando...' : 'Entrar'}
      </Button>
    </form>
  )
}

function RegisterForm({ onSuccess }: { onSuccess: () => void }) {
  const createAccount = useRegister()
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<RegisterValues>({ resolver: zodResolver(registerSchema), mode: 'onBlur' })

  const failure = createAccount.error instanceof ApiError ? createAccount.error.message : null

  return (
    <form
      className="mt-6 space-y-3"
      noValidate
      onSubmit={(event) =>
        void handleSubmit((values) =>
          createAccount.mutate(values, {
            onSuccess,
            // 409 de e-mail já cadastrado vem com o campo culpado; o erro
            // aparece ao lado dele, não só numa linha solta no rodapé
            onError: (error) => {
              if (error instanceof ApiError && error.fields) {
                for (const [field, message] of Object.entries(error.fields)) {
                  setError(field as keyof RegisterValues, { message })
                }
              }
            },
          }),
        )(event)
      }
    >
      <Field label="Nome de usuário" placeholder="Nome de usuário" error={errors.username?.message}>
        <Input {...register('username')} />
      </Field>
      <Field label="E-mail" placeholder="Digite seu e-mail" error={errors.email?.message}>
        <Input type="email" {...register('email')} />
      </Field>
      <Password
        label="Senha"
        error={errors.password?.message}
        registration={register('password')}
      />
      <Password
        label="Confirmar senha"
        error={errors.confirmPassword?.message}
        registration={register('confirmPassword')}
      />

      {failure && (
        <p role="alert" className="text-3xs text-danger">
          {failure}
        </p>
      )}

      <Button type="submit" disabled={createAccount.isPending} className="w-full">
        {createAccount.isPending ? 'Criando...' : 'Criar conta'}
      </Button>
    </form>
  )
}

/*
 * O design não desenha rótulo acima do campo, só o placeholder. Para o leitor
 * de tela isso não basta: o rótulo vai em `aria-label` e o erro é ligado por
 * `aria-describedby`. Clonar aqui evita repetir os dois em cada campo.
 */
function Field({
  label,
  placeholder,
  error,
  children,
}: {
  label: string
  placeholder: string
  error?: string | undefined
  children: React.ReactElement<React.ComponentProps<'input'>>
}) {
  const errorId = `${label}-erro`

  return (
    <div>
      {cloneElement(children, {
        placeholder,
        'aria-label': label,
        'aria-invalid': !!error,
        ...(error ? { 'aria-describedby': errorId } : {}),
      })}
      {error && (
        <p id={errorId} role="alert" className="text-3xs text-danger mt-1">
          {error}
        </p>
      )}
    </div>
  )
}

function Password({
  label,
  error,
  registration,
}: {
  label: string
  error?: string | undefined
  registration: UseFormRegisterReturn
}) {
  const [visible, setVisible] = useState(false)
  const errorId = `${label}-erro`

  return (
    <div>
      <div className="relative">
        <Input
          type={visible ? 'text' : 'password'}
          placeholder={label}
          aria-label={label}
          aria-invalid={!!error}
          {...(error ? { 'aria-describedby': errorId } : {})}
          {...registration}
          className="pr-10"
        />
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={() => setVisible((current) => !current)}
          aria-label={visible ? `Ocultar ${label.toLowerCase()}` : `Mostrar ${label.toLowerCase()}`}
          className="hover:text-text-accent absolute top-1/2 right-3 -translate-y-1/2"
        >
          {visible ? <Eye className="size-4" /> : <EyeOff className="size-4" />}
        </Button>
      </div>
      {error && (
        <p id={errorId} role="alert" className="text-3xs text-danger mt-1">
          {error}
        </p>
      )}
    </div>
  )
}

function SocialButton({ label, icon }: { label: string; icon: React.ReactNode }) {
  return (
    <Button
      variant="ghost"
      className="border-border text-foreground rounded-input hover:border-border-soft w-full justify-center gap-3 border py-2.5 text-xs"
    >
      {icon}
      {label}
    </Button>
  )
}
