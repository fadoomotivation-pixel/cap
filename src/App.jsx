import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
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
import Events from './pages/Events';
import EmployeePortal from './pages/EmployeePortal';
import InterviewAdmin from './pages/InterviewAdmin';
import AttendanceAdmin from './pages/AttendanceAdmin';
import InterviewBooking from './pages/InterviewBooking';
import InterviewConfirmation from './pages/InterviewConfirmation';

import './index.css';

import DholeraInnerPage from './pages/DholeraInnerPage';

const PlaceholderContent = ({ title }) => (
  <div className="space-y-6 text-gray-700 leading-relaxed text-lg">
    <p>
      Welcome to the <strong>{title}</strong> page. Dholera Special Investment Region (DSIR) is a major project under the DMIC, aimed at creating a global manufacturing and trading hub. 
    </p>
    <p>
      The city is being equipped with world-class infrastructure, including a new international airport, expressways, and sustainable energy solutions like the massive Dholera Solar Park. It's designed to be a plug-and-play environment for industries, offering seamless connectivity and smart utilities.
    </p>
    <h3 className="text-2xl font-bold text-[#10243E] mt-8 mb-4">Key Features</h3>
    <ul className="list-disc pl-6 space-y-2">
      <li>Smart city infrastructure with underground utilities</li>
      <li>Dedicated industrial, residential, and high-tech zones</li>
      <li>Excellent connectivity via road, rail, and air</li>
      <li>Sustainable and green development practices</li>
    </ul>
  </div>
);

// Private/utility screens: keep them out of Google's index entirely.
const PrivateRoute = ({ title, children }) => (
  <>
    <Seo title={title} noIndex />
    {children}
  </>
);

export default function App() {
  return (
    <HelmetProvider>
    <Router>
      <Navbar />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/about" element={<About />} />
        <Route path="/projects" element={<ProjectsPage />} />
        <Route path="/projects/:id" element={<ProjectDetail />} />
        <Route path="/dholera" element={<Dholera />} />
        
        {/* Dholera Dropdown Pages */}
        <Route path="/dholera/about" element={<DholeraInnerPage title="About Dholera SIR" bannerImg="https://mirrikh.com/wp-content/uploads/2024/02/dholera-climate-change.jpg" content={<PlaceholderContent title="About Dholera SIR" />} />} />
        <Route path="/dholera/overview" element={<DholeraInnerPage title="Overview" bannerImg="https://mirrikh.com/wp-content/uploads/2025/11/water-management-in-dholera-1024x576.jpg" content={<PlaceholderContent title="Dholera Overview" />} />} />
        <Route path="/dholera/city-highlights" element={<DholeraInnerPage title="City Highlights" bannerImg="https://mirrikh.com/wp-content/uploads/2026/02/Jobs-in-Dholera-SIR-2026-scaled.jpg" content={<PlaceholderContent title="City Highlights" />} />} />
        <Route path="/dholera/airport" element={<DholeraInnerPage title="Dholera International Airport" bannerImg="https://mirrikh.com/wp-content/uploads/2025/12/Waste-Management-in-Dholera.jpg" content={<PlaceholderContent title="Dholera International Airport" />} />} />
        <Route path="/dholera/renew-power" element={<DholeraInnerPage title="Dholera Renew Power" bannerImg="https://mirrikh.com/wp-content/uploads/2024/03/Tata-Semiconductor-Plant-in-Dholera-1024x576.jpg" content={<PlaceholderContent title="Dholera Renew Power" />} />} />

        <Route path="/contact" element={<Contact />} />
        <Route path="/blog" element={<Blog />} />
        <Route path="/events" element={<Events />} />
        <Route path="/employee-kyc" element={<PrivateRoute title="Employee Portal | Capital Brix"><EmployeePortal /></PrivateRoute>} />

        {/* Interview Scheduler Routes */}
        <Route path="/admin/interviews" element={<PrivateRoute title="Interview Scheduler | Capital Brix"><InterviewAdmin /></PrivateRoute>} />
        <Route path="/admin/attendance" element={<PrivateRoute title="Attendance | Capital Brix"><AttendanceAdmin /></PrivateRoute>} />
        <Route path="/book/:token" element={<PrivateRoute title="Schedule Your Interview | Capital Brix"><InterviewBooking /></PrivateRoute>} />
        <Route path="/book/confirm/:bookingId" element={<PrivateRoute title="Interview Confirmed | Capital Brix"><InterviewConfirmation /></PrivateRoute>} />
      </Routes>
      <Footer />
      <WhatsAppFloat />
    </Router>
    </HelmetProvider>
  );
}
