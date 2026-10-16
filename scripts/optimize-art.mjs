/**
 * Gera as variantes WebP servidas pelo site, a partir das artes em design/assets.
 *
 * As artes vieram de print do Figma, então trazem junto a borda de seleção
 * (azul) e a área escura do canvas. O recorte descarta as linhas e colunas das
 * bordas que são escuras ou azuis, depois corta para quadrado pelo centro.
 *
 * Os originais têm 200-400KB cada; no celular isso pesa mais que todo o
 * JavaScript da página, então nenhum PNG vai para public/.
 */
import { mkdir, readdir, rm, stat } from 'node:fs/promises'
import path from 'node:path'
import process from 'node:process'

import sharp from 'sharp'

const SOURCE = 'design/assets'
const OUTPUT = 'public/nft'
const WIDTHS = [240, 480, 960]

// nome do arquivo de origem -> nome usado pela aplicação
const NAMES = {
  'nft-a-emerald-ape.png': 'emerald-ape',
  'nft-b-sage-nomad.png': 'sage-nomad',
  'nft-c-ivory-baron.png': 'ivory-baron',
  'nft-d-golden-beat.png': 'golden-beat',
}

const DARK = 70 // abaixo disso é moldura, não arte
const COVERAGE = 0.6 // fração da linha/coluna que precisa ser descartável
const INSET = 3 // folga para o antialiasing da borda e o canto arredondado

/** Azul de seleção do Figma e seus vizinhos antialiasados. */
const isBlue = (r, g, b) => b > 90 && b - r > 35 && b - g > 20

async function cropArt(input) {
  const { width, height } = await sharp(input).metadata()
  const { data, info } = await sharp(input).raw().toBuffer({ resolveWithObject: true })
  const ch = info.channels

  // descartável = moldura escura ou borda azul de seleção
  const drop = (i) => {
    const r = data[i]
    const g = data[i + 1]
    const b = data[i + 2]
    return 0.299 * r + 0.587 * g + 0.114 * b < DARK || isBlue(r, g, b)
  }

  const rowRatio = (y) => {
    let n = 0
    for (let x = 0; x < width; x++) if (drop((y * width + x) * ch)) n++
    return n / width
  }

  const colRatio = (x) => {
    let n = 0
    for (let y = 0; y < height; y++) if (drop((y * width + x) * ch)) n++
    return n / height
  }

  let top = 0
  let bottom = height - 1
  let left = 0
  let right = width - 1

  while (top < bottom && rowRatio(top) > COVERAGE) top++
  while (bottom > top && rowRatio(bottom) > COVERAGE) bottom--
  while (left < right && colRatio(left) > COVERAGE) left++
  while (right > left && colRatio(right) > COVERAGE) right--

  top += INSET
  left += INSET
  bottom -= INSET
  right -= INSET

  const w = right - left + 1
  const h = bottom - top + 1
  const side = Math.min(w, h)

  return {
    left: left + Math.floor((w - side) / 2),
    top: top + Math.floor((h - side) / 2),
    width: side,
    height: side,
  }
}

await rm(OUTPUT, { recursive: true, force: true })
await mkdir(OUTPUT, { recursive: true })

const files = (await readdir(SOURCE)).filter((file) => file in NAMES)
let totalBefore = 0
let totalAfter = 0

for (const file of files) {
  const name = NAMES[file]
  const input = path.join(SOURCE, file)
  const before = (await stat(input)).size
  totalBefore += before

  const box = await cropArt(input)
  const art = await sharp(input).extract(box).toBuffer()

  let after = 0
  for (const width of WIDTHS) {
    const output = path.join(OUTPUT, `${name}-${width}.webp`)
    await sharp(art).resize(width, width, { fit: 'cover' }).webp({ quality: 78 }).toFile(output)
    after += (await stat(output)).size
  }

  totalAfter += after
  console.log(
    `${name}: recorte ${box.width}x${box.width}, ` +
      `${Math.round(before / 1024)}KB -> ${Math.round(after / 1024)}KB em 3 larguras`,
  )
}

console.log(
  `total: ${Math.round(totalBefore / 1024)}KB -> ${Math.round(totalAfter / 1024)}KB ` +
    `(${Math.round((1 - totalAfter / totalBefore) * 100)}% menor)`,
)
process.exit(0)
