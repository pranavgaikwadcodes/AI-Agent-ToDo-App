function SunIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 15 15" fill="none">
      <circle cx="7.5" cy="7.5" r="3" stroke="currentColor" strokeWidth="1.3" />
      <path
        d="M7.5 1v1.5M7.5 12.5V14M1 7.5h1.5M12.5 7.5H14M3.05 3.05l1.06 1.06M10.89 10.89l1.06 1.06M10.89 3.05l-1.06 1.06M4.11 10.89l-1.06 1.06"
        stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"
      />
    </svg>
  )
}

function MoonIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
      <path
        d="M12.5 9A6 6 0 015 1.5a6 6 0 107.5 7.5z"
        stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"
      />
    </svg>
  )
}

export default function Header({ connected, isDark, onToggleTheme, onClearChat }) {
  return (
    <header className="flex items-center justify-between px-5 py-3 border-b border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 flex-shrink-0">
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
          <h1 className="text-sm font-semibold text-gray-900 dark:text-zinc-100 font-mono leading-none">
            <span className="text-indigo-500 dark:text-indigo-400">AI</span> Todo Agent
          </h1>
          <p className="text-[11px] text-gray-400 dark:text-zinc-500 mt-0.5 leading-none">
            qwen2.5:3b · Ollama · Node.js
          </p>
        </div>
      </div>

      <div className="flex items-center gap-3">
        {connected !== null && (
          <div className="flex items-center gap-1.5">
            <span className={`w-1.5 h-1.5 rounded-full ${
              connected ? 'bg-emerald-400 animate-pulse' : 'bg-red-400'
            }`} />
            <span className="text-xs text-gray-400 dark:text-zinc-500">
              {connected ? 'Online' : 'Offline'}
            </span>
          </div>
        )}

        <div className="h-4 w-px bg-gray-200 dark:bg-zinc-800" />

        {/* Theme toggle */}
        <button
          onClick={onToggleTheme}
          title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
          className="w-8 h-8 flex items-center justify-center rounded-md text-gray-400 dark:text-zinc-500 hover:text-gray-700 dark:hover:text-zinc-300 hover:bg-gray-100 dark:hover:bg-zinc-800 transition-colors"
        >
          {isDark ? <SunIcon /> : <MoonIcon />}
        </button>

        <div className="h-4 w-px bg-gray-200 dark:bg-zinc-800" />

        <button
          onClick={onClearChat}
          className="text-xs text-gray-400 dark:text-zinc-500 hover:text-gray-700 dark:hover:text-zinc-300 px-2.5 py-1.5 rounded-md hover:bg-gray-100 dark:hover:bg-zinc-800 transition-colors"
        >
          Clear chat
        </button>
      </div>
    </header>
  )
}
