// frontend/src/App.jsx
import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { SpeedInsights } from '@vercel/speed-insights/react';

// Pages
import Home from './pages/Home';
import Search from './pages/Search';
// import Favorites from './pages/Favorites'; // If you have this page
import Favorites from "./pages/Favorites";
import Playlists from "./pages/Playlists";

// Components
import Player from './components/Player';
import Navbar from './components/Navbar';

function App() {
  return (
    <div className="min-h-screen bg-gray-900">
      {/* Vercel Speed Insights */}
      <SpeedInsights />
      
      {/* Navigation Bar */}
      <Navbar />
      
      {/* Main Content Area */}
      <main className="pb-32">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/search" element={<Search />} />
          <Route path="/favorites" element={<Favorites />} />
          <Route path="/playlists" element={<Playlists />} />
          {/* Add more routes as needed */}
          {/* <Route path="/album/:id" element={<AlbumDetails />} /> */}
          {/* <Route path="/artist/:id" element={<ArtistDetails />} /> */}
        </Routes>
      </main>
      
      {/* Bottom Player - Always visible */}
      <Player />
    </div>
  );
}

export default App;
