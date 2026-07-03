import React, { useState, useEffect } from 'react';
import { useParams, useHistory } from 'react-router-dom';
import { getAppointmentDetails } from '../../services/api';
import { Appointment } from '../../types';

const AppointmentDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const history = useHistory();
  const [appt, setAppt] = useState<Appointment | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    getAppointmentDetails(Number(id))
      .then(r => setAppt(r.data))
      .catch(e => setError(e.response?.data?.message || 'Failed to load'))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <div style={{ padding: 32 }}>Loading...</div>;
  if (error) return <div style={{ padding: 32, color: 'red' }}>{error}</div>;
  if (!appt) return null;

  return (
    <div style={styles.container}>
      <button style={styles.back} onClick={() => history.goBack()}>← Back</button>
      <h2 style={styles.heading}>Appointment #{appt.id}</h2>
      <div style={styles.card}>
        <p><strong>Date & Time:</strong> {new Date(appt.appointment_time).toLocaleString()}</p>
        <p><strong>Status:</strong> {appt.status}</p>
        <p><strong>Doctor:</strong> Dr. {appt.doctor?.user?.first_name} {appt.doctor?.user?.last_name} — {appt.doctor?.specialization}</p>
      </div>
      {appt.symptom && (
        <div style={styles.section}>
          <h3>Symptoms</h3>
          <p><strong>Description:</strong> {appt.symptom.symptom_description}</p>
          <p><strong>Urgency:</strong> <span style={{ color: appt.symptom.urgency_level === 'High' ? '#e53935' : appt.symptom.urgency_level === 'Medium' ? '#ff6f00' : '#388e3c' }}>{appt.symptom.urgency_level}</span></p>
          <p><strong>Chief complaint:</strong> {appt.symptom.chief_complaint}</p>
          {appt.symptom.suggested_questions?.length > 0 && (
            <>
              <p><strong>Suggested questions for doctor:</strong></p>
              <ul>{appt.symptom.suggested_questions.map((q, i) => <li key={i}>{q}</li>)}</ul>
            </>
          )}
        </div>
      )}
      {appt.postVisitNote && (
        <div style={styles.section}>
          <h3>Post-Visit Summary</h3>
          {appt.postVisitNote.patient_friendly_summary && (
            <div style={styles.summary}>{appt.postVisitNote.patient_friendly_summary}</div>
          )}
          {appt.postVisitNote.prescription && (
            <p><strong>Prescription:</strong> {appt.postVisitNote.prescription}</p>
          )}
          {appt.postVisitNote.follow_up_date && (
            <p><strong>Follow-up Date:</strong> {appt.postVisitNote.follow_up_date}</p>
          )}
          {appt.postVisitNote.medications && appt.postVisitNote.medications.length > 0 && (
            <>
              <h4>Medications</h4>
              <table style={styles.table}>
                <thead><tr><th>Name</th><th>Dosage</th><th>Frequency</th><th>Duration</th></tr></thead>
                <tbody>
                  {appt.postVisitNote.medications.map(m => (
                    <tr key={m.id}>
                      <td>{m.medication_name}</td><td>{m.dosage}</td>
                      <td>{m.frequency}</td><td>{m.duration_days} days</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </>
          )}
        </div>
      )}
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  container: { maxWidth: 700, margin: '32px auto', padding: '0 16px' },
  back: { background: 'none', border: 'none', color: '#1a73e8', cursor: 'pointer', fontSize: 15, marginBottom: 16 },
  heading: { color: '#1a73e8', marginBottom: 16 },
  card: { background: '#fff', border: '1px solid #e0e0e0', borderRadius: 8, padding: 20, marginBottom: 20 },
  section: { background: '#fff', border: '1px solid #e0e0e0', borderRadius: 8, padding: 20, marginBottom: 16 },
  summary: { background: '#e8f5e9', padding: '12px 16px', borderRadius: 6, marginBottom: 12, whiteSpace: 'pre-wrap' as const },
  table: { width: '100%', borderCollapse: 'collapse' as const, fontSize: 14 },
};

export default AppointmentDetail;
