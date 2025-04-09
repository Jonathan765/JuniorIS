import React from 'react';
import MemoryForm from '../components/MemoryForm.js';
import { useNavigate } from 'react-router-dom'; 

const MemoryFormPage = () => {
    
    const navigate = useNavigate(); 
    const goToHome = () => {
        navigate('/');
      };
    return (
        <div>
        <h1>Add a Memory</h1>
        <MemoryForm setMemories={() => {}}/>
        <button onClick={goToHome}>Back to Home</button>
        </div>
    );   
};

export default MemoryFormPage;
