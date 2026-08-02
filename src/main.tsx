import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import {BrowserRouter, Routes, Route} from 'react-router-dom';
import App from './App.tsx';
import AuthPage from './pages/auth.tsx';
import Dashboard from './pages/dashboard.tsx';
import Biolink from './pages/biolink.tsx';
import LeaderboardPage from './pages/leaderboard.tsx';
import PrivacyPage from './pages/privacy.tsx';
import TermsPage from './pages/terms.tsx';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<App />} />
        <Route path="/auth" element={<AuthPage />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/leaderboard" element={<LeaderboardPage />} />
        <Route path="/privacy" element={<PrivacyPage />} />
        <Route path="/terms" element={<TermsPage />} />
        <Route path="/:username" element={<Biolink />} />
      </Routes>
    </BrowserRouter>
  </StrictMode>,
);
