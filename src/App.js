import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';

import SignIn from './components/Signin';
import Signup from './components/SignUp';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<SignIn />} />
        <Route path="/signup" element={<Signup />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
