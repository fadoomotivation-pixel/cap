import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import './index.css';
import HeroScene from './components/canvas/HeroScene';

function App() {
  return (
    <Router>
      <div className="canvas-container">
        <HeroScene />
      </div>
      <div style={{ position: 'relative', zIndex: 10 }}>
        <Navbar />
        <main>
          <Routes>
            <Route path="/" element={<Home />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;
