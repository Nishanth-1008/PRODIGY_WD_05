/**
 * Weather Flow - Core Logic Modules
 */

// Application State
const state = {
  activeCity: {
    name: 'London',
    region: 'England',
    country: 'United Kingdom',
    lat: 51.5074,
    lon: -0.1278,
    timezone: 'Europe/London'
  },
  weatherData: null,
  unit: 'C', // 'C' or 'F'
  favorites: [], // Array of city objects
  recents: [], // Array of city objects (max 5)
  autoRefreshTimer: null
};

// WMO Weather Codes Mapping
// Maps code -> { name, bgState, iconFunction }
const weatherCodeMap = {
  0: { name: 'Clear Sky', bgState: 'clear', icon: 'clear' },
  1: { name: 'Mainly Clear', bgState: 'clouds', icon: 'partly-cloudy' },
  2: { name: 'Partly Cloudy', bgState: 'clouds', icon: 'partly-cloudy' },
  3: { name: 'Overcast', bgState: 'clouds', icon: 'cloudy' },
  45: { name: 'Foggy', bgState: 'clouds', icon: 'fog' },
  48: { name: 'Depositing Rime Fog', bgState: 'clouds', icon: 'fog' },
  51: { name: 'Light Drizzle', bgState: 'rain', icon: 'drizzle' },
  53: { name: 'Moderate Drizzle', bgState: 'rain', icon: 'drizzle' },
  55: { name: 'Dense Drizzle', bgState: 'rain', icon: 'drizzle' },
  56: { name: 'Light Freezing Drizzle', bgState: 'snow', icon: 'snow' },
  57: { name: 'Dense Freezing Drizzle', bgState: 'snow', icon: 'snow' },
  61: { name: 'Slight Rain', bgState: 'rain', icon: 'rain' },
  63: { name: 'Moderate Rain', bgState: 'rain', icon: 'rain' },
  65: { name: 'Heavy Rain', bgState: 'rain', icon: 'rain' },
  66: { name: 'Light Freezing Rain', bgState: 'snow', icon: 'snow' },
  67: { name: 'Heavy Freezing Rain', bgState: 'snow', icon: 'snow' },
  71: { name: 'Slight Snowfall', bgState: 'snow', icon: 'snow' },
  73: { name: 'Moderate Snowfall', bgState: 'snow', icon: 'snow' },
  75: { name: 'Heavy Snowfall', bgState: 'snow', icon: 'snow' },
  77: { name: 'Snow Grains', bgState: 'snow', icon: 'snow' },
  80: { name: 'Slight Rain Showers', bgState: 'rain', icon: 'showers' },
  81: { name: 'Moderate Rain Showers', bgState: 'rain', icon: 'showers' },
  82: { name: 'Violent Rain Showers', bgState: 'rain', icon: 'showers' },
  85: { name: 'Slight Snow Showers', bgState: 'snow', icon: 'snow' },
  86: { name: 'Heavy Snow Showers', bgState: 'snow', icon: 'snow' },
  95: { name: 'Thunderstorm', bgState: 'thunderstorm', icon: 'thunderstorm' },
  96: { name: 'Thunderstorm with Hail', bgState: 'thunderstorm', icon: 'thunderstorm' },
  99: { name: 'Heavy Thunderstorm with Hail', bgState: 'thunderstorm', icon: 'thunderstorm' }
};

// DOM Cache
const dom = {
  searchInput: document.getElementById('search-input'),
  searchForm: document.getElementById('search-form'),
  clearSearchBtn: document.getElementById('clear-search-btn'),
  autocompleteList: document.getElementById('autocomplete-list'),
  locateBtn: document.getElementById('locate-btn'),
  refreshBtn: document.getElementById('refresh-btn'),
  unitCBtn: document.getElementById('unit-c-btn'),
  unitFBtn: document.getElementById('unit-f-btn'),
  errorBanner: document.getElementById('error-banner'),
  errorMessage: document.getElementById('error-message'),
  closeErrorBtn: document.getElementById('close-error-btn'),
  
  // Skeletons
  currentSkeleton: document.getElementById('current-skeleton'),
  currentContent: document.getElementById('current-card-content'),
  hourlySkeleton: document.getElementById('hourly-skeleton'),
  hourlyScroller: document.getElementById('hourly-scroller'),
  dailySkeleton: document.getElementById('daily-skeleton'),
  dailyList: document.getElementById('daily-list'),
  detailsSkeleton: document.getElementById('details-skeleton'),
  detailsGrid: document.getElementById('details-grid'),
  
  // Current Weather Info
  cityName: document.getElementById('city-name'),
  countryRegion: document.getElementById('country-region'),
  favToggleBtn: document.getElementById('fav-toggle-btn'),
  currentTemp: document.getElementById('current-temp'),
  weatherIconWrapper: document.getElementById('weather-icon-wrapper'),
  weatherDesc: document.getElementById('weather-description'),
  feelsLikeTemp: document.getElementById('feels-like-temp'),
  localDate: document.getElementById('local-date'),
  localTime: document.getElementById('local-time'),
  shareWeatherBtn: document.getElementById('share-weather-btn'),
  
  // Tabs
  tabFavorites: document.getElementById('tab-favorites'),
  tabRecents: document.getElementById('tab-recents'),
  favoritesList: document.getElementById('favorites-list'),
  recentsList: document.getElementById('recents-list'),
  
  // Details Metrics
  detailWindSpeed: document.getElementById('detail-wind-speed'),
  windCompass: document.getElementById('wind-compass'),
  compassPointer: document.getElementById('compass-pointer'),
  detailWindDir: document.getElementById('detail-wind-dir'),
  detailHumidity: document.getElementById('detail-humidity'),
  humidityBar: document.getElementById('humidity-bar'),
  detailHumidityDesc: document.getElementById('detail-humidity-desc'),
  detailUv: document.getElementById('detail-uv'),
  detailUvDesc: document.getElementById('detail-uv-desc'),
  uvBar: document.getElementById('uv-bar'),
  detailUvAdvice: document.getElementById('detail-uv-advice'),
  sunPosition: document.getElementById('sun-position'),
  detailSunrise: document.getElementById('detail-sunrise'),
  detailSunset: document.getElementById('detail-sunset'),
  detailVisibility: document.getElementById('detail-visibility'),
  detailVisibilityDesc: document.getElementById('detail-visibility-desc'),
  detailPressure: document.getElementById('detail-pressure'),
  detailPressureDesc: document.getElementById('detail-pressure-desc'),
  
  // Animation containers
  particlesLayer: document.getElementById('particles-layer')
};

