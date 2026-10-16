// Hiển thị câu trả lời của AI: **in đậm** và gạch đầu dòng, không dùng innerHTML (an toàn)

const BULLET = /^\s*[-*•]\s+/

function renderInline(text, keyPrefix) {
  return text.split(/(\*\*[^*]+\*\*)/g).map((part, index) =>
    part.startsWith('**') && part.endsWith('**') && part.length > 4 ? (
      <strong key={`${keyPrefix}-${index}`} className="font-semibold">
        {part.slice(2, -2)}
      </strong>
    ) : (
      part
    ),
  )
}

export default function FormattedText({ text }) {
  const blocks = []
  for (const rawLine of text.split('\n')) {
    const line = rawLine.replace(/^#+\s*/, '')
    if (!line.trim()) continue
    if (BULLET.test(line)) {
      const last = blocks.at(-1)
      const item = line.replace(BULLET, '')
      if (last?.type === 'list') last.items.push(item)
      else blocks.push({ type: 'list', items: [item] })
    } else {
      blocks.push({ type: 'paragraph', text: line })
    }
  }

  return (
    <div className="space-y-1.5">
      {blocks.map((block, index) =>
        block.type === 'list' ? (
          <ul key={index} className="list-disc space-y-1 pl-4 marker:text-accent">
            {block.items.map((item, itemIndex) => (
              <li key={itemIndex}>{renderInline(item, `${index}-${itemIndex}`)}</li>
            ))}
          </ul>
        ) : (
          <p key={index}>{renderInline(block.text, String(index))}</p>
        ),
      )}
    </div>
  )
}
