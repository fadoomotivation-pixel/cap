import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';
import Seo from './components/Seo';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import WhatsAppFloat from './components/WhatsAppFloat';

import Home from './pages/Home';
import About from './pages/About';
import ProjectsPage from './pages/ProjectsPage';
import ProjectDetail from './pages/ProjectDetail';
import Dholera from './pages/Dholera';
import Contact from './pages/Contact';
import Blog from './pages/Blog';
import BlogPost from './pages/BlogPost';
import Events from './pages/Events';
import EmployeePortal from './pages/EmployeePortal';
import InterviewAdmin from './pages/InterviewAdmin';
import AttendanceAdmin from './pages/AttendanceAdmin';
import ExpenseAdmin from './pages/ExpenseAdmin';
import LeadsAdmin from './pages/LeadsAdmin';
import InterviewBooking from './pages/InterviewBooking';
import InterviewConfirmation from './pages/InterviewConfirmation';

import './index.css';

import DholeraInnerPage from './pages/DholeraInnerPage';

// Private/utility screens: keep them out of Google's index entirely.
const PrivateRoute = ({ title, children }) => (
  <>
    <Seo title={title} noIndex />
    {children}
  </>
);

/**
 * Everything inside the router. Split out so the build-time prerenderer can
 * mount the same tree under a StaticRouter — public routes are rendered to
 * real HTML at build time, because this is a client-rendered SPA and a
 * crawler that does not execute JS would otherwise see an empty <div>.
 */
export function AppContent() {
  return (
    <>
      <Navbar />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/about" element={<About />} />
        <Route path="/projects" element={<ProjectsPage />} />
        <Route path="/projects/:id" element={<ProjectDetail />} />
        <Route path="/dholera" element={<Dholera />} />
        <Route path="/dholera/:slug" element={<DholeraInnerPage />} />
        
        {/* Dholera Dropdown Pages */}

        <Route path="/contact" element={<Contact />} />
        <Route path="/blog" element={<Blog />} />
        <Route path="/blog/:slug" element={<BlogPost />} />
        <Route path="/events" element={<Events />} />
        <Route path="/employee-kyc" element={<PrivateRoute title="Employee Portal | Capital Brix"><EmployeePortal /></PrivateRoute>} />

        {/* Interview Scheduler Routes */}
        <Route path="/admin/interviews" element={<PrivateRoute title="Interview Scheduler | Capital Brix"><InterviewAdmin /></PrivateRoute>} />
        <Route path="/admin/attendance" element={<PrivateRoute title="Attendance | Capital Brix"><AttendanceAdmin /></PrivateRoute>} />
        <Route path="/admin/expenses" element={<PrivateRoute title="Petty Cash | Capital Brix"><ExpenseAdmin /></PrivateRoute>} />
        <Route path="/admin/leads" element={<PrivateRoute title="Website Leads | Capital Brix"><LeadsAdmin /></PrivateRoute>} />
        <Route path="/book/:token" element={<PrivateRoute title="Schedule Your Interview | Capital Brix"><InterviewBooking /></PrivateRoute>} />
        <Route path="/book/confirm/:bookingId" element={<PrivateRoute title="Interview Confirmed | Capital Brix"><InterviewConfirmation /></PrivateRoute>} />
      </Routes>
      <Footer />
      <WhatsAppFloat />
    </>
  );
}

export default function App() {
  return (
    <HelmetProvider>
      <BrowserRouter>
        <AppContent />
      </BrowserRouter>
    </HelmetProvider>
  );
}