// Search Suggestion State for keyboard nav
let suggestionFocusIndex = -1;
let debounceTimeout = null;

// ==========================================
// 1. Core Initialization
// ==========================================
document.addEventListener('DOMContentLoaded', () => {
  initStorage();
  setupEventListeners();
  loadInitialWeather();
  startAutoRefresh();
});

// ==========================================
// 2. Storage Module
// ==========================================
function initStorage() {
  // Unit settings
  const storedUnit = localStorage.getItem('wf_unit');
  if (storedUnit === 'C' || storedUnit === 'F') {
    state.unit = storedUnit;
    updateUnitButtons();
  }
  
  // Favorites settings
  const storedFavs = localStorage.getItem('wf_favorites');
  if (storedFavs) {
    try {
      state.favorites = JSON.parse(storedFavs);
    } catch (e) {
      state.favorites = [];
    }
  }
  
  // Recents settings
  const storedRecents = localStorage.getItem('wf_recents');
  if (storedRecents) {
    try {
      state.recents = JSON.parse(storedRecents);
    } catch (e) {
      state.recents = [];
    }
  }
  
  // Active city settings
  const storedCity = localStorage.getItem('wf_active_city');
  if (storedCity) {
    try {
      state.activeCity = JSON.parse(storedCity);
    } catch (e) {
      // Keep London default
    }
  }

  updateSavedLocationsUI();
}

function saveActiveCity(city) {
  state.activeCity = city;
  localStorage.setItem('wf_active_city', JSON.stringify(city));
  
  // Save to Recents
  const index = state.recents.findIndex(c => c.name.toLowerCase() === city.name.toLowerCase() && Math.abs(c.lat - city.lat) < 0.05);
  if (index !== -1) {
    state.recents.splice(index, 1);
  }
  state.recents.unshift(city);
  if (state.recents.length > 5) {
    state.recents.pop();
  }
  localStorage.setItem('wf_recents', JSON.stringify(state.recents));
  
  updateSavedLocationsUI();
}

function toggleFavorite() {
  const city = state.activeCity;
  const isFav = state.favorites.some(c => c.name.toLowerCase() === city.name.toLowerCase() && Math.abs(c.lat - city.lat) < 0.05);
  
  if (isFav) {
    // Remove
    state.favorites = state.favorites.filter(c => !(c.name.toLowerCase() === city.name.toLowerCase() && Math.abs(c.lat - city.lat) < 0.05));
    dom.favToggleBtn.classList.remove('favorited');
    dom.favToggleBtn.setAttribute('aria-pressed', 'false');
  } else {
    // Add
    state.favorites.push(city);
    dom.favToggleBtn.classList.add('favorited');
    dom.favToggleBtn.setAttribute('aria-pressed', 'true');
  }
  
  localStorage.setItem('wf_favorites', JSON.stringify(state.favorites));
  updateSavedLocationsUI();
}

// ==========================================
// 3. API Module (Open-Meteo Integration)
// ==========================================
async function fetchCitySuggestions(query) {
  if (!query || query.trim().length < 2) return [];
  const url = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(query)}&count=5&language=en&format=json`;
  try {
    const response = await fetch(url);
    if (!response.ok) throw new Error('Suggestions fetch failed');
    const data = await response.json();
    return data.results || [];
  } catch (err) {
    console.error('Suggestions geocoding failed', err);
    return [];
  }
}

async function fetchWeatherData(lat, lon, timezone) {
  const tz = timezone || 'auto';
  // Open-Meteo single fetch URL with:
  // Current weather, 24-hour hourly, 7-day daily, and specific indexes.
  const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,apparent_temperature,is_day,precipitation,rain,showers,snowfall,weather_code,cloud_cover,pressure_msl,wind_speed_10m,wind_direction_10m,uv_index,visibility&hourly=temperature_2m,relative_humidity_2m,apparent_temperature,precipitation_probability,weather_code,wind_speed_10m&daily=weather_code,temperature_2m_max,temperature_2m_min,apparent_temperature_max,apparent_temperature_min,sunrise,sunset,uv_index_max&timezone=${encodeURIComponent(tz)}`;
  
  try {
    const response = await fetch(url);
    if (!response.ok) throw new Error('Weather fetch failed');
    const data = await response.json();
    return data;
  } catch (err) {
    throw err;
  }
}

// ==========================================
// 4. Location Module
// ==========================================
function loadInitialWeather() {
  getWeatherForCity(state.activeCity);
}

function getWeatherByGPS() {
  if (!navigator.geolocation) {
    showError('Geolocation is not supported by your browser');
    return;
  }
  
  showSkeletons();
  
  navigator.geolocation.getCurrentPosition(
    async (position) => {
      const { latitude, longitude } = position.coords;
      // Try to reverse geocode coordinate to get a proper city name
      let cityName = 'Current Location';
      let region = '';
      let country = '';
      
      try {
        const revGeoUrl = `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json`;
        const res = await fetch(revGeoUrl, { headers: { 'User-Agent': 'WeatherFlowApp/1.0' } });
        if (res.ok) {
          const data = await res.json();
          cityName = data.address.city || data.address.town || data.address.village || data.address.county || 'Current Location';
          country = data.address.country || '';
          region = data.address.state || '';
        }
      } catch (e) {
        console.warn('Reverse geocoding coordinates failed, falling back to label', e);
      }
      
      const gpsCity = {
        name: cityName,
        region: region,
        country: country,
        lat: latitude,
        lon: longitude,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
      };
      
      getWeatherForCity(gpsCity);
    },
    (error) => {
      console.warn('GPS location access denied or unavailable', error);
      let msg = 'Location access denied. Please search for a city instead.';
      if (error.code === error.POSITION_UNAVAILABLE) {
        msg = 'Position unavailable. Please search for your city.';
      } else if (error.code === error.TIMEOUT) {
        msg = 'Location request timed out. Please search for your city.';
      }
      showError(msg);
      hideSkeletons();
    },
    { timeout: 8000 }
  );
}

