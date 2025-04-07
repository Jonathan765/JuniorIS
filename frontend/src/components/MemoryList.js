import React, { useState, useEffect } from "react";
import { fetchMemories } from "../api.js";  // Import the fetchMemories function

const MemoryList = () => {
  const [memories, setMemories] = useState([]);

  // Fetch memories when the component mounts
  useEffect(() => {
    fetchMemories()  // Fetch the memories from the API
      .then((data) => {
        setMemories(data);  // Set the fetched memories to state
      })
      .catch((error) => {
        console.error("Error fetching memories:", error);  // Handle any errors
      });
  }, []);  // Empty dependency array ensures this runs only once on mount

  return (
    <div>
      <h2>Memory List</h2>
      <ul>
        {memories.map((memory) => (
          <li key={memory.id}>
            <strong>{memory.title}</strong>: {memory.text}
          </li>
        ))}
      </ul>
    </div>
  );
};

export default MemoryList;
