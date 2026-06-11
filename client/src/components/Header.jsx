export default function Header({ connected, onClearChat }) {
  return (
    <header className="flex items-center justify-between px-5 py-3 border-b border-zinc-800 bg-zinc-900 flex-shrink-0">
      <div className="flex items-center gap-3">
        {/* Logo */}
        <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center flex-shrink-0">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M2 4h9M2 8h7M2 12h5" stroke="white" strokeWidth="1.5" strokeLinecap="round" />
            <circle cx="13" cy="11" r="2.5" fill="white" opacity="0.9" />
            <path d="M12 11l.7.7 1.3-1.3" stroke="#4f46e5" strokeWidth="1.1" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>

        <div>
          <h1 className="text-sm font-semibold text-zinc-100 font-mono leading-none">
            <span className="text-indigo-400">AI</span> Todo Agent
          </h1>
          <p className="text-[11px] text-zinc-500 mt-0.5 leading-none">qwen2.5:3b · Ollama · Node.js</p>
        </div>
      </div>

      <div className="flex items-center gap-3">
        {connected !== null && (
          <div className="flex items-center gap-1.5">
            <span className={`w-1.5 h-1.5 rounded-full ${
              connected ? 'bg-emerald-400 animate-pulse' : 'bg-red-400'
            }`} />
            <span className="text-xs text-zinc-500">
              {connected ? 'Online' : 'Offline'}
            </span>
          </div>
        )}

        <div className="h-4 w-px bg-zinc-800" />

        <button
          onClick={onClearChat}
          className="text-xs text-zinc-500 hover:text-zinc-300 px-2.5 py-1.5 rounded-md hover:bg-zinc-800 transition-colors"
        >
          Clear chat
        </button>
      </div>
    </header>
  )
}
