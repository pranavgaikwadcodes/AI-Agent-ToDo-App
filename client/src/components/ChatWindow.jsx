import { useState, useRef, useEffect } from 'react'

const SUGGESTIONS = [
  { label: '📋 Show todos', prompt: 'Show all my todos' },
  { label: '➕ Add a todo', prompt: 'Add buy groceries' },
  { label: '✅ Mark all done', prompt: 'Mark all todos as completed' },
  { label: '🗑️ Clear list', prompt: 'Delete all todos' },
]

function TypingIndicator() {
  return (
    <div className="flex items-start gap-3 px-5 py-2 animate-message-in">
      <div className="w-7 h-7 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center flex-shrink-0 text-[10px] font-mono font-bold text-zinc-500">
        AI
      </div>
      <div className="bg-zinc-800/80 border border-zinc-700/50 rounded-2xl rounded-tl-sm px-4 py-3 flex items-center gap-1.5">
        {[0, 1, 2].map(i => (
          <span
            key={i}
            className="w-1.5 h-1.5 bg-zinc-500 rounded-full animate-typing-dot"
            style={{ animationDelay: `${i * 0.15}s` }}
          />
        ))}
      </div>
    </div>
  )
}

function Message({ msg }) {
  const isUser = msg.role === 'user'
  const time = new Date(msg.createdAt).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  })

  return (
    <div className={`flex items-end gap-3 px-5 py-1 animate-message-in ${isUser ? 'flex-row-reverse' : ''}`}>
      <div className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 text-[10px] font-mono font-bold mb-4 ${
        isUser
          ? 'bg-indigo-600 text-white'
          : 'bg-zinc-800 border border-zinc-700 text-zinc-500'
      }`}>
        {isUser ? 'You' : 'AI'}
      </div>

      <div className={`flex flex-col gap-1 max-w-sm lg:max-w-md ${isUser ? 'items-end' : 'items-start'}`}>
        <div className={`px-4 py-2.5 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap break-words ${
          isUser
            ? 'bg-indigo-600 text-white rounded-br-sm'
            : msg.isError
            ? 'bg-red-950/60 text-red-400 border border-red-900/50 rounded-bl-sm'
            : 'bg-zinc-800/80 border border-zinc-700/50 text-zinc-100 rounded-bl-sm'
        }`}>
          {msg.content}
        </div>
        <span className="text-[10px] text-zinc-700 px-1">{time}</span>
      </div>
    </div>
  )
}

export default function ChatWindow({ messages, loading, onSend }) {
  const [input, setInput] = useState('')
  const bottomRef = useRef(null)
  const textareaRef = useRef(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading])

  // Auto-resize textarea
  useEffect(() => {
    const el = textareaRef.current
    if (!el) return
    el.style.height = 'auto'
    el.style.height = `${Math.min(el.scrollHeight, 160)}px`
  }, [input])

  function submit() {
    if (!input.trim() || loading) return
    onSend(input.trim())
    setInput('')
  }

  function handleKeyDown(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      submit()
    }
  }

  return (
    <main className="flex flex-col flex-1 min-w-0 bg-zinc-950 overflow-hidden">
      {/* Messages area */}
      <div className="flex-1 overflow-y-auto py-4">
        {messages.length === 0 && !loading ? (
          <div className="flex flex-col items-center justify-center h-full gap-6 px-6 text-center">
            <div>
              <div className="w-14 h-14 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center mx-auto mb-4">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm-1-13h2v6h-2zm0 8h2v2h-2z" fill="#818cf8" opacity="0.6"/>
                </svg>
              </div>
              <h2 className="text-base font-semibold text-zinc-300 mb-1">What can I help with?</h2>
              <p className="text-sm text-zinc-600 max-w-xs leading-relaxed">
                Manage your todos using natural language. Try one of these to get started:
              </p>
            </div>
            <div className="flex flex-wrap gap-2 justify-center max-w-sm">
              {SUGGESTIONS.map(s => (
                <button
                  key={s.label}
                  onClick={() => onSend(s.prompt)}
                  className="text-xs px-3 py-1.5 rounded-full border border-zinc-700/80 text-zinc-400 hover:border-indigo-500/60 hover:text-indigo-400 hover:bg-indigo-500/5 transition-all"
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="space-y-1">
            {messages.map(msg => (
              <Message key={msg.id} msg={msg} />
            ))}
            {loading && <TypingIndicator />}
            <div ref={bottomRef} />
          </div>
        )}

        {/* Anchor for scrolling when empty state is shown */}
        {messages.length === 0 && <div ref={bottomRef} />}
      </div>

      {/* Input bar */}
      <div className="p-4 border-t border-zinc-800 flex-shrink-0">
        <form
          onSubmit={e => { e.preventDefault(); submit() }}
          className="flex items-end gap-2.5"
        >
          <textarea
            ref={textareaRef}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask me to manage your todos…"
            rows={1}
            disabled={loading}
            className="flex-1 bg-zinc-900 border border-zinc-700/80 rounded-xl px-4 py-3 text-sm text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-indigo-500/70 focus:ring-1 focus:ring-indigo-500/20 resize-none transition-all disabled:opacity-40 leading-relaxed"
          />
          <button
            type="submit"
            disabled={!input.trim() || loading}
            className="h-11 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 disabled:opacity-30 disabled:cursor-not-allowed text-white text-sm font-medium transition-colors flex-shrink-0 flex items-center gap-1.5"
          >
            <span>Send</span>
            <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
              <path d="M1.5 6.5h10M6.5 1.5l5 5-5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        </form>
        <p className="text-[11px] text-zinc-700 mt-2 text-center">↵ Send &nbsp;·&nbsp; Shift+↵ New line</p>
      </div>
    </main>
  )
}
