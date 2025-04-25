# Music Journaling Web App

This project is a simple web application that lets users write journal entries associated with songs. It uses basic Information Extraction (IE) techniques to automatically suggest keywords for titling a memory entry.

## Features

- Write and save journal entries tied to specific songs
- Automatically generate suggested titles using keyword extraction (KeyBERT)
- Tag entries with emotions, dates, or custom tags
- Explore memories by searching for songs, artits, or tags

## Built With

- FastAPI: backend
- REACT: frontend
- PostgreSQL: database
- Spotify API 

### How to Run

1. **Clone the Repository**

   ```bash
   git clone https://github.com/Jonathan765/JuniorIS.git
   cd JuniorIS

2. **Set up the database (PostgreSQL):**
   - The database and its three tables should be created manually using pgAdmin4 (or another SQL GUI).
   - The project assumes the existence of the necessary tables. SQL scripts for table creation are not included in the code so necessary changes are needed in JuniorIS/backend/main.py to connect to the correct database.

3. **Install dependencies:**
   Inside your project folder, create a virtual environment and install the required packages:

   ```bash
   python3 -m venv venv
   source venv/bin/activate
   pip install -r requirements.txt

4. **Spotify API Token**
    - The website uses the Spotify API to fetch metadata about songs.
    - You will need to manually add a valid Spotify API token inside JuniorIS/backend/spotify.py. The token is expected to be stored in an environment variable or passed directly in the code.

5. **Run the Backend**

    ```bash
    uvicorn main:app --reload

6. **Run the Frontend**

    ```bash
    npm start

