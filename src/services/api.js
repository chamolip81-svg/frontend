import axios from 'axios';

const API_BASE =
  process.env.REACT_APP_API_BASE_URL ||
  'http://localhost:5000/api/music';

const api = axios.create({
  baseURL: API_BASE,
  timeout: 30000, // Increased from 10s to 30s (Saavn API can be slow)
  headers: {
    'Content-Type': 'application/json',
  },
});

// Retry logic for failed requests
api.interceptors.response.use(
  response => response,
  error => {
    console.log('API Error interceptor:', {
      message: error.message,
      code: error.code,
      url: error.config?.url,
    });
    return Promise.reject(error);
  }
);

// Helper: Get best image
const getBestImage = (imageArray) => {
  if (!imageArray) {
    return 'https://via.placeholder.com/500x500/1f2937/10b981?text=♪';
  }

  // If it's a string, return it directly
  if (typeof imageArray === 'string') {
    return imageArray;
  }

  // If it's an array, find best quality
  if (!Array.isArray(imageArray) || imageArray.length === 0) {
    return 'https://via.placeholder.com/500x500/1f2937/10b981?text=♪';
  }

  // Try to find 500x500 first (best quality)
  const best500 = imageArray.find(i => i.quality === '500x500');
  if (best500?.url) return best500.url;

  // Fallback to 150x150
  const best150 = imageArray.find(i => i.quality === '150x150');
  if (best150?.url) return best150.url;

  // Fallback to first valid image
  for (const img of imageArray) {
    if (img?.url) return img.url;
  }

  return 'https://via.placeholder.com/500x500/1f2937/10b981?text=♪';
};

// Helper: Get best audio
const getBestAudioUrl = (downloadUrlArray) => {
  if (!downloadUrlArray) return '';

  // If it's a string, return it directly
  if (typeof downloadUrlArray === 'string') {
    return downloadUrlArray;
  }

  // If it's not an array, return empty
  if (!Array.isArray(downloadUrlArray)) return '';

  // Priority order for quality
  const priority = ['320kbps', '160kbps', '96kbps', '48kbps', '12kbps'];

  for (const q of priority) {
    const found = downloadUrlArray.find(d => d.quality === q);
    if (found?.url) return found.url;
  }

  // Fallback to first available
  for (const item of downloadUrlArray) {
    if (item?.url) return item.url;
  }

  return '';
};

// Helper: Artists
const getArtistNames = (artists) => {
  if (!artists) return 'Unknown Artist';

  if (artists.primary?.length) {
    return artists.primary.map(a => a.name).join(', ');
  }

  if (artists.all?.length) {
    return artists.all.map(a => a.name).join(', ');
  }

  return 'Unknown Artist';
};

// SEARCH with pagination
export const searchSongs = async (query, page = 0) => {
  try {
    if (!query || query.trim() === '') {
      return { songs: [], total: 0 };
    }

    console.log(`🔍 Searching for: "${query}" (page ${page})`);
    const startTime = performance.now();

    // Calculate start index
    // NOTE: Backend may use different pagination than expected
    // Adjust based on your backend's API response
    const resultsPerPage = 20;
    const startIndex = page * resultsPerPage;

   const response = await api.get('/search', {
  params: { 
    query: query.trim(),
    page,
    limit: resultsPerPage,
  },
});


    const endTime = performance.now();
    console.log(`✅ Search completed in ${(endTime - startTime).toFixed(0)}ms`);

    if (response.data.success !== true) {
      console.error('Search API returned success: false', response.data);
      return { songs: [], total: 0 };
    }

    const results = response.data.data.results || [];
    const total = response.data.data.total || 0;
    console.log(`📊 Page ${page}: Got ${results.length} songs (total: ${total})`);
    console.log(`   First song: ${results[0]?.id} - ${results[0]?.name}`);
    console.log(`   Last song: ${results[results.length - 1]?.id} - ${results[results.length - 1]?.name}`);

    // Map and normalize songs
    const normalized = results.map((song, idx) => {
      const image = getBestImage(song.image);
      const url = getBestAudioUrl(song.downloadUrl);
      
      // Debug first song of each page
      if (idx === 0) {
        console.log(`Song 0 (page ${page}):`, {
          name: song.name,
          imageOutput: image,
        });
      }

      return {
        id: song.id,
        name: song.name,
        artist: getArtistNames(song.artists),
        album: song.album?.name || 'Single',
        image: image,
        duration: song.duration,
        url: url,
        year: song.year,
        language: song.language,
        hasLyrics: song.hasLyrics,
        explicitContent: song.explicitContent,
        raw: song,
      };
    });

    return { songs: normalized, total };
  } catch (error) {
    let errorMessage = 'Search failed';
    
    if (error.code === 'ECONNABORTED') {
      errorMessage = 'Search took too long. Make sure backend is running on http://localhost:5000';
    } else if (error.message?.includes('Network Error')) {
      errorMessage = 'Network error. Cannot reach backend. Is it running?';
    } else if (error.response?.status === 404) {
      errorMessage = 'Search endpoint not found on backend';
    } else if (error.response?.status === 500) {
      errorMessage = 'Backend error: ' + (error.response?.data?.message || 'Unknown error');
    }

    console.error('❌ Search error:', {
      message: error.message,
      code: error.code,
      status: error.response?.status,
      userMessage: errorMessage,
      config: {
        url: error.config?.url,
        baseURL: error.config?.baseURL,
        timeout: error.config?.timeout,
      },
    });
    
    throw new Error(errorMessage);
  }
};

// FUTURE ENDPOINTS (kept, not removed)
export const getSongDetails = (id) => api.get(`/songs/${id}`);
export const getAlbumDetails = (id) => api.get(`/albums/${id}`);
export const getArtistDetails = (id) => api.get(`/artists/${id}`);

export default api;