import axios from "axios";

//set the base URL for the backend
const api = axios.create({
  baseURL: "http://localhost:8000", 
});
export default api; 

//retrieving memories from the database
export const fetchMemories = () => {
  return api
    .get("/memories")
    .then((response) => response.data) 
    .catch((error) => {
      console.error("Error fetching memories:", error);
      throw error; 
    });
};

//adding a memory to the database
export const createMemory = (memory) => {
  return api
    .post("/memories", memory)
    .then((response) => response.data) 
    .catch((error) => {
      console.error("Error creating memory:", error);
      throw error; 
    });
};

