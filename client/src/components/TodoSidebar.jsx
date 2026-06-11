import { useState } from 'react'

function TrashIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
      <path d="M2 3.5h9M4.5 3.5v-1h4v1M3 3.5l.6 7h5.8l.6-7" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M5.5 6v3M7.5 6v3" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
    </svg>
  )
}

function TodoItem({ todo, onToggle, onDelete }) {
  const done = todo.status === 'completed'

  return (
    <div className="group flex items-start gap-2.5 px-3 py-2 mx-1 rounded-lg hover:bg-gray-50 dark:hover:bg-zinc-800/60 transition-colors">
      {/* Checkbox toggle */}
      <button
        onClick={() => onToggle(todo.id, todo.status)}
        title={done ? 'Mark as pending' : 'Mark as done'}
        className={`mt-0.5 w-4 h-4 rounded flex-shrink-0 border-2 flex items-center justify-center transition-all ${
          done
            ? 'bg-indigo-500 border-indigo-500 dark:bg-indigo-600 dark:border-indigo-600'
            : 'border-gray-300 dark:border-zinc-600 hover:border-indigo-400 dark:hover:border-indigo-500 bg-white dark:bg-transparent'
        }`}
      >
        {done && (
          <svg width="8" height="6" viewBox="0 0 8 6" fill="none">
            <path d="M1 3l2 2 4-4" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        )}
      </button>

      {/* Text */}
      <p className={`flex-1 text-xs leading-5 min-w-0 break-words ${
        done ? 'line-through text-gray-400 dark:text-zinc-600' : 'text-gray-700 dark:text-zinc-300'
      }`}>
        {todo.todo}
      </p>

      {/* Delete — always visible, subtle until hover */}
      <button
        onClick={() => onDelete(todo.id)}
        title="Delete"
        className="mt-0.5 flex-shrink-0 text-gray-300 dark:text-zinc-700 hover:text-red-500 dark:hover:text-red-400 transition-colors p-0.5 rounded-md hover:bg-red-50 dark:hover:bg-red-500/10"
      >
        <TrashIcon />
      </button>
    </div>
  )
}

export default function TodoSidebar({ todos, onAdd, onToggle, onDelete }) {
  const [newTodo, setNewTodo] = useState('')
  const pending = todos.filter(t => t.status !== 'completed')
  const completed = todos.filter(t => t.status === 'completed')

  function handleAdd(e) {
    e.preventDefault()
    if (!newTodo.trim()) return
    onAdd(newTodo.trim())
    setNewTodo('')
  }

  return (
    <aside className="w-60 flex flex-col border-r border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 overflow-hidden flex-shrink-0">
      {/* Header */}
      <div className="px-4 py-3 border-b border-gray-200 dark:border-zinc-800 flex items-center justify-between flex-shrink-0">
        <span className="text-[10px] font-semibold text-gray-400 dark:text-zinc-500 uppercase tracking-widest">
          My Todos
        </span>
        {todos.length > 0 && (
          <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-gray-100 dark:bg-zinc-800 font-mono text-gray-400 dark:text-zinc-500">
            {completed.length}/{todos.length}
          </span>
        )}
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto py-2">
        {todos.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full gap-2 px-4 text-center">
            <div className="w-10 h-10 rounded-xl bg-gray-100 dark:bg-zinc-800 flex items-center justify-center text-lg mb-1">
              📋
            </div>
            <p className="text-xs font-medium text-gray-500 dark:text-zinc-500">No todos yet</p>
            <p className="text-[11px] text-gray-400 dark:text-zinc-600 leading-relaxed">
              Add one below or ask the AI
            </p>
          </div>
        ) : (
          <div className="space-y-0.5">
            {pending.length > 0 && (
              <div>
                <p className="px-4 pt-1 pb-1 text-[10px] font-semibold text-gray-400 dark:text-zinc-600 uppercase tracking-widest">
                  Pending · {pending.length}
                </p>
                {pending.map(t => (
                  <TodoItem key={t.id} todo={t} onToggle={onToggle} onDelete={onDelete} />
                ))}
              </div>
            )}
            {completed.length > 0 && (
              <div className={pending.length > 0 ? 'mt-3' : ''}>
                <p className="px-4 pt-1 pb-1 text-[10px] font-semibold text-gray-400 dark:text-zinc-600 uppercase tracking-widest">
                  Done · {completed.length}
                </p>
                {completed.map(t => (
                  <TodoItem key={t.id} todo={t} onToggle={onToggle} onDelete={onDelete} />
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Quick-add input */}
      <div className="border-t border-gray-200 dark:border-zinc-800 p-3 flex-shrink-0">
        <form onSubmit={handleAdd} className="flex gap-2">
          <input
            value={newTodo}
            onChange={e => setNewTodo(e.target.value)}
            placeholder="Add a todo…"
            className="flex-1 min-w-0 text-xs bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-lg px-3 py-2 text-gray-700 dark:text-zinc-300 placeholder-gray-400 dark:placeholder-zinc-600 focus:outline-none focus:border-indigo-400 dark:focus:border-indigo-500 transition-colors"
          />
          <button
            type="submit"
            disabled={!newTodo.trim()}
            title="Add todo"
            className="w-8 h-8 rounded-lg bg-indigo-600 hover:bg-indigo-500 disabled:opacity-30 disabled:cursor-not-allowed text-white flex items-center justify-center flex-shrink-0 transition-colors"
          >
            <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
              <path d="M6.5 1.5v10M1.5 6.5h10" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
            </svg>
          </button>
        </form>
      </div>
    </aside>
  )
}
