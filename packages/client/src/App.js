import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Routes, Route, Navigate } from 'react-router-dom';
import LoginPage from './pages/LoginPage';
import LobbyPage from './pages/LobbyPage';
import GamePage from './pages/GamePage';
import MasterPage from './pages/MasterPage';
export default function App() {
    return (_jsxs(Routes, { children: [_jsx(Route, { path: "/", element: _jsx(LoginPage, {}) }), _jsx(Route, { path: "/lobby", element: _jsx(LobbyPage, {}) }), _jsx(Route, { path: "/game/:sessionId", element: _jsx(GamePage, {}) }), _jsx(Route, { path: "/master/:sessionId", element: _jsx(MasterPage, {}) }), _jsx(Route, { path: "*", element: _jsx(Navigate, { to: "/" }) })] }));
}
//# sourceMappingURL=App.js.map