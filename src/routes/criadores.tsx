import { createFileRoute } from '@tanstack/react-router'

import { ComingSoon } from '@/components/layout/ComingSoon'

export const Route = createFileRoute('/criadores')({
  component: () => (
    <ComingSoon
      title="Criadores"
      description="Perfis de artistas, estúdios e comunidades que publicam na Kurio. O design ainda não tem esta tela."
    />
  ),
})
