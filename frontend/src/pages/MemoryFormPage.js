import React from 'react';
import MemoryForm from '../components/MemoryForm.js';

// this file loads the MemoryForm component onto the page or adding a memory
const MemoryFormPage = () => {
    return (
        <div>
        <MemoryForm setMemories={() => {}}/>
        </div>
    );   
};

export default MemoryFormPage;
