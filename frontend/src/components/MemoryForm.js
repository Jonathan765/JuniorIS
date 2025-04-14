import React, { useState, useEffect } from "react";
import { createMemory } from "../api.js";  
import "../styles/MemoryForm.css";  

const MemoryForm = ({ setMemories }) => {
  const [newMemory, setNewMemory] = useState({
    title: "",
    text: "",
    song: "",
    artist: "",
  });

  const [searchQuery, setSearchQuery] = useState("");  
  const [searchResults, setSearchResults] = useState([]);  
  const [isLoading, setIsLoading] = useState(false);
  const [songSelected, setSongSelected] = useState(false); 

  
  const handleChange = (e) => {
    setNewMemory({
      ...newMemory,
      [e.target.name]: e.target.value,  
    });
  };

  const fetchResults = async (query) => {
    setIsLoading(true);
    setSearchResults([]);
    try {
      const response = await fetch(
        `http://localhost:8000/spotify/search?query=${encodeURIComponent(query)}`
      );
      const data = await response.json();
      setSearchResults(data.tracks.items);
    } catch (error) {
      console.error("Error fetching search results:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const delayDebounce = setTimeout(() => {
      if (searchQuery) {
        fetchResults(searchQuery);
      } else {
        setSearchResults([]);
      }
    }, 500); // setting the debounce time in milliseconds
  
    return () => clearTimeout(delayDebounce);
  }, [searchQuery]);

  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);  
  };

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!searchQuery) return;
    fetchResults(searchQuery); 
  };

  const handleSubmit = (e) => {
    e.preventDefault();  
    createMemory(newMemory)
      .then((createdMemory) => {
        setMemories((prevMemories) => [...prevMemories, createdMemory]);  
        setNewMemory({
          title: "",
          text: "",
          song: "",
          artist: "",
        });
        setSearchQuery("");
        setSongSelected(false);
      })
      .catch((error) => {
        console.error("Error creating memory:", error);
      });
  };

  return (
    <form onSubmit={handleSubmit} className="memory-form">
      {/* Song Search Section */}
      <div className="search-section">
        <input
          type="text"
          placeholder="Search for a song"
          value={searchQuery}
          onChange={handleSearchChange}
          className="search-input"
        />
        <button type="button" onClick={handleSearch} className="search-button">
          Search
        </button>
      </div>

      {isLoading && <p className="loading-text">Loading...</p>}

      {searchResults.length > 0 && !songSelected && (
        <ul className="search-results">
          {searchResults.map((track) => (
            <li
              key={track.id}
              onClick={() => {
                setNewMemory({
                  ...newMemory,
                  song: track.name,
                  artist: track.artists.map((artist) => artist.name).join(", "),
                });
                setSearchResults([]);
                setSongSelected(true);
              }}
              className="search-result-item"
            >
              <img
                src={track.album.images[2]?.url}
                alt="Album Cover"
                className="album-thumb"
              />
              <div className="track-info">
                {track.name} - {track.artists.map((artist) => artist.name).join(", ")}
              </div>
            </li>
          ))}
        </ul>
      )}

      {songSelected && (
        <div className="memory-inputs">
          <input
            type="text"
            name="title"
            placeholder="Title"
            value={newMemory.title}
            onChange={handleChange}
            className="input-field"
          />
          <textarea
            name="text"
            placeholder="Memory Text"
            value={newMemory.text}
            onChange={handleChange}
            className="textarea-field"
          />
          <input
            type="text"
            name="song"
            placeholder="Song"
            value={newMemory.song}
            onChange={handleChange}
            readOnly
            className="input-field"
          />
          <input
            type="text"
            name="artist"
            placeholder="Artist"
            value={newMemory.artist}
            onChange={handleChange}
            readOnly
            className="input-field"
          />
          <button type="submit" className="submit-button">
            Add Memory
          </button>
        </div>
      )}
    </form>
  );
};

export default MemoryForm;
