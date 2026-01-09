import { useState } from 'react';
import { Link } from 'react-router-dom';

function Weather() {
  const [city, setCity] = useState('');
  const [weather, setWeather] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const fetchWeather = async () => {
    if (!city.trim()) return;
    setLoading(true);
    setError('');
    try {
      // Replace 'YOUR_API_KEY' with your actual OpenWeatherMap API key
      const API_KEY = 'YOUR_API_KEY';
      const response = await fetch(`https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${API_KEY}&units=metric`);
      if (!response.ok) {
        throw new Error('City not found');
      }
      const data = await response.json();
      setWeather({
        temperature: Math.round(data.main.temp),
        condition: data.weather[0].main,
        humidity: data.main.humidity,
        city: data.name,
        icon: data.weather[0].icon
      });
    } catch (err) {
      setError(err.message);
      setWeather(null);
    }
    setLoading(false);
  };

  return (
    <div style={{ padding: '2rem 0', background: '#0f172a', color: '#e5e7eb', minHeight: '100vh' }}>
      <Link to="/" style={{ color: '#38bdf8', textDecoration: 'none', marginBottom: '2rem', display: 'inline-block', fontSize: '1.1rem', marginLeft: '2rem' }}>← Back to Home</Link>
      <h1 style={{ marginBottom: '2rem', textAlign: 'center', color: '#38bdf8' }}>Weather App</h1>
      
      <div style={{ maxWidth: '500px', margin: '0 auto', padding: '0 2rem' }}>
        <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem' }}>
          <input
            type="text"
            value={city}
            onChange={(e) => setCity(e.target.value)}
            placeholder="Enter city name..."
            style={{ flex: 1, padding: '1rem', borderRadius: '8px', border: 'none', background: '#1e293b', color: '#e5e7eb', fontSize: '1rem' }}
            onKeyPress={(e) => e.key === 'Enter' && fetchWeather()}
          />
          <button 
            onClick={fetchWeather} 
            disabled={loading}
            style={{ 
              padding: '1rem', 
              borderRadius: '8px', 
              border: 'none', 
              background: loading ? '#374151' : '#38bdf8', 
              color: 'white', 
              fontSize: '1rem', 
              fontWeight: 'bold', 
              cursor: loading ? 'not-allowed' : 'pointer' 
            }}
          >
            {loading ? 'Loading...' : 'Get Weather'}
          </button>
        </div>
        
        {error && <p style={{ color: '#ef4444', textAlign: 'center' }}>{error}</p>}
        
        {weather && (
          <div style={{ 
            background: '#1e293b', 
            padding: '2rem', 
            borderRadius: '12px', 
            textAlign: 'center',
            boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
          }}>
            <h2 style={{ marginBottom: '1rem' }}>{weather.city}</h2>
            {weather.icon && (
              <img 
                src={`https://openweathermap.org/img/wn/${weather.icon}@2x.png`} 
                alt={weather.condition}
                style={{ width: '100px', height: '100px' }}
              />
            )}
            <p style={{ fontSize: '3rem', fontWeight: 'bold', margin: '1rem 0' }}>{weather.temperature}°C</p>
            <p style={{ fontSize: '1.2rem', marginBottom: '1rem' }}>{weather.condition}</p>
            <p style={{ opacity: 0.8 }}>Humidity: {weather.humidity}%</p>
          </div>
        )}
        
        <div style={{ marginTop: '2rem', textAlign: 'center', opacity: 0.7, fontSize: '0.9rem' }}>
          <p>Get your free API key from <a href="https://openweathermap.org/api" target="_blank" rel="noopener noreferrer" style={{ color: '#38bdf8' }}>OpenWeatherMap</a></p>
          <p>Replace 'YOUR_API_KEY' in the code with your actual key</p>
        </div>
      </div>
    </div>
  );
}

export default Weather;