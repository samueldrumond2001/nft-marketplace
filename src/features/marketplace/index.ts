// Superfície pública da feature. O resto é interno (regra no eslint.config.js).
export { nftDetailQuery, nftListQuery, nftsByIdQuery, relatedNftsQuery } from './api/queries'
export { CatalogSection } from './components/CatalogSection'
export { CatalogToolbar } from './components/CatalogToolbar'
export { EditionPicker } from './components/EditionPicker'
export { FeaturedCard } from './components/FeaturedCard'
export { FiltersSidebar } from './components/FiltersSidebar'
export { Hero } from './components/Hero'
export { JournalSection } from './components/JournalSection'
export { PromoCards } from './components/PromoCards'
export { MobileSearchBar } from './components/MobileSearchBar'
export { NftCard, NftCardSkeleton } from './components/NftCard'
export { NftGallery } from './components/NftGallery'
export { NftTabs } from './components/NftTabs'
export { RelatedCarousel } from './components/RelatedCarousel'
export { Pagination } from './components/Pagination'
export {
  CATALOG_TABS,
  NETWORK_LABEL,
  SORT_OPTIONS,
  nftDetailSchema,
  nftListSchema,
  nftSummarySchema,
} from './model/nft'
export { catalogSearchSchema, toCatalogFilters } from './model/search'
export type { CatalogSearch } from './model/search'
export type {
  CatalogFilterPatch,
  CatalogFilters,
  CatalogTab,
  Edition,
  Facet,
  Network,
  NftDetail,
  NftList,
  NftSummary,
  SortOption,
} from './model/nft'
