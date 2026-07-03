import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { getDoctors, adminGetDoctorLeaves, adminAddDoctorLeave, adminRemoveDoctorLeave } from '../../services/api';
import { Doctor, DoctorLeave } from '../../types';

const ManageLeaves: React.FC = () => {
  const location = useLocation();
  const params = new URLSearchParams(location.search);
  const initialDoctorId = params.get('doctorId') ? Number(params.get('doctorId')) : null;

  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [selectedDoctor, setSelectedDoctor] = useState<number | ''>(initialDoctorId || '');
  const [leaves, setLeaves] = useState<DoctorLeave[]>([]);
  const [leaveDate, setLeaveDate] = useState('');
  const [reason, setReason] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    getDoctors().then(r => setDoctors(r.data)).catch(console.error);
  }, []);

  useEffect(() => {
    if (selectedDoctor) fetchLeaves(Number(selectedDoctor));
    else setLeaves([]);
  }, [selectedDoctor]);

  const fetchLeaves = async (id: number) => {
    try {
      const res = await adminGetDoctorLeaves(id);
      setLeaves(res.data);
    } catch (err) { console.error(err); }
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDoctor || !leaveDate) { setError('Select doctor and date'); return; }
    setLoading(true);
    setError('');
    setSuccess('');
    try {
      const res = await adminAddDoctorLeave(Number(selectedDoctor), { leave_date: leaveDate, reason });
      const count = res.data.affectedAppointmentsCount;
      setSuccess(`Leave added. ${count > 0 ? `${count} appointment(s) cancelled and patients notified.` : 'No existing appointments affected.'}`);
      setLeaveDate('');
      setReason('');
      fetchLeaves(Number(selectedDoctor));
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to add leave');
    } finally {
      setLoading(false);
    }
  };

  const handleRemove = async (leaveId: number) => {
    if (!window.confirm('Remove this leave day?')) return;
    try {
      await adminRemoveDoctorLeave(Number(selectedDoctor), leaveId);
      setSuccess('Leave removed.');
      fetchLeaves(Number(selectedDoctor));
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to remove leave');
    }
  };

  return (
    <div style={styles.container}>
      <h2 style={styles.heading}>Manage Doctor Leaves</h2>
      <div style={styles.select}>
        <label style={styles.label}>Select Doctor</label>
        <select style={styles.selectInput} value={selectedDoctor}
          onChange={e => setSelectedDoctor(e.target.value ? Number(e.target.value) : '')}>
          <option value="">-- Select a doctor --</option>
          {doctors.map(d => (
            <option key={d.id} value={d.id}>
              Dr. {d.user?.first_name} {d.user?.last_name} — {d.specialization}
            </option>
          ))}
        </select>
      </div>
      {selectedDoctor && (
        <>
          {success && <div style={styles.success}>{success}</div>}
          {error && <div style={styles.error}>{error}</div>}
          <form onSubmit={handleAdd} style={styles.form}>
            <h3 style={styles.subHead}>Add Leave Day</h3>
            <div style={styles.row}>
              <div style={{ flex: 1 }}>
                <label style={styles.label}>Leave Date *</label>
                <input style={styles.input} type="date" value={leaveDate}
                  onChange={e => setLeaveDate(e.target.value)} required />
              </div>
              <div style={{ flex: 2 }}>
                <label style={styles.label}>Reason (optional)</label>
                <input style={styles.input} type="text" value={reason}
                  onChange={e => setReason(e.target.value)} placeholder="Conference, sick leave, etc." />
              </div>
            </div>
            <button style={styles.btn} type="submit" disabled={loading}>
              {loading ? 'Adding...' : 'Add Leave Day'}
            </button>
          </form>
          <h3 style={styles.subHead}>Existing Leave Days</h3>
          {leaves.length === 0 ? <p>No leave days scheduled.</p> : (
            <table style={styles.table}>
              <thead>
                <tr style={styles.th}>
                  <th>Date</th><th>Reason</th><th>Action</th>
                </tr>
              </thead>
              <tbody>
                {leaves.map(lv => (
                  <tr key={lv.id} style={styles.tr}>
                    <td style={styles.td}>{lv.leave_date}</td>
                    <td style={styles.td}>{lv.reason || '—'}</td>
                    <td style={styles.td}>
                      <button style={styles.removeBtn} onClick={() => handleRemove(lv.id)}>Remove</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </>
      )}
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  container: { maxWidth: 750, margin: '32px auto', padding: '0 16px' },
  heading: { color: '#1a73e8', marginBottom: 20 },
  subHead: { color: '#333', marginBottom: 12, marginTop: 24 },
  select: { marginBottom: 24 },
  label: { display: 'block', marginBottom: 5, fontSize: 14, color: '#555', fontWeight: 600 },
  selectInput: { width: '100%', padding: '10px 12px', border: '1px solid #ddd', borderRadius: 4, fontSize: 14 },
  form: { background: '#fff', padding: 20, borderRadius: 8, boxShadow: '0 1px 6px rgba(0,0,0,0.08)', marginBottom: 24 },
  row: { display: 'flex', gap: 16, marginBottom: 16 },
  input: { width: '100%', padding: '10px 12px', border: '1px solid #ddd', borderRadius: 4, boxSizing: 'border-box' as const, fontSize: 14 },
  btn: { padding: '10px 22px', background: '#1a73e8', color: '#fff', border: 'none', borderRadius: 4, cursor: 'pointer', fontWeight: 600 },
  table: { width: '100%', borderCollapse: 'collapse' as const, background: '#fff', borderRadius: 8, overflow: 'hidden', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' },
  th: { background: '#f5f5f5', textAlign: 'left' as const },
  tr: { borderBottom: '1px solid #e0e0e0' },
  td: { padding: '12px 16px', fontSize: 14 },
  removeBtn: { padding: '5px 12px', background: '#e53935', color: '#fff', border: 'none', borderRadius: 4, cursor: 'pointer', fontSize: 12 },
  error: { background: '#fdecea', color: '#d32f2f', padding: '10px 12px', borderRadius: 4, marginBottom: 16 },
  success: { background: '#e6f4ea', color: '#2e7d32', padding: '10px 12px', borderRadius: 4, marginBottom: 16 },
};

export default ManageLeaves;
