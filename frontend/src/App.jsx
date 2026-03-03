import React from 'react';
import { Routes, Route } from 'react-router-dom';
import KioskDisplay from './components/KioskDisplay';
import AdminPanel from './components/AdminPanel';
import './index.css';

function App() {
  return (
    <Routes>
      {/* Route for the headless poster frame display */}
      <Route path="/" element={<KioskDisplay />} />

      {/* Route for managing the display remotely */}
      <Route path="/admin" element={<AdminPanel />} />
    </Routes>
  );
}

export default App;
