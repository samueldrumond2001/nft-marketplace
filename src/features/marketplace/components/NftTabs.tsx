import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import type { NftDetail } from '../model/nft'

export function NftTabs({ nft }: { nft: NftDetail }) {
  return (
    <Tabs defaultValue="details" className="mt-16">
      <TabsList aria-label="Informações do NFT">
        <TabsTrigger value="details">Detalhes do NFT</TabsTrigger>
        <TabsTrigger value="reviews">Avaliações de colecionadores ({nft.ratingCount})</TabsTrigger>
      </TabsList>

      <TabsContent value="details">
        <p className="text-text-secondary max-w-[1060px] text-xs">
          {nft.name} é uma obra digital finalizada à mão da coleção Kurio Editions. Cada atributo
          fica armazenado nos metadados do token e verificado na Ethereum. A obra explora
          identidade, movimento e luz em um mundo digital sem fronteiras.
        </p>
        <p className="text-text-secondary mt-5 max-w-[1060px] text-xs">
          A propriedade inclui a arte em alta resolução, lançamentos exclusivos para colecionadores
          e um registro permanente de procedência registrada na rede. O criador recebe{' '}
          {nft.royaltyPercent}% de direitos autorais nas vendas secundárias, apoiando novos
          trabalhos e lançamentos da comunidade.
        </p>

        <DetailRow title="Rede:">
          Cunhado na Ethereum com procedência imutável e metadados armazenados no IPFS.
        </DetailRow>
        <DetailRow title="Contrato:">
          Direitos autorais do criador: {nft.royaltyPercent}% nas vendas secundárias, pagos
          automaticamente pelos mercados compatíveis.
        </DetailRow>
        <DetailRow title="Direitos autorais:">
          {nft.contractAddress} • Contrato inteligente ERC-721 verificado.
        </DetailRow>
      </TabsContent>

      <TabsContent value="reviews">
        <p className="text-text-secondary text-xs">
          {nft.ratingCount} avaliações, média {nft.ratingAverage.toFixed(1)} de 5.
        </p>
      </TabsContent>
    </Tabs>
  )
}

function DetailRow({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mt-6">
      <h3 className="text-foreground text-xs font-bold">{title}</h3>
      <p className="text-text-secondary mt-1 text-xs">{children}</p>
    </div>
  )
}
