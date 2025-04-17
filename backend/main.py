# from fastapi import FastAPI, Body, Response, status, HTTPException
# from pydantic import BaseModel
# from typing import Optional
# from random import randrange
# import psycopg2 
# from psycopg2.extras import RealDictCursor
# from fastapi.middleware.cors import CORSMiddleware
# from routes import spotify

# app = FastAPI()
# app.include_router(spotify.router, prefix="/spotify")

# #configure CORS (Cross-Origin Resource Sharing) to handle React and FastAPI running on different local ports
# origins = [
#     "http://localhost:3000"
# ]
# app.add_middleware(
#     CORSMiddleware,
#     allow_origins=origins,
#     allow_credentials=True,
#     allow_methods=["*"],
#     allow_headers=["*"]
# )

# try:
#     connection = psycopg2.connect(
#         host="localhost",
#         database="music_memory_journal",
#         user="postgres",
#         password="PostgreJAR",
#         cursor_factory=RealDictCursor
#     )
#     cursor = connection.cursor()
#     print("Database connection was successful")
# except Exception as error:
#     print("Connecting to database failed")
#     print(f"The error was: {error}")


# #Pydantic Models for data validation

# class Memory(BaseModel):
#     title: str
#     text: str
#     song: str
#     artist: str
#     tags: Optional[list[str]] = []

# class Tag(BaseModel):
#     name: str

    
# @app.get("/") 
# async def home():
#     return {"message": "Welcome to the memory journal!"}

# @app.get("/entries/{entry_id}")
# async def get_entry(entry_id: int):
#     return {"entry_id": entry_id, "text": "Example journal entry"}

# @app.get("/memories")
# async def get_all_memories():
#     cursor.execute("""SELECT * FROM memories""")
#     retrieved_post = cursor.fetchall()
#     return retrieved_post

# @app.post("/memories", status_code=status.HTTP_201_CREATED)
# async def create_memory(memory: Memory):
#     cursor.execute(
#                     """
#                     INSERT INTO memories (title, text, song_title, song_artist) 
#                     VALUES (%s, %s, %s, %s) 
#                     RETURNING *""",
#                     (memory.title, memory.text, memory.song, memory.artist)
#                 )
    
#     new_memory = cursor.fetchone()
#     connection.commit()
#     return new_memory

# @app.get("/memories/{id}")
# def get_memory(id: str, response: Response):
#     cursor.execute(
#                     """
#                     SELECT *
#                     FROM memories
#                     WHERE id = %s
#                     """,
#                     (str(id)))
    
#     retrieved_memory = cursor.fetchall()
#     if not retrieved_memory:
#         raise HTTPException(status_code=status.HTTP_404_NOT_FOUND,
#                             detail=f'memory with id: {id} was not found')
#     return retrieved_memory

# @app.delete("/memories/{id}")
# def delete_memory(id: int):
#     cursor.execute(
#                     """
#                     DELETE 
#                     FROM memories
#                     WHERE id = %s
#                     RETURNING *
#                     """,
#                     (str(id),))
#     deleted_post = cursor.fetchone()
#     connection.commit()

#     if deleted_post == None:
#         raise HTTPException(status_code=status.HTTP_404_NOT_FOUND,
#                             detail = f'memory with id {id} was not found')
#     return Response(status_code=status.HTTP_204_NO_CONTENT)

# @app.put('/memories/{id}')
# def update_post(id: int, memory: Memory):
#     cursor.execute(
#                     """
#                     UPDATE memories
#                     SET title = %s, text = %s, song_title = %s, song_artist = %s
#                     WHERE id = %s
#                     RETURNING *
#                     """,
#                     (memory.title, memory.text, memory.song, memory.artist, str(id)))
#     updated_post = cursor.fetchone()
#     connection.commit()
    
#     if updated_post == None:
#         raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"ID:{id} does not exist")
    
#     return updated_post

from fastapi import FastAPI, Body, Response, status, HTTPException
from pydantic import BaseModel
from typing import Optional, List
import psycopg2 
from psycopg2.extras import RealDictCursor
from fastapi.middleware.cors import CORSMiddleware
from routes import spotify

app = FastAPI()
app.include_router(spotify.router, prefix="/spotify")

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

class Memory(BaseModel):
    title: str
    text: str
    song: str
    artist: str
    tags: Optional[List[str]] = []

class Tag(BaseModel):
    name: str

# Helper to ensure tags exist
def ensure_tags_exist(tag_names: List[str]):
    tag_ids = []
    for name in tag_names:
        cursor.execute("SELECT id FROM tags WHERE name = %s", (name,))
        tag = cursor.fetchone()
        if not tag:
            cursor.execute("INSERT INTO tags (name) VALUES (%s) RETURNING id", (name,))
            tag = cursor.fetchone()
        tag_ids.append(tag["id"])
    return tag_ids

def associate_tags(memory_id: int, tag_ids: List[int]):
    for tag_id in tag_ids:
        cursor.execute("INSERT INTO memory_tags (memory_id, tag_id) VALUES (%s, %s) ON CONFLICT DO NOTHING", 
                       (memory_id, tag_id))

def get_memory_tags(memory_id: int):
    cursor.execute("""
        SELECT t.name FROM tags t
        JOIN memory_tags mt ON mt.tag_id = t.id
        WHERE mt.memory_id = %s
    """, (memory_id,))
    return [row["name"] for row in cursor.fetchall()]

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
        INSERT INTO memories (title, text, song_title, song_artist)
        VALUES (%s, %s, %s, %s) RETURNING *
    """, (memory.title, memory.text, memory.song, memory.artist))
    new_memory = cursor.fetchone()

    tag_ids = ensure_tags_exist(memory.tags)
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
    cursor.execute("SELECT * FROM tags")
    return cursor.fetchall()

@app.post("/tags", status_code=status.HTTP_201_CREATED)
def create_tag(tag: Tag):
    cursor.execute("INSERT INTO tags (name) VALUES (%s) RETURNING *", (tag.name,))
    new_tag = cursor.fetchone()
    connection.commit()
    return new_tag

