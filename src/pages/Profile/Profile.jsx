import React from "react";

export default function Profile() {
  const handleLogout = React.useCallback(async () => {
    try {
      const token = localStorage.getItem('authToken');
      const res = await fetch('http://localhost:4000/auth/logout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        credentials: 'include',
        body: JSON.stringify({}),
      });

      if (!res.ok) {
        const text = await res.text();
        console.error('Logout failed:', res.status, text);
        alert('Logout failed');
        return;
      }

      // clear local state and redirect to login
      localStorage.removeItem('authToken');
      console.log('Logged out via server');
      window.location.href = '/login';
    } catch (err) {
      console.error('Logout error:', err);
      alert('Network error during logout');
    }
  }, []);

  return (
    <main className="main-content" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div>
        <h2>Profil</h2>
        <p>Votre page profil sera ici.</p>
        <button
          type="button"
          data-testid="logout-button"
          onClick={handleLogout}
        >
          Logout (server)
        </button>
      </div>
    </main>
  );
}