// ==========================================
// 5. Main Weather Flow
// ==========================================
async function getWeatherForCity(city) {
  showSkeletons();
  hideError();
  
  try {
    const data = await fetchWeatherData(city.lat, city.lon, city.timezone);
    state.weatherData = data;
    saveActiveCity(city);
    
    // Bind UI
    updateCurrentWeatherUI();
    updateHourlyForecastUI();
    updateDailyForecastUI();
    updateMetricsUI();
    
    // Animation triggers
    const code = data.current.weather_code;
    const isDay = data.current.is_day;
    const weatherState = getWeatherStateString(code, isDay);
    setWeatherBackground(weatherState);

    // Hide Skeletons
    hideSkeletons();
  } catch (err) {
    console.error('Fetch weather failed', err);
    showError('Unable to fetch weather. Please check your connection and try again.');
    hideSkeletons();
  }
}

// ==========================================
// 6. UI Module (Renderer)
// ==========================================
function showSkeletons() {
  dom.currentSkeleton.classList.remove('hidden');
  dom.currentContent.setAttribute('hidden', 'true');
  
  dom.hourlySkeleton.classList.remove('hidden');
  dom.hourlyScroller.setAttribute('hidden', 'true');
  
  dom.dailySkeleton.classList.remove('hidden');
  dom.dailyList.setAttribute('hidden', 'true');
  
  dom.detailsSkeleton.classList.remove('hidden');
  dom.detailsGrid.setAttribute('hidden', 'true');
}

function hideSkeletons() {
  dom.currentSkeleton.classList.add('hidden');
  dom.currentContent.removeAttribute('hidden');
  
  dom.hourlySkeleton.classList.add('hidden');
  dom.hourlyScroller.removeAttribute('hidden');
  
  dom.dailySkeleton.classList.add('hidden');
  dom.dailyList.removeAttribute('hidden');
  
  dom.detailsSkeleton.classList.add('hidden');
  dom.detailsGrid.removeAttribute('hidden');
}

