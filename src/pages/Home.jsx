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
    <div className="min-h-screen bg-gray-900 text-white p-6 pb-32">
      <div className="max-w-7xl mx-auto">

        {/* ================= HEADER ================= */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2 flex items-center gap-3">
            {greeting} <Music className="w-10 h-10 text-green-500" />
          </h1>
          <p className="text-gray-400">
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
          <div className="flex items-center gap-3 mb-6">
            <Clock className="w-6 h-6 text-green-500" />
            <h2 className="text-2xl font-bold">Recently Played</h2>
          </div>

          {!hasRecentlyPlayed ? (
            <div className="bg-gray-800 rounded-lg p-10 text-center max-w-xl">
              <Music className="w-14 h-14 text-gray-600 mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2 text-gray-300">
                Nothing played yet
              </h3>
              <p className="text-gray-500">
                Play a song and it will appear here
              </p>
            </div>
          ) : (
            <div className="flex md:grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
              {recentlyPlayed.slice(0, 10).map((song) => (
                <SongCard key={song.id} song={song} />
              ))}
            </div>
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

            {/* Search Card */}
            <Link
              to="/search"
              className="bg-gradient-to-br from-green-500 to-green-700 rounded-lg p-8 hover:scale-105 transition-transform block"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-2xl font-bold">Search Music</h3>
                <Music className="w-8 h-8" />
              </div>
              <p className="text-green-100">
                Find your favorite songs, artists, and albums
              </p>
            </Link>

            {/* Trending Disabled */}
            <div className="bg-gradient-to-br from-purple-500 to-purple-700 rounded-lg p-8 opacity-50 cursor-not-allowed">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-2xl font-bold">Trending</h3>
                <TrendingUp className="w-8 h-8" />
              </div>
              <p className="text-purple-100">
                Coming soon
              </p>
            </div>

            {/* Playlists */}
            <Link to="/playlists">
              <div className="
                bg-gradient-to-br from-blue-500 to-blue-700
                rounded-lg p-8 cursor-pointer
                transition-transform duration-200
                hover:scale-[1.02] hover:brightness-110
              ">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-2xl font-bold">Playlists</h3>
                  <Music className="w-8 h-8" />
                </div>
                <p className="text-blue-100">
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
