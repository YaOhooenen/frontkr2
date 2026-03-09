import { useState } from 'react';
import AuthPage from './pages/AuthPage/AuthPage';
import ShopPage from './pages/ShopPage/ShopPage';

function App() {
  const [token, setToken] = useState(null);

  if (!token) return <AuthPage onLogin={setToken} />;
  return <ShopPage token={token} onLogout={() => setToken(null)} />;
}

export default App;