function showError(message) {
  dom.errorMessage.textContent = message;
  dom.errorBanner.removeAttribute('hidden');
  
  // Auto scroll to error on top
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function hideError() {
  dom.errorBanner.setAttribute('hidden', 'true');
}

function updateUnitButtons() {
  if (state.unit === 'C') {
    dom.unitCBtn.classList.add('active');
    dom.unitCBtn.setAttribute('aria-pressed', 'true');
    dom.unitFBtn.classList.remove('active');
    dom.unitFBtn.setAttribute('aria-pressed', 'false');
  } else {
    dom.unitCBtn.classList.remove('active');
    dom.unitCBtn.setAttribute('aria-pressed', 'false');
    dom.unitFBtn.classList.add('active');
    dom.unitFBtn.setAttribute('aria-pressed', 'true');
  }
}

function formatTemp(celsius) {
  if (state.unit === 'F') {
    return Math.round((celsius * 9) / 5 + 32);
  }
  return Math.round(celsius);
}

function updateCurrentWeatherUI() {
  const d = state.weatherData;
  const city = state.activeCity;
  
  dom.cityName.textContent = city.name;
  dom.countryRegion.textContent = [city.region, city.country].filter(Boolean).join(', ');
  
  // Favorite state icon
  const isFav = state.favorites.some(c => c.name.toLowerCase() === city.name.toLowerCase() && Math.abs(c.lat - city.lat) < 0.05);
  if (isFav) {
    dom.favToggleBtn.classList.add('favorited');
    dom.favToggleBtn.setAttribute('aria-pressed', 'true');
  } else {
    dom.favToggleBtn.classList.remove('favorited');
    dom.favToggleBtn.setAttribute('aria-pressed', 'false');
  }

  // Temp display
  dom.currentTemp.textContent = formatTemp(d.current.temperature_2m);
  dom.feelsLikeTemp.textContent = formatTemp(d.current.apparent_temperature);
  const unitLabel = document.querySelector('.temp-display .temp-unit');
  if (unitLabel) {
    unitLabel.textContent = '°' + state.unit;
  }
  
  // Icon
  const code = d.current.weather_code;
  const isDay = d.current.is_day;
  const mapItem = weatherCodeMap[code] || { name: 'Unknown', bgState: 'clear', icon: 'clear' };
  dom.weatherDesc.textContent = mapItem.name;
  
  dom.weatherIconWrapper.innerHTML = getWeatherSVG(mapItem.icon, isDay, 80);
  
  // Date/Time from local timezone offset
  updateDateTime(d.timezone_abbreviation, d.utc_offset_seconds);
}

function updateDateTime(tzAbbr, utcOffsetSeconds) {
  // compute local time of the queried location
  const localDateObject = getLocalTime(utcOffsetSeconds);
  
  // Options
  const dateOptions = { weekday: 'long', month: 'long', day: 'numeric' };
  const timeOptions = { hour: 'numeric', minute: '2-digit', hour12: true };
  
  dom.localDate.textContent = localDateObject.toLocaleDateString('en-US', dateOptions);
  dom.localTime.textContent = `${localDateObject.toLocaleTimeString('en-US', timeOptions)} (${tzAbbr})`;
}

function getLocalTime(utcOffsetSeconds) {
  const now = new Date();
  const utc = now.getTime() + now.getTimezoneOffset() * 60000;
  return new Date(utc + utcOffsetSeconds * 1000);
}

function updateHourlyForecastUI() {
  const d = state.weatherData;
  dom.hourlyScroller.innerHTML = '';
  
  // Extract hourly data. Open-Meteo returns forecasts from midnight of the current day.
  // We want to find the current hour index and show the next 24 hours.
  const now = new Date();
  const utcTime = now.getTime() + now.getTimezoneOffset() * 60000;
  const localTimeMs = utcTime + d.utc_offset_seconds * 1000;
  const localHourStr = new Date(localTimeMs).toISOString().slice(0, 13) + ':00';
  
  let currentHourIdx = d.hourly.time.findIndex(t => t.startsWith(localHourStr));
  if (currentHourIdx === -1) {
    // Fallback: use current time closest
    const localHourNum = new Date(localTimeMs).getHours();
    currentHourIdx = localHourNum; // Approximation based on indexing starting at midnight
  }
  
  const entriesCount = 24;
  for (let i = 0; i < entriesCount; i++) {
    const idx = currentHourIdx + i;
    if (idx >= d.hourly.time.length) break;
    
    const timeStr = d.hourly.time[idx];
    const hourDate = new Date(timeStr);
    let displayHour = hourDate.toLocaleTimeString('en-US', { hour: 'numeric', hour12: true });
    if (i === 0) displayHour = 'Now';
    
    const temp = d.hourly.temperature_2m[idx];
    const code = d.hourly.weather_code[idx];
    // Guess isDay for hourly items: hours between 6am and 6pm are day
    const hourNum = hourDate.getHours();
    const isDayItem = hourNum >= 6 && hourNum < 18 ? 1 : 0;
    
    const mapItem = weatherCodeMap[code] || { name: 'Unknown', icon: 'clear' };
    const pop = d.hourly.precipitation_probability ? d.hourly.precipitation_probability[idx] : 0;
    
    const itemEl = document.createElement('div');
    itemEl.className = 'hourly-item entry';
    
    itemEl.innerHTML = `
      <span class="hourly-time">${displayHour}</span>
      <div class="hourly-icon">${getWeatherSVG(mapItem.icon, isDayItem, 32)}</div>
      <span class="hourly-temp">${formatTemp(temp)}°</span>
      ${pop > 10 ? `<span class="hourly-pop">${pop}%</span>` : ''}
    `;
    
    dom.hourlyScroller.appendChild(itemEl);
  }
  
  // Re-run fallback check for scroll-driven animations
  setupScrollDrivenFallback();
}

function updateDailyForecastUI() {
  const d = state.weatherData;
  dom.dailyList.innerHTML = '';
  
  // Find global min and max daily temperatures to calculate absolute temperature bars
  const globalMin = Math.min(...d.daily.temperature_2m_min);
  const globalMax = Math.max(...d.daily.temperature_2m_max);
  const globalRange = globalMax - globalMin || 1;
  
  const daysCount = d.daily.time.length;
  for (let i = 0; i < daysCount; i++) {
    const timeStr = d.daily.time[i];
    const date = new Date(timeStr);
    
    let dayName = date.toLocaleDateString('en-US', { weekday: 'long' });
    if (i === 0) dayName = 'Today';
    
    const code = d.daily.weather_code[i];
    const mapItem = weatherCodeMap[code] || { name: 'Unknown', icon: 'clear' };
    
    const minC = d.daily.temperature_2m_min[i];
    const maxC = d.daily.temperature_2m_max[i];
    
    // Apple Weather-style temperature bar positions
    const leftPercent = ((minC - globalMin) / globalRange) * 100;
    const widthPercent = ((maxC - minC) / globalRange) * 100;
    
    const rowEl = document.createElement('div');
    rowEl.className = 'daily-row';
    rowEl.innerHTML = `
      <span class="daily-day">${dayName}</span>
      <div class="daily-icon-box">${getWeatherSVG(mapItem.icon, 1, 24)}</div>
      <span class="daily-min">${formatTemp(minC)}°</span>
      <div class="daily-temp-bar-container" aria-hidden="true">
        <div class="daily-temp-bar" style="left: ${leftPercent}%; width: ${widthPercent}%;"></div>
      </div>
      <span class="daily-max">${formatTemp(maxC)}°</span>
    `;
    
    dom.dailyList.appendChild(rowEl);
  }
}

function updateMetricsUI() {
  const d = state.weatherData;
  
  // Wind Speed & Compass
  const speed = d.current.wind_speed_10m;
  const deg = d.current.wind_direction_10m;
  dom.detailWindSpeed.textContent = Math.round(speed);
  dom.detailWindDir.textContent = getWindDirection(deg);
  dom.compassPointer.style.setProperty('--wind-deg', `${deg}deg`);
  
  // Humidity
  const humidity = d.current.relative_humidity_2m;
  dom.detailHumidity.textContent = humidity;
  dom.humidityBar.style.setProperty('--percent', `${humidity}%`);
  
  // Dew Point approximation from temperature and humidity (Magnus-Tetens formula)
  const T = d.current.temperature_2m;
  const RH = humidity;
  const a = 17.27;
  const b = 237.7;
  const alpha = ((a * T) / (b + T)) + Math.log(RH / 100.0);
  const dewPoint = (b * alpha) / (a - alpha);
  dom.detailHumidityDesc.textContent = `The dew point is ${formatTemp(dewPoint)}° right now.`;
  
  // UV Index
  const uv = d.current.uv_index;
  dom.detailUv.textContent = uv.toFixed(1);
  // UV rating scales from 0 to 12
  const uvPercent = Math.min(100, (uv / 12) * 100);
  dom.uvBar.style.setProperty('--percent', `${uvPercent}%`);
  dom.detailUvDesc.textContent = getUVCategory(uv);
  dom.detailUvAdvice.textContent = getUVAdvice(uv);
  
  // Visibility
  const visMeters = d.current.visibility;
  const visKm = visMeters / 1000;
  dom.detailVisibility.textContent = visKm.toFixed(1);
  dom.detailVisibilityDesc.textContent = getVisibilityDesc(visKm);
  
  // Pressure
  const pressure = d.current.pressure_msl;
  dom.detailPressure.textContent = Math.round(pressure);
  dom.detailPressureDesc.textContent = getPressureDesc(pressure);
  
  // Sunrise & Sunset Arc positioning
  const sunriseStr = d.daily.sunrise[0];
  const sunsetStr = d.daily.sunset[0];
  const sunriseDate = new Date(sunriseStr);
  const sunsetDate = new Date(sunsetStr);
  
  dom.detailSunrise.textContent = sunriseDate.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
  dom.detailSunset.textContent = sunsetDate.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
  
  // Compute progress of current time on the sun arc
  const nowLocal = getLocalTime(d.utc_offset_seconds);
  const sunriseMs = sunriseDate.getTime();
  const sunsetMs = sunsetDate.getTime();
  const nowMs = nowLocal.getTime();
  
  let sunProgress = 0;
  if (nowMs >= sunsetMs) {
    sunProgress = 100;
  } else if (nowMs > sunriseMs) {
    sunProgress = ((nowMs - sunriseMs) / (sunsetMs - sunriseMs)) * 100;
  }
  dom.sunPosition.style.setProperty('--sun-progress', `${sunProgress}%`);
}

function updateSavedLocationsUI() {
  // Render Favorites list
  dom.favoritesList.innerHTML = '';
  if (state.favorites.length === 0) {
    dom.favoritesList.innerHTML = '<li class="empty-state">No favorite locations saved yet.</li>';
  } else {
    state.favorites.forEach((city, idx) => {
      const li = document.createElement('li');
      li.className = 'location-item-row';
      li.setAttribute('role', 'option');
      li.innerHTML = `
        <div class="location-item-info">
          <span class="location-item-name">${city.name}</span>
          <span class="location-item-weather">${city.region || ''}, ${city.country}</span>
        </div>
        <div class="location-item-temp-box">
          <button class="remove-fav-btn" data-index="${idx}" aria-label="Remove ${city.name} from favorites">
            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>
      `;
      li.addEventListener('click', (e) => {
        // If they click delete, don't load weather
        if (e.target.closest('.remove-fav-btn')) return;
        getWeatherForCity(city);
      });
      dom.favoritesList.appendChild(li);
    });
    
    // Add delete listeners
    dom.favoritesList.querySelectorAll('.remove-fav-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const idx = parseInt(btn.getAttribute('data-index'));
        state.favorites.splice(idx, 1);
        localStorage.setItem('wf_favorites', JSON.stringify(state.favorites));
        updateSavedLocationsUI();
        // Update main current star button state if removing active city
        updateCurrentWeatherUI();
      });
    });
  }

  // Render Recents list
  dom.recentsList.innerHTML = '';
  if (state.recents.length === 0) {
    dom.recentsList.innerHTML = '<li class="empty-state">Your search history is empty.</li>';
  } else {
    state.recents.forEach(city => {
      const li = document.createElement('li');
      li.className = 'location-item-row';
      li.setAttribute('role', 'option');
      li.innerHTML = `
        <div class="location-item-info">
          <span class="location-item-name">${city.name}</span>
          <span class="location-item-weather">${city.region || ''}, ${city.country}</span>
        </div>
      `;
      li.addEventListener('click', () => {
        getWeatherForCity(city);
      });
      dom.recentsList.appendChild(li);
    });
  }
}

