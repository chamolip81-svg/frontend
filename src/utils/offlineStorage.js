// src/utils/offlineStorage.js
import { openDB } from "idb";

const DB_NAME = "auralyn-offline-db";
const STORE_NAME = "songs";

const dbPromise = openDB(DB_NAME, 1, {
  upgrade(db) {
    if (!db.objectStoreNames.contains(STORE_NAME)) {
      db.createObjectStore(STORE_NAME, { keyPath: "id" });
    }
  },
});

export async function saveSongOffline(song, audioBlob) {
  const db = await dbPromise;
  await db.put(STORE_NAME, {
    id: song.id,
    song,
    audioBlob,
    savedAt: Date.now(),
  });
}

export async function removeOfflineSong(songId) {
  const db = await dbPromise;
  await db.delete(STORE_NAME, songId);
}

export async function getAllOfflineSongs() {
  const db = await dbPromise;
  return db.getAll(STORE_NAME);
}

export async function getOfflineSong(songId) {
  const db = await dbPromise;
  return db.get(STORE_NAME, songId);
}
