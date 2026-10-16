const GROUPS = [
  ['styles', 'Phong cách'],
  ['favoriteColors', 'Màu thích'],
  ['avoidColors', 'Màu muốn tránh'],
  ['favoriteItems', 'Món hay mặc'],
  ['avoidItems', 'Món không thích'],
  ['occasions', 'Hoàn cảnh hay gặp'],
]

/** Hồ sơ phong cách (JSON) mà AI đã chuẩn hoá và lưu vào tài khoản. */
export default function StyleSummary({ style }) {
  const groups = GROUPS.filter(([key]) => style[key]?.length)
  return (
    <div>
      {style.notes && <p className="font-display text-xl leading-snug">“{style.notes}”</p>}

      {(groups.length > 0 || style.fit !== 'chưa rõ') && (
        <dl className="mt-5 grid gap-5 sm:grid-cols-2">
          {groups.map(([key, label]) => (
            <div key={key}>
              <dt className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted">{label}</dt>
              <dd className="mt-2 flex flex-wrap gap-1.5">
                {style[key].map((tag) => (
                  <span key={tag} className="rounded-full bg-accent/10 px-2.5 py-1 text-xs text-accent">
                    {tag}
                  </span>
                ))}
              </dd>
            </div>
          ))}
          {style.fit && style.fit !== 'chưa rõ' && (
            <div>
              <dt className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted">Phom dáng</dt>
              <dd className="mt-2">
                <span className="rounded-full bg-accent/10 px-2.5 py-1 text-xs text-accent">{style.fit}</span>
              </dd>
            </div>
          )}
        </dl>
      )}
    </div>
  )
}
