import React, { useState, useEffect } from 'react';
import { useParams, useHistory } from 'react-router-dom';
import { getAppointmentDetails, addPostVisitNotes } from '../../services/api';
import { Appointment } from '../../types';

interface MedEntry { medication_name: string; dosage: string; frequency: string; duration_days: string; }

const PostVisitForm: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const history = useHistory();
  const [appt, setAppt] = useState<Appointment | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [notes, setNotes] = useState('');
  const [prescription, setPrescription] = useState('');
  const [followUp, setFollowUp] = useState('');
  const [meds, setMeds] = useState<MedEntry[]>([{ medication_name: '', dosage: '', frequency: '', duration_days: '' }]);

  useEffect(() => {
    getAppointmentDetails(Number(id))
      .then(r => {
        setAppt(r.data);
        if (r.data.postVisitNote) {
          setNotes(r.data.postVisitNote.clinical_notes || '');
          setPrescription(r.data.postVisitNote.prescription || '');
          setFollowUp(r.data.postVisitNote.follow_up_date || '');
        }
      })
      .catch(e => setError(e.response?.data?.message || 'Failed to load'))
      .finally(() => setLoading(false));
  }, [id]);

  const addMed = () => setMeds([...meds, { medication_name: '', dosage: '', frequency: '', duration_days: '' }]);
  const removeMed = (i: number) => setMeds(meds.filter((_, idx) => idx !== i));
  const updateMed = (i: number, field: keyof MedEntry, val: string) => {
    const updated = [...meds];
    updated[i] = { ...updated[i], [field]: val };
    setMeds(updated);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!notes.trim()) { setError('Clinical notes are required'); return; }
    setSaving(true);
    setError('');
    try {
      const validMeds = meds.filter(m => m.medication_name && m.dosage && m.frequency && m.duration_days);
      await addPostVisitNotes({
        appointment_id: Number(id),
        clinical_notes: notes,
        prescription: prescription || undefined,
        follow_up_date: followUp || undefined,
        medications: validMeds.map(m => ({ ...m, duration_days: Number(m.duration_days) })),
      });
      setSuccess('Post-visit notes saved! LLM summary is being generated.');
      setTimeout(() => history.push('/doctor/dashboard'), 2000);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to save notes');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div style={{ padding: 32 }}>Loading...</div>;
  if (!appt) return <div style={{ padding: 32, color: 'red' }}>{error || 'Not found'}</div>;

  return (
    <div style={styles.container}>
      <button style={styles.back} onClick={() => history.goBack()}>← Back</button>
      <h2 style={styles.heading}>Post-Visit Notes — Appointment #{appt.id}</h2>
      <div style={styles.patientInfo}>
        <strong>Patient:</strong> {appt.patient?.user?.first_name} {appt.patient?.user?.last_name}
        &nbsp;|&nbsp; <strong>Date:</strong> {new Date(appt.appointment_time).toLocaleString()}
      </div>
      {appt.symptom && (
        <div style={styles.symptomBox}>
          <strong>Chief Complaint:</strong> {appt.symptom.chief_complaint} — <em>{appt.symptom.urgency_level}</em><br />
          <strong>Symptoms:</strong> {appt.symptom.symptom_description}<br />
          {appt.symptom.suggested_questions?.length > 0 && (
            <><strong>Suggested Questions:</strong>
              <ul style={{ margin: '4px 0 0 0', paddingLeft: 20 }}>
                {appt.symptom.suggested_questions.map((q, i) => <li key={i}>{q}</li>)}
              </ul>
            </>
          )}
        </div>
      )}
      {success && <div style={styles.success}>{success}</div>}
      {error && <div style={styles.error}>{error}</div>}
      <form onSubmit={handleSubmit} style={styles.form}>
        <label style={styles.label}>Clinical Notes *</label>
        <textarea style={styles.textarea} rows={6} value={notes}
          onChange={e => setNotes(e.target.value)} required
          placeholder="Diagnosis, examination findings, treatment plan..." />
        <label style={styles.label}>Prescription</label>
        <textarea style={styles.textarea} rows={3} value={prescription}
          onChange={e => setPrescription(e.target.value)}
          placeholder="Prescribed medications, dosages..." />
        <label style={styles.label}>Follow-up Date</label>
        <input style={styles.input} type="date" value={followUp} onChange={e => setFollowUp(e.target.value)} />
        <h4 style={{ marginBottom: 8 }}>Medications</h4>
        {meds.map((med, i) => (
          <div key={i} style={styles.medRow}>
            <input style={styles.medInput} placeholder="Medication name" value={med.medication_name}
              onChange={e => updateMed(i, 'medication_name', e.target.value)} />
            <input style={styles.medInput} placeholder="Dosage (e.g. 500mg)" value={med.dosage}
              onChange={e => updateMed(i, 'dosage', e.target.value)} />
            <input style={styles.medInput} placeholder="Frequency (e.g. twice daily)" value={med.frequency}
              onChange={e => updateMed(i, 'frequency', e.target.value)} />
            <input style={{ ...styles.medInput, width: 90 }} placeholder="Days" type="number" value={med.duration_days}
              onChange={e => updateMed(i, 'duration_days', e.target.value)} />
            {meds.length > 1 && <button type="button" style={styles.removeBtn} onClick={() => removeMed(i)}>✕</button>}
          </div>
        ))}
        <button type="button" style={styles.addMedBtn} onClick={addMed}>+ Add Medication</button>
        <button style={styles.submitBtn} type="submit" disabled={saving}>
          {saving ? 'Saving...' : 'Save Post-Visit Notes'}
        </button>
      </form>
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  container: { maxWidth: 720, margin: '32px auto', padding: '0 16px' },
  back: { background: 'none', border: 'none', color: '#1a73e8', cursor: 'pointer', fontSize: 15, marginBottom: 12 },
  heading: { color: '#1a73e8', marginBottom: 12 },
  patientInfo: { background: '#e8f0fe', padding: '12px 16px', borderRadius: 6, marginBottom: 16, fontSize: 14 },
  symptomBox: { background: '#fff8e1', padding: '12px 16px', borderRadius: 6, marginBottom: 16, fontSize: 13 },
  form: { background: '#fff', padding: 24, borderRadius: 8, boxShadow: '0 1px 6px rgba(0,0,0,0.08)' },
  label: { display: 'block', marginBottom: 6, fontSize: 14, color: '#555', fontWeight: 600 },
  input: { width: '100%', padding: '10px 12px', marginBottom: 16, border: '1px solid #ddd', borderRadius: 4, boxSizing: 'border-box' as const, fontSize: 14 },
  textarea: { width: '100%', padding: '10px 12px', marginBottom: 16, border: '1px solid #ddd', borderRadius: 4, boxSizing: 'border-box' as const, fontSize: 14, resize: 'vertical' as const },
  medRow: { display: 'flex', gap: 8, marginBottom: 10, flexWrap: 'wrap' as const },
  medInput: { flex: 1, minWidth: 100, padding: '8px 10px', border: '1px solid #ddd', borderRadius: 4, fontSize: 13 },
  removeBtn: { background: '#e53935', color: '#fff', border: 'none', borderRadius: 4, padding: '6px 10px', cursor: 'pointer' },
  addMedBtn: { background: 'none', color: '#1a73e8', border: '1px solid #1a73e8', borderRadius: 4, padding: '7px 14px', cursor: 'pointer', marginBottom: 20, fontSize: 13 },
  submitBtn: { width: '100%', padding: '11px', background: '#1a73e8', color: '#fff', border: 'none', borderRadius: 4, cursor: 'pointer', fontSize: 15, fontWeight: 600 },
  error: { background: '#fdecea', color: '#d32f2f', padding: '10px 12px', borderRadius: 4, marginBottom: 16, fontSize: 14 },
  success: { background: '#e6f4ea', color: '#2e7d32', padding: '10px 12px', borderRadius: 4, marginBottom: 16, fontSize: 14 },
};

export default PostVisitForm;
