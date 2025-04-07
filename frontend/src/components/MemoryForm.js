import React, { useState } from "react";
import { createMemory } from "../api.js";  // Import createMemory function from api.js

const MemoryForm = ({ setMemories }) => {
  const [newMemory, setNewMemory] = useState({
    title: "",
    text: "",
    song: "",
    artist: "",
  });

  // Handle form input changes
  const handleChange = (e) => {
    setNewMemory({
      ...newMemory,
      [e.target.name]: e.target.value,  // Update the corresponding input field
    });
  };

  // Handle the submission of the new memory
  const handleSubmit = (e) => {
    e.preventDefault();  // Prevent the default form submission behavior
    createMemory(newMemory)  // Calling the function from api.js to send the post request
      .then((createdMemory) => {
        setMemories((prevMemories) => [...prevMemories, createdMemory]);  // Add the newly created memory to the state
        setNewMemory({
          title: "",
          text: "",
          song: "",
          artist: "",
        });  // Clear the form after submission
      })
      .catch((error) => {
        console.error("Error creating memory:", error);  // Handle errors
      });
  };

  return (
    <form onSubmit={handleSubmit}>
      <input
        type="text"
        name="title"
        placeholder="Title"
        value={newMemory.title}
        onChange={handleChange}
      />
      <input
        type="text"
        name="text"
        placeholder="Memory Text"
        value={newMemory.text}
        onChange={handleChange}
      />
      <input
        type="text"
        name="song"
        placeholder="Song"
        value={newMemory.song}
        onChange={handleChange}
      />
      <input
        type="text"
        name="artist"
        placeholder="Artist"
        value={newMemory.artist}
        onChange={handleChange}
      />
      <button type="submit">Add Memory</button>
    </form>
  );
};

export default MemoryForm;
