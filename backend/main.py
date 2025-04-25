from fastapi import FastAPI, Body, Response, status, HTTPException
from pydantic import BaseModel
from typing import Optional, List
import psycopg2 
from psycopg2.extras import RealDictCursor
from fastapi.middleware.cors import CORSMiddleware
from routes import spotify
from transformers import pipeline
from keybert import KeyBERT
import spacy

# instantiate the backend
app = FastAPI()

# include a router that handles HTTP requests for Spotify
app.include_router(spotify.router, prefix="/spotify")

# instantiate the BERT Information Extraction model
kw_model = KeyBERT()
nlp = spacy.load("en_core_web_sm")

# save the frontend port location for easy reference
origins = ["http://localhost:3000"]

# connecting the backend to the frontend using CORSMiddleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"]
)

# connecting the backend to the PostgreSQL using the psycopg2 library
try:
    connection = psycopg2.connect(
        host="localhost",
        database="music_memory_journal",
        user="postgres",
        password="PostgreJAR",
        cursor_factory=RealDictCursor
    )
    cursor = connection.cursor()
    print("Database connection was successful")
except Exception as error: 
    print("Connecting to database failed")
    print(f"The error was: {error}")

# Pydantic models to validate objects moving between the frontend and backend
class MemoryText(BaseModel): # the memory text to send the BERT model
    text: str

class Tag(BaseModel): # the memory tags
    name: str
    tag_type: str = "custom"

class Memory(BaseModel): # the main memory object to store in the database
    title: str
    text: str
    song: str
    artist: str
    album_image_url: Optional[str] = None
    tags: Optional[List[Tag]] = []

def is_good_phrase(phrase):
    doc = nlp(phrase)
    return any(token.pos_ in {"NOUN", "PROPN", "ADJ"} for token in doc)

def extract_keywords(text: str):
    raw_keywords = kw_model.extract_keywords(
        text, keyphrase_ngram_range=(1, 2), stop_words='english', top_n=15
    )
    filtered_keywords = [kw[0].title() for kw in raw_keywords if is_good_phrase(kw[0])]
    return filtered_keywords[:5]

# ensures that the tags to be added to a memory exist in the tag table and if not, adds them and return their ids
def ensure_tags_exist(tag_names: List[str], tag_type_map: Optional[dict] = None):
    tag_ids = []
    for name in tag_names:
        tag_type = tag_type_map[name] if tag_type_map and name in tag_type_map else "custom"
        
        # check if tag already exists
        cursor.execute("SELECT id FROM tags WHERE name = %s AND tag_type = %s", (name, tag_type))
        tag = cursor.fetchone()

        if not tag:
            # insert the tag
            cursor.execute("""
                INSERT INTO tags (name, tag_type)
                VALUES (%s, %s)
                ON CONFLICT (name, tag_type) DO NOTHING
                RETURNING id
            """, (name, tag_type))
            tag = cursor.fetchone()

        # get the tag id
        tag_ids.append(tag["id"])

    return tag_ids

# given the id of the tags added to a memory and the given memories id, apdates the many-to-many table 
# that associates a memory with all of its tags
def associate_tags(memory_id: int, tag_ids: List[int]):
    for tag_id in tag_ids:
        cursor.execute("INSERT INTO memory_tags (memory_id, tag_id) VALUES (%s, %s) ON CONFLICT DO NOTHING", 
                       (memory_id, tag_id))

# given a memory id, returns an array of its associated tags, each of the form: {name, tag_type}
def get_memory_tags(memory_id: int):
    cursor.execute("""
        SELECT t.name, t.tag_type FROM tags t
        JOIN memory_tags mt ON mt.tag_id = t.id
        WHERE mt.memory_id = %s
    """, (memory_id,))
    return [{"name": row["name"], "tag_type": row["tag_type"]} for row in cursor.fetchall()]

# defining the backend routes:

@app.get("/")
async def home():
    return {"message": "Welcome to the memory journal!"}

# returns all memories and their associated tags
@app.get("/memories")
async def get_all_memories():
    cursor.execute("SELECT * FROM memories")
    memories = cursor.fetchall()
    for mem in memories:
        mem["tags"] = get_memory_tags(mem["id"])
    return memories

