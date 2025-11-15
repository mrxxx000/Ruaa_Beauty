import React from "react";
import './styles/App.css';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import Mehendi from './pages/Mehendi';
import Contact from './pages/Contact';
import Makeup from './pages/Makeup';
import About from './pages/About';
import Lashes from './pages/Lashes';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/mehendi" element={<Mehendi />} />
        <Route path="/contact" element={<Contact />} />
        <Route path="/makeup" element={<Makeup />} />
        <Route path="/about" element={<About />} />
        <Route path="/lashes" element={<Lashes />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
