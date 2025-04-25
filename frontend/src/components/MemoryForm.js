import React, { useState, useEffect } from "react";
import { createMemory } from "../api.js";  
import "../styles/MemoryForm.css";  
import { Link } from "react-router-dom";
import { useNavigate } from "react-router-dom";

// this file determines the layout of the adding a memory component

const MemoryForm = ({ setMemories }) => { 

  const [newMemory, setNewMemory] = useState({ // the new memory to be added
    title: "",
    text: "",
    song: "",
    artist: "",
    album_image_url: "",
    tags: [],
  });

  const [searchQuery, setSearchQuery] = useState(""); 
  const [searchResults, setSearchResults] = useState([]);  
  const [isLoading, setIsLoading] = useState(false);
  const [songSelected, setSongSelected] = useState(false); 
  const [selectedTrack, setSelectedTrack] = useState(null);
  const [formStep, setFormStep] = useState(1);

  const [tagInput, setTagInput] = useState("");
  const [selectedTagType, setSelectedTagType] = useState("custom");
  const [tagSuggestions, setTagSuggestions] = useState([]);
  const [tagFieldFocused, setTagFieldFocused] = useState(false);

  const [suggestedTitles, setSuggestedTitles] = useState([]);
  const [loadingTitles, setLoadingTitles] = useState(false);
  const [titleFocused, setTitleFocused] = useState(false);

  const [dateParts, setDateParts] = useState({ day: "", month: "", year: "" });

  const navigate = useNavigate();

  // given the memory text, sets the suggested titles to the fetched results through the backend BERT model
  const generateTitles = async (memoryText) => {
    setLoadingTitles(true);
    try {
      const res = await fetch("http://localhost:8000/generate-titles", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: memoryText })
      });
      const data = await res.json();
      setSuggestedTitles(data.titles);
    } catch (err) {
      console.error("Error generating titles:", err);
    } finally {
      setLoadingTitles(false);
    }
  };
  
  // updates the memory with changes to the form
  const handleChange = (e) => {
    setNewMemory({
      ...newMemory,
      [e.target.name]: e.target.value,  
    });
  };

  // sets the search results to the fetched spotify data
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

  // create a debounce for fetching spotify results while the user it typing
  useEffect(() => {
    const delayDebounce = setTimeout(() => {
      if (searchQuery) {
        fetchResults(searchQuery);
      } else {
        setSearchResults([]);
      }
    }, 500); 
  
    return () => clearTimeout(delayDebounce);
  }, [searchQuery]);

  // create a debounce for fetching the tags from the database while the user is typing
  useEffect(() => {
    const delayDebounce = setTimeout(() => {
      const fetchTagSuggestions = async () => {
        if (tagFieldFocused) {
          try {
            const query = tagInput.trim();
            const url = `http://localhost:8000/tags/search?query=${encodeURIComponent(query)}&type=${selectedTagType}`;
            const res = await fetch(url);
            const data = await res.json();
            setTagSuggestions(data);
          } catch (err) {
            console.error("Error fetching tag suggestions:", err);
          }
        }
      };
  
      if (tagFieldFocused) {
        fetchTagSuggestions();
      }
    }, 300);
  
    return () => clearTimeout(delayDebounce);
  }, [tagInput, selectedTagType, tagFieldFocused]);
  
  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);  
  };

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!searchQuery) return;
    fetchResults(searchQuery); 
  };

  // handles creating a memory when the user submits the form
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
          album_image_url: "",
          tags: [],
        });
        setSearchQuery("");
        setSongSelected(false);
      })
      .catch((error) => {
        console.error("Error creating memory:", error);
      });
      navigate("/");
  };

  return (
    <>
    {/* header of the page */}  
      <div className="header">
        <h1 className="header-title">My Music Memory Journal</h1>
      </div>

      <div className="search-wrapper">
      <div className="back-button-container">
        <Link to="/" className="back-button">← Home</Link>
      </div>

      {/* song search form */}
      {!songSelected && (
        <form className="search-form" onSubmit={handleSearch}>
        <p className="search-instructions">
          Type the name of a song and pick one from the list to start your memory.
        </p>
          {/* song search bar */}
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

          {/* displaying the spotify results*/}
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
                      album_image_url: track.album.images[0]?.url,
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
      
      {/* memory form */}
      {songSelected && ( 
      <form onSubmit={handleSubmit} className="memory-form">

        {/* display the selected song info */}
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
          {/* step 1 of the memory form: the actual text input */}
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
                className="submit-form-button"
                onClick={async () => {
                  await generateTitles(newMemory.text);
                  setFormStep(2);
                }}
              >
                Save and Continue
              </button>
              <button
                type="button"
                className="back-to-mem-button"
                onClick={() => {
                  
                  setSongSelected(false);
                  setSelectedTrack(null);
                  setNewMemory({ title: '', text: '', song: '', artist: '', album_image_url: '' });
                  setSearchQuery("");
                  setFormStep(1);
                }}
              >
                ← Back to Search
              </button>
            </>
          )}

          {/* step 2 of the memory form: title and tags */}
          {formStep === 2 && (
            <>
            {/* title input section */}
            <p className="suggestion-label">Give your memory a title:</p>
              <input
                type="text"
                name="title"
                placeholder="Add a title"
                value={newMemory.title}
                onChange={handleChange}
                onFocus={() => setTitleFocused(true)}
                onBlur={() => setTimeout(() => setTitleFocused(false), 100)}
                className="title-field"
              />
              {/* display suggested titles fetched from the BERT backend model */}
              {titleFocused && (newMemory.title === "") && (
                loadingTitles ? (
                  <p className="loading-text">Generating title suggestions...</p>
                ) : Array.isArray(suggestedTitles) && suggestedTitles.length > 0 ? (
                  
                  <div className="title-suggestions">
                    <ul className="suggestion-list">
                    <p className="title-suggestion-label">
                    <span role="img" aria-label="sparkle" style={{ marginRight: "0.2rem" }}> 
                      ✨
                      </span>
                      AI-generated title ideas:</p>
                      {suggestedTitles.map((title, index) => (
                        <li
                          key={index}
                          className="suggested-title"
                          onClick={() =>
                            setNewMemory((prev) => ({ ...prev, title }))
                          }
                        >
                          {title}
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : null
              )}

            {/* tag input section */}
            <p className="suggestion-tags-label">Add tags to your memory:</p>
            <div className="tags-input-wrapper">
              {/* dropdown for selecting tag type */}
              <select
                value={selectedTagType}
                onChange={(e) => {
                  setSelectedTagType(e.target.value);
                  setTagSuggestions([]); 
                }}
                className="tag-type-dropdown"
              >
                <option value="emotion">Emotion</option>
                <option value="date">Date</option>
                <option value="custom">Custom</option>
              </select>

              {/* text input for tag name */}
              <div className="tag-suggested-container">

              {/* change the input display when entering a date */}
              {selectedTagType === "date" ? (
                  <div className="tag-text-with-button-wrapper">

                    {/* entering the year */}
                    <input
                      type="text"
                      placeholder="YYYY"
                      value={dateParts.year}
                      maxLength={4}
                      onChange={(e) => {
                        const val = e.target.value;
                        if (/^\d{0,4}$/.test(val)) setDateParts({ ...dateParts, year: val });
                      }}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault(); 
                          const { year, month, day } = dateParts;
                          const tag = [year, month, day].filter(Boolean).join("-");
                          if (
                            tag &&
                            !newMemory.tags.some((t) => t.name === tag && t.tag_type === "date")
                          ) {
                            setNewMemory((prev) => ({
                              ...prev,
                              tags: [...prev.tags, { name: tag, tag_type: "date" }],
                            }));
                            setDateParts({ year: "", month: "", day: "" });
                          }
                        }
                      }}
                      className="tag-field date-field"
                    />
                    
                    {/* entering the month */}
                    <input
                      type="text"
                      placeholder="MM"
                      value={dateParts.month}
                      maxLength={2}
                      onChange={(e) => {
                        const val = e.target.value;
                        if (/^\d{0,2}$/.test(val)) setDateParts({ ...dateParts, month: val });
                      }}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault(); 
                          const { year, month, day } = dateParts;
                          const tag = [year, month, day].filter(Boolean).join("-");
                          if (
                            tag &&
                            !newMemory.tags.some((t) => t.name === tag && t.tag_type === "date")
                          ) {
                            setNewMemory((prev) => ({
                              ...prev,
                              tags: [...prev.tags, { name: tag, tag_type: "date" }],
                            }));
                            setDateParts({ year: "", month: "", day: "" });
                          }
                        }
                      }}
                      className="tag-field date-field"
                    />
                    
                    {/* entering the day */}
                    <input
                      type="text"
                      placeholder="DD"
                      value={dateParts.day}
                      maxLength={2}
                      onChange={(e) => {
                        const val = e.target.value;
                        if (/^\d{0,2}$/.test(val)) setDateParts({ ...dateParts, day: val });
                      }}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault(); 
                          const { year, month, day } = dateParts;
                          const tag = [year, month, day].filter(Boolean).join("-");
                          if (
                            tag &&
                            !newMemory.tags.some((t) => t.name === tag && t.tag_type === "date")
                          ) {
                            setNewMemory((prev) => ({
                              ...prev,
                              tags: [...prev.tags, { name: tag, tag_type: "date" }],
                            }));
                            setDateParts({ year: "", month: "", day: "" });
                          }
                        }
                      }}
                      className="tag-field date-field"
                    />
                    
                    {/* button for adding a date tag */}
                    <button
                      type="button"
                      className="add-tag-btn"
                      onClick={() => {
                        const { year, month, day } = dateParts;
                        const tag = [year, month, day].filter(Boolean).join("-");
                        if (
                          tag &&
                          !newMemory.tags.some((t) => t.name === tag && t.tag_type === "date")
                        ) {
                          setNewMemory((prev) => ({
                            ...prev,
                            tags: [...prev.tags, { name: tag, tag_type: "date" }],
                          }));
                          setDateParts({ year: "", month: "", day: "" });
                        }
                      }}
                    >
                      +
                    </button>
                  </div>
                ) : (
                  <div className="tag-text-with-button-wrapper">
                  {/* tag text input when entering an emotion or custom */}
                  <input
                    type="text"
                    placeholder={`Add a tag`}
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onFocus={() => setTagFieldFocused(true)}
                    onBlur={() => {
                      setTimeout(() => setTagSuggestions([]), 100)
                      setTimeout(() => setTagFieldFocused(false), 100)
                    
                    }}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && tagInput.trim()) {
                        e.preventDefault();
                        const tag = tagInput.trim();

                        if (
                          !newMemory.tags.some(
                            (t) => t.name === tag && t.tag_type === selectedTagType
                          )
                        ) {
                          setNewMemory((prev) => ({
                            ...prev,
                            tags: [...prev.tags, { name: tag, tag_type: selectedTagType }],
                          }));
                        }

                        setTagInput("");
                        setTagSuggestions([]);
                      }
                    }}
                    className="tag-field"
                  />

                  {/* adding a tag button for emotion or custom tag */}
                  <button
                      type="button"
                      className="add-tag-btn"
                      onClick={() => {

                        const tag = tagInput.trim();
                        if (tag !== "") {

                          if (
                            !newMemory.tags.some(
                              (t) => t.name === tag && t.tag_type === selectedTagType
                            )
                          ) {
                            setNewMemory((prev) => ({
                              ...prev,
                              tags: [...prev.tags, { name: tag, tag_type: selectedTagType }],
                            }));
                          }

                          setTagInput("");
                          setTagSuggestions([]);
                        }
                      }}
                    >
                      +
                    </button>
                    </div>  
                )}
                
                {/* displaying the fetched tags from teh databse that match the user input */}
                {tagSuggestions.length > 0 && selectedTagType !== "date" && (
                  
                  <ul className="tag-suggestions">
                    {tagSuggestions.map((suggestion, index) => (
                      <li
                        key={index}
                        onClick={() => {
                          if (!newMemory.tags.some(t => t.name === suggestion.name && t.tag_type === suggestion.tag_type)) {
                            setNewMemory(prev => ({
                              ...prev,
                              tags: [...prev.tags, { name: suggestion.name, tag_type: suggestion.tag_type }]
                            }));
                          }
                          setTagInput("");
                          setTagSuggestions([]);
                        }}
                        className="tag-suggestion-item"
                      >
                        {suggestion.name} 
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div> 
               
              {/* display the added tags */}
              <div className="tags-list">
              {newMemory.tags.map(({ name, tag_type }, index) => (
                <span key={index} className={`tag tag-${tag_type}`}>
                  {name}
                  {/* button to remove a tag */}
                  <button
                    type="button"
                    className="remove-tag-btn"
                    onClick={() =>
                      setNewMemory((prev) => ({
                        ...prev,
                        tags: prev.tags.filter((_, i) => i !== index),
                      }))
                    }
                  >
                    ×
                  </button>
                </span>
              ))}
              </div>
           
            {/* buttons for submitting the form and going back to the memory text */}
            <button type="submit" className="submit-form-button">
              Add Memory
            </button>
            <button type="button" className="back-to-mem-button"
              onClick={() => {
                setFormStep(1)}}
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