// ==========================================
// 7. Dynamic Background & Particle System
// ==========================================
function getWeatherStateString(code, isDay) {
  const mapItem = weatherCodeMap[code] || { bgState: 'clear' };
  let suffix = isDay ? '-day' : '-night';
  if (mapItem.bgState === 'snow' || mapItem.bgState === 'thunderstorm') {
    return mapItem.bgState; // These don't distinguish day/night background styling
  }
  return mapItem.bgState + suffix;
}

function setWeatherBackground(weatherState) {
  document.body.setAttribute('data-weather', weatherState);
  clearParticles();
  
  if (weatherState.startsWith('rain')) {
    spawnRain();
  } else if (weatherState.startsWith('snow')) {
    spawnSnow();
  } else if (weatherState.startsWith('thunderstorm')) {
    triggerThunderstorms();
  }
}

function clearParticles() {
  dom.particlesLayer.innerHTML = '';
  
  // Clear any running thunderstorm timers
  if (window.thunderstormInterval) {
    clearInterval(window.thunderstormInterval);
    window.thunderstormInterval = null;
  }
}

function spawnRain() {
  const count = 50;
  const fragment = document.createDocumentFragment();
  for (let i = 0; i < count; i++) {
    const drop = document.createElement('div');
    drop.className = 'rain-drop';
    drop.style.left = `${Math.random() * 100}%`;
    drop.style.animationDuration = `${0.6 + Math.random() * 0.6}s`;
    drop.style.animationDelay = `${Math.random() * 2}s`;
    fragment.appendChild(drop);
  }
  dom.particlesLayer.appendChild(fragment);
}

function spawnSnow() {
  const count = 45;
  const fragment = document.createDocumentFragment();
  for (let i = 0; i < count; i++) {
    const flake = document.createElement('div');
    flake.className = 'snowflake';
    flake.style.left = `${Math.random() * 100}%`;
    const size = `${3 + Math.random() * 5}px`;
    flake.style.width = size;
    flake.style.height = size;
    flake.style.animationDuration = `${4 + Math.random() * 5}s`;
    flake.style.animationDelay = `${Math.random() * 4}s`;
    fragment.appendChild(flake);
  }
  dom.particlesLayer.appendChild(fragment);
}

function triggerThunderstorms() {
  // Periodically add lightning flash
  const flashEl = document.createElement('div');
  flashEl.className = 'lightning-flash';
  dom.particlesLayer.appendChild(flashEl);
  
  const triggerFlash = () => {
    flashEl.classList.add('flash-anim');
    setTimeout(() => {
      flashEl.classList.remove('flash-anim');
    }, 900);
  };
  
  // Initial flash
  triggerFlash();
  
  // Set interval
  window.thunderstormInterval = setInterval(() => {
    // 50% chance of double strike
    triggerFlash();
    if (Math.random() > 0.5) {
      setTimeout(triggerFlash, 400);
    }
  }, 7000 + Math.random() * 5000);
}

