import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom'; 
import { fetchMemories } from '../api.js';
import MemoryList from '../components/MemoryList.js';

const MemoryListPage = () => {
  const [memories, setMemories] = useState([]);
  const navigate = useNavigate(); 

  useEffect(() => {
    fetchMemories()
      .then(response => {
        setMemories(response.data);
      })
      .catch(error => {
        console.error("Error fetching memories:", error);
      });
  }, []);

  const goToHome = () => {
    navigate('/');
  };

  return (
    <div>
      <h1>View Memories</h1>
      <MemoryList memories={memories} />
      <button onClick={goToHome}>Back to Home</button>
    </div>
  );
};

export default MemoryListPage;
