import React from "react";
import { NavLink } from "react-router-dom";
import { Home, Search, Heart, Music, Download } from "lucide-react";
import { usePlaylists } from "../context/PlaylistsContext";
import { usePWAInstall } from "../context/PWAInstallContext";

const Navbar = () => {
  const { playlists } = usePlaylists();
  const { isInstallable, promptInstall } = usePWAInstall();

  const baseClass =
    "flex items-center gap-2 px-4 py-2 rounded-lg transition-colors";

  const activeClass = "bg-green-600 text-white";
  const inactiveClass = "text-gray-300 hover:bg-gray-800";

  return (
    <nav className=" hidden md:block sticky top-0 z-50 bg-gray-900 border-b border-gray-800 px-6 py-4">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        {/* Logo / Brand */}
        <h1 className="text-xl font-bold text-green-500">
          Auralyn
        </h1>

        {/* Navigation Links */}
        <div className="flex items-center gap-3">
          <NavLink
            to="/"
            end
            className={({ isActive }) =>
              `${baseClass} ${isActive ? activeClass : inactiveClass}`
            }
          >
            <Home size={18} />
            Home
          </NavLink>

          <NavLink
            to="/search"
            className={({ isActive }) =>
              `${baseClass} ${isActive ? activeClass : inactiveClass}`
            }
          >
            <Search size={18} />
            Search
          </NavLink>

          <NavLink
            to="/favorites"
            className={({ isActive }) =>
              `${baseClass} ${isActive ? activeClass : inactiveClass}`
            }
          >
            <Heart size={18} />
            Favorites
          </NavLink>

          {/* ✅ PLAYLISTS BUTTON (UNCHANGED) */}
          <NavLink
            to="/playlists"
            className={({ isActive }) =>
              `${baseClass} ${isActive ? activeClass : inactiveClass} relative`
            }
          >
            <Music size={18} />
            Playlists

            {/* 🔢 Playlist Count Badge */}
            {playlists.length > 0 && (
              <span
                className="
                  absolute -top-1 -right-1
                  bg-green-500 text-black
                  text-xs font-bold
                  px-1.5 py-0.5 rounded-full
                "
              >
                {playlists.length}
              </span>
            )}
          </NavLink>

          {/* ✅ PWA INSTALL BUTTON (CORRECT PLACE, NOTHING REMOVED) */}
          {isInstallable && (
            <button
              onClick={promptInstall}
              className="
                flex items-center gap-2
                px-4 py-2
                rounded-lg
                bg-green-600 text-white
                hover:bg-green-700
                transition
              "
              title="Install Auralyn"
            >
              <Download size={18} />
              Install
            </button>
          )}
        </div>
      </div>
    </nav>
  );
};
{/* MOBILE BOTTOM NAVBAR */}
<nav className="fixed bottom-0 left-0 right-0 z-50 bg-gray-900 border-t border-gray-800 md:hidden">
  <div className="flex justify-around items-center py-2">

    <NavLink
      to="/"
      end
      className={({ isActive }) =>
        `flex flex-col items-center text-xs ${
          isActive ? "text-green-500" : "text-gray-400"
        }`
      }
    >
      <Home size={20} />
      Home
    </NavLink>

    <NavLink
      to="/search"
      className={({ isActive }) =>
        `flex flex-col items-center text-xs ${
          isActive ? "text-green-500" : "text-gray-400"
        }`
      }
    >
      <Search size={20} />
      Search
    </NavLink>

    <NavLink
      to="/favorites"
      className={({ isActive }) =>
        `flex flex-col items-center text-xs ${
          isActive ? "text-green-500" : "text-gray-400"
        }`
      }
    >
      <Heart size={20} />
      Favorites
    </NavLink>

    <NavLink
      to="/playlists"
      className={({ isActive }) =>
        `flex flex-col items-center text-xs ${
          isActive ? "text-green-500" : "text-gray-400"
        }`
      }
    >
      <Music size={20} />
      Playlists
    </NavLink>

  </div>
</nav>

export default Navbar;
