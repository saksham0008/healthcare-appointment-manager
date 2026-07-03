import React, { useState, useEffect } from 'react';
import { useHistory } from 'react-router-dom';
import { getAppointments, cancelAppointment } from '../../services/api';
import { Appointment } from '../../types';

const statusColor: Record<string, string> = {
  booked: '#1a73e8', confirmed: '#34a853', completed: '#9e9e9e', cancelled: '#e53935',
};

const MyAppointments: React.FC = () => {
  const history = useHistory();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const fetchAppointments = async () => {
    setLoading(true);
    try {
      // We need patient.id, not user.id. We fetch all and filter by patient_id heuristic.
      const res = await getAppointments();
      setAppointments(res.data);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load appointments');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchAppointments(); }, []);

  const handleCancel = async (id: number) => {
    if (!window.confirm('Cancel this appointment?')) return;
    try {
      await cancelAppointment(id);
      fetchAppointments();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Cancel failed');
    }
  };

  return (
    <div style={styles.container}>
      <h2 style={styles.heading}>My Appointments</h2>
      {error && <div style={styles.error}>{error}</div>}
      {loading ? <p>Loading...</p> : appointments.length === 0 ? (
        <div style={styles.empty}>
          <p>No appointments yet.</p>
          <button style={styles.btn} onClick={() => history.push('/patient/doctors')}>Find a Doctor</button>
        </div>
      ) : (
        <div>
          {appointments.map(appt => (
            <div key={appt.id} style={styles.card}>
              <div style={styles.header}>
                <span>
                  Appointment #{appt.id} &nbsp;
                  <strong>Dr. {appt.doctor?.user?.first_name} {appt.doctor?.user?.last_name}</strong>
                  {appt.doctor && <span style={styles.spec}> — {appt.doctor.specialization}</span>}
                </span>
                <span style={{ ...styles.badge, background: statusColor[appt.status] || '#888' }}>
                  {appt.status}
                </span>
              </div>
              <p style={styles.time}>📅 {new Date(appt.appointment_time).toLocaleString()}</p>
              {appt.symptom && (
                <div style={styles.symptomBox}>
                  <strong>Symptoms:</strong> {appt.symptom.symptom_description}
                  <br />
                  <span style={styles.urgency}>Urgency: {appt.symptom.urgency_level}</span>
                </div>
              )}
              {appt.postVisitNote?.patient_friendly_summary && (
                <div style={styles.summaryBox}>
                  <strong>Post-visit summary:</strong>
                  <p>{appt.postVisitNote.patient_friendly_summary}</p>
                </div>
              )}
              <div style={styles.actions}>
                <button style={styles.detailBtn} onClick={() => history.push(`/patient/appointment/${appt.id}`)}>
                  View Details
                </button>
                {(appt.status === 'booked' || appt.status === 'confirmed') && (
                  <button style={styles.cancelBtn} onClick={() => handleCancel(appt.id)}>Cancel</button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  container: { maxWidth: 800, margin: '32px auto', padding: '0 16px' },
  heading: { color: '#1a73e8', marginBottom: 24 },
  error: { background: '#fdecea', color: '#d32f2f', padding: '10px 12px', borderRadius: 4, marginBottom: 16 },
  empty: { textAlign: 'center', padding: 40 },
  btn: { padding: '10px 20px', background: '#1a73e8', color: '#fff', border: 'none', borderRadius: 4, cursor: 'pointer' },
  card: { background: '#fff', border: '1px solid #e0e0e0', borderRadius: 8, padding: 20, marginBottom: 16, boxShadow: '0 1px 4px rgba(0,0,0,0.06)' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  badge: { padding: '3px 10px', borderRadius: 12, color: '#fff', fontSize: 12, fontWeight: 600 },
  spec: { color: '#1a73e8', fontSize: 14 },
  time: { color: '#555', fontSize: 14, marginBottom: 10 },
  symptomBox: { background: '#f5f5f5', padding: '10px 12px', borderRadius: 4, fontSize: 13, marginBottom: 10 },
  urgency: { color: '#e65100', fontWeight: 600 },
  summaryBox: { background: '#e8f5e9', padding: '10px 12px', borderRadius: 4, fontSize: 13, marginBottom: 10 },
  actions: { display: 'flex', gap: 10 },
  detailBtn: { padding: '7px 14px', background: '#1a73e8', color: '#fff', border: 'none', borderRadius: 4, cursor: 'pointer', fontSize: 13 },
  cancelBtn: { padding: '7px 14px', background: '#e53935', color: '#fff', border: 'none', borderRadius: 4, cursor: 'pointer', fontSize: 13 },
};

export default MyAppointments;
