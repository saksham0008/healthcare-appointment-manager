import React, { useState } from 'react';
import { useDispatch } from 'react-redux';
import { useHistory, Link } from 'react-router-dom';
import { login } from '../services/api';
import { setCredentials } from '../store/authSlice';
import { AppDispatch } from '../store';

const Login: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const history = useHistory();
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await login(form);
      dispatch(setCredentials({ user: res.data.user, token: res.data.token }));
      const role = res.data.user.role;
      if (role === 'patient') history.push('/patient/doctors');
      else if (role === 'doctor') history.push('/doctor/dashboard');
      else history.push('/admin/dashboard');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <h2 style={styles.title}>Login</h2>
        {error && <div style={styles.error}>{error}</div>}
        <form onSubmit={handleSubmit}>
          <label style={styles.label}>Email</label>
          <input style={styles.input} type="email" value={form.email}
            onChange={e => setForm({ ...form, email: e.target.value })} required />
          <label style={styles.label}>Password</label>
          <input style={styles.input} type="password" value={form.password}
            onChange={e => setForm({ ...form, password: e.target.value })} required />
          <button style={styles.btn} type="submit" disabled={loading}>
            {loading ? 'Logging in...' : 'Login'}
          </button>
        </form>
        <p style={{ marginTop: 16, textAlign: 'center' }}>
          No account? <Link to="/register">Register as Patient</Link>
        </p>
      </div>
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  container: { display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '80vh', background: '#f5f7fa' },
  card: { background: '#fff', padding: 32, borderRadius: 8, boxShadow: '0 2px 12px rgba(0,0,0,0.1)', width: 360 },
  title: { marginBottom: 24, color: '#1a73e8', textAlign: 'center' },
  label: { display: 'block', marginBottom: 4, fontSize: 14, color: '#555' },
  input: { width: '100%', padding: '10px 12px', marginBottom: 16, border: '1px solid #ddd', borderRadius: 4, boxSizing: 'border-box' as const, fontSize: 14 },
  btn: { width: '100%', padding: '11px', background: '#1a73e8', color: '#fff', border: 'none', borderRadius: 4, cursor: 'pointer', fontSize: 15, fontWeight: 600 },
  error: { background: '#fdecea', color: '#d32f2f', padding: '10px 12px', borderRadius: 4, marginBottom: 16, fontSize: 14 },
};

export default Login;
