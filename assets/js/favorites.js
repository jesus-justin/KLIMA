/* Favorites & Recent Searches Manager */

const FavoritesManager = {
  MAX_RECENT: 5,
  
  getFavorites() {
    try {
      const raw = localStorage.getItem('klima:favorites');
      return raw ? JSON.parse(raw) : [];
    } catch(_) { return []; }
  },
  
  addFavorite(location) {
    const favs = this.getFavorites();
    // Avoid duplicates
    const exists = favs.find(f => f.lat === location.lat && f.lon === location.lon);
    if (exists) return favs;
    
    favs.unshift({
      name: location.name,
      lat: location.lat,
      lon: location.lon,
      country: location.country,
      addedAt: Date.now()
    });
    
    try {
      localStorage.setItem('klima:favorites', JSON.stringify(favs));
    } catch(_) {}
    return favs;
  },
  
  removeFavorite(lat, lon) {
    const favs = this.getFavorites().filter(f => !(f.lat === lat && f.lon === lon));
    try {
      localStorage.setItem('klima:favorites', JSON.stringify(favs));
    } catch(_) {}
    return favs;
  },
  
  isFavorite(lat, lon) {
    return this.getFavorites().some(f => f.lat === lat && f.lon === lon);
  },
  
  getRecent() {
    try {
      const raw = localStorage.getItem('klima:recent');
      return raw ? JSON.parse(raw) : [];
    } catch(_) { return []; }
  },
  
  addRecent(location) {
    let recent = this.getRecent();
    // Remove if exists, then add to front
    recent = recent.filter(r => !(r.lat === location.lat && r.lon === location.lon));
    recent.unshift({
      name: location.name,
      lat: location.lat,
      lon: location.lon,
      country: location.country,
      accessedAt: Date.now()
    });
    
    // Keep only MAX_RECENT
    recent = recent.slice(0, this.MAX_RECENT);
    
    try {
      localStorage.setItem('klima:recent', JSON.stringify(recent));
    } catch(_) {}
    return recent;
  }
};