// ==========================================
// 8. Event Listeners & Interactions
// ==========================================
function setupEventListeners() {
  // Unit Toggles
  dom.unitCBtn.addEventListener('click', () => {
    if (state.unit === 'C') return;
    state.unit = 'C';
    localStorage.setItem('wf_unit', 'C');
    updateUnitButtons();
    updateCurrentWeatherUI();
    updateHourlyForecastUI();
    updateDailyForecastUI();
    updateMetricsUI();
  });
  
  dom.unitFBtn.addEventListener('click', () => {
    if (state.unit === 'F') return;
    state.unit = 'F';
    localStorage.setItem('wf_unit', 'F');
    updateUnitButtons();
    updateCurrentWeatherUI();
    updateHourlyForecastUI();
    updateDailyForecastUI();
    updateMetricsUI();
  });

  // GPS button
  dom.locateBtn.addEventListener('click', getWeatherByGPS);
  
  // Refresh button
  dom.refreshBtn.addEventListener('click', () => {
    getWeatherForCity(state.activeCity);
  });
  
  // Favorite toggle
  dom.favToggleBtn.addEventListener('click', toggleFavorite);

  // Panel Tabs Switching
  dom.tabFavorites.addEventListener('click', () => {
    dom.tabFavorites.classList.add('active');
    dom.tabFavorites.setAttribute('aria-selected', 'true');
    dom.tabRecents.classList.remove('active');
    dom.tabRecents.setAttribute('aria-selected', 'false');
    dom.favoritesList.removeAttribute('hidden');
    dom.recentsList.setAttribute('hidden', 'true');
  });

  dom.tabRecents.addEventListener('click', () => {
    dom.tabRecents.classList.add('active');
    dom.tabRecents.setAttribute('aria-selected', 'true');
    dom.tabFavorites.classList.remove('active');
    dom.tabFavorites.setAttribute('aria-selected', 'false');
    dom.recentsList.removeAttribute('hidden');
    dom.favoritesList.setAttribute('hidden', 'true');
  });

  // Error Banner dismiss
  dom.closeErrorBtn.addEventListener('click', hideError);

  // Search input autocomplete logic
  dom.searchInput.addEventListener('input', () => {
    const val = dom.searchInput.value;
    
    if (val.trim().length > 0) {
      dom.clearSearchBtn.removeAttribute('hidden');
    } else {
      dom.clearSearchBtn.setAttribute('hidden', 'true');
    }
    
    // Debounce autocomplete fetches
    clearTimeout(debounceTimeout);
    debounceTimeout = setTimeout(async () => {
      if (val.trim().length < 2) {
        dom.autocompleteList.setAttribute('hidden', 'true');
        return;
      }
      
      const suggestions = await fetchCitySuggestions(val);
      renderSuggestions(suggestions);
    }, 300);
  });

  dom.clearSearchBtn.addEventListener('click', () => {
    dom.searchInput.value = '';
    dom.clearSearchBtn.setAttribute('hidden', 'true');
    dom.autocompleteList.setAttribute('hidden', 'true');
    dom.searchInput.focus();
  });

  // Close suggestions dropdown when clicking outside
  document.addEventListener('click', (e) => {
    if (!e.target.closest('.search-box')) {
      dom.autocompleteList.setAttribute('hidden', 'true');
    }
  });

  // Search form submit
  dom.searchForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const val = dom.searchInput.value.trim();
    if (!val) return;
    
    dom.autocompleteList.setAttribute('hidden', 'true');
    
    // Perform geocoding to resolve city
    showSkeletons();
    const suggestions = await fetchCitySuggestions(val);
    
    if (suggestions.length === 0) {
      showError(`Location "${val}" not found. Please try another search.`);
      hideSkeletons();
    } else {
      // Pick first matched city
      const selected = suggestions[0];
      const city = {
        name: selected.name,
        region: selected.admin1 || '',
        country: selected.country || '',
        lat: selected.latitude,
        lon: selected.longitude,
        timezone: selected.timezone
      };
      getWeatherForCity(city);
    }
  });

  // Keyboard navigation on search suggestion dropdown list
  dom.searchInput.addEventListener('keydown', (e) => {
    const items = dom.autocompleteList.querySelectorAll('.autocomplete-item');
    if (items.length === 0 || dom.autocompleteList.hasAttribute('hidden')) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      suggestionFocusIndex = (suggestionFocusIndex + 1) % items.length;
      updateSuggestionFocus(items);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      suggestionFocusIndex = (suggestionFocusIndex - 1 + items.length) % items.length;
      updateSuggestionFocus(items);
    } else if (e.key === 'Enter') {
      if (suggestionFocusIndex >= 0 && suggestionFocusIndex < items.length) {
        e.preventDefault();
        items[suggestionFocusIndex].click();
      }
    } else if (e.key === 'Escape') {
      dom.autocompleteList.setAttribute('hidden', 'true');
      suggestionFocusIndex = -1;
    }
  });

  // Share button clipboard copy
  dom.shareWeatherBtn.addEventListener('click', shareWeatherSummary);
}

function renderSuggestions(suggestions) {
  dom.autocompleteList.innerHTML = '';
  suggestionFocusIndex = -1;
  
  if (suggestions.length === 0) {
    dom.autocompleteList.setAttribute('hidden', 'true');
    return;
  }
  
  suggestions.forEach((item, idx) => {
    const option = document.createElement('div');
    option.className = 'autocomplete-item';
    option.setAttribute('role', 'option');
    option.id = `suggestion-option-${idx}`;
    option.innerHTML = `
      <span>${item.name}${item.admin1 ? `, ${item.admin1}` : ''}</span>
      <span class="autocomplete-country">${item.country}</span>
    `;
    
    option.addEventListener('click', () => {
      const city = {
        name: item.name,
        region: item.admin1 || '',
        country: item.country || '',
        lat: item.latitude,
        lon: item.longitude,
        timezone: item.timezone
      };
      
      dom.searchInput.value = item.name;
      dom.autocompleteList.setAttribute('hidden', 'true');
      getWeatherForCity(city);
    });
    
    dom.autocompleteList.appendChild(option);
  });
  
  dom.autocompleteList.removeAttribute('hidden');
}

function updateSuggestionFocus(items) {
  items.forEach((item, idx) => {
    if (idx === suggestionFocusIndex) {
      item.classList.add('focused');
      dom.searchInput.setAttribute('aria-activedescendant', item.id);
      // Ensure visible
      item.scrollIntoView({ block: 'nearest' });
    } else {
      item.classList.remove('focused');
    }
  });
}

function startAutoRefresh() {
  if (state.autoRefreshTimer) {
    clearInterval(state.autoRefreshTimer);
  }
  
  // Refresh every 10 minutes (600,000 ms)
  state.autoRefreshTimer = setInterval(() => {
    console.log('Auto-refreshing weather data...');
    getWeatherForCity(state.activeCity);
  }, 600000);
}

