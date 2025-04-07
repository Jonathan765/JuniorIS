import React from 'react';
import { Link } from 'react-router-dom';

const Home = () => {
  return (
    <div>
      <h1>Welcome to the Music Memory Journal</h1>
      <div>
        {/* Link to MemoryFormPage to add a new memory */}
        <Link to="/add-memory">
          <button>Add Memory</button>
        </Link>
      </div>
      <div>
        {/* Link to MemoryListPage to view existing memories */}
        <Link to="/view-memories">
          <button>View Memories</button>
        </Link>
      </div>
    </div>
  );
};

export default Home;
