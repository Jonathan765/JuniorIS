from fastapi import APIRouter, Query
from api.spotify import get_access_token
import httpx

# instantiate a route to integrate into the FastAPI backend
router = APIRouter()

# returns the song information for all of the songs from Spotify that match the query
@router.get("/search")
async def search_tracks(query: str = Query(..., min_length=1)):
    token = await get_access_token()
    headers = {
        "Authorization": f"Bearer {token}"
    }
    params = {
        "q": query,
        "type": "track",
        "limit": 10
    }
    async with httpx.AsyncClient() as client:
        response = await client.get(
            "https://api.spotify.com/v1/search",
            headers=headers,
            params=params
        )
        response.raise_for_status()
        return response.json()
