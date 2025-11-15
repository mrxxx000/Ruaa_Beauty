import React from "react";
import './styles/App.css';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import Mehendi from './pages/Mehendi';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/mehendi" element={<Mehendi />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
