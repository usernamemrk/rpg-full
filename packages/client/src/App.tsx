import { Routes, Route, Navigate } from 'react-router-dom'
import LoginPage from './pages/LoginPage'
import LobbyPage from './pages/LobbyPage'
import GamePage from './pages/GamePage'
import MasterPage from './pages/MasterPage'

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<LoginPage />} />
      <Route path="/lobby" element={<LobbyPage />} />
      <Route path="/game/:sessionId" element={<GamePage />} />
      <Route path="/master/:sessionId" element={<MasterPage />} />
      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  )
}
