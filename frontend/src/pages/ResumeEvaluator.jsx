import React, { useState } from 'react';
import axios from 'axios';
import { UploadCloud, CheckCircle2, XCircle, AlertCircle, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function ResumeEvaluator() {
  const [file, setFile] = useState(null);
  const [role, setRole] = useState('Software Engineer');
  const [loading, setLoading] = useState(false);
  const [report, setReport] = useState(null);
  const [error, setError] = useState(null);

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!file || !role) {
      setError("Please select a file and enter a role.");
      return;
    }

    const formData = new FormData();
    formData.append('resume', file);
    formData.append('role', role);

    setLoading(true);
    setError(null);
    setReport(null);

    try {
      const { data } = await axios.post('http://localhost:5000/api/resume', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setReport(data.report.evaluation);
    } catch (err) {
      setError(err.response?.data?.error || err.message || "Failed to evaluate resume");
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      style={{ maxWidth: '900px', margin: '0 auto', width: '100%', position: 'relative' }}
    >
      <div style={{ position: 'absolute', top: -100, left: '20%', width: 300, height: 300, background: 'var(--glow-primary)', filter: 'blur(100px)', borderRadius: '50%', zIndex: -1, opacity: 0.3 }}></div>

      <h1 className="outfit-font" style={{ fontSize: '3rem', marginBottom: '16px' }}>Local ML Résumé Screening</h1>
      <p style={{ color: 'var(--text-secondary)', marginBottom: '40px', fontSize: '1.1rem' }}>
        Drop a PDF and execute the Python FAANG heuristic pipeline to determine candidate viability.
      </p>

      <AnimatePresence mode="wait">
        {!report ? (
          <motion.form 
            key="upload-form"
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, y: -20 }}
            onSubmit={handleUpload} 
            className="glass-panel" 
            style={{ padding: '48px', position: 'relative', overflow: 'hidden' }}
          >
            <div style={{ marginBottom: '28px' }}>
              <label style={{ display: 'block', marginBottom: '10px', fontWeight: '600', color: 'var(--text-secondary)' }}>Target Role</label>
              <input 
                type="text" 
                className="input-base" 
                value={role} 
                onChange={e => setRole(e.target.value)}
                placeholder="e.g. Software Engineer, Data Scientist"
              />
            </div>

            <div style={{ marginBottom: '40px' }}>
               <label style={{ display: 'block', marginBottom: '10px', fontWeight: '600', color: 'var(--text-secondary)' }}>Upload Candidate PDF</label>
               <motion.div 
                 whileHover={{ borderStyle: 'solid', borderColor: 'var(--accent-color)' }}
                 style={{ 
                 border: '2px dashed var(--border-strong)', 
                 borderRadius: '16px', 
                 padding: '48px 24px', 
                 textAlign: 'center',
                 background: 'rgba(0,0,0,0.3)',
                 cursor: 'pointer',
                 transition: 'all 0.3s ease'
               }} onClick={() => document.getElementById('file-upload').click()}>
                  <UploadCloud size={56} color="var(--accent-color)" style={{ marginBottom: '20px' }} />
                  <h3 className="outfit-font" style={{ marginBottom: '12px', fontSize: '1.4rem' }}>{file ? file.name : "Click to browse or drag and drop"}</h3>
                  <p style={{ color: 'var(--text-secondary)' }}>Accepts raw PDF data for heuristic parsing</p>
                  <input 
                    id="file-upload" 
                    type="file" 
                    accept="application/pdf" 
                    style={{ display: 'none' }}
                    onChange={(e) => setFile(e.target.files[0])}
                  />
               </motion.div>
            </div>

            {error && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ padding: '16px', background: 'rgba(244, 63, 94, 0.1)', border: '1px solid var(--danger-color)', color: '#fca5a5', borderRadius: '12px', marginBottom: '24px' }}>
                {error}
              </motion.div>
            )}

            <button type="submit" className="btn btn-primary" style={{ width: '100%', fontSize: '1.2rem', padding: '16px' }} disabled={loading}>
              {loading ? <><Loader2 className="lucide-spin" /> Executing ML Pipeline...</> : "Run Full Heuristic Evaluation"}
            </button>
          </motion.form>
        ) : (
          <motion.div 
            key="results"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ type: "spring", stiffness: 100, damping: 20 }}
            className="glass-panel"
            style={{ position: 'relative', overflow: 'hidden' }}
          >
            {report.decision === 'Selected' && <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '4px', background: 'var(--success-color)' }}></div>}
            {report.decision === 'Borderline' && <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '4px', background: '#fbbf24' }}></div>}
            {report.decision === 'Rejected' && <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '4px', background: 'var(--danger-color)' }}></div>}

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '40px', paddingBottom: '30px', borderBottom: '1px solid var(--border-subtle)' }}>
              <div>
                <h2 className="outfit-font" style={{ fontSize: '2.5rem', marginBottom: '8px' }}>Verdict: 
                  <span style={{ color: report.decision === 'Selected' ? 'var(--success-color)' : report.decision === 'Borderline' ? '#fbbf24' : 'var(--danger-color)', marginLeft: '12px' }}>{report.decision}</span>
                </h2>
                <p style={{ color: 'var(--text-secondary)', fontSize: '1.1rem' }}>
                  Overall Score: <strong style={{ color: 'white' }}>{report.scores?.finalScore}/100</strong> • 
                  Semantic Match: <strong style={{ color: 'var(--accent-color)' }}>{Math.round(report.semanticScore || 0)}%</strong>
                </p>
              </div>
              
              <div style={{ width: '120px', height: '120px', borderRadius: '50%', background: `conic-gradient(var(--accent-color) ${report.semanticScore || 0}%, rgba(255,255,255,0.05) 0)`, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 0 20px rgba(59,130,246,0.2)' }}>
                 <div style={{ width: '100px', height: '100px', borderRadius: '50%', background: 'var(--bg-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2rem', fontWeight: 'bold' }}>
                   {Math.round(report.semanticScore || 0)}
                 </div>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '24px', marginBottom: '40px' }}>
              <div style={{ flex: 1, padding: '24px', background: 'rgba(0,0,0,0.3)', border: '1px solid var(--border-subtle)', borderRadius: '16px' }}>
                <h3 className="outfit-font" style={{ marginBottom: '16px', color: 'var(--success-color)', fontSize: '1.2rem' }}>Matched Skills</h3>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                  {report.skillGap?.matchedSkills?.map((s, i) => (
                    <span key={i} style={{ padding: '6px 12px', background: 'rgba(16,185,129,0.2)', color: 'var(--success-color)', borderRadius: '20px', fontSize: '0.9rem', border: '1px solid var(--success-color)' }}>{s}</span>
                  ))}
                  {(!report.skillGap || report.skillGap.matchedSkills?.length === 0) && <span style={{ color: 'var(--text-secondary)' }}>None identified</span>}
                </div>
              </div>
              <div style={{ flex: 1, padding: '24px', background: 'rgba(0,0,0,0.3)', border: '1px solid var(--border-subtle)', borderRadius: '16px' }}>
                <h3 className="outfit-font" style={{ marginBottom: '16px', color: 'var(--danger-color)', fontSize: '1.2rem' }}>Missing Skills</h3>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                  {report.skillGap?.missingSkills?.map((s, i) => (
                    <span key={i} style={{ padding: '6px 12px', background: 'rgba(244,63,94,0.2)', color: 'var(--danger-color)', borderRadius: '20px', fontSize: '0.9rem', border: '1px solid var(--danger-color)' }}>{s}</span>
                  ))}
                  {(!report.skillGap || report.skillGap.missingSkills?.length === 0) && <span style={{ color: 'var(--text-secondary)' }}>None identified</span>}
                </div>
              </div>
            </div>

            <div style={{ marginBottom: '40px' }}>
              <h3 className="outfit-font" style={{ marginBottom: '16px', color: 'var(--text-secondary)', fontSize: '1.1rem', textTransform: 'uppercase', letterSpacing: '1px' }}>Machine Learning Reasoning</h3>
              <p style={{ background: 'rgba(0,0,0,0.4)', padding: '24px', borderRadius: '12px', color: '#f3f4f6', fontSize: '1.1rem', borderLeft: '4px solid var(--accent-color)', lineHeight: '1.7' }}>
                {report.explanation || report.reason}
              </p>
            </div>

            <div style={{ display: 'flex', gap: '24px', marginBottom: '40px' }}>
              <div style={{ flex: 1, padding: '24px', background: 'linear-gradient(180deg, rgba(16,185,129,0.08) 0%, rgba(16,185,129,0.02) 100%)', border: '1px solid rgba(16, 185, 129, 0.2)', borderRadius: '16px' }}>
                <h3 className="outfit-font" style={{ color: 'var(--success-color)', display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px', fontSize: '1.3rem' }}><CheckCircle2 size={24} /> ATS Strengths</h3>
                <ul style={{ listStylePos: 'inside', color: '#d1d5db', display: 'flex', flexDirection: 'column', gap: '16px', lineHeight: '1.6' }}>
                  {report.strengths?.map((s, i) => <li key={i}>{s}</li>)}
                </ul>
              </div>
              
              <div style={{ flex: 1, padding: '24px', background: 'linear-gradient(180deg, rgba(244,63,94,0.08) 0%, rgba(244,63,94,0.02) 100%)', border: '1px solid rgba(244, 63, 94, 0.2)', borderRadius: '16px' }}>
                <h3 className="outfit-font" style={{ color: 'var(--danger-color)', display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px', fontSize: '1.3rem' }}><XCircle size={24} /> Vulnerabilities</h3>
                <ul style={{ listStylePos: 'inside', color: '#d1d5db', display: 'flex', flexDirection: 'column', gap: '16px', lineHeight: '1.6' }}>
                  {report.weaknesses?.map((w, i) => <li key={i}>{w}</li>)}
                </ul>
              </div>
            </div>

            <div>
               <h3 className="outfit-font" style={{ marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px', fontSize: '1.3rem', color: '#fbbf24' }}><AlertCircle color="#fbbf24" size={24} /> Actionable Improvements</h3>
               <ul style={{ listStyle: 'none', padding: 0 }}>
                 {report.skillGap?.recommendations?.map((imp, i) => (
                    <li key={i} style={{ padding: '16px 20px', background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border-subtle)', borderRadius: '12px', marginBottom: '12px', fontSize: '1.05rem', color: '#f3f4f6' }}>
                       {imp}
                    </li>
                  ))}
                 {report.improvements?.map((imp, i) => (
                   <li key={i+100} style={{ padding: '16px 20px', background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border-subtle)', borderRadius: '12px', marginBottom: '12px', fontSize: '1.05rem', color: '#f3f4f6' }}>
                      {imp}
                   </li>
                 ))}
               </ul>
            </div>

            <button onClick={() => setReport(null)} className="btn btn-secondary" style={{ marginTop: '40px', width: '100%', padding: '16px' }}>Evaluate Another Candidate</button>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
