import React, { useState, useEffect } from 'react';
import { useHistory } from 'react-router-dom';
import { getDoctors } from '../../services/api';
import { Doctor } from '../../types';

const DoctorSearch: React.FC = () => {
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [specialization, setSpecialization] = useState('');
  const [loading, setLoading] = useState(false);
  const history = useHistory();

  const fetchDoctors = async (spec?: string) => {
    setLoading(true);
    try {
      const res = await getDoctors(spec);
      setDoctors(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchDoctors(); }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchDoctors(specialization || undefined);
  };

  return (
    <div style={styles.container}>
      <h2 style={styles.heading}>Find a Doctor</h2>
      <form onSubmit={handleSearch} style={styles.searchBar}>
        <input style={styles.input} placeholder="Search by specialization..."
          value={specialization} onChange={e => setSpecialization(e.target.value)} />
        <button style={styles.btn} type="submit">Search</button>
        <button style={styles.btnOutline} type="button" onClick={() => { setSpecialization(''); fetchDoctors(); }}>
          Clear
        </button>
      </form>
      {loading ? <p>Loading doctors...</p> : (
        <div style={styles.grid}>
          {doctors.length === 0 && <p>No doctors found.</p>}
          {doctors.map(doc => (
            <div key={doc.id} style={styles.card}>
              <h3 style={styles.name}>
                Dr. {doc.user?.first_name} {doc.user?.last_name}
              </h3>
              <p style={styles.spec}>{doc.specialization}</p>
              {doc.bio && <p style={styles.bio}>{doc.bio}</p>}
              <p style={styles.meta}>
                🕒 {doc.working_hours_start} – {doc.working_hours_end} &nbsp;|&nbsp; {doc.slot_duration} min slots
              </p>
              <button style={styles.bookBtn} onClick={() => history.push(`/patient/book/${doc.id}`)}>
                Book Appointment
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  container: { maxWidth: 900, margin: '32px auto', padding: '0 16px' },
  heading: { color: '#1a73e8', marginBottom: 24 },
  searchBar: { display: 'flex', gap: 10, marginBottom: 28 },
  input: { flex: 1, padding: '10px 14px', border: '1px solid #ddd', borderRadius: 4, fontSize: 14 },
  btn: { padding: '10px 20px', background: '#1a73e8', color: '#fff', border: 'none', borderRadius: 4, cursor: 'pointer' },
  btnOutline: { padding: '10px 16px', background: '#fff', color: '#1a73e8', border: '1px solid #1a73e8', borderRadius: 4, cursor: 'pointer' },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 20 },
  card: { background: '#fff', border: '1px solid #e0e0e0', borderRadius: 8, padding: 20, boxShadow: '0 1px 4px rgba(0,0,0,0.07)' },
  name: { margin: '0 0 4px', color: '#222', fontSize: 17 },
  spec: { color: '#1a73e8', fontWeight: 600, marginBottom: 6 },
  bio: { color: '#666', fontSize: 13, marginBottom: 8 },
  meta: { color: '#888', fontSize: 12, marginBottom: 14 },
  bookBtn: { width: '100%', padding: '9px', background: '#34a853', color: '#fff', border: 'none', borderRadius: 4, cursor: 'pointer', fontWeight: 600 },
};

export default DoctorSearch;
