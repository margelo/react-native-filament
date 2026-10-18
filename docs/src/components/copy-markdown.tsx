'use client'

import { Check, Copy } from 'lucide-react'
import { useState } from 'react'

export function CopyMarkdown({ markdown }: { markdown: string }) {
  const [copied, setCopied] = useState(false)
  const copy = () =>
    navigator.clipboard.writeText(markdown).then(() => {
      setCopied(true)
    })
  return (
    <button
      type="button"
      onClick={copy}
      onBlur={() => setCopied(false)}
      className="inline-flex items-center gap-2 rounded-lg border bg-fd-secondary px-2.5 py-1.5 text-xs font-medium text-fd-secondary-foreground transition-colors hover:bg-fd-accent"
    >
      {copied ? <Check className="size-3.5" /> : <Copy className="size-3.5" />}
      {copied ? 'Copied' : 'Copy Markdown'}
    </button>
  )
}
