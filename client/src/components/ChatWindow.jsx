import { useState, useRef, useEffect } from 'react'

const SUGGESTIONS = [
  { label: '📋 Show todos', prompt: 'Show all my todos' },
  { label: '➕ Add a todo', prompt: 'Add buy groceries' },
  { label: '✅ Mark all done', prompt: 'Mark all todos as completed' },
  { label: '🗑️ Clear list', prompt: 'Delete all todos' },
]

function TypingIndicator() {
  return (
    <div className="flex items-end gap-3 px-5 py-2">
      <div className="w-7 h-7 rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center flex-shrink-0 text-white text-[10px] font-bold">
        ✦
      </div>
      <div className="bg-gray-100 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700/60 rounded-2xl rounded-bl-sm px-4 py-3 flex items-center gap-1.5">
        {[0, 1, 2].map(i => (
          <span
            key={i}
            className="w-1.5 h-1.5 bg-gray-400 dark:bg-zinc-500 rounded-full animate-typing-dot"
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
    <div className={`flex items-end gap-2.5 px-5 py-1.5 animate-message-in ${isUser ? 'flex-row-reverse' : ''}`}>
      {/* Avatar */}
      <div className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 mb-5 text-[10px] font-bold ${
        isUser
          ? 'bg-indigo-600 text-white'
          : 'bg-gradient-to-br from-indigo-500 to-violet-600 text-white'
      }`}>
        {isUser ? 'You' : '✦'}
      </div>

      <div className={`flex flex-col gap-1 max-w-xs lg:max-w-sm xl:max-w-md ${isUser ? 'items-end' : 'items-start'}`}>
        <div className={`px-4 py-2.5 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap break-words shadow-sm ${
          isUser
            ? 'bg-indigo-600 text-white rounded-br-sm'
            : msg.isError
            ? 'bg-red-50 dark:bg-red-950/40 text-red-500 dark:text-red-400 border border-red-200 dark:border-red-900/50 rounded-bl-sm'
            : 'bg-gray-100 dark:bg-zinc-800 border border-gray-200/80 dark:border-zinc-700/60 text-gray-800 dark:text-zinc-100 rounded-bl-sm'
        }`}>
          {msg.content}
        </div>
        <span className="text-[10px] text-gray-400 dark:text-zinc-600 px-1">{time}</span>
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

  // Auto-focus after AI responds
  useEffect(() => {
    if (!loading) textareaRef.current?.focus()
  }, [loading])

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
    <div className="flex flex-col flex-1 min-w-0 bg-white dark:bg-zinc-950 overflow-hidden">
      {/* Messages */}
      <div className="flex-1 overflow-y-auto py-4 bg-white dark:bg-zinc-950">
        {messages.length === 0 && !loading ? (
          <div className="flex flex-col items-center justify-center h-full gap-5 px-8 text-center">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-500/10 to-violet-500/10 border border-indigo-200/50 dark:border-indigo-500/20 flex items-center justify-center text-2xl">
              ✦
            </div>
            <div>
              <h2 className="text-sm font-semibold text-gray-700 dark:text-zinc-300 mb-1.5">
                What can I help with?
              </h2>
              <p className="text-xs text-gray-400 dark:text-zinc-600 max-w-xs leading-relaxed">
                Chat with the AI to manage your todos, or use the panel on the left to add and check them off directly.
              </p>
            </div>
            <div className="flex flex-wrap gap-2 justify-center max-w-xs">
              {SUGGESTIONS.map(s => (
                <button
                  key={s.label}
                  onClick={() => onSend(s.prompt)}
                  className="text-xs px-3 py-1.5 rounded-full border border-gray-200 dark:border-zinc-700/80 bg-gray-50 dark:bg-transparent text-gray-500 dark:text-zinc-400 hover:border-indigo-300 dark:hover:border-indigo-500/60 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-500/5 transition-all"
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="space-y-0.5 pb-2">
            {messages.map(msg => (
              <Message key={msg.id} msg={msg} />
            ))}
            {loading && <TypingIndicator />}
            <div ref={bottomRef} />
          </div>
        )}
        {messages.length === 0 && <div ref={bottomRef} />}
      </div>

      {/* Input */}
      <div className="px-4 pb-4 pt-3 bg-white dark:bg-zinc-950 flex-shrink-0">
        <form
          onSubmit={e => { e.preventDefault(); submit() }}
          className="flex items-end gap-2.5 bg-gray-50 dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-2xl px-4 py-3 focus-within:border-indigo-300 dark:focus-within:border-indigo-600/60 focus-within:ring-2 focus-within:ring-indigo-100 dark:focus-within:ring-indigo-500/10 transition-all"
        >
          <textarea
            ref={textareaRef}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask me to manage your todos…"
            rows={1}
            disabled={loading}
            className="flex-1 bg-transparent text-sm text-gray-900 dark:text-zinc-100 placeholder-gray-400 dark:placeholder-zinc-600 focus:outline-none resize-none disabled:opacity-40 leading-relaxed"
          />
          <button
            type="submit"
            disabled={!input.trim() || loading}
            className="w-8 h-8 rounded-xl bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 disabled:opacity-30 disabled:cursor-not-allowed text-white flex items-center justify-center flex-shrink-0 transition-colors"
          >
            <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
              <path d="M1.5 6.5h10M6.5 1.5l5 5-5 5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        </form>
        <p className="text-[11px] text-gray-400 dark:text-zinc-700 mt-2 text-center">
          ↵ Send &nbsp;·&nbsp; Shift+↵ New line
        </p>
      </div>
    </div>
  )
}
