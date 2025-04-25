import React from 'react';
import { BrowserRouter as Router, Routes, Route} from 'react-router-dom';
import Home from './pages/Home.js';
import MemoryListPage from './pages/MemoryListPage.js';
import MemoryFormPage from './pages/MemoryFormPage.js';

// the main app that determines what elements to call for each page of the website
const App = () => {
  return (
    <Router>
      <Routes>  
        <Route path="/" element={<Home />} />  
        <Route path="/view-memories" element={<MemoryListPage />} />
        <Route path="/add-memory" element={<MemoryFormPage />} />
      </Routes>
    </Router>
  );
};

export default App;
