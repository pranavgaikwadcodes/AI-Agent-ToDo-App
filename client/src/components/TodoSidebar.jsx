function CheckIcon() {
  return (
    <svg width="8" height="8" viewBox="0 0 8 8" fill="none">
      <path d="M1.5 4l1.5 1.5 3.5-3" stroke="#34d399" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function TodoItem({ todo }) {
  const done = todo.status === 'completed'
  return (
    <div className={`flex items-start gap-2.5 px-4 py-2 hover:bg-zinc-800/40 transition-colors ${done ? 'opacity-40' : ''}`}>
      {done ? (
        <div className="mt-0.5 w-4 h-4 rounded-full bg-emerald-500/15 border border-emerald-500/40 flex items-center justify-center flex-shrink-0">
          <CheckIcon />
        </div>
      ) : (
        <div className="mt-0.5 w-4 h-4 rounded-full border border-zinc-600 flex-shrink-0" />
      )}
      <div className="min-w-0 flex-1">
        <p className={`text-xs leading-5 truncate ${done ? 'text-zinc-500 line-through' : 'text-zinc-300'}`}>
          {todo.todo}
        </p>
        <span className="text-[10px] text-zinc-700 font-mono">#{todo.id}</span>
      </div>
    </div>
  )
}

export default function TodoSidebar({ todos }) {
  const pending = todos.filter(t => t.status !== 'completed')
  const completed = todos.filter(t => t.status === 'completed')

  return (
    <aside className="w-56 flex flex-col border-r border-zinc-800 bg-zinc-900 overflow-hidden flex-shrink-0">
      {/* Header */}
      <div className="px-4 py-3 border-b border-zinc-800 flex items-center justify-between flex-shrink-0">
        <span className="text-[10px] font-semibold text-zinc-500 uppercase tracking-widest">Todos</span>
        {todos.length > 0 && (
          <span className="text-[10px] font-mono text-zinc-600">
            {completed.length}/{todos.length}
          </span>
        )}
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto py-1">
        {todos.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full gap-2 py-12 px-4 text-center">
            <span className="text-xl">📋</span>
            <p className="text-xs text-zinc-600">No todos yet</p>
            <p className="text-[11px] text-zinc-700">Try "add buy milk"</p>
          </div>
        ) : (
          <>
            {pending.length > 0 && (
              <div className="mb-1">
                <p className="px-4 py-1.5 text-[10px] font-semibold text-zinc-700 uppercase tracking-widest">
                  Pending · {pending.length}
                </p>
                {pending.map(t => <TodoItem key={t.id} todo={t} />)}
              </div>
            )}
            {completed.length > 0 && (
              <div>
                <p className="px-4 py-1.5 text-[10px] font-semibold text-zinc-700 uppercase tracking-widest">
                  Done · {completed.length}
                </p>
                {completed.map(t => <TodoItem key={t.id} todo={t} />)}
              </div>
            )}
          </>
        )}
      </div>
    </aside>
  )
}
