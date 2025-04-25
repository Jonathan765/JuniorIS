import axios from "axios"; // library to handle backend calls

// set the base URL for the FastAPI backend for easy future reference
const api = axios.create({
  baseURL: "http://localhost:8000", 
});
export default api; 

// retrieving all memories from the backend
export const fetchMemories = () => {
  return api
    .get("/memories")
    .then((response) => response) 
    .catch((error) => {
      console.error("Error fetching memories:", error);
      throw error; 
    });
};

// adding a memory to the database through the backend
export const createMemory = (memory) => {
  return api
    .post("/memories", memory)
    .then((response) => response.data) 
    .catch((error) => {
      console.error("Error creating memory:", error);
      throw error; 
    });
};

