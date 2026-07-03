import React from 'react';
import { useHistory } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

const Home: React.FC = () => {
  const history = useHistory();
  const { isAuthenticated, user } = useAuth();

  const handleCTA = () => {
    if (!isAuthenticated) { history.push('/register'); return; }
    if (user?.role === 'patient') history.push('/patient/doctors');
    else if (user?.role === 'doctor') history.push('/doctor/dashboard');
    else history.push('/admin/dashboard');
  };

  return (
    <div style={styles.page}>
      <div style={styles.hero}>
        <h1 style={styles.title}>Healthcare Appointment &amp; Follow-up Manager</h1>
        <p style={styles.subtitle}>
          Book appointments, get AI-powered symptom analysis, receive post-visit summaries,
          and stay informed with email reminders and calendar events.
        </p>
        <button style={styles.ctaBtn} onClick={handleCTA}>
          {isAuthenticated ? 'Go to Dashboard' : 'Get Started'}
        </button>
      </div>
      <div style={styles.features}>
        {[
          { icon: '🔍', title: 'Find Doctors', desc: 'Search by specialization and book available slots instantly.' },
          { icon: '🤖', title: 'AI Symptom Analysis', desc: 'LLM-powered pre-visit summary with urgency level for your doctor.' },
          { icon: '📋', title: 'Post-Visit Summary', desc: 'Patient-friendly discharge summary with medication schedule.' },
          { icon: '📧', title: 'Email & Calendar', desc: 'Automatic confirmations, reminders, and Google Calendar events.' },
        ].map(f => (
          <div key={f.title} style={styles.featureCard}>
            <div style={styles.icon}>{f.icon}</div>
            <h3 style={styles.featureTitle}>{f.title}</h3>
            <p style={styles.featureDesc}>{f.desc}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  page: { minHeight: '80vh' },
  hero: { textAlign: 'center', padding: '64px 20px 48px', background: 'linear-gradient(135deg, #e8f0fe 0%, #f5f7fa 100%)' },
  title: { fontSize: 36, fontWeight: 700, color: '#1a73e8', marginBottom: 16 },
  subtitle: { fontSize: 17, color: '#555', maxWidth: 580, margin: '0 auto 28px', lineHeight: 1.6 },
  ctaBtn: { padding: '14px 36px', background: '#1a73e8', color: '#fff', border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: 16, fontWeight: 600 },
  features: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 24, maxWidth: 900, margin: '48px auto', padding: '0 20px' },
  featureCard: { background: '#fff', border: '1px solid #e0e0e0', borderRadius: 10, padding: '24px 20px', textAlign: 'center', boxShadow: '0 1px 6px rgba(0,0,0,0.06)' },
  icon: { fontSize: 36, marginBottom: 12 },
  featureTitle: { fontWeight: 700, marginBottom: 8, color: '#222' },
  featureDesc: { color: '#666', fontSize: 14, lineHeight: 1.5 },
};

export default Home;
