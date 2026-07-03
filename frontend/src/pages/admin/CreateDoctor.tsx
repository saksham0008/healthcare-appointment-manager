import React, { useState } from 'react';
import { useHistory } from 'react-router-dom';
import { adminCreateDoctor } from '../../services/api';

const CreateDoctor: React.FC = () => {
  const history = useHistory();
  const [form, setForm] = useState({
    username: '', email: '', password: '', first_name: '', last_name: '',
    phone: '', specialization: '', bio: '',
    working_hours_start: '09:00', working_hours_end: '17:00', slot_duration: '30',
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await adminCreateDoctor({ ...form, slot_duration: Number(form.slot_duration) });
      setSuccess('Doctor profile created successfully!');
      setTimeout(() => history.push('/admin/dashboard'), 1500);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to create doctor');
    } finally {
      setLoading(false);
    }
  };

  const field = (label: string, key: keyof typeof form, type = 'text', required = false) => (
    <div key={key}>
      <label style={styles.label}>{label}{required ? ' *' : ''}</label>
      <input style={styles.input} type={type} value={form[key]}
        onChange={e => setForm({ ...form, [key]: e.target.value })} required={required} />
    </div>
  );

  return (
    <div style={styles.container}>
      <button style={styles.back} onClick={() => history.goBack()}>← Back</button>
      <h2 style={styles.heading}>Create Doctor Profile</h2>
      {success && <div style={styles.success}>{success}</div>}
      {error && <div style={styles.error}>{error}</div>}
      <form onSubmit={handleSubmit} style={styles.form}>
        <div style={styles.grid}>
          {field('Username', 'username', 'text', true)}
          {field('Email', 'email', 'email', true)}
          {field('Password', 'password', 'password', true)}
          {field('First Name', 'first_name')}
          {field('Last Name', 'last_name')}
          {field('Phone', 'phone', 'tel')}
          {field('Specialization', 'specialization', 'text', true)}
        </div>
        <label style={styles.label}>Bio</label>
        <textarea style={styles.textarea} rows={3} value={form.bio}
          onChange={e => setForm({ ...form, bio: e.target.value })} placeholder="Short bio..." />
        <div style={styles.grid}>
          <div>
            <label style={styles.label}>Working Hours Start</label>
            <input style={styles.input} type="time" value={form.working_hours_start}
              onChange={e => setForm({ ...form, working_hours_start: e.target.value })} />
          </div>
          <div>
            <label style={styles.label}>Working Hours End</label>
            <input style={styles.input} type="time" value={form.working_hours_end}
              onChange={e => setForm({ ...form, working_hours_end: e.target.value })} />
          </div>
          <div>
            <label style={styles.label}>Slot Duration (minutes)</label>
            <input style={styles.input} type="number" min="15" max="60" value={form.slot_duration}
              onChange={e => setForm({ ...form, slot_duration: e.target.value })} />
          </div>
        </div>
        <button style={styles.btn} type="submit" disabled={loading}>
          {loading ? 'Creating...' : 'Create Doctor'}
        </button>
      </form>
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  container: { maxWidth: 700, margin: '32px auto', padding: '0 16px' },
  back: { background: 'none', border: 'none', color: '#1a73e8', cursor: 'pointer', fontSize: 15, marginBottom: 12 },
  heading: { color: '#1a73e8', marginBottom: 20 },
  form: { background: '#fff', padding: 28, borderRadius: 8, boxShadow: '0 1px 6px rgba(0,0,0,0.08)' },
  grid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 20px' },
  label: { display: 'block', marginBottom: 5, fontSize: 14, color: '#555', fontWeight: 600 },
  input: { width: '100%', padding: '10px 12px', marginBottom: 16, border: '1px solid #ddd', borderRadius: 4, boxSizing: 'border-box' as const, fontSize: 14 },
  textarea: { width: '100%', padding: '10px 12px', marginBottom: 16, border: '1px solid #ddd', borderRadius: 4, boxSizing: 'border-box' as const, fontSize: 14, resize: 'vertical' as const },
  btn: { width: '100%', padding: '11px', background: '#1a73e8', color: '#fff', border: 'none', borderRadius: 4, cursor: 'pointer', fontSize: 15, fontWeight: 600, marginTop: 8 },
  error: { background: '#fdecea', color: '#d32f2f', padding: '10px 12px', borderRadius: 4, marginBottom: 16 },
  success: { background: '#e6f4ea', color: '#2e7d32', padding: '10px 12px', borderRadius: 4, marginBottom: 16 },
};

export default CreateDoctor;
