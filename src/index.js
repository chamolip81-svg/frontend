import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { PlaylistsProvider } from "./context/PlaylistsContext";
import App from "./App";
import "./index.css";
import { PWAInstallProvider } from "./context/PWAInstallContext";

import { PlayerProvider } from "./context/PlayerContext";
import { FavoritesProvider } from "./context/FavoritesContext";
// import { OfflineProvider } from "./context/OfflineContext";
const root = ReactDOM.createRoot(document.getElementById("root"));

root.render(
  <React.StrictMode>
    <BrowserRouter>
      <FavoritesProvider>
        <PlaylistsProvider>
          <PWAInstallProvider>
            <PlayerProvider>
              <App />
            </PlayerProvider>
          </PWAInstallProvider>
        </PlaylistsProvider>
      </FavoritesProvider>

    </BrowserRouter>
  </React.StrictMode>
);
