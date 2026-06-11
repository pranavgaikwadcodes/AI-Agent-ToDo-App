function CheckIcon() {
  return (
    <svg width="8" height="8" viewBox="0 0 8 8" fill="none">
      <path d="M1.5 4l1.5 1.5 3.5-3" stroke="#34d399" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function DeleteIcon() {
  return (
    <svg width="11" height="11" viewBox="0 0 11 11" fill="none">
      <path d="M2 2l7 7M9 2l-7 7" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
    </svg>
  )
}

function TodoItem({ todo, onToggle, onDelete }) {
  const done = todo.status === 'completed'
  return (
    <div className={`group flex items-start gap-2.5 px-4 py-2 hover:bg-gray-100 dark:hover:bg-zinc-800/40 transition-colors ${done ? 'opacity-50' : ''}`}>
      {/* Toggle button */}
      <button
        onClick={() => onToggle(todo.id, todo.status)}
        title={done ? 'Mark as pending' : 'Mark as completed'}
        className={`mt-0.5 w-4 h-4 rounded-full border flex items-center justify-center flex-shrink-0 transition-all ${
          done
            ? 'bg-emerald-500/15 border-emerald-500/40 hover:bg-emerald-500/25'
            : 'border-gray-300 dark:border-zinc-600 hover:border-indigo-400 dark:hover:border-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-500/10'
        }`}
      >
        {done && <CheckIcon />}
      </button>

      {/* Text */}
      <div className="min-w-0 flex-1">
        <p className={`text-xs leading-5 truncate ${
          done ? 'text-gray-400 dark:text-zinc-500 line-through' : 'text-gray-700 dark:text-zinc-300'
        }`}>
          {todo.todo}
        </p>
        <span className="text-[10px] text-gray-400 dark:text-zinc-700 font-mono">#{todo.id}</span>
      </div>

      {/* Delete — visible on hover */}
      <button
        onClick={() => onDelete(todo.id)}
        title="Delete todo"
        className="opacity-0 group-hover:opacity-100 mt-1 flex-shrink-0 text-gray-300 dark:text-zinc-700 hover:text-red-400 dark:hover:text-red-400 transition-all"
      >
        <DeleteIcon />
      </button>
    </div>
  )
}

export default function TodoSidebar({ todos, onToggle, onDelete }) {
  const pending = todos.filter(t => t.status !== 'completed')
  const completed = todos.filter(t => t.status === 'completed')

  return (
    <aside className="w-56 flex flex-col border-r border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 overflow-hidden flex-shrink-0">
      {/* Header */}
      <div className="px-4 py-3 border-b border-gray-200 dark:border-zinc-800 flex items-center justify-between flex-shrink-0">
        <span className="text-[10px] font-semibold text-gray-400 dark:text-zinc-500 uppercase tracking-widest">
          Todos
        </span>
        {todos.length > 0 && (
          <span className="text-[10px] font-mono text-gray-400 dark:text-zinc-600">
            {completed.length}/{todos.length}
          </span>
        )}
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto py-1">
        {todos.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full gap-2 py-12 px-4 text-center">
            <span className="text-xl">📋</span>
            <p className="text-xs text-gray-400 dark:text-zinc-600">No todos yet</p>
            <p className="text-[11px] text-gray-400 dark:text-zinc-700">Try "add buy milk"</p>
          </div>
        ) : (
          <>
            {pending.length > 0 && (
              <div className="mb-1">
                <p className="px-4 py-1.5 text-[10px] font-semibold text-gray-400 dark:text-zinc-700 uppercase tracking-widest">
                  Pending · {pending.length}
                </p>
                {pending.map(t => (
                  <TodoItem key={t.id} todo={t} onToggle={onToggle} onDelete={onDelete} />
                ))}
              </div>
            )}
            {completed.length > 0 && (
              <div>
                <p className="px-4 py-1.5 text-[10px] font-semibold text-gray-400 dark:text-zinc-700 uppercase tracking-widest">
                  Done · {completed.length}
                </p>
                {completed.map(t => (
                  <TodoItem key={t.id} todo={t} onToggle={onToggle} onDelete={onDelete} />
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </aside>
  )
}
