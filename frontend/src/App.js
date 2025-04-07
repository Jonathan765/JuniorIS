import React, { useEffect, useState } from "react";

function App() {
  const [memories, setMemories] = useState([]);

  useEffect(() => {
    fetch("http://localhost:8000/memories")
      .then((res) => res.json())
      .then((data) => setMemories(data))
      .catch((err) => console.error("Error fetching memories:", err));
  }, []);

  return (
    <div>
      <h1>Music Memory Journal</h1>
      <ul>
        {memories.map((memory) => (
          <li key={memory.id}>
            <strong>{memory.title}</strong>: {memory.text}
          </li>
        ))}
      </ul>
    </div>
  );
}

export default App;
