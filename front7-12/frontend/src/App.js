import { useState, useEffect } from 'react';
import AuthPage from './pages/AuthPage/AuthPage';
import ShopPage from './pages/ShopPage/ShopPage';
import { api } from './api';

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('accessToken');
    if (token) {
      api.me()
        .then(data => setUser(data))
        .catch(() => {
          localStorage.removeItem('accessToken');
          localStorage.removeItem('refreshToken');
        })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const handleLogin = (data) => {
    localStorage.setItem('accessToken', data.accessToken);
    localStorage.setItem('refreshToken', data.refreshToken);
    setUser(data.user);
  };

  const handleLogout = () => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    setUser(null);
  };

  if (loading) return <div style={{ color: '#e7eaf3', padding: 32 }}>Загрузка...</div>;
  if (!user) return <AuthPage onLogin={handleLogin} />;
  return <ShopPage user={user} onLogout={handleLogout} />;
}

export default App;