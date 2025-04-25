import React, { useState } from "react";
import '../styles/MemoryList.css';

// this file determines what the memory view looks like

const MemoryList = ({ memories }) => {
  const [activeCardId, setActiveCardId] = useState(null); // the memory card the user has clicked
  const [searchQuery, setSearchQuery] = useState(""); // what the user is searching
  const [searchMode, setSearchMode] = useState("songs");  // where the user is searching (songs, tags)

  // sorting the fetched memories passed as a prop in date_added order
  const sortedMemories = [...memories].sort(
    (a, b) => new Date(b.date_added) - new Date(a.date_added)
  );

  // returns what songs match the searched query
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
      {/* search section*/}
      <div className="search-bar-container">

        {/* dropdown for selecting what option to search in*/}
        <select
          value={searchMode}
          onChange={(e) => setSearchMode(e.target.value)}
          className="search-dropdown"
        >
          <option value="songs">Songs</option>
          <option value="tags">Tags</option>
        </select>

        {/* textbox for the user to write their query in*/}
        <input
          type="text"
          placeholder={`Search by ${searchMode}`}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="search-text"
        />
      </div>

      {/* the memory grid that displays the memories matching the query (or all if no query input) */}
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
