import { lazy, Suspense } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import Footer from './components/Footer'
import Navbar from './components/Navbar'
import ScrollToHash from './components/ScrollToHash'
import AboutPage from './pages/AboutPage'
import AdminPage from './pages/AdminPage'
import BlogPage from './pages/BlogPage'
import BookTestRidePage from './pages/BookTestRidePage'
import DealerLocatorPage from './pages/DealerLocatorPage'
import HomePage from './pages/HomePage'
import ModelDetailPage from './pages/ModelDetailPage'
import ModelsPage from './pages/ModelsPage'
import NotFoundPage from './pages/NotFoundPage'
import PortalLoginPage from './pages/PortalLoginPage'
import PortalPage from './pages/PortalPage'
import PrivacyPage from './pages/PrivacyPage'
import TermsPage from './pages/TermsPage'
import WarrantyPage from './pages/WarrantyPage'
import './App.css'
import './styles/public.css'

const ChatWidget = lazy(() => import('./components/ChatWidget'))

export default function App() {
  return (
    <div className="page">
      <ScrollToHash />
      <a className="skip-link" href="#main">
        Skip to main content
      </a>
      <Navbar />
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/models" element={<ModelsPage />} />
        <Route path="/models/:slug" element={<ModelDetailPage />} />
        <Route path="/about" element={<AboutPage />} />
        <Route path="/book-test-ride" element={<BookTestRidePage />} />
        <Route path="/dealers/locate" element={<DealerLocatorPage />} />
        <Route path="/partner" element={<Navigate to="/" replace />} />
        <Route path="/portal/login" element={<PortalLoginPage />} />
        <Route path="/portal" element={<PortalPage />} />
        <Route path="/admin" element={<AdminPage />} />
        <Route path="/blog" element={<BlogPage />} />
        <Route path="/privacy" element={<PrivacyPage />} />
        <Route path="/terms" element={<TermsPage />} />
        <Route path="/warranty" element={<WarrantyPage />} />
        <Route path="/home" element={<Navigate to="/" replace />} />
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
      <Footer />
      <Suspense fallback={null}>
        <ChatWidget />
      </Suspense>
    </div>
  )
}