// Clipboard Sharing Summary Function
function shareWeatherSummary() {
  const d = state.weatherData;
  const city = state.activeCity;
  if (!d) return;
  
  const mapItem = weatherCodeMap[d.current.weather_code] || { name: 'Clear Sky' };
  const temp = formatTemp(d.current.temperature_2m);
  const feelsLike = formatTemp(d.current.apparent_temperature);
  const humidity = d.current.relative_humidity_2m;
  const wind = Math.round(d.current.wind_speed_10m);
  
  const summary = `Weather Flow Summary for ${city.name}, ${city.country}:\n` +
                  `Condition: ${mapItem.name}\n` +
                  `Temperature: ${temp}°${state.unit} (Feels like ${feelsLike}°${state.unit})\n` +
                  `Humidity: ${humidity}%\n` +
                  `Wind Speed: ${wind} km/h\n` +
                  `Shared from Weather Flow Dashboard.`;
                  
  navigator.clipboard.writeText(summary).then(() => {
    // Show a premium toast alert
    showShareToast();
  }).catch(err => {
    console.error('Clipboard copy failed', err);
    alert('Summary copied: \n' + summary); // Fallback alert
  });
}

function showShareToast() {
  // Create a toast notification
  const toast = document.createElement('div');
  toast.style.cssText = `
    position: fixed;
    bottom: 24px;
    left: 50%;
    transform: translateX(-50%) translateY(20px);
    background: rgba(15, 23, 42, 0.9);
    border: 1px solid rgba(255, 255, 255, 0.15);
    color: #ffffff;
    padding: 10px 20px;
    border-radius: 99px;
    font-size: 0.85rem;
    font-weight: 600;
    backdrop-filter: blur(16px);
    box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.4);
    z-index: 1000;
    opacity: 0;
    transition: opacity 0.3s ease, transform 0.3s ease;
  `;
  toast.textContent = 'Weather summary copied to clipboard!';
  document.body.appendChild(toast);
  
  // Trigger animation
  setTimeout(() => {
    toast.style.opacity = '1';
    toast.style.transform = 'translateX(-50%) translateY(0)';
  }, 10);
  
  // Fade out
  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateX(-50%) translateY(20px)';
    setTimeout(() => {
      document.body.removeChild(toast);
    }, 300);
  }, 2500);
}

// ==========================================
// 9. Scroll-driven Animations JS Fallback
// ==========================================
function setupScrollDrivenFallback() {
  const hasSupport = CSS.supports('(animation-timeline: view()) and (animation-range: entry)');
  if (hasSupport) {
    // Rely on native CSS scroll-driven animations
    return;
  }
  
  const scroller = dom.hourlyScroller;
  const entries = scroller.querySelectorAll('.hourly-item');
  
  const animations = new Map();
  
  entries.forEach(entry => {
    const animation = entry.animate(
      [
        { scale: '0.92', opacity: '0.6', background: 'rgba(255, 255, 255, 0.02)', borderColor: 'rgba(255, 255, 255, 0.04)' },
        { scale: '1.04', opacity: '1', background: 'rgba(255, 255, 255, 0.08)', borderColor: 'rgba(255, 255, 255, 0.15)' },
        { scale: '0.92', opacity: '0.6', background: 'rgba(255, 255, 255, 0.02)', borderColor: 'rgba(255, 255, 255, 0.04)' }
      ],
      {
        duration: 1,
        fill: 'both'
      }
    );
    animation.pause();
    animations.set(entry, animation);
  });
  
  const tick = () => {
    const scrollerRect = scroller.getBoundingClientRect();
    const scrollerCenterX = scrollerRect.left + scrollerRect.width / 2;
    
    entries.forEach(entry => {
      const animation = animations.get(entry);
      if (!animation) return;
      
      const entryRect = entry.getBoundingClientRect();
      const entryCenterX = entryRect.left + entryRect.width / 2;
      
      // Calculate position relative to the scroller viewport center
      const distance = Math.abs(scrollerCenterX - entryCenterX);
      const maxDistance = scrollerRect.width / 2;
      const progress = Math.max(0, Math.min(1, distance / maxDistance));
      
      // We map progress (0 at center, 1 at edge) to animation time (0.5 is center, 0/1 is edge)
      // When item is centered, currentTime is 0.5. When item moves left, currentTime approaches 0.
      // When item moves right, currentTime approaches 1.
      const isLeft = entryCenterX < scrollerCenterX;
      let animProgress = 0.5;
      
      if (isLeft) {
        animProgress = 0.5 - (progress * 0.5);
      } else {
        animProgress = 0.5 + (progress * 0.5);
      }
      
      animation.currentTime = animProgress;
    });
  };
  
  scroller.removeEventListener('scroll', tick);
  scroller.addEventListener('scroll', tick);
  tick();
}

// ==========================================
// 10. Utility & Math Helpers
// ==========================================
function getWindDirection(deg) {
  const directions = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW'];
  const index = Math.round(((deg %= 360) < 0 ? deg + 360 : deg) / 22.5) % 16;
  return directions[index];
}

function getUVCategory(uv) {
  if (uv < 3) return 'Low';
  if (uv < 6) return 'Moderate';
  if (uv < 8) return 'High';
  if (uv < 11) return 'Very High';
  return 'Extreme';
}

function getUVAdvice(uv) {
  if (uv < 3) return 'No special precautions needed.';
  if (uv < 6) return 'Wear sunglasses and SPF 15+ sunscreen.';
  if (uv < 8) return 'Protection needed. Seek shade at midday.';
  if (uv < 11) return 'Extra protection needed. Avoid midday sun.';
  return 'Extreme risk. Take all precautions, stay indoors.';
}

function getVisibilityDesc(km) {
  if (km >= 10) return 'Perfectly clear view.';
  if (km >= 6) return 'Mostly clear view.';
  if (km >= 3) return 'Medium visibility (mist).';
  if (km >= 1) return 'Low visibility (fog/haze).';
  return 'Extremely dense fog. Danger.';
}

function getPressureDesc(hPa) {
  if (hPa > 1020) return 'High pressure (Stable weather).';
  if (hPa >= 1009) return 'Standard atmospheric pressure.';
  return 'Low pressure (Storm potential).';
}

