import React from 'react';
import { Link } from 'react-router-dom';
import '../styles/Home.css'; 

const albumImages = [
    "Alvvays_AlbumCover.png",
    "AmericanIdiot_AlbumCover.jpg",
    "Californication_AlbumCover.jpg",
    "Currents_AlbumCover.png",
    "InRainbows_AlbumCover.png",
    "JarOfFlies_AlbumCover.png",
    "MovingPictures_AlbumCover.png",
    "RayOfLight_AlbumCover.jpg",
    "Album1.png",
    "Album2.png",
    "Album3.png",
    "Album4.png",
    "Album5.png",
    "Album6.png",
    "Album7.png",
    "Album8.png",
    "Album9.jpg",
    "Album10.jpg"
  ];

  const Home = () => {
    return (
      <div className="home-container">
        
        <div className="album-background">
        {albumImages.map((img, index) => (
          <img
            key={index}
            src={`/images/album_covers/${img}`}
            alt={`Album ${index + 1}`}
          />
        ))}
      </div>
  
        {/* Header Bar */}
        <div className="home-header">
          <h1 className="home-header-title">My Music Memory Journal</h1>
        </div>
  
        <div className="home-content-box">
        <div>
            <h2>Welcome to My Music Memory Journal</h2>
            <p>Every song tells a story. Capture the moments, feelings, and memories tied to your favorite tracks. 
                Whether it's a late-night drive, a heartbreak, 
                or pure joy — let your music journal become a time capsule of you.</p>
        </div>
        
        <div style={{ marginTop: '0rem' }}>
            <Link to="/add-memory">
            <button className="submit-form-button">Add Memory</button>
            </Link>
            <Link to="/view-memories">
            <button className="submit-form-button">View Memories</button>
            </Link>
        </div>
        </div>
      </div>
    );
  };
  
  export default Home;