import { createFileRoute } from '@tanstack/react-router'

import { ComingSoon } from '@/components/layout/ComingSoon'

export const Route = createFileRoute('/aprenda')({
  component: () => (
    <ComingSoon
      title="Aprenda"
      description="Guias sobre carteiras, cunhagem e procedência, no mesmo tom do Diário da Cunhagem. O design ainda não tem esta tela."
    />
  ),
})
