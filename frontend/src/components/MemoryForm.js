import React, { useState, useEffect } from "react";
import { createMemory } from "../api.js";  
import "../styles/MemoryForm.css";  
import { Link } from "react-router-dom";

const MemoryForm = ({ setMemories }) => {
  const [newMemory, setNewMemory] = useState({
    title: "",
    text: "",
    song: "",
    artist: "",
    tags: [],
  });

  const [searchQuery, setSearchQuery] = useState("");  
  const [searchResults, setSearchResults] = useState([]);  
  const [isLoading, setIsLoading] = useState(false);
  const [songSelected, setSongSelected] = useState(false); 
  const [selectedTrack, setSelectedTrack] = useState(null);
  const [formStep, setFormStep] = useState(1);
  const [tagInput, setTagInput] = useState("");



  
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
          tags: [],
        });
        setSearchQuery("");
        setSongSelected(false);
      })
      .catch((error) => {
        console.error("Error creating memory:", error);
      });
  };

  return (
    <>
      
      <div className="header">
        <h1 className="header-title">My Music Memory Journal</h1>
      </div>

      <div className="search-wrapper">
      <div className="back-button-container">
        <Link to="/" className="back-button">← Home</Link>
      </div>
      {/* Song Search Form */}
      {!songSelected && (
        <form className="search-form" onSubmit={handleSearch}>
        <p className="search-instructions">
          Type the name of a song and pick one from the list to start your memory.
        </p>
          <div className="search-section">
            <input
              type="text"
              placeholder="Search for a song"
              value={searchQuery}
              onChange={handleSearchChange}
              className="search-input"
            />
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
                    setSelectedTrack({
                      name: track.name,
                      artist: track.artists.map((artist) => artist.name).join(", "),
                      albumImage: track.album.images[0]?.url, 
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
        </form>
      )}
      

      {/* Memory Form */}
      {songSelected && ( 
        
      <form onSubmit={handleSubmit} className="memory-form">
      
        {selectedTrack && formStep === 1 && (
          <div className="selected-track-display">
            <img
              src={selectedTrack.albumImage}
              alt={`${selectedTrack.name} album cover`}
              className="selected-album-image"
            />
            <div className="track-details">
              <p className="track-title">{selectedTrack.name}</p>
              <p className="track-artist">{selectedTrack.artist}</p>
            </div>
          </div>
        )}
        
        <div className="memory-inputs">
          {/* Step 1: Show memory text area and Continue button */}
          {formStep === 1 && (
            <>
              <textarea
                name="text"
                placeholder="Write your memory here"
                value={newMemory.text}
                onChange={handleChange}
                className="textarea-field"
              />
              <button
                type="button"
                className="submit-button"
                onClick={() => setFormStep(2)}
              >
                Save and Continue
              </button>
              <button
                type="button"
                className="back-to-search-button"
                onClick={() => {
                  setSongSelected(false);
                  setSelectedTrack(null);
                  setNewMemory({ title: '', text: '', song: '', artist: '' });
                  setSearchQuery("");
                  setFormStep(1);
                }}
              >
                ← Back to Search
              </button>
            </>
          )}

          {/* Step 2: Show title input and submit button */}
          {formStep === 2 && (
            <>
              <input
                type="text"
                name="title"
                placeholder="Give your memory a title"
                value={newMemory.title}
                onChange={handleChange}
                className="title-field"
              />

            {/* Tag Input */}
            <div className="tags-input-wrapper">
              <input
                type="text"
                placeholder="Add a tag and press Enter"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && tagInput.trim()) {
                    e.preventDefault();
                    const tag = tagInput.trim();
                    if (!newMemory.tags?.includes(tag)) {
                      setNewMemory((prev) => ({
                        ...prev,
                        tags: [...(prev.tags || []), tag],
                      }));
                    }
                    setTagInput("");
                  }
                }}
                className="tag-field"
              />

              {/* Render added tags */}
              <div className="tags-list">
                {(newMemory.tags || []).map((tag, index) => (
                  <span key={index} className="tag">
                    {tag}
                    <button
                      type="button"
                      className="remove-tag-btn"
                      onClick={() => {
                        setNewMemory((prev) => ({
                          ...prev,
                          tags: prev.tags.filter((t) => t !== tag),
                        }));
                      }}
                    >
                    </button>
                  </span>
                ))}
              </div>
            </div>
            
            <button type="submit" className="submit-button">
              Add Memory
            </button>
            <button
              type="button"
              className="back-to-mem-button"
              onClick={() => setFormStep(1)}
            >
              ← Back to Memory
            </button>
  
            </>
          )}
        </div>
    </form>
    )}
    </div>
    </>
  );
};

export default MemoryForm;

