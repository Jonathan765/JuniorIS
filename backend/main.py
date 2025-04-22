from fastapi import FastAPI, Body, Response, status, HTTPException
from pydantic import BaseModel
from typing import Optional, List
import psycopg2 
from psycopg2.extras import RealDictCursor
from fastapi.middleware.cors import CORSMiddleware
from routes import spotify
from transformers import pipeline
from keybert import KeyBERT

app = FastAPI()
app.include_router(spotify.router, prefix="/spotify")

kw_model = KeyBERT()

origins = ["http://localhost:3000"]
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"]
)

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

# Pydantic Models


class MemoryText(BaseModel):
    text: str

class Tag(BaseModel):
    name: str
    tag_type: str = "custom"

class Memory(BaseModel):
    title: str
    text: str
    song: str
    artist: str
    album_image_url: Optional[str] = None
    tags: Optional[List[Tag]] = []

def extract_keywords(text: str):
    keywords = kw_model.extract_keywords(text, keyphrase_ngram_range=(1, 2), stop_words='english', top_n=5)
    return [kw[0].title() for kw in keywords]

# Helper to ensure tags exist
def ensure_tags_exist(tag_names: List[str], tag_type_map: Optional[dict] = None):
    tag_ids = []
    for name in tag_names:
        tag_type = tag_type_map[name] if tag_type_map and name in tag_type_map else "custom"
        
        # Check if tag already exists
        cursor.execute("SELECT id FROM tags WHERE name = %s AND tag_type = %s", (name, tag_type))
        tag = cursor.fetchone()

        if not tag:
            # Insert the tag if it doesn't exist, handling duplicates
            cursor.execute("""
                INSERT INTO tags (name, tag_type)
                VALUES (%s, %s)
                ON CONFLICT (name, tag_type) DO NOTHING
                RETURNING id
            """, (name, tag_type))
            tag = cursor.fetchone()

        # If tag was inserted, or if it already exists, get its ID
        tag_ids.append(tag["id"])

    return tag_ids

def associate_tags(memory_id: int, tag_ids: List[int]):
    for tag_id in tag_ids:
        cursor.execute("INSERT INTO memory_tags (memory_id, tag_id) VALUES (%s, %s) ON CONFLICT DO NOTHING", 
                       (memory_id, tag_id))

def get_memory_tags(memory_id: int):
    cursor.execute("""
        SELECT t.name, t.tag_type FROM tags t
        JOIN memory_tags mt ON mt.tag_id = t.id
        WHERE mt.memory_id = %s
    """, (memory_id,))
    return [{"name": row["name"], "tag_type": row["tag_type"]} for row in cursor.fetchall()]


@app.get("/")
async def home():
    return {"message": "Welcome to the memory journal!"}

@app.get("/memories")
async def get_all_memories():
    cursor.execute("SELECT * FROM memories")
    memories = cursor.fetchall()
    for mem in memories:
        mem["tags"] = get_memory_tags(mem["id"])
    return memories

@app.get("/memories/{id}")
def get_memory(id: str):
    cursor.execute("SELECT * FROM memories WHERE id = %s", (str(id),))
    mem = cursor.fetchone()
    if not mem:
        raise HTTPException(status_code=404, detail=f"Memory with id {id} not found")
    mem["tags"] = get_memory_tags(mem["id"])
    return mem

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

@app.delete("/memories/{id}")
def delete_memory(id: int):
    cursor.execute("DELETE FROM memories WHERE id = %s RETURNING *", (str(id),))
    deleted = cursor.fetchone()
    connection.commit()
    if not deleted:
        raise HTTPException(status_code=404, detail=f"Memory with id {id} not found")
    return Response(status_code=status.HTTP_204_NO_CONTENT)

@app.get("/tags")
def get_all_tags():
    cursor.execute("SELECT id, name, tag_type FROM tags")
    return cursor.fetchall()

@app.post("/tags", status_code=status.HTTP_201_CREATED)
def create_tag(tag: Tag):
    cursor.execute("INSERT INTO tags (name, tag_type) VALUES (%s, %s) RETURNING *", 
                   (tag.name, tag.tag_type or "user"))
    new_tag = cursor.fetchone()
    connection.commit()
    return new_tag


@app.post("/generate-titles")
async def generate_titles(memory: MemoryText):
    
    keywords = extract_keywords(memory.text)
    titles = list(dict.fromkeys(keywords))

    return {"titles": titles}


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