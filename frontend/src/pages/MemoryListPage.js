import React, { useEffect, useState } from 'react';
import { fetchMemories } from '../api.js';
import MemoryList from '../components/MemoryList.js';
import { Link } from "react-router-dom";

// this file loads the MemoryList component onto the page for viewing memories

const MemoryListPage = () => {
  const [memories, setMemories] = useState([]);

  // fetches all of the memories before the MemoryList component loads to pass it as a prop
  useEffect(() => {
    fetchMemories()
      .then(response => {
        setMemories(response.data);
      })
      .catch(error => {
        console.error("Error fetching memories:", error);
      });
  }, []);

  return (
    <div>
      <div className="header">
        <h1 className="header-title">My Music Memory Journal</h1>
      </div>

      <div className="back-button-container">
        <Link to="/" className="back-button">← Home</Link>
      </div>

      <MemoryList memories={memories} />
    </div>
  );
};

export default MemoryListPage;
