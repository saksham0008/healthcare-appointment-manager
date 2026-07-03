import React, { useState, useEffect } from 'react';
import { useHistory } from 'react-router-dom';
import { getDoctorAppointments } from '../../services/api';
import { useAuth } from '../../hooks/useAuth';
import { Appointment } from '../../types';

const statusColor: Record<string, string> = {
  booked: '#1a73e8', confirmed: '#34a853', completed: '#9e9e9e', cancelled: '#e53935',
};

const urgencyColor: Record<string, string> = {
  High: '#e53935', Medium: '#ff6f00', Low: '#388e3c',
};

const DoctorDashboard: React.FC = () => {
  const { user } = useAuth();
  const history = useHistory();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!user) return;
    fetchAppointments(user.id);
  }, [user]);

  const fetchAppointments = async (id: number) => {
    setLoading(true);
    setError('');
    try {
      const res = await getDoctorAppointments(id);
      setAppointments(res.data);
    } catch (err: any) {
      // If forbidden (doctor id mismatch), just show empty
      if (err.response?.status === 403) {
        setAppointments([]);
      } else {
        setError(err.response?.data?.message || 'Failed to load appointments');
      }
    } finally {
      setLoading(false);
    }
  };

  const todayAppts = appointments.filter(a => {
    const d = new Date(a.appointment_time);
    const today = new Date();
    return d.toDateString() === today.toDateString() && a.status !== 'cancelled';
  });

  const upcomingAppts = appointments.filter(a => {
    const d = new Date(a.appointment_time);
    return d > new Date() && a.status !== 'cancelled' && a.status !== 'completed';
  });

  return (
    <div style={styles.container}>
      <h2 style={styles.heading}>Doctor Dashboard</h2>
      <p style={styles.sub}>Welcome, Dr. {user?.first_name} {user?.last_name}</p>
      {error && <div style={styles.error}>{error}</div>}
      {loading ? <p>Loading...</p> : (
        <>
          <div style={styles.statsRow}>
            <div style={styles.statCard}><div style={styles.statNum}>{todayAppts.length}</div><div>Today</div></div>
            <div style={styles.statCard}><div style={styles.statNum}>{upcomingAppts.length}</div><div>Upcoming</div></div>
            <div style={styles.statCard}><div style={styles.statNum}>{appointments.filter(a => a.status === 'completed').length}</div><div>Completed</div></div>
          </div>
          <h3 style={styles.sectionTitle}>All Appointments</h3>
          {appointments.length === 0 ? <p>No appointments found.</p> : appointments.map(appt => (
            <div key={appt.id} style={styles.card}>
              <div style={styles.cardHeader}>
                <span>
                  <strong>{appt.patient?.user?.first_name} {appt.patient?.user?.last_name}</strong>
                  <span style={{ color: '#888', fontSize: 13 }}> &nbsp;{appt.patient?.user?.email}</span>
                </span>
                <span style={{ ...styles.badge, background: statusColor[appt.status] }}>{appt.status}</span>
              </div>
              <p style={styles.time}>📅 {new Date(appt.appointment_time).toLocaleString()}</p>
              {appt.symptom && (
                <div style={styles.symptomBox}>
                  <span style={{ fontWeight: 600 }}>Chief Complaint:</span> {appt.symptom.chief_complaint}
                  &nbsp; <span style={{ color: urgencyColor[appt.symptom.urgency_level], fontWeight: 600 }}>
                    [{appt.symptom.urgency_level}]
                  </span>
                  <br />
                  <small>{appt.symptom.symptom_description}</small>
                </div>
              )}
              <button style={styles.btn} onClick={() => history.push(`/doctor/appointment/${appt.id}`)}>
                {appt.status === 'completed' ? 'View Notes' : 'Add Notes'}
              </button>
            </div>
          ))}
        </>
      )}
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  container: { maxWidth: 800, margin: '32px auto', padding: '0 16px' },
  heading: { color: '#1a73e8', marginBottom: 4 },
  sub: { color: '#666', marginBottom: 24 },
  error: { background: '#fdecea', color: '#d32f2f', padding: '10px 12px', borderRadius: 4, marginBottom: 16 },
  statsRow: { display: 'flex', gap: 16, marginBottom: 28 },
  statCard: { flex: 1, background: '#fff', border: '1px solid #e0e0e0', borderRadius: 8, padding: '16px 20px', textAlign: 'center', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' },
  statNum: { fontSize: 28, fontWeight: 700, color: '#1a73e8' },
  sectionTitle: { color: '#333', marginBottom: 12 },
  card: { background: '#fff', border: '1px solid #e0e0e0', borderRadius: 8, padding: 18, marginBottom: 14, boxShadow: '0 1px 4px rgba(0,0,0,0.06)' },
  cardHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  badge: { padding: '3px 10px', borderRadius: 12, color: '#fff', fontSize: 12, fontWeight: 600 },
  time: { color: '#555', fontSize: 14, marginBottom: 8 },
  symptomBox: { background: '#fff8e1', padding: '10px 12px', borderRadius: 4, fontSize: 13, marginBottom: 10 },
  btn: { padding: '7px 16px', background: '#1a73e8', color: '#fff', border: 'none', borderRadius: 4, cursor: 'pointer', fontSize: 13 },
};

export default DoctorDashboard;
