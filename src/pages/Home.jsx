// src/pages/Home.js
import React from 'react';
import { Music, Clock, TrendingUp } from 'lucide-react';
import { usePlayer } from '../context/PlayerContext';
import SongCard from '../components/SongCard';
import HorizontalSection from "../components/HorizontalSection";
import { Link } from "react-router-dom";
import { getTrending } from "../services/trending";
import { useEffect, useState } from "react";

const Home = () => {
  const { recentlyPlayed } = usePlayer();

  const currentHour = new Date().getHours();
  const greeting =
    currentHour < 12 ? 'Good Morning' :
    currentHour < 18 ? 'Good Afternoon' :
    'Good Evening';

  const [trendingPunjabi, setTrendingPunjabi] = useState([]);
  const [trendingHindi, setTrendingHindi] = useState([]);
  const [trendingGlobal, setTrendingGlobal] = useState([]);

  /* ===========================
     Load Trending Sections
     =========================== */
  useEffect(() => {
    let mounted = true;

    const loadTrending = async () => {
      const global = await getTrending("global");
      const punjabi = await getTrending("punjabi");
      const hindi = await getTrending("hindi");

      if (!mounted) return;

      setTrendingGlobal(global);
      setTrendingPunjabi(punjabi);
      setTrendingHindi(hindi);
    };

    loadTrending();

    return () => {
      mounted = false;
    };
  }, []);

  const hasRecentlyPlayed = recentlyPlayed.length > 0;

  return (
    /* 🔥 REAL MOBILE FIX: full width on mobile, constrained on desktop */
    <div className="min-h-screen bg-gray-900 text-white px-4 md:px-6 pb-32">
      <div className="mx-auto md:max-w-7xl">

        {/* ================= HEADER ================= */}
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-bold mb-2 flex items-center gap-3">
            {greeting} <Music className="w-8 h-8 md:w-10 md:h-10 text-green-500" />
          </h1>
          <p className="text-gray-400 text-sm md:text-base">
            {new Date().toLocaleDateString('en-US', {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric'
            })}
          </p>
        </div>

        {/* ================= RECENTLY PLAYED ================= */}
        <section className="mb-12">
          <div className="flex items-center gap-3 mb-4">
            <Clock className="w-5 h-5 md:w-6 md:h-6 text-green-500" />
            <h2 className="text-xl md:text-2xl font-bold">Recently Played</h2>
          </div>

          {!hasRecentlyPlayed ? (
            <div className="bg-gray-800 rounded-lg p-8 text-center max-w-md">
              <Music className="w-12 h-12 text-gray-600 mx-auto mb-3" />
              <h3 className="text-base font-semibold mb-1 text-gray-300">
                Nothing played yet
              </h3>
              <p className="text-gray-500 text-sm">
                Play a song and it will appear here
              </p>
            </div>
          ) : (
            <>
              {/* ✅ MOBILE: TRUE HORIZONTAL CAROUSEL */}
              <div
                className="
                  flex gap-4 overflow-x-auto pb-4 md:hidden
                  snap-x snap-mandatory
                  -mx-4 px-4
                "
                style={{ WebkitOverflowScrolling: "touch" }}
              >
                {recentlyPlayed.slice(0, 10).map((song) => (
                  <div
                    key={song.id}
                    className="min-w-[150px] snap-start"
                  >
                    <SongCard song={song} />
                  </div>
                ))}
              </div>

              {/* ✅ DESKTOP: GRID (UNCHANGED) */}
              <div className="hidden md:grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
                {recentlyPlayed.slice(0, 10).map((song) => (
                  <SongCard key={song.id} song={song} />
                ))}
              </div>
            </>
          )}
        </section>

        {/* ================= TRENDING GLOBAL ================= */}
        {trendingGlobal.length > 0 && (
          <HorizontalSection
            title="Trending Global"
            icon="🌍"
            songs={trendingGlobal}
          />
        )}

        {/* ================= TRENDING PUNJABI ================= */}
        {trendingPunjabi.length > 0 && (
          <HorizontalSection
            title="Trending Punjabi"
            icon="🔥"
            songs={trendingPunjabi}
          />
        )}

        {/* ================= TRENDING HINDI ================= */}
        {trendingHindi.length > 0 && (
          <HorizontalSection
            title="Trending Hindi"
            icon="🎶"
            songs={trendingHindi}
          />
        )}

        {/* ================= QUICK ACTIONS ================= */}
        <section>
          <div className="flex items-center gap-3 mb-6">
            <TrendingUp className="w-6 h-6 text-green-500" />
            <h2 className="text-2xl font-bold">Discover</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

            <Link
              to="/search"
              className="bg-gradient-to-br from-green-500 to-green-700 rounded-lg p-6 md:p-8 hover:scale-105 transition-transform block"
            >
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-xl md:text-2xl font-bold">Search Music</h3>
                <Music className="w-6 h-6 md:w-8 md:h-8" />
              </div>
              <p className="text-green-100 text-sm md:text-base">
                Find your favorite songs, artists, and albums
              </p>
            </Link>

            <Link to="/playlists">
              <div className="
                bg-gradient-to-br from-blue-500 to-blue-700
                rounded-lg p-6 md:p-8 cursor-pointer
                transition-transform duration-200
                hover:scale-[1.02] hover:brightness-110
              ">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-xl md:text-2xl font-bold">Playlists</h3>
                  <Music className="w-6 h-6 md:w-8 md:h-8" />
                </div>
                <p className="text-blue-100 text-sm md:text-base">
                  Create and manage playlists
                </p>
              </div>
            </Link>

          </div>
        </section>

        {/* ================= STATS ================= */}
        {hasRecentlyPlayed && (
          <section className="mt-12">
            <div className="bg-gray-800 rounded-lg p-6">
              <h3 className="text-lg font-semibold mb-4">Your Stats</h3>
              <div className="grid grid-cols-3 gap-6 text-center">
                <div>
                  <p className="text-3xl font-bold text-green-500">
                    {recentlyPlayed.length}
                  </p>
                  <p className="text-sm text-gray-400">Songs Played</p>
                </div>
                <div>
                  <p className="text-3xl font-bold text-green-500">
                    {new Set(recentlyPlayed.map(s => s.artist)).size}
                  </p>
                  <p className="text-sm text-gray-400">Artists</p>
                </div>
                <div>
                  <p className="text-3xl font-bold text-green-500">
                    {Math.round(
                      recentlyPlayed.reduce((a, s) => a + (s.duration || 0), 0) / 60
                    )}
                  </p>
                  <p className="text-sm text-gray-400">Minutes Listened</p>
                </div>
              </div>
            </div>
          </section>
        )}

      </div>
    </div>
  );
};

export default Home;
