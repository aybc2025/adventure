import { Routes, Route, Navigate } from 'react-router-dom';
import { lazy, Suspense } from 'react';
import { AuthProvider } from './contexts/AuthContext.jsx';
import { SessionProvider } from './contexts/SessionContext.jsx';
import { ROUTES } from './config/routes.js';
import ErrorBoundary from './components/shared/ErrorBoundary.jsx';
import LoadingSpinner from './components/shared/LoadingSpinner.jsx';
import ProtectedRoute from './components/shared/ProtectedRoute.jsx';
import UpdateBanner from './components/shared/UpdateBanner.jsx';

// Public
const Landing = lazy(() => import('./pages/Landing.jsx'));

// Player pages
const PlayerHome = lazy(() => import('./pages/player/PlayerHome.jsx'));
const HeroCreate = lazy(() => import('./pages/player/HeroCreate.jsx'));
const HeroProfile = lazy(() => import('./pages/player/HeroProfile.jsx'));
const AdventureSelect = lazy(() => import('./pages/player/AdventureSelect.jsx'));
const RoomView = lazy(() => import('./pages/player/RoomView.jsx'));
const LevelUp = lazy(() => import('./pages/player/LevelUp.jsx'));
const GameOver = lazy(() => import('./pages/player/GameOver.jsx'));
const History = lazy(() => import('./pages/player/History.jsx'));

// GM pages
const GMDashboard = lazy(() => import('./pages/gm/GMDashboard.jsx'));
const TemplateManager = lazy(() => import('./pages/gm/TemplateManager.jsx'));
const TemplateEditor = lazy(() => import('./pages/gm/TemplateEditor.jsx'));
const ItemManager = lazy(() => import('./pages/gm/ItemManager.jsx'));
const ItemEditor = lazy(() => import('./pages/gm/ItemEditor.jsx'));
const AdventureManager = lazy(() => import('./pages/gm/AdventureManager.jsx'));
const AdventureEditor = lazy(() => import('./pages/gm/AdventureEditor.jsx'));
const RoomEditor = lazy(() => import('./pages/gm/RoomEditor.jsx'));
const GMHistory = lazy(() => import('./pages/gm/GMHistory.jsx'));
const ImportJSON = lazy(() => import('./pages/gm/ImportJSON.jsx'));

function PageFallback() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <LoadingSpinner size="large" label="טוען..." />
    </div>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <SessionProvider>
          <UpdateBanner />
          <Suspense fallback={<PageFallback />}>
            <Routes>
              {/* Public */}
              <Route path={ROUTES.LANDING} element={<Landing />} />

              {/* Player */}
              <Route element={<ProtectedRoute variant="player" />}>
                <Route path={ROUTES.PLAY_HOME} element={<PlayerHome />} />
                <Route path={ROUTES.HERO_CREATE} element={<HeroCreate />} />
                <Route path={ROUTES.HERO_PROFILE} element={<HeroProfile />} />
                <Route path={ROUTES.ADVENTURE_SELECT} element={<AdventureSelect />} />
                <Route path={ROUTES.ROOM_VIEW} element={<RoomView />} />
                <Route path={ROUTES.LEVEL_UP} element={<LevelUp />} />
                <Route path={ROUTES.GAME_OVER} element={<GameOver />} />
                <Route path={ROUTES.PLAYER_HISTORY} element={<History />} />
              </Route>

              {/* GM */}
              <Route element={<ProtectedRoute variant="gm" />}>
                <Route path={ROUTES.GM_DASHBOARD} element={<GMDashboard />} />
                <Route path={ROUTES.GM_TEMPLATES} element={<TemplateManager />} />
                <Route path={ROUTES.GM_TEMPLATE_NEW} element={<TemplateEditor />} />
                <Route path={ROUTES.GM_TEMPLATE_EDIT} element={<TemplateEditor />} />
                <Route path={ROUTES.GM_ITEMS} element={<ItemManager />} />
                <Route path={ROUTES.GM_ITEM_NEW} element={<ItemEditor />} />
                <Route path={ROUTES.GM_ITEM_EDIT} element={<ItemEditor />} />
                <Route path={ROUTES.GM_ADVENTURES} element={<AdventureManager />} />
                <Route path={ROUTES.GM_ADVENTURE_NEW} element={<AdventureEditor />} />
                <Route path={ROUTES.GM_ADVENTURE_EDIT} element={<AdventureEditor />} />
                <Route path={ROUTES.GM_ROOM_NEW} element={<RoomEditor />} />
                <Route path={ROUTES.GM_ROOM_EDIT} element={<RoomEditor />} />
                <Route path={ROUTES.GM_HISTORY} element={<GMHistory />} />
                <Route path={ROUTES.GM_IMPORT} element={<ImportJSON />} />
              </Route>

              {/* Catch-all */}
              <Route path="*" element={<Navigate to={ROUTES.LANDING} replace />} />
            </Routes>
          </Suspense>
        </SessionProvider>
      </AuthProvider>
    </ErrorBoundary>
  );
}
