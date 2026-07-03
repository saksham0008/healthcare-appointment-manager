import React, { useState } from 'react';
import { useHistory, Link } from 'react-router-dom';
import { registerPatient } from '../services/api';

const Register: React.FC = () => {
  const history = useHistory();
  const [form, setForm] = useState({
    username: '', email: '', password: '', first_name: '', last_name: '', phone: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await registerPatient(form);
      history.push('/login');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  const field = (label: string, key: keyof typeof form, type = 'text') => (
    <div key={key}>
      <label style={styles.label}>{label}</label>
      <input style={styles.input} type={type} value={form[key]}
        onChange={e => setForm({ ...form, [key]: e.target.value })}
        required={['username', 'email', 'password'].includes(key)} />
    </div>
  );

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <h2 style={styles.title}>Patient Registration</h2>
        {error && <div style={styles.error}>{error}</div>}
        <form onSubmit={handleSubmit}>
          {field('Username *', 'username')}
          {field('Email *', 'email', 'email')}
          {field('Password *', 'password', 'password')}
          {field('First Name', 'first_name')}
          {field('Last Name', 'last_name')}
          {field('Phone', 'phone', 'tel')}
          <button style={styles.btn} type="submit" disabled={loading}>
            {loading ? 'Registering...' : 'Register'}
          </button>
        </form>
        <p style={{ marginTop: 16, textAlign: 'center' }}>
          Already have an account? <Link to="/login">Login</Link>
        </p>
      </div>
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  container: { display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '80vh', background: '#f5f7fa', padding: 16 },
  card: { background: '#fff', padding: 32, borderRadius: 8, boxShadow: '0 2px 12px rgba(0,0,0,0.1)', width: 400 },
  title: { marginBottom: 24, color: '#1a73e8', textAlign: 'center' },
  label: { display: 'block', marginBottom: 4, fontSize: 14, color: '#555' },
  input: { width: '100%', padding: '10px 12px', marginBottom: 14, border: '1px solid #ddd', borderRadius: 4, boxSizing: 'border-box' as const, fontSize: 14 },
  btn: { width: '100%', padding: '11px', background: '#1a73e8', color: '#fff', border: 'none', borderRadius: 4, cursor: 'pointer', fontSize: 15, fontWeight: 600, marginTop: 8 },
  error: { background: '#fdecea', color: '#d32f2f', padding: '10px 12px', borderRadius: 4, marginBottom: 16, fontSize: 14 },
};

export default Register;
