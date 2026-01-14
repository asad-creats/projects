import { useState } from 'react';
import { Link } from 'react-router-dom';

const theme = {
  bg: '#0a0a0f',
  surface: '#13131a',
  surfaceHover: '#1a1a24',
  accent: '#6366f1',
  accentHover: '#4f46e5',
  success: '#10b981',
  danger: '#ef4444',
  warning: '#f59e0b',
  text: '#f1f5f9',
  textSecondary: '#94a3b8',
  textMuted: '#64748b',
  glass: 'rgba(99, 102, 241, 0.05)',
  glassBorder: 'rgba(99, 102, 241, 0.1)',
  border: 'rgba(148, 163, 184, 0.1)',
  gradient: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 50%, #d946ef 100%)',
};

function Weather() {
  const [city, setCity] = useState('');
  const [weather, setWeather] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // IMPORTANT: Replace with your own API key from https://openweathermap.org/api
  // Free tier: 1,000 calls/day, uses API v2.5
  // New keys take 1-2 hours to activate after signup
  const API_KEY = '0b8622e1ac45fb603d4362b3a8c43c34';

  const fetchWeather = async () => {
    if (!city.trim()) {
      setError('Please enter a city name');
      return;
    }
    
    setLoading(true);
    setError('');
    setWeather(null);
    
    try {
      // Using FREE tier API v2.5 Current Weather endpoint
      const response = await fetch(
        `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(city)}&appid=${API_KEY}&units=metric`
      );
      
      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('INVALID_API_KEY');
        } else if (response.status === 404) {
          throw new Error(`City "${city}" not found. Please check the spelling.`);
        } else if (response.status === 429) {
          throw new Error('Rate limit exceeded. Please wait a moment and try again.');
        } else {
          const errorData = await response.json();
          throw new Error(errorData.message || 'Failed to fetch weather data');
        }
      }
      
      const data = await response.json();
      
      setWeather({
        temperature: Math.round(data.main.temp),
        feelsLike: Math.round(data.main.feels_like),
        tempMin: Math.round(data.main.temp_min),
        tempMax: Math.round(data.main.temp_max),
        condition: data.weather[0].main,
        description: data.weather[0].description,
        humidity: data.main.humidity,
        windSpeed: Math.round(data.wind.speed * 3.6), // Convert m/s to km/h
        pressure: data.main.pressure,
        visibility: (data.visibility / 1000).toFixed(1), // Convert to km
        city: data.name,
        country: data.sys.country,
        icon: data.weather[0].icon,
        sunrise: new Date(data.sys.sunrise * 1000).toLocaleTimeString('en-US', { 
          hour: '2-digit', 
          minute: '2-digit' 
        }),
        sunset: new Date(data.sys.sunset * 1000).toLocaleTimeString('en-US', { 
          hour: '2-digit', 
          minute: '2-digit' 
        }),
        cloudiness: data.clouds.all,
      });
      setCity(''); // Clear input after successful search
    } catch (err) {
      setError(err.message);
      setWeather(null);
    } finally {
      setLoading(false);
    }
  };

  const getWeatherEmoji = (condition) => {
    const emojiMap = {
      'Clear': '☀️',
      'Clouds': '☁️',
      'Rain': '🌧️',
      'Drizzle': '🌦️',
      'Thunderstorm': '⛈️',
      'Snow': '❄️',
      'Mist': '🌫️',
      'Fog': '🌫️',
      'Haze': '🌫️',
      'Smoke': '💨',
    };
    return emojiMap[condition] || '🌤️';
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      fetchWeather();
    }
  };

  const quickSearch = (cityName) => {
    setCity(cityName);
    setTimeout(() => {
      const button = document.querySelector('[data-search-button]');
      if (button) button.click();
    }, 100);
  };

  const isApiKeyError = error === 'INVALID_API_KEY';

  return (
    <div style={styles.container}>
      <style>{keyframesCSS}</style>
      
      <div style={styles.header}>
        <Link to="/" style={styles.backLink}>
          ← Back to Dashboard
        </Link>
      </div>

      <div style={styles.content}>
        <div style={styles.titleSection}>
          <h1 style={styles.title}>
            <span style={styles.titleGradient}>Weather</span>
            <span style={{ fontSize: '2rem', marginLeft: '0.5rem' }}>🌤️</span>
          </h1>
          <p style={styles.subtitle}>
            Real-time weather information for any city worldwide
          </p>
        </div>

        <div style={styles.searchCard}>
          <div style={styles.searchContainer}>
            <input
              type="text"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              placeholder="Enter city name (e.g., London, Tokyo, New York)"
              style={styles.input}
              onKeyPress={handleKeyPress}
              disabled={loading}
            />
            <button 
              data-search-button
              onClick={fetchWeather} 
              disabled={loading || !city.trim()}
              style={{
                ...styles.searchButton,
                opacity: (loading || !city.trim()) ? 0.5 : 1,
                cursor: (loading || !city.trim()) ? 'not-allowed' : 'pointer',
              }}
            >
              {loading ? (
                <span style={styles.loadingSpinner} />
              ) : (
                <>
                  <span style={{ fontSize: '1.2rem' }}>🔍</span>
                  Search
                </>
              )}
            </button>
          </div>
        </div>
        
        {error && (
          <div style={styles.errorCard}>
            <span style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>
              {isApiKeyError ? '🔑' : '⚠️'}
            </span>
            <p style={styles.errorText}>
              {isApiKeyError ? 'Invalid API Key' : error}
            </p>
            {isApiKeyError && (
              <div style={styles.apiKeyHelp}>
                <p style={{ marginBottom: '1rem', fontWeight: '600', fontSize: '1rem' }}>
                  How to get a FREE API key:
                </p>
                <ol style={{ paddingLeft: '1.5rem', textAlign: 'left', lineHeight: '2', marginBottom: '1.5rem' }}>
                  <li>Visit <a href="https://home.openweathermap.org/users/sign_up" target="_blank" rel="noopener noreferrer" style={styles.link}>OpenWeatherMap Sign Up</a></li>
                  <li>Create a free account and verify your email</li>
                  <li>Go to <a href="https://home.openweathermap.org/api_keys" target="_blank" rel="noopener noreferrer" style={styles.link}>API Keys</a> section</li>
                  <li>Copy your default API key</li>
                  <li>Replace <code style={styles.codeSnippet}>API_KEY</code> in the Weather.jsx file (line 27)</li>
                </ol>
                <div style={styles.noteBox}>
                  <strong>⏰ Important:</strong> New API keys take 1-2 hours to activate.
                  <br />
                  <strong>📊 Free Tier:</strong> 1,000 API calls per day (plenty for testing!)
                </div>
              </div>
            )}
          </div>
        )}
        
        {weather && (
          <div style={styles.weatherCard}>
            <div style={styles.weatherHeader}>
              <div>
                <h2 style={styles.cityName}>
                  {weather.city}, {weather.country}
                </h2>
                <p style={styles.weatherDescription}>
                  {weather.description.charAt(0).toUpperCase() + weather.description.slice(1)}
                </p>
              </div>
              <span style={{ fontSize: '3rem' }}>
                {getWeatherEmoji(weather.condition)}
              </span>
            </div>
            
            <div style={styles.weatherMain}>
              <div style={styles.temperatureSection}>
                {weather.icon && (
                  <img 
                    src={`https://openweathermap.org/img/wn/${weather.icon}@4x.png`} 
                    alt={weather.condition}
                    style={styles.weatherIcon}
                  />
                )}
                <div>
                  <div style={styles.temperature}>
                    {weather.temperature}°C
                  </div>
                  <div style={styles.feelsLike}>
                    Feels like {weather.feelsLike}°C
                  </div>
                  <div style={styles.tempRange}>
                    H: {weather.tempMax}° L: {weather.tempMin}°
                  </div>
                </div>
              </div>
            </div>

            <div style={styles.weatherDetails}>
              <div style={styles.detailCard}>
                <span style={styles.detailIcon}>💧</span>
                <div>
                  <div style={styles.detailLabel}>Humidity</div>
                  <div style={styles.detailValue}>{weather.humidity}%</div>
                </div>
              </div>

              <div style={styles.detailCard}>
                <span style={styles.detailIcon}>💨</span>
                <div>
                  <div style={styles.detailLabel}>Wind Speed</div>
                  <div style={styles.detailValue}>{weather.windSpeed} km/h</div>
                </div>
              </div>

              <div style={styles.detailCard}>
                <span style={styles.detailIcon}>🌡️</span>
                <div>
                  <div style={styles.detailLabel}>Pressure</div>
                  <div style={styles.detailValue}>{weather.pressure} hPa</div>
                </div>
              </div>

              <div style={styles.detailCard}>
                <span style={styles.detailIcon}>👁️</span>
                <div>
                  <div style={styles.detailLabel}>Visibility</div>
                  <div style={styles.detailValue}>{weather.visibility} km</div>
                </div>
              </div>

              <div style={styles.detailCard}>
                <span style={styles.detailIcon}>☁️</span>
                <div>
                  <div style={styles.detailLabel}>Cloudiness</div>
                  <div style={styles.detailValue}>{weather.cloudiness}%</div>
                </div>
              </div>

              <div style={styles.detailCard}>
                <span style={styles.detailIcon}>🌡️</span>
                <div>
                  <div style={styles.detailLabel}>Condition</div>
                  <div style={styles.detailValue}>{weather.condition}</div>
                </div>
              </div>

              <div style={styles.detailCard}>
                <span style={styles.detailIcon}>🌅</span>
                <div>
                  <div style={styles.detailLabel}>Sunrise</div>
                  <div style={styles.detailValue}>{weather.sunrise}</div>
                </div>
              </div>

              <div style={styles.detailCard}>
                <span style={styles.detailIcon}>🌇</span>
                <div>
                  <div style={styles.detailLabel}>Sunset</div>
                  <div style={styles.detailValue}>{weather.sunset}</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {!weather && !error && !loading && (
          <div style={styles.emptyState}>
            <span style={{ fontSize: '4rem', marginBottom: '1rem' }}>🌍</span>
            <h3 style={{ marginBottom: '0.5rem', color: theme.text }}>
              Search for a city
            </h3>
            <p style={{ color: theme.textMuted, marginBottom: '1.5rem' }}>
              Get current weather conditions for any location
            </p>
            <div style={styles.exampleCities}>
              <p style={{ fontSize: '0.85rem', color: theme.textMuted, marginBottom: '0.75rem' }}>
                Try these cities:
              </p>
              <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', justifyContent: 'center' }}>
                {['London', 'Tokyo', 'New York', 'Paris', 'Dubai'].map(cityName => (
                  <button
                    key={cityName}
                    onClick={() => quickSearch(cityName)}
                    style={styles.exampleCityButton}
                  >
                    {cityName}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/* ==================== STYLES ==================== */

const styles = {
  container: {
    minHeight: '100vh',
    background: theme.bg,
    color: theme.text,
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", "SF Pro Display", Roboto, sans-serif',
    padding: '2rem',
  },

  header: {
    maxWidth: '800px',
    margin: '0 auto 2rem',
  },

  backLink: {
    color: theme.accent,
    textDecoration: 'none',
    fontSize: '0.95rem',
    fontWeight: '500',
    display: 'inline-flex',
    alignItems: 'center',
    gap: '0.5rem',
    transition: 'all 0.2s ease',
  },

  content: {
    maxWidth: '800px',
    margin: '0 auto',
  },

  titleSection: {
    textAlign: 'center',
    marginBottom: '3rem',
    animation: 'fadeIn 0.5s ease',
  },

  title: {
    fontSize: '3rem',
    fontWeight: '700',
    marginBottom: '0.5rem',
    letterSpacing: '-0.02em',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '0.5rem',
  },

  titleGradient: {
    background: theme.gradient,
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    backgroundClip: 'text',
  },

  subtitle: {
    color: theme.textMuted,
    fontSize: '1rem',
  },

  searchCard: {
    background: theme.surface,
    padding: '2rem',
    borderRadius: '16px',
    border: `1px solid ${theme.border}`,
    marginBottom: '2rem',
    boxShadow: '0 4px 24px rgba(0, 0, 0, 0.2)',
    animation: 'slideIn 0.3s ease',
  },

  searchContainer: {
    display: 'flex',
    gap: '1rem',
  },

  input: {
    flex: 1,
    padding: '1rem 1.25rem',
    background: theme.bg,
    border: `1px solid ${theme.border}`,
    borderRadius: '10px',
    color: theme.text,
    fontSize: '0.95rem',
    transition: 'all 0.2s ease',
    fontFamily: 'inherit',
    outline: 'none',
  },

  searchButton: {
    padding: '1rem 2rem',
    background: theme.gradient,
    border: 'none',
    borderRadius: '10px',
    color: 'white',
    fontWeight: '600',
    fontSize: '0.95rem',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
    fontFamily: 'inherit',
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    whiteSpace: 'nowrap',
    boxShadow: '0 4px 12px rgba(99, 102, 241, 0.3)',
  },

  loadingSpinner: {
    width: '20px',
    height: '20px',
    border: '2px solid rgba(255, 255, 255, 0.3)',
    borderTop: '2px solid white',
    borderRadius: '50%',
    animation: 'spin 0.8s linear infinite',
    display: 'inline-block',
  },

  errorCard: {
    background: 'rgba(239, 68, 68, 0.1)',
    border: `1px solid rgba(239, 68, 68, 0.3)`,
    padding: '2rem',
    borderRadius: '12px',
    textAlign: 'center',
    marginBottom: '2rem',
    animation: 'fadeIn 0.3s ease',
  },

  errorText: {
    color: theme.danger,
    fontSize: '1rem',
    fontWeight: '500',
    marginBottom: '1rem',
  },

  apiKeyHelp: {
    background: 'rgba(0, 0, 0, 0.3)',
    padding: '2rem',
    borderRadius: '12px',
    marginTop: '1.5rem',
    textAlign: 'left',
  },

  link: {
    color: theme.accent,
    textDecoration: 'none',
    fontWeight: '600',
    transition: 'opacity 0.2s ease',
  },

  codeSnippet: {
    background: 'rgba(255, 255, 255, 0.1)',
    padding: '2px 6px',
    borderRadius: '4px',
    fontFamily: 'monospace',
    fontSize: '0.9em',
  },

  noteBox: {
    background: 'rgba(99, 102, 241, 0.1)',
    border: `1px solid ${theme.glassBorder}`,
    padding: '1rem',
    borderRadius: '8px',
    fontSize: '0.85rem',
    lineHeight: '1.6',
  },

  weatherCard: {
    background: theme.surface,
    padding: '2rem',
    borderRadius: '16px',
    border: `1px solid ${theme.border}`,
    boxShadow: '0 4px 24px rgba(0, 0, 0, 0.2)',
    animation: 'fadeIn 0.5s ease',
  },

  weatherHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '2rem',
    paddingBottom: '1.5rem',
    borderBottom: `1px solid ${theme.border}`,
  },

  cityName: {
    fontSize: '1.8rem',
    fontWeight: '700',
    marginBottom: '0.25rem',
    color: theme.text,
  },

  weatherDescription: {
    color: theme.textSecondary,
    fontSize: '1rem',
  },

  weatherMain: {
    marginBottom: '2rem',
  },

  temperatureSection: {
    display: 'flex',
    alignItems: 'center',
    gap: '2rem',
  },

  weatherIcon: {
    width: '120px',
    height: '120px',
    filter: 'drop-shadow(0 4px 8px rgba(0, 0, 0, 0.2))',
  },

  temperature: {
    fontSize: '4rem',
    fontWeight: '700',
    background: theme.gradient,
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    backgroundClip: 'text',
    lineHeight: 1,
    marginBottom: '0.5rem',
  },

  feelsLike: {
    color: theme.textMuted,
    fontSize: '1rem',
    marginBottom: '0.25rem',
  },

  tempRange: {
    color: theme.textSecondary,
    fontSize: '0.95rem',
    fontWeight: '500',
  },

  weatherDetails: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
    gap: '1rem',
  },

  detailCard: {
    background: theme.glass,
    border: `1px solid ${theme.glassBorder}`,
    padding: '1rem',
    borderRadius: '10px',
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
    transition: 'all 0.2s ease',
  },

  detailIcon: {
    fontSize: '1.8rem',
  },

  detailLabel: {
    color: theme.textMuted,
    fontSize: '0.8rem',
    marginBottom: '0.25rem',
  },

  detailValue: {
    color: theme.text,
    fontSize: '1rem',
    fontWeight: '600',
  },

  emptyState: {
    textAlign: 'center',
    padding: '4rem 2rem',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
  },

  exampleCities: {
    marginTop: '1.5rem',
  },

  exampleCityButton: {
    padding: '0.5rem 1rem',
    background: theme.glass,
    border: `1px solid ${theme.glassBorder}`,
    borderRadius: '8px',
    color: theme.accent,
    fontSize: '0.85rem',
    fontWeight: '500',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    fontFamily: 'inherit',
  },
};

/* ==================== CSS KEYFRAMES ==================== */

const keyframesCSS = `
  @keyframes fadeIn {
    from { 
      opacity: 0; 
      transform: translateY(10px); 
    }
    to { 
      opacity: 1; 
      transform: translateY(0); 
    }
  }

  @keyframes slideIn {
    from { 
      transform: translateX(-10px); 
      opacity: 0; 
    }
    to { 
      transform: translateX(0); 
      opacity: 1; 
    }
  }

  @keyframes spin {
    to { 
      transform: rotate(360deg); 
    }
  }

  button:hover:not(:disabled) {
    transform: translateY(-2px);
    box-shadow: 0 6px 20px rgba(99, 102, 241, 0.4);
  }

  button:active:not(:disabled) {
    transform: translateY(0);
  }

  input:focus {
    border-color: ${theme.accent};
    box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.1);
  }

  a:hover {
    opacity: 0.8;
  }
`;

export default Weather;