import axios from "axios";

// Set the base URL for the API
const api = axios.create({
  baseURL: "http://localhost:8000", 
});
export default api; 

// Function to fetch all memories
export const fetchMemories = () => {
  return api
    .get("/memories")
    .then((response) => response.data) // Return the data directly
    .catch((error) => {
      console.error("Error fetching memories:", error);
      throw error; // Re-throw error for further handling
    });
};

// Function to create a new memory
export const createMemory = (memory) => {
  return api
    .post("/memories", memory)
    .then((response) => response.data) // Return the created memory data
    .catch((error) => {
      console.error("Error creating memory:", error);
      throw error; // Re-throw error for further handling
    });
};

