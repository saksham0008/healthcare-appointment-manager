import React from 'react';
import { Link, useHistory } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

const Navbar: React.FC = () => {
  const { user, isAuthenticated, signOut } = useAuth();
  const history = useHistory();

  const handleLogout = () => {
    signOut();
    history.push('/login');
  };

  return (
    <nav style={styles.nav}>
      <Link to="/" style={styles.brand}>🏥 HealthCare</Link>
      <div style={styles.links}>
        {!isAuthenticated && (
          <>
            <Link to="/login" style={styles.link}>Login</Link>
            <Link to="/register" style={styles.link}>Register</Link>
          </>
        )}
        {isAuthenticated && user?.role === 'patient' && (
          <>
            <Link to="/patient/doctors" style={styles.link}>Find Doctors</Link>
            <Link to="/patient/appointments" style={styles.link}>My Appointments</Link>
          </>
        )}
        {isAuthenticated && user?.role === 'doctor' && (
          <Link to="/doctor/dashboard" style={styles.link}>My Dashboard</Link>
        )}
        {isAuthenticated && user?.role === 'admin' && (
          <Link to="/admin/dashboard" style={styles.link}>Admin Dashboard</Link>
        )}
        {isAuthenticated && (
          <button onClick={handleLogout} style={styles.btn}>
            Logout ({user?.username})
          </button>
        )}
      </div>
    </nav>
  );
};

const styles: Record<string, React.CSSProperties> = {
  nav: {
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    padding: '12px 24px', background: '#1a73e8', color: '#fff',
  },
  brand: { color: '#fff', textDecoration: 'none', fontSize: 20, fontWeight: 700 },
  links: { display: 'flex', gap: 16, alignItems: 'center' },
  link: { color: '#fff', textDecoration: 'none', fontSize: 15 },
  btn: {
    background: 'transparent', border: '1px solid #fff', color: '#fff',
    padding: '6px 14px', borderRadius: 4, cursor: 'pointer', fontSize: 14,
  },
};

export default Navbar;
