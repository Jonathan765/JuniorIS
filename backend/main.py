from fastapi import FastAPI, Body, Response, status, HTTPException
from pydantic import BaseModel
from typing import Optional
from random import randrange
import psycopg2 
from psycopg2.extras import RealDictCursor
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI()

#configure CORS (Cross-Origin Resource Sharing) to handle React and FastAPI running on different local ports
origins = [
    "http://localhost:3000"
]
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


my_memories = [
    {
        "title": "Post One",
        "text": "Content of Post One",
        "id": 1
    },
    {
        "title": "Favorite Foods",
        "text": "I like pizza",
        "id": 2
    }
]

class Memory(BaseModel):
    title: str
    text: str
    song: str
    artist: str


@app.get("/") #path operation decorator: goes to path '/' using the HTTP 'GET' method
async def home():
    return {"message": "Welcome to the memory journal!"}

@app.get("/entries/{entry_id}")
async def get_entry(entry_id: int):
    return {"entry_id": entry_id, "text": "Example journal entry"}

@app.get("/memories")
async def get_all_memories():
    cursor.execute("""SELECT * FROM memories""")
    retrieved_post = cursor.fetchall()
    return retrieved_post

@app.post("/memories", status_code=status.HTTP_201_CREATED)
async def create_memory(memory: Memory):
    cursor.execute(
                    """
                    INSERT INTO memories (title, text, song_title, song_artist) 
                    VALUES (%s, %s, %s, %s) 
                    RETURNING *""",
                    (memory.title, memory.text, memory.song, memory.artist)
                )
    
    new_memory = cursor.fetchone()
    connection.commit()
    return new_memory

@app.get("/memories/{id}")
def get_memory(id: str, response: Response):
    cursor.execute(
                    """
                    SELECT *
                    FROM memories
                    WHERE id = %s
                    """,
                    (str(id)))
    
    retrieved_memory = cursor.fetchall()
    if not retrieved_memory:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND,
                            detail=f'memory with id: {id} was not found')
    return retrieved_memory

@app.delete("/memories/{id}")
def delete_memory(id: int):
    cursor.execute(
                    """
                    DELETE 
                    FROM memories
                    WHERE id = %s
                    RETURNING *
                    """,
                    (str(id),))
    deleted_post = cursor.fetchone()
    connection.commit()

    if deleted_post == None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND,
                            detail = f'memory with id {id} was not found')
    return Response(status_code=status.HTTP_204_NO_CONTENT)

@app.put('/memories/{id}')
def update_post(id: int, memory: Memory):
    cursor.execute(
                    """
                    UPDATE memories
                    SET title = %s, text = %s, song_title = %s, song_artist = %s
                    WHERE id = %s
                    RETURNING *
                    """,
                    (memory.title, memory.text, memory.song, memory.artist, str(id)))
    updated_post = cursor.fetchone()
    connection.commit()
    
    if updated_post == None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"ID:{id} does not exist")
    
    return updated_post

