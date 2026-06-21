import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import {
  UploadCloud, CheckCircle2, XCircle, AlertCircle,
  Loader2, ChevronRight, Trophy, Star, TrendingUp,
  Zap, Shield, AlertTriangle, CheckCheck, Rocket,
  User, Mail, Phone, Link, RefreshCw,
  Search, Filter, Briefcase, Calendar, Clock, X
} from 'lucide-react';

export default function CandidatePortal() {
  // Use string keys for steps to avoid fractional comparison issues
  const [step, setStep] = useState('role');  // 'role' | 'upload' | 'atsResult' | 'details' | 'interview' | 'done'
  const [roles, setRoles] = useState([]);
  const [rolesLoading, setRolesLoading] = useState(true);
  const [rolesError, setRolesError] = useState(null);
  const [selectedRole, setSelectedRole] = useState('');

  // Phase 3: Jobs Board State
  const [searchQuery, setSearchQuery] = useState('');
  const [domainFilter, setDomainFilter] = useState('All');
  const [difficultyFilter, setDifficultyFilter] = useState('All');
  const [sortOrder, setSortOrder] = useState('Newest');
  const [selectedJobDetail, setSelectedJobDetail] = useState(null);

  // Phase 2: Resume
  const [file, setFile] = useState(null);
  const [resumeLoading, setResumeLoading] = useState(false);
  const [resumeReport, setResumeReport] = useState(null);
  const [resumeError, setResumeError] = useState(null);

  // Phase 3.5: Candidate Info
  const [candidateInfo, setCandidateInfo] = useState({ name: '', email: '', phone: '', linkedin: '' });
  const [infoError, setInfoError] = useState(null);
  const [infoLoading, setInfoLoading] = useState(false);
  const [candidateId, setCandidateId] = useState(null);

  // Phase 4: Interview
  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState({});
  const [qaLoading, setQaLoading] = useState(false);
  const [qaError, setQaError] = useState(null);
  const [submitAttempted, setSubmitAttempted] = useState(false);
  const questionRefs = useRef([]);
  const [qaReport, setQaReport] = useState(null);

  useEffect(() => { loadRoles(); }, []);

  const loadRoles = async () => {
    setRolesLoading(true);
    setRolesError(null);
    try {
      const res = await axios.get('http://localhost:5000/api/roles');
      const data = res.data.data || [];
      setRoles(data);
      if (data.length > 0) setSelectedRole(data[0].title);
    } catch (err) {
      setRolesError('Could not load roles. Check that the backend is running.');
    } finally {
      setRolesLoading(false);
    }
  };

  // ── Step 2: Resume Upload ──────────────────────────────────────────────────
  const handleResumeUpload = async (e) => {
    e.preventDefault();
    if (!file) return setResumeError('Please select a PDF file.');
    if (!selectedRole) return setResumeError('Please select a role first.');
    setResumeLoading(true);
    setResumeError(null);
    const formData = new FormData();
    formData.append('resume', file);
    formData.append('role', selectedRole);
    try {
      const { data } = await axios.post('http://localhost:5000/api/resume', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        timeout: 120000 // 2 min for embedding on first run
      });
      setResumeReport(data.report);
      setStep('atsResult');
    } catch (err) {
      if (err.code === 'ECONNABORTED') {
        setResumeError('Analysis timed out. The model may be loading. Please try again.');
      } else {
        setResumeError(err.response?.data?.error || 'Resume evaluation failed. Ensure the PDF is readable.');
      }
    } finally {
      setResumeLoading(false);
    }
  };

  // ── Step 3.5: Register Candidate Info ────────────────────────────────────
  const handleRegisterCandidate = async (e) => {
    e.preventDefault();
    const { name, email } = candidateInfo;
    if (!name.trim() || !email.trim()) return setInfoError('Name and Email are required.');
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return setInfoError('Please enter a valid email address.');
    setInfoLoading(true);
    setInfoError(null);
    try {
      const { data } = await axios.post('http://localhost:5000/api/candidates/register', {
        ...candidateInfo,
        role: selectedRole,
        atsScore: resumeReport?.evaluation?.scores?.finalScore ?? null,
        atsDecision: resumeReport?.evaluation?.decision ?? null,
        resumeText: resumeReport?.resumeText || '',
        resumeEmbedding: resumeReport?.resumeEmbedding || [],
        jobEmbedding: resumeReport?.jobEmbedding || [],
        semanticScore: resumeReport?.semanticScore || 0,
        skillGap: resumeReport?.skillGap || { matchedSkills: [], missingSkills: [], recommendations: [] },
      });
      setCandidateId(data.candidateId);
      const qRes = await axios.post('http://localhost:5000/api/questions', { 
        role: selectedRole,
        candidateId: data.candidateId 
      });
      setQuestions(qRes.data.data || []);
      setStep('interview');
    } catch (err) {
      setInfoError(err.response?.data?.error || 'Registration failed. Please try again.');
    } finally {
      setInfoLoading(false);
    }
  };

  // ── Step 4: Submit Interview ──────────────────────────────────────────────
  const handleSubmitInterview = async () => {
    setSubmitAttempted(true);
    const answeredCount = questions.filter((_, idx) => (answers[idx] || '').trim().length > 0).length;
    
    if (answeredCount < questions.length) {
      const firstUnansweredIdx = questions.findIndex((_, idx) => !(answers[idx] || '').trim().length);
      if (firstUnansweredIdx !== -1 && questionRefs.current[firstUnansweredIdx]) {
        questionRefs.current[firstUnansweredIdx].scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
      return setQaError('Please answer all interview questions before submission.');
    }

    const qaPayload = questions.map((q, idx) => ({
      question: q.question,
      answer: (answers[idx] || '').trim()
    }));
    setQaLoading(true);
    setQaError(null);
    try {
      const response = await axios.post('http://localhost:5000/api/submitAnswer', {
        role: selectedRole,
        qa: qaPayload,
        candidateId,
      }, { timeout: 90000 });
      setQaReport(response.data.report || response.data);
      setStep('done');
    } catch (err) {
      if (err.code === 'ECONNABORTED') {
        setQaError('Evaluation timed out. The AI model may be busy. Please try again.');
      } else {
        setQaError(err.response?.data?.message || 'Submission failed. Please try again.');
      }
    } finally {
      setQaLoading(false);
    }
  };

  // ── Helpers ────────────────────────────────────────────────────────────────
  const decisionColor = (d) => {
    if (d === 'Selected') return 'var(--success-color)';
    if (d === 'Borderline') return '#fbbf24';
    return 'var(--danger-color)';
  };

  // Phase 3: Derived State for Roles
  const filteredRoles = roles.filter(r => {
    const matchesSearch = r.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          (r.description || '').toLowerCase().includes(searchQuery.toLowerCase());
    const matchesDomain = domainFilter === 'All' || r.domain === domainFilter;
    const matchesDiff = difficultyFilter === 'All' || r.difficulty === difficultyFilter;
    return matchesSearch && matchesDomain && matchesDiff;
  }).sort((a, b) => {
    if (sortOrder === 'Difficulty') {
      const diffVal = { 'Easy': 1, 'Medium': 2, 'Hard': 3 };
      return (diffVal[b.difficulty] || 0) - (diffVal[a.difficulty] || 0);
    }
    return 0;
  });

  const STEP_ORDER = ['role', 'upload', 'atsResult', 'details', 'interview', 'done'];
  const stepIndex = STEP_ORDER.indexOf(step);
  const trackerSteps = [
    { label: '1. Select Role',   key: 'role' },
    { label: '2. ATS Screening', key: 'upload' },
    { label: '3. ATS Result',    key: 'atsResult' },
    { label: '4. Your Details',  key: 'details' },
    { label: '5. Tech Interview',key: 'interview' },
    { label: '6. Final Review',  key: 'done' },
  ].map((s, i) => ({ ...s, active: i <= stepIndex, current: s.key === step }));

  return (
    <div style={{ maxWidth: '900px', margin: '0 auto', width: '100%', animation: 'fadeIn 0.5s ease-out' }}>
      <h1 className="outfit-font" style={{ fontSize: '3rem', marginBottom: '40px' }}>Application Portal</h1>

      {/* Step Tracker */}
      <div style={{
        display: 'flex', justifyContent: 'space-between', marginBottom: '40px',
        padding: '16px 20px', background: 'rgba(0,0,0,0.3)', borderRadius: '14px',
        border: '1px solid var(--border-subtle)', flexWrap: 'wrap', gap: '8px'
      }}>
        {trackerSteps.map((s, i) => (
          <span key={i} style={{
            color: s.active ? 'var(--accent-color)' : 'rgba(255,255,255,0.3)',
            fontWeight: s.current ? '700' : '400',
            fontSize: s.current ? '0.9rem' : '0.8rem',
            transition: 'all 0.3s',
            borderBottom: s.current ? '2px solid var(--accent-color)' : '2px solid transparent',
            paddingBottom: '4px'
          }}>{s.label}</span>
        ))}
      </div>

      {/* ── STEP 1: Select Role (Jobs Board) ─────────────────────────────────── */}
      {step === 'role' && (
        <div style={{ animation: 'fadeIn 0.4s ease-out' }}>
          
          {/* Search & Filters */}
          <div className="glass-panel" style={{ padding: '24px', marginBottom: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
              <div style={{ flex: '1 1 250px', position: 'relative' }}>
                <Search size={18} style={{ position: 'absolute', left: '14px', top: '14px', color: 'var(--text-secondary)' }} />
                <input 
                  type="text" 
                  placeholder="Search by role title or keywords..." 
                  className="input-base" 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  style={{ paddingLeft: '40px', width: '100%', boxSizing: 'border-box' }}
                />
              </div>
              
              <div style={{ display: 'flex', gap: '12px', flex: '1 1 auto' }}>
                <select className="input-base" value={domainFilter} onChange={(e) => setDomainFilter(e.target.value)} style={{ flex: 1 }}>
                  <option value="All">All Domains</option>
                  {[...new Set(roles.map(r => r.domain).filter(Boolean))].map(d => <option key={d} value={d}>{d}</option>)}
                </select>
                
                <select className="input-base" value={difficultyFilter} onChange={(e) => setDifficultyFilter(e.target.value)} style={{ flex: 1 }}>
                  <option value="All">All Difficulties</option>
                  <option value="Easy">Easy</option>
                  <option value="Medium">Medium</option>
                  <option value="Hard">Hard</option>
                </select>
                
                <select className="input-base" value={sortOrder} onChange={(e) => setSortOrder(e.target.value)} style={{ flex: 1 }}>
                  <option value="Newest">Sort: Newest</option>
                  <option value="Difficulty">Sort: Difficulty</option>
                </select>
              </div>
            </div>
          </div>

          {/* Job Grid */}
          {rolesLoading ? (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '20px' }}>
              {[1,2,3,4,5,6].map(i => (
                <div key={i} className="glass-panel" style={{ padding: '24px', height: '240px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <div style={{ height: '24px', background: 'rgba(255,255,255,0.1)', borderRadius: '4px', width: '60%', animation: 'pulse 1.5s infinite' }}></div>
                  <div style={{ height: '16px', background: 'rgba(255,255,255,0.1)', borderRadius: '4px', width: '40%', animation: 'pulse 1.5s infinite' }}></div>
                  <div style={{ height: '16px', background: 'rgba(255,255,255,0.1)', borderRadius: '4px', width: '80%', marginTop: '16px', animation: 'pulse 1.5s infinite' }}></div>
                  <div style={{ height: '40px', background: 'rgba(255,255,255,0.1)', borderRadius: '8px', width: '100%', marginTop: 'auto', animation: 'pulse 1.5s infinite' }}></div>
                </div>
              ))}
            </div>
          ) : rolesError ? (
            <div style={{ padding: '20px', background: 'rgba(244,63,94,0.1)', borderRadius: '10px', border: '1px solid var(--danger-color)', color: '#fca5a5' }}>
              <p style={{ marginBottom: '14px' }}>⚠️ {rolesError}</p>
              <button onClick={loadRoles} className="btn btn-secondary" style={{ padding: '10px 20px' }}>
                <RefreshCw size={16} style={{ marginRight: 6 }} /> Retry
              </button>
            </div>
          ) : roles.length === 0 ? (
            <div className="glass-panel" style={{ padding: '40px', textAlign: 'center' }}>
              <Briefcase size={48} color="rgba(255,255,255,0.2)" style={{ margin: '0 auto 16px' }} />
              <h3 style={{ fontSize: '1.2rem', marginBottom: '8px' }}>No Active Roles</h3>
              <p style={{ color: 'var(--text-secondary)' }}>Check back later or ask HR to open new positions.</p>
            </div>
          ) : filteredRoles.length === 0 ? (
            <div className="glass-panel" style={{ padding: '40px', textAlign: 'center' }}>
              <Search size={48} color="rgba(255,255,255,0.2)" style={{ margin: '0 auto 16px' }} />
              <h3 style={{ fontSize: '1.2rem', marginBottom: '8px' }}>No matching jobs found</h3>
              <p style={{ color: 'var(--text-secondary)' }}>Try adjusting your search or filters.</p>
              <button onClick={() => { setSearchQuery(''); setDomainFilter('All'); setDifficultyFilter('All'); }} className="btn btn-secondary" style={{ marginTop: '16px' }}>Clear Filters</button>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '20px' }}>
              {filteredRoles.map((r, i) => (
                <div key={i} className="glass-panel hover-card" style={{ padding: '24px', display: 'flex', flexDirection: 'column', transition: 'all 0.2s', cursor: 'pointer' }} onClick={() => setSelectedJobDetail(r)}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                    <h3 style={{ fontSize: '1.25rem', color: 'white', lineHeight: '1.3' }}>{r.title}</h3>
                    {r.difficulty && (
                      <span style={{ 
                        background: r.difficulty === 'Hard' ? 'rgba(244,63,94,0.15)' : r.difficulty === 'Medium' ? 'rgba(251,191,36,0.15)' : 'rgba(16,185,129,0.15)', 
                        color: r.difficulty === 'Hard' ? '#fca5a5' : r.difficulty === 'Medium' ? '#fde68a' : '#6ee7b7', 
                        padding: '4px 8px', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 'bold' 
                      }}>
                        {r.difficulty}
                      </span>
                    )}
                  </div>
                  
                  <div style={{ display: 'flex', gap: '12px', color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '16px', flexWrap: 'wrap' }}>
                    {r.domain && <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><Briefcase size={14} /> {r.domain}</span>}
                    {r.experience && <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><Star size={14} /> {r.experience}</span>}
                    <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><Clock size={14} /> Rolling Deadline</span>
                  </div>

                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '20px', display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                    {r.description || 'No description provided.'}
                  </p>

                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '24px' }}>
                    {(r.skills || []).slice(0, 3).map((s, idx) => (
                      <span key={idx} style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', padding: '2px 8px', borderRadius: '12px', fontSize: '0.75rem', color: '#cbd5e1' }}>
                        {s}
                      </span>
                    ))}
                    {(r.skills?.length > 3) && <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', padding: '2px 4px' }}>+{r.skills.length - 3}</span>}
                  </div>

                  <button className="btn btn-secondary" style={{ marginTop: 'auto', width: '100%', background: 'rgba(255,255,255,0.05)' }}>
                    View Details
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Job Details Modal */}
          {selectedJobDetail && (
            <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }} onClick={() => setSelectedJobDetail(null)}>
              <div className="glass-panel" style={{ width: '100%', maxWidth: '700px', maxHeight: '90vh', overflowY: 'auto', padding: '0', animation: 'fadeIn 0.2s ease-out' }} onClick={e => e.stopPropagation()}>
                
                {/* Modal Header */}
                <div style={{ padding: '32px', borderBottom: '1px solid var(--border-subtle)', position: 'relative' }}>
                  <button onClick={() => setSelectedJobDetail(null)} style={{ position: 'absolute', top: '24px', right: '24px', background: 'transparent', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', padding: '4px' }}>
                    <X size={24} />
                  </button>
                  <h2 className="outfit-font" style={{ fontSize: '2rem', marginBottom: '12px', paddingRight: '32px' }}>{selectedJobDetail.title}</h2>
                  
                  <div style={{ display: 'flex', gap: '16px', color: 'var(--text-secondary)', fontSize: '0.95rem', flexWrap: 'wrap' }}>
                    {selectedJobDetail.domain && <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><Briefcase size={16} color="var(--accent-color)" /> {selectedJobDetail.domain}</span>}
                    {selectedJobDetail.experience && <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><Star size={16} color="#fbbf24" /> {selectedJobDetail.experience}</span>}
                    <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><Clock size={16} color="#fca5a5" /> Rolling Deadline</span>
                    {selectedJobDetail.difficulty && <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><TrendingUp size={16} color="#6ee7b7" /> {selectedJobDetail.difficulty}</span>}
                  </div>
                </div>

                {/* Modal Body */}
                <div style={{ padding: '32px', display: 'flex', flexDirection: 'column', gap: '32px' }}>
                  
                  <div>
                    <h3 className="outfit-font" style={{ fontSize: '1.2rem', marginBottom: '12px', color: 'white' }}>About the Role</h3>
                    <p style={{ color: 'var(--text-secondary)', lineHeight: '1.7', whiteSpace: 'pre-wrap' }}>{selectedJobDetail.description || 'No detailed description provided.'}</p>
                  </div>

                  <div>
                    <h3 className="outfit-font" style={{ fontSize: '1.2rem', marginBottom: '12px', color: 'white' }}>Required Skills</h3>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                      {(selectedJobDetail.skills || []).map((s, idx) => (
                        <span key={idx} style={{ background: 'rgba(59,130,246,0.15)', color: '#93c5fd', padding: '6px 12px', borderRadius: '6px', fontSize: '0.9rem', fontWeight: '500' }}>
                          {s}
                        </span>
                      ))}
                      {(!selectedJobDetail.skills || selectedJobDetail.skills.length === 0) && <span style={{ color: 'var(--text-secondary)' }}>None specified</span>}
                    </div>
                  </div>

                  {selectedJobDetail.responsibilities && selectedJobDetail.responsibilities.length > 0 && (
                    <div>
                      <h3 className="outfit-font" style={{ fontSize: '1.2rem', marginBottom: '12px', color: 'white' }}>Key Responsibilities</h3>
                      <ul style={{ color: 'var(--text-secondary)', lineHeight: '1.7', paddingLeft: '20px' }}>
                        {selectedJobDetail.responsibilities.map((r, i) => <li key={i} style={{ marginBottom: '8px' }}>{r}</li>)}
                      </ul>
                    </div>
                  )}

                  {selectedJobDetail.blueprint && selectedJobDetail.blueprint.rubric && (
                    <div style={{ background: 'rgba(0,0,0,0.2)', padding: '20px', borderRadius: '12px', border: '1px solid var(--border-subtle)' }}>
                      <h3 className="outfit-font" style={{ fontSize: '1.1rem', marginBottom: '12px', color: 'white', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <CheckCheck size={18} color="var(--success-color)" /> Evaluation Rubric
                      </h3>
                      <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', lineHeight: '1.6' }}>{selectedJobDetail.blueprint.rubric}</p>
                    </div>
                  )}

                </div>

                {/* Modal Footer */}
                <div style={{ padding: '24px 32px', borderTop: '1px solid var(--border-subtle)', display: 'flex', justifyContent: 'flex-end', gap: '16px', background: 'rgba(0,0,0,0.2)' }}>
                  <button className="btn btn-secondary" onClick={() => setSelectedJobDetail(null)}>Cancel</button>
                  <button className="btn btn-primary" style={{ padding: '12px 32px' }} onClick={() => {
                    setSelectedRole(selectedJobDetail.title);
                    setStep('upload');
                    setSelectedJobDetail(null);
                  }}>
                    Apply Now <ChevronRight size={18} style={{ verticalAlign: 'middle', marginLeft: '4px' }} />
                  </button>
                </div>

              </div>
            </div>
          )}

        </div>
      )}

      {/* ── STEP 2: Upload Resume ───────────────────────────────────────────── */}
      {step === 'upload' && (
        <div className="glass-panel" style={{ padding: '40px', animation: 'fadeIn 0.4s ease-out' }}>
          <h2 className="outfit-font" style={{ fontSize: '2.4rem', marginBottom: '16px' }}>Upload Your Resume</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '1.1rem', marginBottom: '32px' }}>
            We'll automatically extract your skills and experience to match you with the <strong style={{ color: 'white' }}>{selectedRole}</strong> role.
          </p>
          <button onClick={() => setStep('role')} className="btn btn-secondary" style={{ marginBottom: '24px' }}>
            ← Back to Roles
          </button>
          <form onSubmit={handleResumeUpload}>
            <div onClick={() => document.getElementById('file-upload-portal').click()} style={{
              border: `2px dashed ${file ? 'var(--success-color)' : 'var(--border-strong)'}`,
              borderRadius: '16px', padding: '48px 24px', textAlign: 'center',
              background: file ? 'rgba(16,185,129,0.04)' : 'rgba(0,0,0,0.3)',
              cursor: 'pointer', marginBottom: '24px', transition: 'all 0.3s'
            }}>
              <UploadCloud size={56} color={file ? 'var(--success-color)' : 'var(--accent-color)'} style={{ marginBottom: '16px' }} />
              <h3 className="outfit-font" style={{ marginBottom: '8px' }}>
                {file ? `✅ ${file.name}` : 'Click to select PDF'}
              </h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Only PDF files accepted</p>
              <input id="file-upload-portal" type="file" accept="application/pdf"
                style={{ display: 'none' }} onChange={(e) => setFile(e.target.files[0])} />
            </div>
            {resumeError && (
              <div style={{ color: '#fca5a5', marginBottom: '16px', padding: '12px 16px', background: 'rgba(244,63,94,0.1)', borderRadius: '10px', border: '1px solid var(--danger-color)' }}>
                ⚠️ {resumeError}
              </div>
            )}
            {resumeLoading && (
              <div style={{ marginBottom: '16px', padding: '14px 18px', background: 'rgba(59,130,246,0.08)', border: '1px solid rgba(59,130,246,0.2)', borderRadius: '10px', color: '#93c5fd', fontSize: '0.9rem' }}>
                ⏳ Analyzing your resume with AI. This may take 15–30s on first run while the model loads...
              </div>
            )}
            <button type="submit" className="btn btn-primary"
                style={{ width: '100%', padding: '16px', fontSize: '1.1rem' }} disabled={resumeLoading}>
                {resumeLoading
                  ? <><Loader2 className="lucide-spin" size={18} /> Analyzing Resume…</>
                  : 'Run ATS Screening'}
              </button>
          </form>
        </div>
      )}

      {/* ── STEP 3: ATS Result — 5 Card UI ─────────────────────────────────── */}
      {step === 'atsResult' && resumeReport && (
        <div style={{ animation: 'fadeIn 0.4s ease-out' }}>

          {/* Card 1: Result Header */}
          <div style={{
            padding: '32px', borderRadius: '20px', marginBottom: '20px',
            background: resumeReport.evaluation?.decision === 'Selected'
              ? 'linear-gradient(135deg, rgba(16,185,129,0.15) 0%, rgba(16,185,129,0.05) 100%)'
              : resumeReport.evaluation?.decision === 'Borderline'
              ? 'linear-gradient(135deg, rgba(251,191,36,0.15) 0%, rgba(251,191,36,0.05) 100%)'
              : 'linear-gradient(135deg, rgba(244,63,94,0.15) 0%, rgba(244,63,94,0.05) 100%)',
            border: `1px solid ${decisionColor(resumeReport.evaluation?.decision)}`,
            display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
              {resumeReport.evaluation?.decision === 'Selected'
                ? <CheckCircle2 size={44} color="var(--success-color)" />
                : resumeReport.evaluation?.decision === 'Borderline'
                ? <AlertCircle size={44} color="#fbbf24" />
                : <XCircle size={44} color="var(--danger-color)" />}
              <div>
                <h2 className="outfit-font" style={{ fontSize: '2.2rem', color: decisionColor(resumeReport.evaluation?.decision), margin: 0 }}>
                  {resumeReport.evaluation?.decision === 'Selected' ? '🎉 Shortlisted!' : resumeReport.evaluation?.decision === 'Borderline' ? '⚠️ Borderline' : '❌ Not Shortlisted'}
                </h2>
                <p style={{ color: 'var(--text-secondary)', margin: '4px 0 0' }}>
                  Role: <strong style={{ color: 'white' }}>{selectedRole}</strong> &nbsp;•&nbsp;
                  Level: <strong style={{ color: 'white' }}>{resumeReport.evaluation?.experienceLevel || 'N/A'}</strong>
                </p>
              </div>
            </div>
            <div style={{
              width: '110px', height: '110px', borderRadius: '50%',
              background: `conic-gradient(${decisionColor(resumeReport.evaluation?.decision)} ${resumeReport.evaluation?.scores?.finalScore || 0}%, rgba(255,255,255,0.05) 0)`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: `0 0 24px ${decisionColor(resumeReport.evaluation?.decision)}44`
            }}>
              <div style={{
                width: '86px', height: '86px', borderRadius: '50%', background: 'var(--bg-primary)',
                display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center'
              }}>
                <span style={{ fontSize: '1.8rem', fontWeight: '900', lineHeight: 1 }}>{resumeReport.evaluation?.scores?.finalScore ?? '--'}</span>
                <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>/ 100</span>
              </div>
            </div>
          </div>

          {/* Card 2: Score Breakdown */}
          <div className="glass-panel" style={{ padding: '28px', marginBottom: '20px' }}>
            <h3 className="outfit-font" style={{ marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px', fontSize: '1.2rem' }}>
              <Star size={22} color="#fbbf24" /> 🟡 Score & Fairness
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '14px' }}>
              {[
                { label: 'ATS Score', value: `${resumeReport.evaluation?.scores?.finalScore ?? '--'}/100`, color: decisionColor(resumeReport.evaluation?.decision) },
                { label: 'Skill Match', value: `${resumeReport.evaluation?.scores?.skillMatch ?? '--'}%`, color: 'var(--accent-color)' },
                { label: 'Fairness Score', value: resumeReport.evaluation?.fairnessScore != null ? Number(resumeReport.evaluation.fairnessScore).toFixed(2) : '1.00', color: '#10b981' },
                { label: 'Bias Adjusted', value: resumeReport.evaluation?.biasAdjusted ? '✅ Yes' : '❌ No', color: resumeReport.evaluation?.biasAdjusted ? '#10b981' : '#f43f5e' },
              ].map((item, i) => (
                <div key={i} style={{ background: 'rgba(0,0,0,0.3)', borderRadius: '14px', padding: '18px', border: '1px solid var(--border-subtle)', textAlign: 'center' }}>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.75rem', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '1px' }}>{item.label}</p>
                  <p style={{ fontSize: '1.4rem', fontWeight: '800', color: item.color, margin: 0 }}>{item.value}</p>
                </div>
              ))}
            </div>
          </div>

          {/* CTA → Enter Details */}
          <button onClick={() => setStep('details')} className="btn btn-primary"
            style={{ width: '100%', padding: '18px', fontSize: '1.15rem' }}>
            Continue — Enter Your Details <ChevronRight size={18} style={{ verticalAlign: 'middle' }} />
          </button>
        </div>
      )}

      {/* ── STEP 3.5: Candidate Personal Info Form ─────────────────────────── */}
      {step === 'details' && (
        <div className="glass-panel" style={{ padding: '40px', animation: 'fadeIn 0.4s ease-out' }}>
          {/* Header */}
          <div style={{ marginBottom: '32px' }}>
            <h2 className="outfit-font" style={{ fontSize: '2.4rem', marginBottom: '8px' }}>Final Step: Contact Info</h2>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '32px', fontSize: '1.1rem' }}>
              Where should we send your results and updates?
            </p>
            <button onClick={() => setStep('upload')} className="btn btn-secondary" style={{ marginBottom: '24px' }}>
              ← Back to Resume Upload
            </button>
            <p style={{ color: 'var(--text-secondary)', lineHeight: '1.6' }}>
              Fill in your contact information. This will be shared with the HR team along with your ATS score
              (<strong style={{ color: decisionColor(resumeReport?.evaluation?.decision) }}>{resumeReport?.evaluation?.decision}</strong> — {resumeReport?.evaluation?.scores?.finalScore}/100).
            </p>
          </div>

          {/* ATS Summary Banner */}
          <div style={{
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            background: 'rgba(0,0,0,0.3)', borderRadius: '12px', padding: '16px 20px',
            border: `1px solid ${decisionColor(resumeReport?.evaluation?.decision)}33`, marginBottom: '32px', flexWrap: 'wrap', gap: '10px'
          }}>
            <span style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
              Role Applied: <strong style={{ color: 'white' }}>{selectedRole}</strong>
            </span>
            <span style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
              ATS Score: <strong style={{ color: decisionColor(resumeReport?.evaluation?.decision) }}>{resumeReport?.evaluation?.scores?.finalScore}/100</strong>
            </span>
            <span style={{
              background: `${decisionColor(resumeReport?.evaluation?.decision)}22`,
              color: decisionColor(resumeReport?.evaluation?.decision),
              padding: '4px 14px', borderRadius: '20px', fontSize: '0.85rem', fontWeight: '700',
              border: `1px solid ${decisionColor(resumeReport?.evaluation?.decision)}44`
            }}>{resumeReport?.evaluation?.decision}</span>
          </div>

          <form onSubmit={handleRegisterCandidate}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

              {/* Name */}
              <div>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px', fontWeight: '600', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                  <User size={16} /> Full Name <span style={{ color: 'var(--danger-color)' }}>*</span>
                </label>
                <input type="text" className="input-base"
                  placeholder="e.g. Shreya Sharma"
                  value={candidateInfo.name}
                  onChange={(e) => setCandidateInfo({ ...candidateInfo, name: e.target.value })}
                  required
                />
              </div>

              {/* Email */}
              <div>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px', fontWeight: '600', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                  <Mail size={16} /> Email Address <span style={{ color: 'var(--danger-color)' }}>*</span>
                </label>
                <input type="email" className="input-base"
                  placeholder="e.g. shreya@gmail.com"
                  value={candidateInfo.email}
                  onChange={(e) => setCandidateInfo({ ...candidateInfo, email: e.target.value })}
                  required
                />
              </div>

              {/* Phone + LinkedIn side by side */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px', fontWeight: '600', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                    <Phone size={16} /> Phone Number
                  </label>
                  <input type="tel" className="input-base"
                    placeholder="e.g. +91 9876543210"
                    value={candidateInfo.phone}
                    onChange={(e) => setCandidateInfo({ ...candidateInfo, phone: e.target.value })}
                  />
                </div>
                <div>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px', fontWeight: '600', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                    <Link size={16} /> LinkedIn URL
                  </label>
                  <input type="url" className="input-base"
                    placeholder="e.g. linkedin.com/in/shreya"
                    value={candidateInfo.linkedin}
                    onChange={(e) => setCandidateInfo({ ...candidateInfo, linkedin: e.target.value })}
                  />
                </div>
              </div>
            </div>

            {infoError && (
              <div style={{ marginTop: '20px', padding: '12px 16px', background: 'rgba(244,63,94,0.1)', border: '1px solid var(--danger-color)', borderRadius: '10px', color: '#fca5a5' }}>
                ⚠️ {infoError}
              </div>
            )}

            <button type="submit" className="btn btn-primary"
              style={{ width: '100%', padding: '18px', fontSize: '1.15rem', marginTop: '32px' }}
              disabled={infoLoading}>
              {infoLoading
                ? <><Loader2 className="lucide-spin" size={18} /> Saving & Generating Questions...</>
                : <>Save & Proceed to Tech Interview <ChevronRight size={18} style={{ verticalAlign: 'middle' }} /></>}
            </button>
          </form>
        </div>
      )}

      {/* ── STEP 4: Tech Interview ──────────────────────────────────────────── */}
      {step === 'interview' && (
        <div className="glass-panel" style={{ padding: '40px', animation: 'fadeIn 0.4s ease-out' }}>
          
          <button onClick={() => setStep('details')} className="btn btn-secondary" style={{ marginBottom: '24px' }}>
            ← Back to Contact Info
          </button>

          <div style={{ marginBottom: '32px' }}>
            <h2 className="outfit-font" style={{ fontSize: '2rem', marginBottom: '8px' }}>🧠 Tech Interview</h2>
            <p style={{ color: 'var(--text-secondary)' }}>
              Role: <strong style={{ color: 'white' }}>{selectedRole}</strong> &nbsp;•&nbsp;
              Answered: <strong style={{ color: 'white' }}>{questions.filter((_, idx) => (answers[idx] || '').trim().length > 0).length} / {questions.length}</strong>
            </p>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', marginBottom: '32px' }}>
            {questions.map((q, idx) => (
              <div key={idx} style={{
                background: 'rgba(0,0,0,0.35)', padding: '28px', borderRadius: '16px',
                border: '1px solid var(--border-subtle)',
                borderLeft: `4px solid ${q.difficulty === 'Hard' ? 'var(--danger-color)' : q.difficulty === 'Medium' ? '#fbbf24' : 'var(--success-color)'}`
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px', flexWrap: 'wrap' }}>
                  <span style={{ color: 'var(--accent-color)', fontWeight: '800', background: 'rgba(59,130,246,0.15)', borderRadius: '6px', padding: '3px 10px', fontSize: '0.9rem' }}>Q{idx + 1}</span>
                  {q.skill && (
                    <span style={{ background: 'rgba(168,85,247,0.15)', color: '#c4b5fd', borderRadius: '6px', padding: '3px 10px', fontSize: '0.8rem', fontWeight: '600' }}>🔧 {q.skill}</span>
                  )}
                  {q.difficulty && (
                    <span style={{
                      background: q.difficulty === 'Hard' ? 'rgba(244,63,94,0.15)' : q.difficulty === 'Medium' ? 'rgba(251,191,36,0.15)' : 'rgba(16,185,129,0.15)',
                      color: q.difficulty === 'Hard' ? '#fca5a5' : q.difficulty === 'Medium' ? '#fde68a' : '#6ee7b7',
                      borderRadius: '6px', padding: '3px 10px', fontSize: '0.8rem', fontWeight: '600'
                    }}>{q.difficulty === 'Hard' ? '🔴' : q.difficulty === 'Medium' ? '🟡' : '🟢'} {q.difficulty}</span>
                  )}
                </div>
                <h3 style={{ marginBottom: '16px', lineHeight: '1.7', fontSize: '1.05rem', color: 'white' }}>{q.question}</h3>
                <textarea 
                  ref={el => questionRefs.current[idx] = el}
                  className="input-base"
                  placeholder="Type your detailed answer here... The AI will evaluate clarity, depth, and technical accuracy."
                  value={answers[idx] || ''}
                  onChange={(e) => setAnswers({ ...answers, [idx]: e.target.value })}
                  style={{ 
                    minHeight: '130px', 
                    border: submitAttempted && !(answers[idx] || '').trim() ? '2px solid var(--danger-color)' : '1px solid rgba(255, 255, 255, 0.1)'
                  }}
                />
                {submitAttempted && !(answers[idx] || '').trim() && (
                  <p style={{ color: 'var(--danger-color)', fontSize: '0.85rem', marginTop: '8px' }}>This question is mandatory.</p>
                )}
              </div>
            ))}
          </div>

          {qaError && (
            <div style={{ padding: '14px', background: 'rgba(244,63,94,0.1)', border: '1px solid var(--danger-color)', borderRadius: '10px', color: '#fca5a5', marginBottom: '16px' }}>
              ⚠️ {qaError}
            </div>
          )}

          {qaLoading && (
            <div style={{ marginBottom: '16px', padding: '14px 18px', background: 'rgba(59,130,246,0.08)', border: '1px solid rgba(59,130,246,0.2)', borderRadius: '10px', color: '#93c5fd', fontSize: '0.9rem' }}>
              ⏳ Evaluating your answers with AI. This may take 10–20 seconds...
            </div>
          )}
          <button onClick={handleSubmitInterview} className="btn btn-primary"
            style={{ 
              width: '100%', 
              padding: '18px', 
              fontSize: '1.15rem',
              opacity: questions.filter((_, idx) => (answers[idx] || '').trim().length > 0).length < questions.length ? 0.6 : 1
            }} 
            disabled={qaLoading}>
            {qaLoading
              ? <><Loader2 className="lucide-spin" size={18} /> Evaluating Answers…</>
              : <>Submit Interview Answers <ChevronRight size={18} style={{ verticalAlign: 'middle' }} /></>}
          </button>
        </div>
      )}

      {/* ── STEP 5: Final Review ────────────────────────────────────────────── */}
      {step === 'done' && qaReport && (
        <div style={{ animation: 'fadeIn 0.4s ease-out' }}>

          <div className="glass-panel" style={{ padding: '36px', marginBottom: '24px', textAlign: 'center', borderTop: '4px solid var(--success-color)' }}>
            <CheckCircle2 size={72} color="var(--success-color)" style={{ margin: '0 auto 20px' }} />
            <h1 className="outfit-font" style={{ fontSize: '2.8rem', marginBottom: '10px' }}>Application Submitted! 🎉</h1>
            <p style={{ color: 'var(--text-secondary)', fontSize: '1.1rem', marginBottom: '8px' }}>
              Hey <strong style={{ color: 'white' }}>{candidateInfo.name || 'Candidate'}</strong> — your profile has been sent to HR!
            </p>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>
              Confirmation sent to: <strong style={{ color: 'var(--accent-color)' }}>{candidateInfo.email}</strong>
            </p>
          </div>

          {/* Combined Score Cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: '16px', marginBottom: '24px' }}>
            {[
              { label: 'ATS Resume Score', value: `${resumeReport?.evaluation?.scores?.finalScore ?? '--'}/100`, icon: <Trophy size={24} color="#fbbf24" />, color: '#fbbf24' },
              { label: 'Interview Score', value: `${qaReport.finalScore ?? '--'}/10`, icon: <Star size={24} color="var(--accent-color)" />, color: 'var(--accent-color)' },
              { label: 'ATS Decision', value: resumeReport?.evaluation?.decision ?? '--', icon: <Shield size={24} color={decisionColor(resumeReport?.evaluation?.decision)} />, color: decisionColor(resumeReport?.evaluation?.decision) },
            ].map((card, i) => (
              <div key={i} className="glass-panel" style={{ padding: '24px', textAlign: 'center' }}>
                <div style={{ marginBottom: '10px' }}>{card.icon}</div>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '8px' }}>{card.label}</p>
                <p style={{ fontSize: '1.7rem', fontWeight: '900', color: card.color, margin: 0 }}>{card.value}</p>
              </div>
            ))}
          </div>

          {/* Interview Metrics */}
          {(qaReport.clarity || qaReport.reasoning) && (
            <div className="glass-panel" style={{ padding: '28px', marginBottom: '24px' }}>
              <h3 className="outfit-font" style={{ marginBottom: '20px', fontSize: '1.2rem', display: 'flex', alignItems: 'center', gap: '10px' }}>
                <TrendingUp size={22} color="var(--accent-color)" /> Interview Metrics
              </h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: '14px' }}>
                {[
                  { label: 'Clarity', value: `${qaReport.clarity ?? '--'}/10` },
                  { label: 'Reasoning', value: `${qaReport.reasoning ?? '--'}/10` },
                  { label: 'Overall', value: `${qaReport.overallScore ?? '--'}%` },
                ].map((m, i) => (
                  <div key={i} style={{ background: 'rgba(0,0,0,0.3)', borderRadius: '12px', padding: '16px', textAlign: 'center', border: '1px solid var(--border-subtle)' }}>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', textTransform: 'uppercase', marginBottom: '6px' }}>{m.label}</p>
                    <p style={{ fontSize: '1.4rem', fontWeight: '800', color: 'var(--accent-color)', margin: 0 }}>{m.value}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Per-Question Feedback */}
          {qaReport.detailedFeedback?.length > 0 && (
            <div className="glass-panel" style={{ padding: '28px', marginBottom: '24px' }}>
              <h3 className="outfit-font" style={{ marginBottom: '24px', fontSize: '1.2rem' }}>🔍 Question-by-Question Feedback</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {qaReport.detailedFeedback.map((fb, i) => (
                  <div key={i} style={{
                    background: 'var(--bg-panel)', padding: '20px', borderRadius: '14px',
                    border: '1px solid var(--border-subtle)',
                    borderLeft: `6px solid ${fb.score > 7 ? 'var(--success-color)' : fb.score > 4 ? '#fbbf24' : 'var(--danger-color)'}`
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                      <p style={{ fontWeight: 600, color: 'white', maxWidth: '80%', lineHeight: '1.5', margin: 0 }}>
                        <span style={{ color: 'var(--text-secondary)', marginRight: '8px' }}>Q:</span>{fb.question}
                      </p>
                      <span style={{
                        background: fb.score > 7 ? 'rgba(16,185,129,0.2)' : fb.score > 4 ? 'rgba(251,191,36,0.2)' : 'rgba(244,63,94,0.2)',
                        color: fb.score > 7 ? 'var(--success-color)' : fb.score > 4 ? '#fbbf24' : 'var(--danger-color)',
                        padding: '4px 14px', borderRadius: '20px', fontSize: '0.9rem', fontWeight: '700', whiteSpace: 'nowrap'
                      }}>{fb.score}/10</span>
                    </div>
                    <p style={{ color: '#d1d5db', margin: '0 0 10px', fontStyle: 'italic', fontSize: '0.9rem' }}>
                      <span style={{ color: 'var(--text-secondary)', fontStyle: 'normal' }}>Your answer: </span>{answers[i] || '(no answer)'}
                    </p>
                    <div style={{ background: 'rgba(59,130,246,0.08)', padding: '12px 16px', borderRadius: '8px', borderLeft: '2px solid var(--accent-color)', color: '#e5e7eb', fontSize: '0.95rem' }}>
                      <AlertTriangle size={14} style={{ verticalAlign: 'text-bottom', marginRight: '8px' }} color="var(--accent-color)" />
                      {fb.feedback}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Improvements */}
          {qaReport.improvements?.length > 0 && (
            <div className="glass-panel" style={{ padding: '28px', marginBottom: '24px', borderLeft: '4px solid #a855f7' }}>
              <h3 className="outfit-font" style={{ marginBottom: '16px', color: '#a855f7', display: 'flex', alignItems: 'center', gap: '10px', fontSize: '1.2rem' }}>
                <Rocket size={22} /> 🚀 What to Improve
              </h3>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {qaReport.improvements.map((imp, i) => (
                  <li key={i} style={{ display: 'flex', gap: '10px', color: '#e9d5ff', lineHeight: '1.6', background: 'rgba(168,85,247,0.08)', padding: '12px 16px', borderRadius: '10px' }}>
                    <Zap size={14} color="#a855f7" style={{ marginTop: '5px', flexShrink: 0 }} /> {imp}
                  </li>
                ))}
              </ul>
            </div>
          )}

          <button onClick={() => {
            setStep('role'); setFile(null); setResumeReport(null);
            setQaReport(null); setQuestions([]); setAnswers({});
            setCandidateInfo({ name: '', email: '', phone: '', linkedin: '' });
            setCandidateId(null);
          }} className="btn btn-secondary" style={{ width: '100%', padding: '16px', fontSize: '1.05rem' }}>
            Start New Application
          </button>
        </div>
      )}
    </div>
  );
}
