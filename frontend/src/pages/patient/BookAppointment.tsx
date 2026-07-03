import React, { useState, useEffect } from 'react';
import { useParams, useHistory } from 'react-router-dom';
import { getDoctorById, getDoctorAvailability, bookAppointment } from '../../services/api';
import { useAuth } from '../../hooks/useAuth';
import { Doctor } from '../../types';

const BookAppointment: React.FC = () => {
  const { doctorId } = useParams<{ doctorId: string }>();
  const { user } = useAuth();
  const history = useHistory();

  const [doctor, setDoctor] = useState<Doctor | null>(null);
  const [date, setDate] = useState('');
  const [slots, setSlots] = useState<string[]>([]);
  const [selectedSlot, setSelectedSlot] = useState('');
  const [symptoms, setSymptoms] = useState('');
  const [loading, setLoading] = useState(false);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [unavailable, setUnavailable] = useState('');

  useEffect(() => {
    getDoctorById(Number(doctorId))
      .then(r => setDoctor(r.data))
      .catch(console.error);
  }, [doctorId]);

  const handleDateChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const d = e.target.value;
    setDate(d);
    setSelectedSlot('');
    setSlots([]);
    setUnavailable('');
    setError('');
    if (!d) return;
    setSlotsLoading(true);
    try {
      const res = await getDoctorAvailability(Number(doctorId), d);
      if (!res.data.available) {
        setUnavailable(res.data.reason || 'Doctor not available on this date');
      } else {
        setSlots(res.data.slots || []);
        if ((res.data.slots || []).length === 0) {
          setUnavailable('No slots available on this date');
        }
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load slots');
    } finally {
      setSlotsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSlot) { setError('Please select a time slot'); return; }
    if (!user) { setError('You must be logged in'); return; }
    setLoading(true);
    setError('');
    try {
      // Pass user.id — backend resolves patient record by user_id via JWT
      const appointmentTime = `${date}T${selectedSlot}:00.000Z`;
      await bookAppointment({
        patient_id: user.id,
        doctor_id: Number(doctorId),
        appointment_time: appointmentTime,
        symptoms: symptoms.trim() || undefined,
      });
      setSuccess('Appointment booked successfully!');
      setTimeout(() => history.push('/patient/appointments'), 1500);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Booking failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      <h2 style={styles.heading}>Book Appointment</h2>
      {doctor && (
        <div style={styles.docInfo}>
          <strong>Dr. {doctor.user?.first_name} {doctor.user?.last_name}</strong>
          <span style={styles.spec}> — {doctor.specialization}</span>
        </div>
      )}
      {success && <div style={styles.success}>{success}</div>}
      {error && <div style={styles.error}>{error}</div>}
      <form onSubmit={handleSubmit} style={styles.form}>
        <label style={styles.label}>Select Date</label>
        <input type="date" style={styles.input} value={date}
          min={new Date().toISOString().split('T')[0]}
          onChange={handleDateChange} required />
        {unavailable && <div style={styles.warn}>{unavailable}</div>}
        {slotsLoading && <p style={{ marginBottom: 12 }}>Loading slots...</p>}
        {slots.length > 0 && (
          <>
            <label style={styles.label}>Select Time Slot</label>
            <div style={styles.slotsGrid}>
              {slots.map(slot => (
                <button key={slot} type="button"
                  style={{ ...styles.slotBtn, ...(selectedSlot === slot ? styles.slotSelected : {}) }}
                  onClick={() => setSelectedSlot(slot)}>
                  {slot}
                </button>
              ))}
            </div>
          </>
        )}
        <label style={styles.label}>Describe your symptoms (optional)</label>
        <textarea style={styles.textarea} rows={4} value={symptoms}
          onChange={e => setSymptoms(e.target.value)}
          placeholder="e.g. fever for 3 days, headache, sore throat..." />
        <button style={styles.btn} type="submit"
          disabled={loading || !!unavailable || !selectedSlot}>
          {loading ? 'Booking...' : 'Confirm Booking'}
        </button>
      </form>
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  container: { maxWidth: 600, margin: '32px auto', padding: '0 16px' },
  heading: { color: '#1a73e8', marginBottom: 16 },
  docInfo: { background: '#e8f0fe', padding: '12px 16px', borderRadius: 6, marginBottom: 20, fontSize: 15 },
  spec: { color: '#1a73e8' },
  form: { background: '#fff', padding: 24, borderRadius: 8, boxShadow: '0 1px 6px rgba(0,0,0,0.08)' },
  label: { display: 'block', marginBottom: 6, fontSize: 14, color: '#555', fontWeight: 600 },
  input: { width: '100%', padding: '10px 12px', marginBottom: 16, border: '1px solid #ddd', borderRadius: 4, boxSizing: 'border-box' as const, fontSize: 14 },
  textarea: { width: '100%', padding: '10px 12px', marginBottom: 16, border: '1px solid #ddd', borderRadius: 4, boxSizing: 'border-box' as const, fontSize: 14, resize: 'vertical' as const },
  slotsGrid: { display: 'flex', flexWrap: 'wrap' as const, gap: 8, marginBottom: 16 },
  slotBtn: { padding: '8px 14px', border: '1px solid #1a73e8', borderRadius: 4, background: '#fff', color: '#1a73e8', cursor: 'pointer', fontSize: 13 },
  slotSelected: { background: '#1a73e8', color: '#fff' },
  btn: { width: '100%', padding: '11px', background: '#1a73e8', color: '#fff', border: 'none', borderRadius: 4, cursor: 'pointer', fontSize: 15, fontWeight: 600 },
  error: { background: '#fdecea', color: '#d32f2f', padding: '10px 12px', borderRadius: 4, marginBottom: 16, fontSize: 14 },
  success: { background: '#e6f4ea', color: '#2e7d32', padding: '10px 12px', borderRadius: 4, marginBottom: 16, fontSize: 14 },
  warn: { background: '#fff8e1', color: '#f57f17', padding: '10px 12px', borderRadius: 4, marginBottom: 16, fontSize: 14 },
};

export default BookAppointment;
