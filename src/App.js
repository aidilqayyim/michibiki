import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Emergency from './components/Emergency';
import Map from './components/Map';
import Nodes from './components/Nodes';
import Chat from './components/Chat';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Map />} />
        <Route path="/emergency" element={<Emergency />} />
        <Route path="/nodes" element={<Nodes />} />
        <Route path="/chat" element={<Chat />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
