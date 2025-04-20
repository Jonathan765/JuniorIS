// import React, { useState, useEffect } from "react";
// import { fetchMemories } from "../api.js";  // Import the fetchMemories function

// const MemoryList = () => {
//   const [memories, setMemories] = useState([]);

//   // Fetch memories when the component mounts
//   useEffect(() => {
//     fetchMemories()  // Fetch the memories from the API
//       .then((data) => {
//         setMemories(data);  // Set the fetched memories to state
//       })
//       .catch((error) => {
//         console.error("Error fetching memories:", error);  // Handle any errors
//       });
//   }, []);  // Empty dependency array ensures this runs only once on mount

//   return (
//     <div>
//       <h2>Memory List</h2>
//       <ul>
//         {memories.map((memory) => (
//           <li key={memory.id}>
//             <strong>{memory.title}</strong>: {memory.text}
//           </li>
//         ))}
//       </ul>
//     </div>
//   );
// };

// export default MemoryList;
import React, {useState} from "react";
import '../styles/MemoryList.css'; // optional: for styles



const MemoryList = ({ memories }) => {
  // Sort memories by created date descending (most recent first)
  const sortedMemories = [...memories].sort((a, b) => new Date(b.date_added) - new Date(a.date_added));
  const [activeCardId, setActiveCardId] = useState(null);

  return (
    <div>
      <div className="memory-grid">
        {sortedMemories.map((memory) => (
          <div
            className={`memory-card ${activeCardId === memory.id ? "active" : ""}`}
            key={memory.id}
            onClick={() =>
              setActiveCardId(activeCardId === memory.id ? null : memory.id)
            }
          >
            <div className="card-inner">
              <div className="card-front">
                <img
                  src={memory.album_image_url}
                  alt={memory.title}
                  className="album-cover"
                />
                <div className="memory-info">
                  <h3>{memory.title}</h3>
                </div>
              </div>
              <div className="card-back">
                <h3>{memory.title}</h3>
                <p>{memory.text}</p>
                <div className="tags">
                  <span>{memory.song_title}</span>
                  <span>{memory.song_artist}</span>
                  {/* Add more tags as needed */}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default MemoryList;

