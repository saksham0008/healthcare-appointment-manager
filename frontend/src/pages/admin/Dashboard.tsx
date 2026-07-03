import React, { useState, useEffect } from 'react';
import { useHistory } from 'react-router-dom';
import { adminGetAllAppointments, getDoctors } from '../../services/api';
import { Appointment, Doctor } from '../../types';

const statusColor: Record<string, string> = {
  booked: '#1a73e8', confirmed: '#34a853', completed: '#9e9e9e', cancelled: '#e53935',
};

const AdminDashboard: React.FC = () => {
  const history = useHistory();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [loading, setLoading] = useState(false);
  const [tab, setTab] = useState<'appointments' | 'doctors'>('appointments');

  useEffect(() => {
    setLoading(true);
    Promise.all([adminGetAllAppointments(), getDoctors()])
      .then(([apptRes, docRes]) => {
        setAppointments(apptRes.data);
        setDoctors(docRes.data);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  return (
    <div style={styles.container}>
      <h2 style={styles.heading}>Admin Dashboard</h2>
      <div style={styles.statsRow}>
        <div style={styles.statCard}><div style={styles.num}>{appointments.length}</div><div>Total Appointments</div></div>
        <div style={styles.statCard}><div style={styles.num}>{doctors.length}</div><div>Doctors</div></div>
        <div style={styles.statCard}><div style={styles.num}>{appointments.filter(a => a.status === 'booked' || a.status === 'confirmed').length}</div><div>Active</div></div>
        <div style={styles.statCard}><div style={styles.num}>{appointments.filter(a => a.status === 'cancelled').length}</div><div>Cancelled</div></div>
      </div>
      <div style={styles.actions}>
        <button style={styles.primaryBtn} onClick={() => history.push('/admin/create-doctor')}>
          + Create Doctor Profile
        </button>
        <button style={styles.secondaryBtn} onClick={() => history.push('/admin/leaves')}>
          Manage Doctor Leaves
        </button>
      </div>
      <div style={styles.tabs}>
        <button style={{ ...styles.tab, ...(tab === 'appointments' ? styles.activeTab : {}) }} onClick={() => setTab('appointments')}>
          All Appointments
        </button>
        <button style={{ ...styles.tab, ...(tab === 'doctors' ? styles.activeTab : {}) }} onClick={() => setTab('doctors')}>
          All Doctors
        </button>
      </div>
      {loading ? <p>Loading...</p> : tab === 'appointments' ? (
        <div>
          {appointments.length === 0 ? <p>No appointments.</p> : appointments.map(appt => (
            <div key={appt.id} style={styles.card}>
              <div style={styles.cardRow}>
                <span>
                  <strong>#{appt.id}</strong> &nbsp;
                  Patient: <strong>{appt.patient?.user?.first_name} {appt.patient?.user?.last_name}</strong>
                  &nbsp;→ Dr. <strong>{appt.doctor?.user?.first_name} {appt.doctor?.user?.last_name}</strong>
                  <span style={{ color: '#888', fontSize: 13 }}> ({appt.doctor?.specialization})</span>
                </span>
                <span style={{ ...styles.badge, background: statusColor[appt.status] }}>{appt.status}</span>
              </div>
              <p style={styles.time}>📅 {new Date(appt.appointment_time).toLocaleString()}</p>
              {appt.symptom && <p style={styles.meta}>Urgency: <strong>{appt.symptom.urgency_level}</strong> — {appt.symptom.chief_complaint}</p>}
            </div>
          ))}
        </div>
      ) : (
        <div style={styles.grid}>
          {doctors.map(doc => (
            <div key={doc.id} style={styles.docCard}>
              <h3 style={styles.docName}>Dr. {doc.user?.first_name} {doc.user?.last_name}</h3>
              <p style={styles.spec}>{doc.specialization}</p>
              <p style={styles.meta}>{doc.working_hours_start} – {doc.working_hours_end} | {doc.slot_duration}min</p>
              <button style={styles.linkBtn} onClick={() => history.push(`/admin/leaves?doctorId=${doc.id}`)}>
                Manage Leaves
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  container: { maxWidth: 1000, margin: '32px auto', padding: '0 16px' },
  heading: { color: '#1a73e8', marginBottom: 20 },
  statsRow: { display: 'flex', gap: 16, marginBottom: 24, flexWrap: 'wrap' as const },
  statCard: { flex: 1, minWidth: 140, background: '#fff', border: '1px solid #e0e0e0', borderRadius: 8, padding: '16px 20px', textAlign: 'center', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' },
  num: { fontSize: 28, fontWeight: 700, color: '#1a73e8' },
  actions: { display: 'flex', gap: 12, marginBottom: 24 },
  primaryBtn: { padding: '10px 20px', background: '#1a73e8', color: '#fff', border: 'none', borderRadius: 4, cursor: 'pointer', fontWeight: 600 },
  secondaryBtn: { padding: '10px 20px', background: '#fff', color: '#1a73e8', border: '1px solid #1a73e8', borderRadius: 4, cursor: 'pointer' },
  tabs: { display: 'flex', gap: 0, marginBottom: 16, borderBottom: '2px solid #e0e0e0' },
  tab: { padding: '10px 20px', background: 'none', border: 'none', cursor: 'pointer', fontSize: 14, color: '#666' },
  activeTab: { color: '#1a73e8', borderBottom: '2px solid #1a73e8', fontWeight: 600, marginBottom: -2 },
  card: { background: '#fff', border: '1px solid #e0e0e0', borderRadius: 8, padding: 16, marginBottom: 12 },
  cardRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  badge: { padding: '3px 10px', borderRadius: 12, color: '#fff', fontSize: 12, fontWeight: 600 },
  time: { color: '#555', fontSize: 13, margin: '4px 0' },
  meta: { color: '#888', fontSize: 13, margin: 0 },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 16 },
  docCard: { background: '#fff', border: '1px solid #e0e0e0', borderRadius: 8, padding: 18 },
  docName: { margin: '0 0 4px', fontSize: 16 },
  spec: { color: '#1a73e8', fontWeight: 600, marginBottom: 6 },
  linkBtn: { background: 'none', color: '#1a73e8', border: 'none', cursor: 'pointer', padding: 0, fontSize: 13, textDecoration: 'underline' },
};

export default AdminDashboard;
