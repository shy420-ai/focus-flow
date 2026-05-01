// User-added link archive — paste URL + title, optionally description.
// YouTube URLs auto-fill title and thumbnail via oEmbed.
import { useState, useEffect } from 'react'
import { loadArchive, addEntry, deleteEntry, fetchYoutubePreview, isYoutubeUrl, type ArchiveEntry } from '../../lib/archiveStore'

export function ArchiveSection() {
  const [items, setItems] = useState<ArchiveEntry[]>(loadArchive)
  const [showAdd, setShowAdd] = useState(false)

  useEffect(() => {
    function refresh() { setItems(loadArchive()) }
    window.addEventListener('ff-archive-changed', refresh)
    return () => window.removeEventListener('ff-archive-changed', refresh)
  }, [])

  return (
    <div>
      <button
        onClick={() => setShowAdd(true)}
        style={{ width: '100%', padding: '12px', borderRadius: 12, border: '1.5px dashed #A0A0A0', background: '#fafafa', color: '#666', fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', marginBottom: 12 }}
      >+ 새 자료 추가</button>

      {items.length === 0 ? (
        <div style={{ background: 'color-mix(in srgb, var(--pl) 25%, #fff)', borderRadius: 14, padding: '24px 16px', textAlign: 'center', color: '#999', fontSize: 12, lineHeight: 1.7 }}>
          아직 저장된 자료가 없어<br />
          <span style={{ fontSize: 10, color: '#bbb' }}>유용한 영상·기사·논문 링크 모아두기</span>
        </div>
      ) : (
        items.map((e) => <ArchiveCard key={e.id} entry={e} onDelete={() => deleteEntry(e.id)} />)
      )}

      {showAdd && <ArchiveAddModal onClose={() => setShowAdd(false)} />}
    </div>
  )
}

function ArchiveCard({ entry, onDelete }: { entry: ArchiveEntry; onDelete: () => void }) {
  return (
    <a
      href={entry.url}
      target="_blank"
      rel="noreferrer"
      style={{ display: 'flex', gap: 10, background: '#fff', borderRadius: 12, padding: 10, marginBottom: 8, border: '1px solid #f0f0f0', textDecoration: 'none', color: 'inherit' }}
    >
      {entry.thumbnail ? (
        <img
          src={entry.thumbnail}
          alt=""
          style={{ width: 96, height: 64, borderRadius: 8, objectFit: 'cover', flexShrink: 0, background: '#f5f5f5' }}
        />
      ) : (
        <div style={{ width: 96, height: 64, borderRadius: 8, background: 'color-mix(in srgb, var(--pl) 35%, #fff)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: 24 }}>📎</div>
      )}
      <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 2 }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--pd)', overflow: 'hidden', textOverflow: 'ellipsis', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', lineHeight: 1.4 }}>{entry.title || '(제목 없음)'}</div>
        {entry.description && (
          <div style={{ fontSize: 10, color: '#888', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{entry.description}</div>
        )}
        <div style={{ fontSize: 9, color: '#bbb', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginTop: 'auto' }}>{shortenUrl(entry.url)}</div>
      </div>
      <button
        onClick={(e) => { e.preventDefault(); onDelete() }}
        style={{ background: 'none', border: 'none', color: '#ccc', cursor: 'pointer', fontSize: 13, padding: 2, alignSelf: 'flex-start' }}
        aria-label="삭제"
      >✕</button>
    </a>
  )
}

function shortenUrl(url: string): string {
  try {
    const u = new URL(url)
    return u.host + u.pathname
  } catch { return url }
}

function ArchiveAddModal({ onClose }: { onClose: () => void }) {
  const [url, setUrl] = useState('')
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [autoTitle, setAutoTitle] = useState(false)
  const [thumbnail, setThumbnail] = useState('')

  // Auto-fill title and thumbnail for YouTube URLs as the user types.
  useEffect(() => {
    if (!url.trim()) return
    if (!isYoutubeUrl(url)) return
    let cancelled = false
    fetchYoutubePreview(url).then((data) => {
      if (cancelled || !data) return
      if (!title) setTitle(data.title)
      setThumbnail(data.thumbnail)
      setAutoTitle(true)
    })
    return () => { cancelled = true }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [url])

  function save() {
    if (!url.trim() || !title.trim()) return
    addEntry({ url: url.trim(), title: title.trim(), description: description.trim() || undefined, thumbnail: thumbnail || undefined })
    onClose()
  }

  return (
    <div
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
      style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.5)', backdropFilter: 'blur(2px)', zIndex: 9300, display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}
    >
      <div style={{ background: '#fff', borderRadius: '20px 20px 0 0', width: '100%', maxWidth: 520, boxShadow: '0 -8px 32px rgba(0,0,0,.18)' }}>
        <div style={{ padding: '14px 20px', borderBottom: '1px solid #f0f0f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--pd)' }}>📎 자료 추가</div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#bbb', fontSize: 18, cursor: 'pointer', padding: 4, fontFamily: 'inherit' }}>✕</button>
        </div>
        <div style={{ padding: 18, display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#666', marginBottom: 4 }}>URL</div>
            <input
              type="text"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://..."
              style={{ width: '100%', padding: '10px 12px', border: '1.5px solid #e8e8e8', borderRadius: 10, fontSize: 12, fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box' }}
            />
            {isYoutubeUrl(url) && autoTitle && (
              <div style={{ fontSize: 10, color: 'var(--pink)', marginTop: 4 }}>✨ 유튜브 제목·썸네일 자동으로 가져옴</div>
            )}
          </div>
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#666', marginBottom: 4 }}>제목</div>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="제목 (자동 또는 직접 입력)"
              style={{ width: '100%', padding: '10px 12px', border: '1.5px solid #e8e8e8', borderRadius: 10, fontSize: 13, fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box' }}
            />
          </div>
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#666', marginBottom: 4 }}>한 줄 메모 (선택)</div>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="왜 저장했는지 / 핵심 한 줄"
              style={{ width: '100%', padding: '10px 12px', border: '1.5px solid #e8e8e8', borderRadius: 10, fontSize: 12, fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box' }}
            />
          </div>
          <button
            onClick={save}
            disabled={!url.trim() || !title.trim()}
            style={{ marginTop: 4, padding: 12, borderRadius: 10, border: 'none', background: url.trim() && title.trim() ? 'var(--pink)' : '#ddd', color: '#fff', fontSize: 13, fontWeight: 700, cursor: url.trim() && title.trim() ? 'pointer' : 'not-allowed', fontFamily: 'inherit' }}
          >저장</button>
        </div>
      </div>
    </div>
  )
}
