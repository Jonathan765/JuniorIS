import React, { useState } from "react";
import { createMemory } from "../api.js";  // Import createMemory function from api.js
import "../styles/MemoryForm.css";  // Import the CSS for styling

const MemoryForm = ({ setMemories }) => {
  const [newMemory, setNewMemory] = useState({
    title: "",
    text: "",
    song: "",
    artist: "",
  });
  const [searchQuery, setSearchQuery] = useState("");  // Search query state
  const [searchResults, setSearchResults] = useState([]);  // Store search results
  const [isLoading, setIsLoading] = useState(false);  // Loading state
  const [songSelected, setSongSelected] = useState(false); // State to check if a song is selected

  // Handle form input changes
  const handleChange = (e) => {
    setNewMemory({
      ...newMemory,
      [e.target.name]: e.target.value,  // Update the corresponding input field
    });
  };

  // Handle search input changes
  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);  // Update search query
  };

  // Handle song search
  const handleSearch = async (e) => {
    e.preventDefault();
    if (!searchQuery) return;  // Don't search if the query is empty

    setIsLoading(true);  // Set loading state to true

    try {
      // Send GET request to the FastAPI backend to search for songs
      const response = await fetch(`http://localhost:8000/spotify/search?query=${searchQuery}`);
      const data = await response.json();  // Parse the JSON response

      // Update search results
      setSearchResults(data.tracks.items);  // Assuming data.tracks.items contains the songs
    } catch (error) {
      console.error("Error fetching search results:", error);  // Handle errors
    } finally {
      setIsLoading(false);  // Reset loading state
    }
  };

  // Handle memory submission
  const handleSubmit = (e) => {
    e.preventDefault();  // Prevent the default form submission behavior
    createMemory(newMemory)  // Assuming createMemory is already set up to send the post request
      .then((createdMemory) => {
        setMemories((prevMemories) => [...prevMemories, createdMemory]);  // Add the new memory to the state
        setNewMemory({
          title: "",
          text: "",
          song: "",
          artist: "",
        });  // Reset the form after submission
        setSongSelected(false);  // Reset song selection state
      })
      .catch((error) => {
        console.error("Error creating memory:", error);  // Handle errors
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

      {/* Show loading state while searching */}
      {isLoading && <p className="loading-text">Loading...</p>}

      {/* Show search results */}
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
                setSearchResults([]);  // Clear search results after selecting a song
                setSongSelected(true);  // Mark that a song has been selected
              }}
              className="search-result-item"
            >
              {track.name} - {track.artists.map((artist) => artist.name).join(", ")}
            </li>
          ))}
        </ul>
      )}

      {/* Show the title and memory text inputs only after a song is selected */}
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
          ></textarea>

          <input
            type="text"
            name="song"
            placeholder="Song"
            value={newMemory.song}
            onChange={handleChange}
            readOnly  // Prevent editing the song directly
            className="input-field"
          />
          <input
            type="text"
            name="artist"
            placeholder="Artist"
            value={newMemory.artist}
            onChange={handleChange}
            readOnly  // Prevent editing the artist directly
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