# returns one memory based on its id
@app.get("/memories/{id}")
def get_memory(id: str):
    cursor.execute("SELECT * FROM memories WHERE id = %s", (str(id),))
    mem = cursor.fetchone()
    if not mem:
        raise HTTPException(status_code=404, detail=f"Memory with id {id} not found")
    mem["tags"] = get_memory_tags(mem["id"])
    return mem

# posts a memory (using the Pydantic Memory model) to the database
@app.post("/memories", status_code=status.HTTP_201_CREATED)
def create_memory(memory: Memory):
    cursor.execute("""
        INSERT INTO memories (title, text, song_title, song_artist, album_image_url)
        VALUES (%s, %s, %s, %s, %s) RETURNING *
    """, (memory.title, memory.text, memory.song, memory.artist, memory.album_image_url))
    new_memory = cursor.fetchone()

    tag_names = [tag.name for tag in memory.tags]
    tag_type_map = {tag.name: tag.tag_type for tag in memory.tags}
    tag_ids = ensure_tags_exist(tag_names, tag_type_map)
    associate_tags(new_memory["id"], tag_ids)
    connection.commit()

    new_memory["tags"] = memory.tags
    return new_memory

# updates a memory id entry in the memories table
@app.put("/memories/{id}")
def update_post(id: int, memory: Memory):
    cursor.execute("""
        UPDATE memories
        SET title = %s, text = %s, song_title = %s, song_artist = %s
        WHERE id = %s
        RETURNING *
    """, (memory.title, memory.text, memory.song, memory.artist, str(id)))
    updated = cursor.fetchone()
    if not updated:
        raise HTTPException(status_code=404, detail=f"Memory with id {id} not found")

    cursor.execute("DELETE FROM memory_tags WHERE memory_id = %s", (id,))
    tag_ids = ensure_tags_exist(memory.tags)
    associate_tags(id, tag_ids)
    connection.commit()

    updated["tags"] = memory.tags
    return updated

# delets a memory entry in the memories tably by id
@app.delete("/memories/{id}")
def delete_memory(id: int):
    cursor.execute("DELETE FROM memories WHERE id = %s RETURNING *", (str(id),))
    deleted = cursor.fetchone()
    connection.commit()
    if not deleted:
        raise HTTPException(status_code=404, detail=f"Memory with id {id} not found")
    return Response(status_code=status.HTTP_204_NO_CONTENT)

# returns all of tags in the tags table, all of the form {id, name, tag_type}
@app.get("/tags")
def get_all_tags():
    cursor.execute("SELECT id, name, tag_type FROM tags")
    return cursor.fetchall()

# posts a tag to the tag table (using the Pydantic Tag model)
@app.post("/tags", status_code=status.HTTP_201_CREATED)
def create_tag(tag: Tag):
    cursor.execute("INSERT INTO tags (name, tag_type) VALUES (%s, %s) RETURNING *", 
                   (tag.name, tag.tag_type or "user"))
    new_tag = cursor.fetchone()
    connection.commit()
    return new_tag

# returns a list of titles genereate using KeyBERT from the Pydantic MemoryText model
@app.post("/generate-titles")
async def generate_titles(memory: MemoryText):
    keywords = extract_keywords(memory.text)
    titles = list(dict.fromkeys(keywords))

    return {"titles": titles}

# returns all of the tags that match either, or both, of the query and the tag type
@app.get("/tags/search")
def search_tags(query: str, type: Optional[str] = None):
    if type and (not query or query.strip() == ""):
        cursor.execute("""
            SELECT id, name, tag_type FROM tags
            WHERE tag_type = %s
            ORDER BY name
        """, (type,))
    elif type:
        cursor.execute("""
            SELECT id, name, tag_type FROM tags
            WHERE name ILIKE %s AND tag_type = %s
            ORDER BY name
            LIMIT 10
        """, (f"%{query}%", type))
    else:
        cursor.execute("""
            SELECT id, name, tag_type FROM tags
            WHERE name ILIKE %s
            ORDER BY name
            LIMIT 10
        """, (f"%{query}%",))
    return cursor.fetchall()