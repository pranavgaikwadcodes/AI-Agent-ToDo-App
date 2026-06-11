import { useState, useEffect } from 'react'
import Header from './components/Header'
import TodoSidebar from './components/TodoSidebar'
import ChatWindow from './components/ChatWindow'

function getSessionId() {
  const key = 'ai-todo-session'
  let id = localStorage.getItem(key)
  if (!id) {
    id = crypto.randomUUID()
    localStorage.setItem(key, id)
  }
  return id
}

function getInitialTheme() {
  const saved = localStorage.getItem('theme')
  if (saved) return saved === 'dark'
  return window.matchMedia('(prefers-color-scheme: dark)').matches
}

export default function App() {
  const [sessionId] = useState(getSessionId)
  const [messages, setMessages] = useState([])
  const [todos, setTodos] = useState([])
  const [loading, setLoading] = useState(false)
  const [connected, setConnected] = useState(null)
  const [isDark, setIsDark] = useState(getInitialTheme)

  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
    localStorage.setItem('theme', isDark ? 'dark' : 'light')
  }, [isDark])

  useEffect(() => {
    loadMessages()
    loadTodos()
  }, [])

  async function loadMessages() {
    try {
      const res = await fetch(`/api/messages/${sessionId}`)
      if (!res.ok) throw new Error()
      setMessages(await res.json())
      setConnected(true)
    } catch {
      setConnected(false)
    }
  }

  async function loadTodos() {
    try {
      const res = await fetch('/api/todos')
      if (!res.ok) throw new Error()
      setTodos(await res.json())
    } catch {
      // silent — sidebar just stays empty
    }
  }

  async function sendMessage(text) {
    if (!text.trim() || loading) return

    const userMsg = {
      id: `u_${Date.now()}`,
      role: 'user',
      content: text,
      createdAt: new Date().toISOString(),
    }
    setMessages(prev => [...prev, userMsg])
    setLoading(true)

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId, message: text }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Server error')

      setMessages(prev => [
        ...prev,
        {
          id: `a_${Date.now()}`,
          role: 'assistant',
          content: data.response,
          createdAt: new Date().toISOString(),
        },
      ])
      loadTodos()
    } catch {
      setMessages(prev => [
        ...prev,
        {
          id: `e_${Date.now()}`,
          role: 'assistant',
          content: 'Connection error — make sure the server and Ollama are running.',
          createdAt: new Date().toISOString(),
          isError: true,
        },
      ])
    } finally {
      setLoading(false)
    }
  }

  async function addTodo(text) {
    if (!text.trim()) return
    try {
      const res = await fetch('/api/todos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ todo: text }),
      })
      const newTodo = await res.json()
      setTodos(prev => [...prev, newTodo])
    } catch {
      loadTodos()
    }
  }

  async function toggleTodo(id, currentStatus) {
    const newStatus = currentStatus === 'completed' ? 'pending' : 'completed'
    setTodos(prev => prev.map(t => t.id === id ? { ...t, status: newStatus } : t))
    try {
      await fetch(`/api/todos/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      })
    } catch {
      loadTodos()
    }
  }

  async function deleteTodo(id) {
    setTodos(prev => prev.filter(t => t.id !== id))
    try {
      await fetch(`/api/todos/${id}`, { method: 'DELETE' })
    } catch {
      loadTodos()
    }
  }

  async function clearChat() {
    try {
      await fetch(`/api/messages/${sessionId}`, { method: 'DELETE' })
      setMessages([])
    } catch {
      // silent
    }
  }

  return (
    <div className="h-screen flex flex-col bg-white dark:bg-zinc-950 overflow-hidden">
      <Header
        connected={connected}
        isDark={isDark}
        onToggleTheme={() => setIsDark(d => !d)}
        onClearChat={clearChat}
      />
      <div className="flex flex-1 min-h-0">
        <TodoSidebar todos={todos} onAdd={addTodo} onToggle={toggleTodo} onDelete={deleteTodo} />
        <ChatWindow messages={messages} loading={loading} onSend={sendMessage} />
      </div>
    </div>
  )
}
