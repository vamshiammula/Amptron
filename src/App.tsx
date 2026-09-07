import { lazy, Suspense } from 'react'
import { Navigate, Route, Routes, useLocation } from 'react-router-dom'
import SupportPage from './pages/SupportPage'
import Footer from './components/Footer'
import WorkspaceHeader from './components/WorkspaceHeader'
import Navbar from './components/Navbar'
import ScrollToHash from './components/ScrollToHash'
import AboutPage from './pages/AboutPage'
import BlogPage from './pages/BlogPage'
import BookTestRidePage from './pages/BookTestRidePage'
import DealerLocatorPage from './pages/DealerLocatorPage'
import HomePage from './pages/HomePage'
import ModelDetailPage from './pages/ModelDetailPage'
import ModelsPage from './pages/ModelsPage'
import OwnershipCalculatorPage from './pages/OwnershipCalculatorPage'
import NotFoundPage from './pages/NotFoundPage'
import PrivacyPage from './pages/PrivacyPage'
import TermsPage from './pages/TermsPage'
import WarrantyPage from './pages/WarrantyPage'
import './App.css'
import './styles/public.css'
import './styles/brand.css'
import './styles/workspace.css'

const AdminPage = lazy(() => import('./pages/AdminPage'))

const PortalPage = lazy(() => import('./pages/PortalPage'))

const PortalLoginPage = lazy(() => import('./pages/PortalLoginPage'))

const ChatWidget = lazy(() => import('./components/ChatWidget'))

export default function App() {
  const { pathname } = useLocation()
  const workspace = pathname === '/admin' || pathname.startsWith('/portal')
  return (
    <div className={`page${workspace ? ' workspace-page' : ''}`}>
      <ScrollToHash />
      <a className="skip-link" href="#main">
        Skip to main content
      </a>
      {workspace ? <WorkspaceHeader /> : <Navbar />}
      <Suspense
        fallback={
          <main id="main" className="wrap page-section" aria-busy="true">
            <output>Loading your workspace…</output>
          </main>
        }
      >
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/models" element={<ModelsPage />} />
          <Route
            path="/models/amptron-volt"
            element={<Navigate to="/models" replace />}
          />
          <Route
            path="/models/amptron-storm"
            element={<Navigate to="/models/amptron-nira" replace />}
          />
          <Route path="/models/:slug" element={<ModelDetailPage />} />
          <Route path="/support" element={<SupportPage />} />
          <Route path="/about" element={<AboutPage />} />
          <Route path="/book-test-ride" element={<BookTestRidePage />} />
          <Route path="/dealers/locate" element={<DealerLocatorPage />} />
          <Route path="/partner" element={<Navigate to="/" replace />} />
          <Route path="/portal/login" element={<PortalLoginPage />} />
          <Route path="/portal" element={<PortalPage />} />
          <Route path="/admin" element={<AdminPage />} />
          <Route path="/blog" element={<BlogPage />} />
          <Route
            path="/ownership-calculator"
            element={<OwnershipCalculatorPage />}
          />
          <Route path="/privacy" element={<PrivacyPage />} />
          <Route path="/terms" element={<TermsPage />} />
          <Route path="/warranty" element={<WarrantyPage />} />
          <Route path="/home" element={<Navigate to="/" replace />} />
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </Suspense>
      {!workspace && <Footer />}
      <Suspense fallback={null}>
        <ChatWidget />
      </Suspense>
    </div>
  )
}
