import { useState } from 'react'
import Login from './Login'
import Scanner from './Scanner'
import { setToken } from './api'

export default function App() {
  const [authed, setAuthed] = useState(false)

  function handleLogin(token: string) {
    setToken(token)
    setAuthed(true)
  }

  function handleLogout() {
    setToken('')
    setAuthed(false)
  }

  return authed ? <Scanner onLogout={handleLogout} /> : <Login onLogin={handleLogin} />
}
