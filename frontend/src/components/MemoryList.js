// import React, {useState} from "react";
// import '../styles/MemoryList.css'; // optional: for styles

// const MemoryList = ({ memories }) => {
//   // Sort memories by created date descending (most recent first)
//   const sortedMemories = [...memories].sort((a, b) => new Date(b.date_added) - new Date(a.date_added));
//   const [activeCardId, setActiveCardId] = useState(null);

//   return (
//     <div>
//       <div className="memory-grid">
//         {sortedMemories.map((memory) => (
//           <div
//             className={`memory-card ${activeCardId === memory.id ? "active" : ""}`}
//             key={memory.id}
//             onClick={() =>
//               setActiveCardId(activeCardId === memory.id ? null : memory.id)
//             }
//           >
//             <div className="card-inner">
//               <div className="card-front">
//                 <img
//                   src={memory.album_image_url}
//                   alt={memory.title}
//                   className="album-cover"
//                 />
//                 <div className="memory-info">
//                   <h3>{memory.title}</h3>
//                 </div>
//               </div>
//               <div className="card-back">
//                 <h3>{memory.title}</h3>
//                 <p>{memory.text}</p>
//                 <div className="tags">
//                   <span>{memory.song_title}</span>
//                   <span>{memory.song_artist}</span>
//                   {/* Add more tags as needed */}
//                 </div>
//               </div>
//             </div>
//           </div>
//         ))}
//       </div>
//     </div>
//   );
// };

// export default MemoryList;
import React, { useState } from "react";
import '../styles/MemoryList.css';

const MemoryList = ({ memories }) => {
  const [activeCardId, setActiveCardId] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchMode, setSearchMode] = useState("songs"); // or "tags"

  const sortedMemories = [...memories].sort(
    (a, b) => new Date(b.date_added) - new Date(a.date_added)
  );

  const filteredMemories = sortedMemories.filter((memory) => {
    const query = searchQuery.toLowerCase();

    if (searchMode === "songs") {
      return (
        memory.song_title.toLowerCase().includes(query) ||
        memory.song_artist.toLowerCase().includes(query)
      );
    } else if (searchMode === "tags") {
      return memory.tags?.some(tag =>
        tag.name.toLowerCase().includes(query)
      );
    }

    return true;
  });

  return (
    <div>
      {/* Search Controls */}
      <div className="search-bar-container">
        <select
          value={searchMode}
          onChange={(e) => setSearchMode(e.target.value)}
          className="search-dropdown"
        >
          <option value="songs">Songs</option>
          <option value="tags">Tags</option>
        </select>

        <input
          type="text"
          placeholder={`Search by ${searchMode}`}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="search-text"
        />
      </div>

      {/* Memory Grid */}
      <div className="memory-grid">
        {filteredMemories.map((memory) => (
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
                  {memory.tags?.map((tag, idx) => (
                    <span key={idx} className="tag">{tag.name}</span>
                  ))}
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
