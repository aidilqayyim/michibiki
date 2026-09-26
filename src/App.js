import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Settings from './pages/Settings';
import Map from './pages/Map';
import Nodes from './pages/Nodes';
import Chat from './pages/Chat';
import Connect from './pages/Connect';
import Logs from './pages/Logs';
import NavBar from './components/NavBar';
import PageTransition from './components/PageTransition';
import MeshProvider from './data/MeshProvider';

function App() {
  return (
    <BrowserRouter>
      <MeshProvider>
      <PageTransition>
      {(location) => <Routes location={location}>
        <Route path="/" element={<Navigate to="/map" replace />} />
        <Route path="/map" element={<Map />} />
        <Route path="/settings" element={<Settings />} />
        <Route path="/connect" element={<Connect />} />
        <Route path="/nodes" element={<Nodes />} />
        <Route path="/logs" element={<Logs />} />
        <Route path="/chat" element={<Chat />} />
        <Route path="*" element={<Navigate to="/map" replace />} />
      </Routes>}
      </PageTransition>
      <NavBar />
      </MeshProvider>
    </BrowserRouter>
  );
}

export default App;
