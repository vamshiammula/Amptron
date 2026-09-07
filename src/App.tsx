import { lazy, Suspense, useEffect, useState } from 'react'
import { OPEN_CHAT_EVENT } from './lib/openChat'
import { Navigate, Route, Routes, useLocation } from 'react-router-dom'
const SupportPage = lazy(() => import('./pages/SupportPage'))
import Footer from './components/Footer'
import WorkspaceHeader from './components/WorkspaceHeader'
import Navbar from './components/Navbar'
import ScrollToHash from './components/ScrollToHash'
const AboutPage = lazy(() => import('./pages/AboutPage'))
const BlogPage = lazy(() => import('./pages/BlogPage'))
const BookTestRidePage = lazy(() => import('./pages/BookTestRidePage'))
const DealerLocatorPage = lazy(() => import('./pages/DealerLocatorPage'))
import HomePage from './pages/HomePage'
const ModelDetailPage = lazy(() => import('./pages/ModelDetailPage'))
const ModelsPage = lazy(() => import('./pages/ModelsPage'))
const OwnershipCalculatorPage = lazy(
  () => import('./pages/OwnershipCalculatorPage'),
)
const NotFoundPage = lazy(() => import('./pages/NotFoundPage'))
const PrivacyPage = lazy(() => import('./pages/PrivacyPage'))
const TermsPage = lazy(() => import('./pages/TermsPage'))
const WarrantyPage = lazy(() => import('./pages/WarrantyPage'))
import './App.css'
import './styles/public.css'
import './styles/brand.css'

const AdminPage = lazy(() => import('./pages/AdminPage'))

const PortalPage = lazy(() => import('./pages/PortalPage'))

const PortalLoginPage = lazy(() => import('./pages/PortalLoginPage'))

const ChatWidget = lazy(() => import('./components/ChatWidget'))

export default function App() {
  const { pathname } = useLocation()
  const [chatReady, setChatReady] = useState(false)
  useEffect(() => {
    const showChat = () => setChatReady(true)
    const timer = window.setTimeout(showChat, 1500)
    window.addEventListener(OPEN_CHAT_EVENT, showChat)
    return () => {
      window.clearTimeout(timer)
      window.removeEventListener(OPEN_CHAT_EVENT, showChat)
    }
  }, [])
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
            <output>Loading…</output>
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
        {chatReady && !workspace && <ChatWidget />}
      </Suspense>
    </div>
  )
}
