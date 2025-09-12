export type TTSEntry = { text: string; index: number }

// Very lightweight extractor for elements with data-tts and optional data-fragment-index
export function extractTTSFromSlideHtml(html: string): TTSEntry[] {
  const entries: TTSEntry[] = []
  const re = /<[^>]*data-tts\s*=\s*"([^"]+)"[^>]*>/gim
  let m: RegExpExecArray | null
  while ((m = re.exec(html))) {
    const fullTag = m[0]
    const text = m[1]
    // fragment index if present
    const fm = fullTag.match(/data-fragment-index\s*=\s*"(\d+)"/i)
    const idx = fm ? parseInt(fm[1], 10) : Number.MAX_SAFE_INTEGER // if not specified, sort to the end preserving HTML order
    entries.push({ text, index: Number.isFinite(idx) ? idx : Number.MAX_SAFE_INTEGER })
  }
  // Stable sort: first by index, then by original order (re.exec yields in-order already)
  return entries.sort((a, b) => a.index - b.index)
}

