'use client'

import React from 'react'

/**
 * Simple regex-based markdown renderer for AI chat messages.
 * Handles: **bold**, *italic*, `code`, ## headers, - unordered lists, 1. ordered lists, line breaks.
 * Returns React.ReactNode (JSX elements) styled for the dark glassmorphism theme.
 */

function parseInline(text: string, keyPrefix: string): React.ReactNode[] {
  const nodes: React.ReactNode[] = []
  let remaining = text
  let idx = 0

  while (remaining.length > 0) {
    // Inline code: `...`
    const inlineCodeMatch = remaining.match(/^`([^`]+)`/)
    if (inlineCodeMatch) {
      nodes.push(
        <code
          key={`${keyPrefix}-c${idx++}`}
          className="rounded bg-white/10 px-1.5 py-0.5 text-emerald-300 text-[13px] font-mono"
        >
          {inlineCodeMatch[1]}
        </code>
      )
      remaining = remaining.slice(inlineCodeMatch[0].length)
      continue
    }

    // Bold: **...**
    const boldMatch = remaining.match(/^\*\*(.+?)\*\*/s)
    if (boldMatch) {
      nodes.push(
        <strong key={`${keyPrefix}-b${idx++}`} className="font-semibold">
          {parseInline(boldMatch[1], `${keyPrefix}-bi${idx}`)}
        </strong>
      )
      remaining = remaining.slice(boldMatch[0].length)
      continue
    }

    // Italic: *...* (single asterisk, not double)
    const italicMatch = remaining.match(/^\*([^*]+?)\*/)
    if (italicMatch) {
      nodes.push(
        <em key={`${keyPrefix}-i${idx++}`} className="italic">
          {parseInline(italicMatch[1], `${keyPrefix}-ii${idx}`)}
        </em>
      )
      remaining = remaining.slice(italicMatch[0].length)
      continue
    }

    // Plain text: everything up to next special character (* or `)
    const plainMatch = remaining.match(/^[^*`]+/)
    if (plainMatch) {
      nodes.push(plainMatch[0])
      remaining = remaining.slice(plainMatch[0].length)
      continue
    }

    // Single character fallback (for stray * or ` that didn't match any pattern)
    nodes.push(remaining[0])
    remaining = remaining.slice(1)
  }

  return nodes.length > 0 ? nodes : ['']
}

export function renderMarkdown(content: string): React.ReactNode {
  // Normalize line endings and collapse 3+ newlines into 2
  const normalized = content.replace(/\r\n/g, '\n').replace(/\n{3,}/g, '\n\n')

  // Split into blocks by double newline
  const blocks = normalized.split(/\n\n+/).filter(b => b.trim())

  const elements: React.ReactNode[] = []
  let gk = 0

  for (const block of blocks) {
    const lines = block.split('\n')
    const bk = `b${gk}`

    // --- Header: single line starting with # ---
    if (lines.length === 1) {
      const headerMatch = lines[0].match(/^(#{1,6})\s+(.+)/)
      if (headerMatch) {
        const level = headerMatch[1].length
        elements.push(
          <div
            key={bk}
            className={level <= 2
              ? 'text-sm font-semibold mt-3 mb-1'
              : 'text-sm font-medium mt-2 mb-0.5'}
          >
            {parseInline(headerMatch[2], `${bk}-h`)}
          </div>
        )
        gk++
        continue
      }
    }

    // --- Unordered list: every non-empty line starts with - or * ---
    const isUnordered = lines.filter(l => l.trim()).every(l => /^[-*]\s/.test(l.trim()))
    if (isUnordered) {
      elements.push(
        <ul key={bk} className="my-1.5 ml-0.5 space-y-1 list-none">
          {lines.filter(l => l.trim()).map((line, i) => {
            const text = line.trim().replace(/^[-*]\s+/, '')
            return (
              <li key={`${bk}-li${i}`} className="text-sm leading-relaxed flex gap-2">
                <span className="text-emerald-400 mt-px shrink-0 select-none">•</span>
                <span>{parseInline(text, `${bk}-t${i}`)}</span>
              </li>
            )
          })}
        </ul>
      )
      gk++
      continue
    }

    // --- Ordered list: every non-empty line starts with N. ---
    const isOrdered = lines.filter(l => l.trim()).every(l => /^\d+\.\s/.test(l.trim()))
    if (isOrdered) {
      elements.push(
        <ol key={bk} className="my-1.5 ml-0.5 space-y-1 list-none">
          {lines.filter(l => l.trim()).map((line, i) => {
            const text = line.trim().replace(/^\d+\.\s+/, '')
            return (
              <li key={`${bk}-li${i}`} className="text-sm leading-relaxed flex gap-2">
                <span className="text-emerald-400 mt-px shrink-0 select-none min-w-[1.25rem]">{i + 1}.</span>
                <span>{parseInline(text, `${bk}-t${i}`)}</span>
              </li>
            )
          })}
        </ol>
      )
      gk++
      continue
    }

    // --- Paragraph: render lines joined with <br> ---
    elements.push(
      <p key={bk} className="text-sm leading-relaxed">
        {lines.map((line, i) => (
          <React.Fragment key={`${bk}-l${i}`}>
            {i > 0 && <br />}
            {parseInline(line, `${bk}-l${i}`)}
          </React.Fragment>
        ))}
      </p>
    )
    gk++
  }

  return <>{elements}</>
}
