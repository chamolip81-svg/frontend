import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { PlaylistsProvider } from "./context/PlaylistsContext";
import App from "./App";
import "./index.css";
import { PWAInstallProvider } from "./context/PWAInstallContext";

import { PlayerProvider } from "./context/PlayerContext";
import { FavoritesProvider } from "./context/FavoritesContext";

/* ===========================
   PERFORMANCE MONITORING (NEW)
   =========================== */
const logPerformanceMetric = (name, value) => {
  console.log(`⚡ ${name}: ${value.toFixed(2)}ms`);
  
  // Send to your analytics service if available
  if (window.gtag) {
    window.gtag('event', name, {
      value: Math.round(value),
      event_category: 'Performance',
    });
  }
};

const setupPerformanceObservers = () => {
  if ('PerformanceObserver' in window) {
    // FCP (First Contentful Paint)
    try {
      const fcpObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          logPerformanceMetric('FCP', entry.startTime);
        }
      });
      fcpObserver.observe({ entryTypes: ['paint'] });
    } catch (e) {
      console.warn('FCP observer not supported');
    }

    // LCP (Largest Contentful Paint)
    try {
      const lcpObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        const lastEntry = entries[entries.length - 1];
        logPerformanceMetric('LCP', lastEntry.startTime);
      });
      lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });
    } catch (e) {
      console.warn('LCP observer not supported');
    }

    // CLS (Cumulative Layout Shift)
    let clsValue = 0;
    try {
      const clsObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (!entry.hadRecentInput) {
            clsValue += entry.value;
            logPerformanceMetric('CLS', clsValue * 1000); // Convert to milliseconds for logging
          }
        }
      });
      clsObserver.observe({ entryTypes: ['layout-shift'] });
    } catch (e) {
      console.warn('CLS observer not supported');
    }
  }
};

const measurePageLoadTime = () => {
  if (window.performance && window.performance.timing) {
    window.addEventListener('load', () => {
      const navigation = performance.timing;
      const pageLoadTime = navigation.loadEventEnd - navigation.navigationStart;
      logPerformanceMetric('PageLoadTime', pageLoadTime);
    });
  }
};

// Setup monitoring
setupPerformanceObservers();
measurePageLoadTime();

// Service Worker registration for offline support and caching
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('/service-worker.js')
    .then((reg) => console.log('✅ Service Worker registered'))
    .catch((err) => console.warn('Service Worker registration failed:', err));
}

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