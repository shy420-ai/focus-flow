import { useState, useEffect } from 'react'
import { useBackClose } from '../../hooks/useBackClose'
import { useAppStore } from '../../store/AppStore'
import { CATEGORY_META } from '../../data/adhdTips'
import { listenTipFeedback, setLike, addComment, deleteComment, setCommentReaction, recordTipRead, type TipFeedback, type TipComment } from '../../lib/tipFeedback'
import { recordTipView } from '../../lib/tipsViewLimit'
import { isBookmarked, toggleBookmark } from '../../lib/tipBookmarks'
import { tipCategoryIcon } from './tipCategoryIcons'
import type { AdhdTip } from '../../types/adhdTip'

interface Props {
  tip: AdhdTip
  onClose: () => void
}

const COMMENT_MAX = 140

export function TipDetailModal({ tip, onClose }: Props) {
  useBackClose(true, onClose)
  const meta = CATEGORY_META[tip.category]
  const uid = useAppStore((s) => s.uid)

  const [fb, setFb] = useState<TipFeedback>({ likes: [], comments: [] })
  const [commentText, setCommentText] = useState('')
  // Which top-level comment is currently being replied to (id or null).
  const [replyingTo, setReplyingTo] = useState<string | null>(null)
  const [replyText, setReplyText] = useState('')
  const [bookmarked, setBookmarked] = useState<boolean>(() => isBookmarked(tip.id))

  function handleBookmark() {
    toggleBookmark(tip.id)
    setBookmarked(isBookmarked(tip.id))
  }

  useEffect(() => {
    if (!uid) return
    return listenTipFeedback(tip.id, setFb)
  }, [tip.id, uid])

  // Count this view toward today's soft limit (only once on mount).
  useEffect(() => {
    recordTipView()

  }, [])

  // Record the read globally (uid arrayUnion → dedup'd) so the dev stats
  // panel can show real reach numbers.
  useEffect(() => {
    if (!uid) return
    recordTipRead(tip.id, uid).catch(() => { /* offline ok */ })
  }, [uid, tip.id])

  const liked = !!uid && fb.likes.includes(uid)

  function toggleLike() {
    if (!uid) return
    setLike(tip.id, uid, !liked).catch(console.error)
  }

  function postComment() {
    if (!uid) return
    const text = commentText.trim().slice(0, COMMENT_MAX)
    if (!text) return
    const nickname = (localStorage.getItem('ff_nickname') || '').trim() || '익명'
    const comment: TipComment = {
      id: String(Date.now()),
      fromUid: uid,
      fromNickname: nickname,
      text,
      ts: Date.now(),
    }
    addComment(tip.id, comment).catch(console.error)
    setCommentText('')
  }

  function postReply(parentId: string) {
    if (!uid) return
    const text = replyText.trim().slice(0, COMMENT_MAX)
    if (!text) return
    const nickname = (localStorage.getItem('ff_nickname') || '').trim() || '익명'
    const comment: TipComment = {
      id: String(Date.now()),
      fromUid: uid,
      fromNickname: nickname,
      text,
      ts: Date.now(),
      parentId,
    }
    addComment(tip.id, comment).catch(console.error)
    setReplyText('')
    setReplyingTo(null)
  }

  // Top-level comments (no parent) sorted oldest → newest. Replies are
  // looked up per-parent inline.
  const topLevel = [...fb.comments].filter((c) => !c.parentId).sort((a, b) => a.ts - b.ts)
  const repliesOf = (parentId: string) =>
    fb.comments.filter((c) => c.parentId === parentId).sort((a, b) => a.ts - b.ts)

  return (
    <div
      style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.5)', backdropFilter: 'blur(2px)', zIndex: 9300, display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div style={{ background: '#fff', borderRadius: '20px 20px 0 0', width: '100%', maxWidth: 520, maxHeight: '92vh', overflowY: 'auto', boxShadow: '0 -8px 32px rgba(0,0,0,.18)' }}>
        <div style={{ padding: '14px 20px', borderBottom: '1px solid #f0f0f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'sticky', top: 0, background: '#fff', zIndex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ display: 'inline-flex', color: meta.color }}>{tipCategoryIcon(tip.category)}</span>
            <span style={{ fontSize: 11, color: meta.color, fontWeight: 700 }}>{meta.label}</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <button
              onClick={handleBookmark}
              style={{ background: 'none', border: 'none', color: bookmarked ? '#F5B91E' : '#ccc', fontSize: 20, cursor: 'pointer', padding: 4, fontFamily: 'inherit', lineHeight: 1 }}
              aria-label={bookmarked ? '북마크 해제' : '북마크'}
            >{bookmarked ? '★' : '☆'}</button>
            <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#bbb', fontSize: 18, cursor: 'pointer', padding: 4, fontFamily: 'inherit' }}>✕</button>
          </div>
        </div>

        <div style={{ padding: 20 }}>
          <div style={{ fontSize: 18, fontWeight: 800, color: 'var(--pd)', marginBottom: 6 }}>{tip.title}</div>
          <div style={{ fontSize: 12, color: meta.color, fontWeight: 600, marginBottom: 18 }}>{tip.summary}</div>

          {tip.sections ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14, marginBottom: 16 }}>
              {tip.sections.map((s, i) => (
                <div key={i}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
                    {s.icon && <span style={{ fontSize: 14 }}>{s.icon}</span>}
                    <span style={{ fontSize: 13, fontWeight: 800, color: meta.color }}>{s.title}</span>
                  </div>
                  <div style={{ fontSize: 13, color: '#444', lineHeight: 1.7, whiteSpace: 'pre-wrap', paddingLeft: 22 }}>
                    {s.body}
                  </div>
                </div>
              ))}
            </div>
          ) : tip.body ? (
            <div style={{ fontSize: 13, color: '#444', lineHeight: 1.7, whiteSpace: 'pre-wrap', marginBottom: 16 }}>
              {tip.body}
            </div>
          ) : null}

          {tip.tags && tip.tags.length > 0 && (
            <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginBottom: 12 }}>
              {tip.tags.map((t) => (
                <span key={t} style={{ background: 'var(--pl)', color: 'var(--pd)', fontSize: 10, fontWeight: 600, padding: '3px 9px', borderRadius: 99 }}>#{t}</span>
              ))}
            </div>
          )}

          {tip.source && (
            <div style={{ marginTop: 14, padding: '10px 12px', background: '#fafafa', borderRadius: 10, fontSize: 10, color: '#888', borderLeft: '3px solid #eee' }}>
              <div style={{ fontWeight: 700, color: '#666', marginBottom: 2 }}>참고</div>
              {tip.source}
            </div>
          )}

          <div style={{ marginTop: 14, fontSize: 9, color: '#bbb', lineHeight: 1.6, textAlign: 'center' }}>
            ※ 정보·교육 목적. 의료적 조언 아님 — 진단·치료는 전문의와.
          </div>

          {/* Like + comments */}
          {uid && (
            <div style={{ marginTop: 22, paddingTop: 16, borderTop: '1px solid #f0f0f0' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
                <button
                  onClick={toggleLike}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 6,
                    padding: '8px 14px',
                    borderRadius: 99,
                    border: '1.5px solid ' + (liked ? 'var(--pink)' : '#eee'),
                    background: liked ? 'color-mix(in srgb, var(--pink) 18%, #fff)' : '#fff',
                    color: liked ? 'var(--pink)' : '#666',
                    fontSize: 12,
                    fontWeight: 700,
                    cursor: 'pointer',
                    fontFamily: 'inherit',
                  }}
                >
                  <span style={{ fontSize: 14 }}>{liked ? '❤️' : '🤍'}</span>
                  도움됐어 {fb.likes.length > 0 && fb.likes.length}
                </button>
                <span style={{ fontSize: 11, color: '#888', fontWeight: 600 }}>💬 {fb.comments.length}</span>
              </div>

              {/* Comment list */}
              {topLevel.length === 0 ? (
                <div style={{ fontSize: 11, color: '#bbb', textAlign: 'center', padding: '16px 0' }}>
                  아직 댓글 없어 — 첫 댓글 남겨봐
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 12 }}>
                  {topLevel.map((c) => {
                    const reactors = fb.commentReactions?.[c.id] ?? []
                    const reacted = reactors.includes(uid)
                    const replies = repliesOf(c.id)
                    return (
                      <div key={c.id}>
                        <CommentRow
                          comment={c}
                          mine={c.fromUid === uid}
                          reactedCount={reactors.length}
                          reacted={reacted}
                          onReact={() => setCommentReaction(tip.id, c.id, uid, !reacted).catch(console.error)}
                          onReply={() => { setReplyingTo(replyingTo === c.id ? null : c.id); setReplyText('') }}
                          onDelete={() => deleteComment(tip.id, c).catch(console.error)}
                        />

                        {/* Replies (1-level deep) */}
                        {replies.length > 0 && (
                          <div style={{ marginTop: 6, marginLeft: 18, paddingLeft: 10, borderLeft: '2px solid var(--pl)', display: 'flex', flexDirection: 'column', gap: 6 }}>
                            {replies.map((r) => {
                              const rReactors = fb.commentReactions?.[r.id] ?? []
                              const rReacted = rReactors.includes(uid)
                              return (
                                <CommentRow
                                  key={r.id}
                                  comment={r}
                                  mine={r.fromUid === uid}
                                  reactedCount={rReactors.length}
                                  reacted={rReacted}
                                  onReact={() => setCommentReaction(tip.id, r.id, uid, !rReacted).catch(console.error)}
                                  onDelete={() => deleteComment(tip.id, r).catch(console.error)}
                                  isReply
                                />
                              )
                            })}
                          </div>
                        )}

                        {/* Inline reply input */}
                        {replyingTo === c.id && (
                          <div style={{ marginTop: 6, marginLeft: 18, paddingLeft: 10, borderLeft: '2px solid var(--pl)', display: 'flex', gap: 6, alignItems: 'flex-end' }}>
                            <textarea
                              value={replyText}
                              onChange={(e) => setReplyText(e.target.value.slice(0, COMMENT_MAX))}
                              placeholder={`@${c.fromNickname} 에게 답글`}
                              rows={1}
                              autoFocus
                              style={{ flex: 1, padding: '8px 10px', border: '1.5px solid #e8e8e8', borderRadius: 8, fontSize: 11, fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box', resize: 'none', lineHeight: 1.5 }}
                            />
                            <button
                              onClick={() => postReply(c.id)}
                              disabled={!replyText.trim()}
                              style={{ width: 32, height: 32, borderRadius: 99, background: replyText.trim() ? 'var(--pink)' : '#ddd', border: 'none', color: '#fff', fontSize: 12, cursor: replyText.trim() ? 'pointer' : 'not-allowed', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}
                              aria-label="답글 보내기"
                            >➤</button>
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              )}

              {/* Comment input */}
              <div style={{ display: 'flex', gap: 6, alignItems: 'flex-end', marginTop: 10 }}>
                <textarea
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value.slice(0, COMMENT_MAX))}
                  placeholder="짧은 댓글 (최대 140자)"
                  rows={2}
                  style={{ flex: 1, padding: '10px 12px', border: '1.5px solid #e8e8e8', borderRadius: 10, fontSize: 12, fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box', resize: 'none', lineHeight: 1.5 }}
                />
                <button
                  onClick={postComment}
                  disabled={!commentText.trim()}
                  style={{ width: 40, height: 40, borderRadius: 99, background: commentText.trim() ? 'var(--pink)' : '#ddd', border: 'none', color: '#fff', fontSize: 14, cursor: commentText.trim() ? 'pointer' : 'not-allowed', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}
                  aria-label="보내기"
                >➤</button>
              </div>
              <div style={{ fontSize: 9, color: '#bbb', textAlign: 'right', marginTop: 4 }}>{commentText.length}/{COMMENT_MAX}</div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

interface CommentRowProps {
  comment: TipComment
  mine: boolean
  reactedCount: number
  reacted: boolean
  onReact: () => void
  onReply?: () => void  // not provided for replies (no reply-to-reply)
  onDelete: () => void
  isReply?: boolean
}

function CommentRow({ comment, mine, reactedCount, reacted, onReact, onReply, onDelete, isReply }: CommentRowProps) {
  const rel = relativeTime(comment.ts)
  return (
    <div style={{ background: isReply ? '#fff' : '#fafafa', borderRadius: 10, padding: '8px 12px', border: '1px solid #f0f0f0' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
        <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--pd)' }}>{comment.fromNickname}</span>
        <span style={{ fontSize: 9, color: '#bbb' }}>{rel}</span>
        {mine && (
          <button
            onClick={onDelete}
            style={{ marginLeft: 'auto', background: 'none', border: 'none', color: '#ccc', cursor: 'pointer', fontSize: 11, padding: 2 }}
            aria-label="삭제"
          >✕</button>
        )}
      </div>
      <div style={{ fontSize: 12, color: '#444', lineHeight: 1.5, whiteSpace: 'pre-wrap', wordBreak: 'break-word', marginBottom: 6 }}>{comment.text}</div>
      <div style={{ display: 'flex', gap: 4 }}>
        <button
          onClick={onReact}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 4,
            padding: '3px 9px',
            borderRadius: 99,
            border: '1px solid ' + (reacted ? 'var(--pink)' : '#eee'),
            background: reacted ? 'color-mix(in srgb, var(--pink) 15%, #fff)' : '#fff',
            color: reacted ? 'var(--pink)' : '#888',
            fontSize: 10,
            fontWeight: 700,
            cursor: 'pointer',
            fontFamily: 'inherit',
          }}
        >
          <span style={{ fontSize: 11 }}>{reacted ? '❤️' : '🤍'}</span>
          공감 {reactedCount > 0 && reactedCount}
        </button>
        {onReply && (
          <button
            onClick={onReply}
            style={{ padding: '3px 9px', borderRadius: 99, border: '1px solid #eee', background: '#fff', color: '#888', fontSize: 10, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}
          >💬 답글</button>
        )}
      </div>
    </div>
  )
}

function relativeTime(ts: number): string {
  const diff = Date.now() - ts
  if (diff < 60_000) return '방금'
  const m = Math.floor(diff / 60_000)
  if (m < 60) return `${m}분 전`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}시간 전`
  const d = Math.floor(h / 24)
  if (d < 7) return `${d}일 전`
  return new Date(ts).toISOString().slice(5, 10)
}