// ==========================================
// 11. SVG Weather Icons Library
// ==========================================
function getWeatherSVG(iconName, isDay, size) {
  const strokeColor = 'currentColor';
  const fills = {
    sun: '#fbbf24',
    cloud: '#94a3b8',
    cloudLight: '#e2e8f0',
    rain: '#60a5fa',
    snow: '#cbd5e1',
    lightning: '#f59e0b',
    moon: '#e2e8f0'
  };

  switch (iconName) {
    case 'clear':
      if (isDay) {
        return `
          <svg class="sun-icon-animated" viewBox="0 0 24 24" width="${size}" height="${size}" fill="none" stroke="${strokeColor}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="12" cy="12" r="4" fill="${fills.sun}" stroke="${fills.sun}"></circle>
            <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41" stroke="${fills.sun}"></path>
          </svg>
        `;
      } else {
        return `
          <svg class="moon-icon-animated" viewBox="0 0 24 24" width="${size}" height="${size}" fill="none" stroke="${strokeColor}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z" fill="${fills.moon}" stroke="${fills.moon}"></path>
          </svg>
        `;
      }
      
    case 'partly-cloudy':
      if (isDay) {
        return `
          <svg viewBox="0 0 24 24" width="${size}" height="${size}" fill="none" stroke="${strokeColor}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M15.18 10A5 5 0 0 0 13.5 6H13a6 6 0 1 0-5.9 7.2" stroke="${fills.sun}"></path>
            <path d="M20 17.58A5 5 0 0 0 18 8h-1.26A8 8 0 1 0 4 16.25" fill="${fills.cloud}" stroke="${fills.cloud}"></path>
          </svg>
        `;
      } else {
        return `
          <svg viewBox="0 0 24 24" width="${size}" height="${size}" fill="none" stroke="${strokeColor}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z" fill="${fills.moon}" stroke="${fills.moon}" opacity="0.8"></path>
            <path d="M20 17.58A5 5 0 0 0 18 8h-1.26A8 8 0 1 0 4 16.25" fill="${fills.cloud}" stroke="${fills.cloud}"></path>
          </svg>
        `;
      }
      
    case 'cloudy':
      return `
        <svg viewBox="0 0 24 24" width="${size}" height="${size}" fill="none" stroke="${strokeColor}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M20 17.58A5 5 0 0 0 18 8h-1.26A8 8 0 1 0 4 16.25" fill="${fills.cloud}" stroke="${fills.cloud}"></path>
        </svg>
      `;
      
    case 'fog':
      return `
        <svg viewBox="0 0 24 24" width="${size}" height="${size}" fill="none" stroke="${strokeColor}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M20 17.58A5 5 0 0 0 18 8h-1.26A8 8 0 1 0 4 16.25" fill="${fills.cloud}" stroke="${fills.cloud}"></path>
          <line x1="5" y1="19" x2="19" y2="19" stroke="${fills.cloudLight}" stroke-width="2"></line>
          <line x1="8" y1="21" x2="16" y2="21" stroke="${fills.cloudLight}" stroke-width="2"></line>
        </svg>
      `;
      
    case 'drizzle':
      return `
        <svg viewBox="0 0 24 24" width="${size}" height="${size}" fill="none" stroke="${strokeColor}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M20 17.58A5 5 0 0 0 18 8h-1.26A8 8 0 1 0 4 16.25" fill="${fills.cloud}" stroke="${fills.cloud}"></path>
          <line x1="8" y1="19" x2="8" y2="21" stroke="${fills.rain}"></line>
          <line x1="12" y1="19" x2="12" y2="21" stroke="${fills.rain}"></line>
          <line x1="16" y1="19" x2="16" y2="21" stroke="${fills.rain}"></line>
        </svg>
      `;
      
    case 'rain':
    case 'showers':
      return `
        <svg viewBox="0 0 24 24" width="${size}" height="${size}" fill="none" stroke="${strokeColor}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M20 17.58A5 5 0 0 0 18 8h-1.26A8 8 0 1 0 4 16.25" fill="${fills.cloud}" stroke="${fills.cloud}"></path>
          <line x1="8" y1="19" x2="6" y2="22" stroke="${fills.rain}"></line>
          <line x1="12" y1="19" x2="10" y2="22" stroke="${fills.rain}"></line>
          <line x1="16" y1="19" x2="14" y2="22" stroke="${fills.rain}"></line>
        </svg>
      `;
      
    case 'snow':
      return `
        <svg viewBox="0 0 24 24" width="${size}" height="${size}" fill="none" stroke="${strokeColor}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M20 17.58A5 5 0 0 0 18 8h-1.26A8 8 0 1 0 4 16.25" fill="${fills.cloud}" stroke="${fills.cloud}"></path>
          <circle cx="8" cy="20" r="1.2" fill="${fills.snow}" stroke="${fills.snow}"></circle>
          <circle cx="12" cy="21" r="1.2" fill="${fills.snow}" stroke="${fills.snow}"></circle>
          <circle cx="16" cy="20" r="1.2" fill="${fills.snow}" stroke="${fills.snow}"></circle>
        </svg>
      `;
      
    case 'thunderstorm':
      return `
        <svg viewBox="0 0 24 24" width="${size}" height="${size}" fill="none" stroke="${strokeColor}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M20 17.58A5 5 0 0 0 18 8h-1.26A8 8 0 1 0 4 16.25" fill="#1e293b" stroke="${fills.cloud}"></path>
          <polyline points="13 18 9 22 12 22 11 26 16 20 13 20" fill="${fills.lightning}" stroke="${fills.lightning}"></polyline>
        </svg>
      `;
      
    default:
      return `
        <svg viewBox="0 0 24 24" width="${size}" height="${size}" fill="none" stroke="${strokeColor}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <circle cx="12" cy="12" r="10" stroke="${fills.cloud}"></circle>
          <line x1="12" y1="8" x2="12" y2="12" stroke="${fills.cloud}"></line>
          <line x1="12" y1="16" x2="12.01" y2="16" stroke="${fills.cloud}"></line>
        </svg>
      `;
  }
}
