import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Users, Target, BriefcaseBusiness, RefreshCw, Mail, Phone, Trash2, 
  Search, Filter, BarChart3, PieChart as PieIcon, TrendingUp, 
  ArrowRight, ShieldCheck, Zap, AlertTriangle, ChevronRight, X, 
  PlusCircle, Loader2, CheckCircle, AlertCircle, GitCompare, Inbox,
  Calendar, Award, Brain, FileText, CheckCheck, Link as LinkIcon, Activity, List
} from 'lucide-react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  PieChart, Pie, Cell, FunnelChart, Funnel, LabelList, LineChart, Line, Legend
} from 'recharts';

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

// â”€â”€ Skeleton card â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function SkeletonCard() {
  return (
    <div style={{ padding: '20px', borderRadius: '16px', background: 'rgba(255,255,255,0.03)', border: '1px solid transparent' }}>
      <div style={{ display: 'flex', gap: '12px', marginBottom: '16px', alignItems: 'center' }}>
        <div className="skeleton" style={{ width: 48, height: 48, borderRadius: 12 }} />
        <div style={{ flex: 1 }}>
          <div className="skeleton" style={{ height: 14, width: '60%', marginBottom: 8 }} />
          <div className="skeleton" style={{ height: 12, width: '40%' }} />
        </div>
      </div>
      <div className="skeleton" style={{ height: 10, width: '100%', marginBottom: 8 }} />
      <div className="skeleton" style={{ height: 10, width: '80%' }} />
    </div>
  );
}

// â”€â”€ Candidate Detail Drawer Component â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// ── Toast Notification Container ─────────────────────────────────────────────
function ToastContainer({ toasts }) {
  return (
    <div className="toast-container">
      {toasts.map(t => (
        <div key={t.id} className={`toast toast-${t.type}`}>
          {t.type === 'success' && <CheckCircle size={18} />}
          {t.type === 'error'   && <AlertCircle size={18} />}
          {t.type === 'info'    && <Activity size={18} />}
          <span>{t.message}</span>
        </div>
      ))}
    </div>
  );
}

// ── Confirmation Modal ──────────────────────────────────────────────────────
function ConfirmModal({ open, title, message, onConfirm, onCancel, loading }) {
  if (!open) return null;
  return (
    <div className="modal-backdrop" onClick={!loading ? onCancel : undefined}>
      <div className="modal-box" onClick={e => e.stopPropagation()}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '20px' }}>
          <div style={{ width: 48, height: 48, borderRadius: '50%', background: 'rgba(244,63,94,0.12)', border: '1px solid rgba(244,63,94,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <AlertTriangle size={22} color="#f43f5e" />
          </div>
          <h3 className="outfit-font" style={{ fontSize: '1.3rem', margin: 0, color: 'white' }}>{title}</h3>
        </div>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', lineHeight: '1.65', marginBottom: '28px' }}>{message}</p>
        <div style={{ display: 'flex', gap: '12px' }}>
          <button onClick={onCancel} className="btn btn-secondary" style={{ flex: 1, padding: '12px' }} disabled={loading}>
            Cancel
          </button>
          <button onClick={onConfirm} className="btn btn-danger" style={{ flex: 1, padding: '12px' }} disabled={loading}>
            {loading
              ? <><Loader2 size={16} className="lucide-spin" style={{ marginRight: 6 }} /> Deleting…</>
              : <><Trash2 size={16} style={{ marginRight: 6 }} /> Confirm Delete</>
            }
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Candidate Detail Drawer Component ──────────────────────────────────────────
function CandidateDetailDrawer({ candidateId, onClose, onDelete }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (candidateId) {
      fetchDetails();
    }
  }, [candidateId]);

  const fetchDetails = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await axios.get(`http://localhost:5000/api/dashboard/candidate/${candidateId}`);
      setData(res.data.data || null);
    } catch (err) {
      setError("Failed to load candidate details. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Backdrop */}
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.5 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: '#000', zIndex: 1050, cursor: 'pointer'
        }}
      />
      {/* Drawer Panel */}
      <motion.div 
        initial={{ x: '100%' }}
        animate={{ x: 0 }}
        exit={{ x: '100%' }}
        transition={{ type: 'spring', damping: 25, stiffness: 220 }}
        style={{
          position: 'fixed', top: 0, right: 0, bottom: 0,
          width: 'min(640px, 95vw)', background: '#0a0f1d',
          borderLeft: '1px solid var(--border-strong)', zIndex: 1100,
          boxShadow: '-10px 0 40px rgba(0,0,0,0.6)', display: 'flex',
          flexDirection: 'column', color: '#fff'
        }}
      >
        {/* Header */}
        <div style={{ padding: '24px', borderBottom: '1px solid var(--border-subtle)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h2 className="outfit-font" style={{ margin: 0, fontSize: '1.6rem', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Users color="var(--accent-color)" size={24} /> Candidate Profile
            </h2>
            <p style={{ margin: '4px 0 0', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Detailed recruiter audit log</p>
          </div>
          <button onClick={onClose} style={{ background: 'rgba(255,255,255,0.05)', border: 'none', color: '#fff', borderRadius: '50%', padding: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
            <X size={20} />
          </button>
        </div>

        {/* Scrollable Content */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '24px' }}>
          {loading ? (
            <div style={{ textAlign: 'center', padding: '80px 0' }}>
              <Loader2 size={40} className="lucide-spin" style={{ color: 'var(--accent-color)', margin: '0 auto 16px' }} />
              <p style={{ color: 'var(--text-secondary)' }}>Retrieving intelligence record...</p>
            </div>
          ) : error ? (
            <div className="error-banner" style={{ margin: '20px 0' }}>
              <AlertCircle size={18} />
              <span>{error}</span>
              <button onClick={fetchDetails} className="btn btn-secondary" style={{ padding: '6px 12px', fontSize: '0.8rem', marginLeft: 'auto' }}>Retry</button>
            </div>
          ) : !data ? (
            <p style={{ color: 'var(--text-secondary)', textAlign: 'center' }}>No profile record found.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
              
              {/* Profile Card Summary */}
              <div style={{ padding: '24px', background: 'rgba(255,255,255,0.02)', borderRadius: '16px', border: '1px solid var(--border-subtle)' }}>
                <div style={{ display: 'flex', gap: '16px', alignItems: 'center', marginBottom: '20px' }}>
                  <div style={{ width: '56px', height: '56px', borderRadius: '14px', background: 'linear-gradient(135deg, var(--accent-color), #8b5cf6)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.4rem', fontWeight: 'bold' }}>
                    {data.name?.[0]?.toUpperCase() || '?'}
                  </div>
                  <div>
                    <h3 style={{ margin: 0, fontSize: '1.4rem', fontWeight: '700' }}>{data.name || 'Unknown Candidate'}</h3>
                    <p style={{ margin: '2px 0 0', color: 'var(--accent-color)', fontWeight: '600', fontSize: '0.9rem' }}>{data.role || 'â€”'}</p>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><Mail size={16} /> {data.email}</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><Phone size={16} /> {data.phone || 'No phone provided'}</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><Calendar size={16} /> Applied: {data.createdAt ? new Date(data.createdAt).toLocaleDateString() : 'â€”'}</div>
                  {data.linkedin && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <LinkIcon size={16} /> <a href={data.linkedin} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--accent-color)', textDecoration: 'none' }}>LinkedIn Profile</a>
                    </div>
                  )}
                </div>
              </div>

              {/* Evaluation Scores Summary */}
              <div>
                <h4 className="outfit-font" style={{ fontSize: '1.1rem', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Award size={18} color="var(--accent-color)" /> Assessment Scores
                </h4>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }}>
                  <div style={{ padding: '16px', background: 'rgba(59,130,246,0.06)', border: '1px solid rgba(59,130,246,0.1)', borderRadius: '12px', textAlign: 'center' }}>
                    <p style={{ margin: '0 0 6px', fontSize: '0.75rem', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>ATS Score</p>
                    <p style={{ margin: 0, fontSize: '1.6rem', fontWeight: '800', color: 'var(--accent-color)' }}>{data.atsScore ?? 'â€”'}/100</p>
                    {data.atsDecision && (
                      <span style={{ display: 'inline-block', marginTop: '6px', fontSize: '0.65rem', fontWeight: '700', padding: '2px 8px', borderRadius: '4px', background: data.atsDecision === 'Selected' ? 'rgba(16,185,129,0.15)' : data.atsDecision === 'Borderline' ? 'rgba(251,191,36,0.15)' : 'rgba(244,63,94,0.15)', color: data.atsDecision === 'Selected' ? '#10b981' : data.atsDecision === 'Borderline' ? '#fbbf24' : '#ef4444' }}>
                        {data.atsDecision}
                      </span>
                    )}
                  </div>
                  <div style={{ padding: '16px', background: 'rgba(139,92,246,0.06)', border: '1px solid rgba(139,92,246,0.1)', borderRadius: '12px', textAlign: 'center' }}>
                    <p style={{ margin: '0 0 6px', fontSize: '0.75rem', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Semantic Match</p>
                    <p style={{ margin: 0, fontSize: '1.6rem', fontWeight: '800', color: '#a78bfa' }}>{Math.round(data.semanticScore || 0)}%</p>
                    <span style={{ display: 'inline-block', marginTop: '6px', fontSize: '0.65rem', color: 'var(--text-secondary)' }}>Embedding Similarity</span>
                  </div>
                  <div style={{ padding: '16px', background: 'rgba(16,185,129,0.06)', border: '1px solid rgba(16,185,129,0.1)', borderRadius: '12px', textAlign: 'center' }}>
                    <p style={{ margin: '0 0 6px', fontSize: '0.75rem', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Fairness Bias</p>
                    <p style={{ margin: 0, fontSize: '1.6rem', fontWeight: '800', color: '#10b981' }}>{data.fairnessScore != null ? Number(data.fairnessScore).toFixed(2) : '1.00'}</p>
                    <span style={{ display: 'inline-block', marginTop: '6px', fontSize: '0.65rem', color: 'var(--text-secondary)' }}>Guard Index</span>
                  </div>
                </div>
              </div>

              {/* Skills and Gap Analysis */}
              <div style={{ padding: '20px', background: 'rgba(0,0,0,0.2)', borderRadius: '16px', border: '1px solid var(--border-subtle)' }}>
                <h4 className="outfit-font" style={{ fontSize: '1.1rem', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Brain size={18} color="#10b981" /> Skill Matrix Gap Analysis
                </h4>
                
                <p style={{ margin: '0 0 14px', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                  Experience Tier detected: <strong style={{ color: 'white' }}>{data.skillGap?.experienceLevel || data.evaluation?.experienceLevel || 'Intermediate'}</strong>
                </p>

                <div style={{ marginBottom: '16px' }}>
                  <p style={{ margin: '0 0 8px', fontSize: '0.8rem', color: '#10b981', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Matched Skills</p>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                    {data.skillGap?.matchedSkills?.length > 0 ? (
                      data.skillGap.matchedSkills.map((s, idx) => (
                        <span key={idx} style={{ padding: '4px 10px', borderRadius: '6px', background: 'rgba(16,185,129,0.1)', color: '#10b981', fontSize: '0.75rem', border: '1px solid rgba(16,185,129,0.2)' }}>{s}</span>
                      ))
                    ) : (
                      <span style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.25)' }}>None detected</span>
                    )}
                  </div>
                </div>

                <div style={{ marginBottom: '16px' }}>
                  <p style={{ margin: '0 0 8px', fontSize: '0.8rem', color: '#ef4444', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Missing Skills</p>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                    {data.skillGap?.missingSkills?.length > 0 ? (
                      data.skillGap.missingSkills.map((s, idx) => (
                        <span key={idx} style={{ padding: '4px 10px', borderRadius: '6px', background: 'rgba(239,68,68,0.1)', color: '#ef4444', fontSize: '0.75rem', border: '1px solid rgba(239,68,68,0.2)' }}>{s}</span>
                      ))
                    ) : (
                      <span style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.25)' }}>No matching gaps</span>
                    )}
                  </div>
                </div>

                {data.skillGap?.recommendations?.length > 0 && (
                  <div style={{ marginTop: '16px', paddingTop: '16px', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                    <p style={{ margin: '0 0 8px', fontSize: '0.8rem', color: 'var(--accent-color)', fontWeight: '600', textTransform: 'uppercase' }}>Hiring Recommendations</p>
                    <ul style={{ paddingLeft: '16px', margin: 0, fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: '1.6' }}>
                      {data.skillGap.recommendations.map((r, idx) => <li key={idx} style={{ marginBottom: '6px' }}>{r}</li>)}
                    </ul>
                  </div>
                )}
              </div>

              {/* Technical Interview Transcript */}
              {data.interview ? (
                <div>
                  <h4 className="outfit-font" style={{ fontSize: '1.1rem', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Brain size={18} color="#f59e0b" /> Technical Assessment Feedback
                  </h4>

                  <div style={{ padding: '20px', background: 'rgba(245,158,11,0.04)', border: '1px solid rgba(245,158,11,0.15)', borderRadius: '16px', marginBottom: '20px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                      <div>
                        <p style={{ margin: 0, fontSize: '0.75rem', color: '#fbbf24', textTransform: 'uppercase', fontWeight: 'bold' }}>Recommendation</p>
                        <p style={{ margin: 0, fontSize: '1.3rem', fontWeight: '900', color: data.interview.overallRecommendation === 'Proceed' ? '#10b981' : data.interview.overallRecommendation === 'Hold' ? '#fbbf24' : '#ef4444' }}>
                          {data.interview.overallRecommendation || 'Hold'}
                        </p>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Tech accuracy</p>
                        <p style={{ margin: 0, fontSize: '1.3rem', fontWeight: '900' }}>{data.interview.scores?.technicalScore ?? 'â€”'}/10</p>
                      </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px', fontSize: '0.8rem', textAlign: 'center', paddingTop: '12px', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                      <div>
                        <span style={{ color: 'var(--text-secondary)' }}>Comm</span>
                        <p style={{ margin: '4px 0 0', fontWeight: 'bold' }}>{data.interview.scores?.communicationScore ?? 'â€”'}/10</p>
                      </div>
                      <div>
                        <span style={{ color: 'var(--text-secondary)' }}>Problem Solv</span>
                        <p style={{ margin: '4px 0 0', fontWeight: 'bold' }}>{data.interview.scores?.problemSolvingScore ?? 'â€”'}/10</p>
                      </div>
                      <div>
                        <span style={{ color: 'var(--text-secondary)' }}>Depth</span>
                        <p style={{ margin: '4px 0 0', fontWeight: 'bold' }}>{data.interview.scores?.depth ?? 'â€”'}/10</p>
                      </div>
                      <div>
                        <span style={{ color: 'var(--text-secondary)' }}>Confidence</span>
                        <p style={{ margin: '4px 0 0', fontWeight: 'bold' }}>{data.interview.scores?.confidence ?? 'â€”'}/10</p>
                      </div>
                    </div>
                  </div>

                  {/* Feedback Blocks */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '24px' }}>
                    {[
                      { label: "Technical Capabilities", text: data.interview.feedback?.technical },
                      { label: "Communication Skills", text: data.interview.feedback?.communication },
                      { label: "Problem Solving & Logic", text: data.interview.feedback?.problemSolving },
                      { label: "General Comments", text: data.interview.feedback?.general }
                    ].map((f, i) => f.text && (
                      <div key={i} style={{ padding: '14px 18px', background: 'rgba(255,255,255,0.02)', borderRadius: '12px', border: '1px solid var(--border-subtle)', fontSize: '0.85rem' }}>
                        <p style={{ margin: '0 0 6px', fontWeight: 'bold', color: 'rgba(255,255,255,0.8)' }}>{f.label}</p>
                        <p style={{ margin: 0, color: 'var(--text-secondary)', lineHeight: '1.6' }}>{f.text}</p>
                      </div>
                    ))}
                  </div>

                  {/* Q&A logs */}
                  {data.evaluation?.detailedFeedback?.length > 0 && (
                    <div>
                      <h5 style={{ fontSize: '0.95rem', fontWeight: 'bold', marginBottom: '12px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Detailed Q&A evaluation</h5>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                        {data.evaluation.detailedFeedback.map((fb, idx) => (
                          <div key={idx} style={{ padding: '16px', background: 'rgba(0,0,0,0.3)', borderRadius: '12px', border: '1px solid var(--border-subtle)' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                              <span style={{ fontSize: '0.8rem', color: 'var(--accent-color)', fontWeight: 'bold' }}>QUESTION {idx + 1}</span>
                              <span style={{ fontSize: '0.8rem', fontWeight: 'bold', background: fb.score >= 7 ? 'rgba(16,185,129,0.15)' : fb.score >= 4 ? 'rgba(251,191,36,0.15)' : 'rgba(244,63,94,0.15)', color: fb.score >= 7 ? '#10b981' : fb.score >= 4 ? '#fbbf24' : '#ef4444', padding: '2px 8px', borderRadius: '4px' }}>
                                Score: {fb.score}/10
                              </span>
                            </div>
                            <p style={{ margin: '0 0 10px', fontSize: '0.9rem', color: '#fff', fontWeight: '600' }}>{fb.question}</p>
                            
                            <div style={{ padding: '10px 14px', background: 'rgba(255,255,255,0.01)', borderLeft: '3px solid rgba(255,255,255,0.15)', borderRadius: '0 8px 8px 0', marginBottom: '10px', fontSize: '0.85rem' }}>
                              <p style={{ margin: '0 0 4px', color: 'var(--text-secondary)', fontSize: '0.75rem', textTransform: 'uppercase' }}>Candidate Answer</p>
                              <p style={{ margin: 0, color: '#e2e8f0', fontStyle: 'italic' }}>"{data.answers?.[idx] || 'No response provided.'}"</p>
                            </div>

                            <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: '1.5' }}>
                              <strong style={{ color: 'rgba(255,255,255,0.8)' }}>AI Feedback:</strong> {fb.feedback || 'No detailed feedback provided.'}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                </div>
              ) : (
                <div style={{ padding: '24px', background: 'rgba(255,255,255,0.01)', border: '1px dashed var(--border-strong)', borderRadius: '16px', textAlign: 'center', color: 'var(--text-secondary)' }}>
                  <Brain size={32} style={{ opacity: 0.3, marginBottom: '8px' }} />
                  <p style={{ margin: 0, fontSize: '0.9rem' }}>Technical Interview assessment not completed yet.</p>
                </div>
              )}

            </div>
          )}
        </div>

        {/* ── Delete footer ── */}
        {!loading && !error && data && (
          <div style={{ padding: '16px 24px', borderTop: '1px solid var(--border-subtle)', flexShrink: 0 }}>
            <button
              onClick={() => onDelete && onDelete(candidateId, data.name)}
              className="btn btn-danger"
              style={{ width: '100%', padding: '12px', fontSize: '0.88rem', borderRadius: '12px' }}
            >
              <Trash2 size={16} /> Delete Candidate Permanently
            </button>
          </div>
        )}
      </motion.div>
    </>
  );
}

// â”€â”€ Main Recruiter Dashboard Component â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
export default function HRDashboard() {
  const [candidates, setCandidates] = useState([]);
  const [intelligence, setIntelligence] = useState(null);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState(null);
  const [activeTab, setActiveTab] = useState('candidates');
  const [searchQuery, setSearchQuery] = useState('');

  // Details drawer state
  const [selectedDetailCandidateId, setSelectedDetailCandidateId] = useState(null);

  // Compare Tab states (Greenhouse/Ashby wizard flow)
  const [roles, setRoles] = useState([]);
  const [rolesLoading, setRolesLoading] = useState(false);
  const [selectedRoleForCompare, setSelectedRoleForCompare] = useState('');
  const [compareCandidatesList, setCompareCandidatesList] = useState([]);
  const [selectedCompareCandidates, setSelectedCompareCandidates] = useState([]);
  const [compareListLoading, setCompareListLoading] = useState(false);
  const [compareListError, setCompareListError] = useState(null);

  const [comparisonResult, setComparisonResult] = useState(null);
  const [comparing, setComparing] = useState(false);
  const [compareError, setCompareError] = useState(null);

  // Create Role state
  const [roleForm, setRoleForm] = useState({ title: '', description: '' });
  const [roleCreating, setRoleCreating] = useState(false);
  const [roleResult, setRoleResult] = useState(null);
  const [roleError, setRoleError] = useState(null);

  // Toast + Confirm Modal
  const [toasts, setToasts] = useState([]);
  const [confirmModal, setConfirmModal] = useState({ open: false, title: '', message: '', onConfirm: null, loading: false });

  useEffect(() => {
    fetchData();
    fetchRoles();
  }, []);

  useEffect(() => {
    if (selectedRoleForCompare) {
      fetchCandidatesForRole(selectedRoleForCompare);
    } else {
      setCompareCandidatesList([]);
      setSelectedCompareCandidates([]);
    }
  }, [selectedRoleForCompare]);

  const fetchData = async () => {
    setLoading(true);
    setFetchError(null);
    try {
      const [candRes, intelRes] = await Promise.allSettled([
        axios.get('http://localhost:5000/api/dashboard/candidates'),
        axios.get('http://localhost:5000/api/dashboard/recruiter-intelligence')
      ]);

      if (candRes.status === 'fulfilled') {
        setCandidates(candRes.value.data.data || []);
      } else {
        setFetchError('Failed to load candidates. Is the backend running?');
        setCandidates([]);
      }

      if (intelRes.status === 'fulfilled') {
        setIntelligence(intelRes.value.data || null);
      } else {
        setIntelligence(null);
      }
    } catch (error) {
      setFetchError('Network error: Could not reach the backend server.');
    } finally {
      setLoading(false);
    }
  };

  const fetchRoles = async () => {
    setRolesLoading(true);
    try {
      const res = await axios.get('http://localhost:5000/api/roles');
      setRoles(res.data.data || []);
    } catch (err) {
      console.error("Failed to load roles list", err);
    } finally {
      setRolesLoading(false);
    }
  };

  const fetchCandidatesForRole = async (roleName) => {
    setCompareListLoading(true);
    setCompareListError(null);
    setSelectedCompareCandidates([]);
    try {
      const res = await axios.get(`http://localhost:5000/api/dashboard/candidates/by-role?role=${encodeURIComponent(roleName)}`);
      setCompareCandidatesList(res.data.data || []);
    } catch (err) {
      setCompareListError("Failed to fetch candidates for this role. Is the backend running?");
    } finally {
      setCompareListLoading(false);
    }
  };

  const handleCompare = async () => {
    if (selectedCompareCandidates.length !== 2) return;
    setComparing(true);
    setCompareError(null);
    setComparisonResult(null);
    try {
      const res = await axios.post('http://localhost:5000/api/candidates/compare', {
        candidateIds: selectedCompareCandidates,
        roleTitle: selectedRoleForCompare
      });
      setComparisonResult(res.data.data);
    } catch (error) {
      const msg = error.response?.data?.message || error.message || 'Comparison failed';
      setCompareError(msg);
    } finally {
      setComparing(false);
    }
  };

  const handleCreateRole = async (e) => {
    e.preventDefault();
    if (!roleForm.title.trim()) return setRoleError('Role title is required.');
    setRoleCreating(true);
    setRoleError(null);
    setRoleResult(null);
    try {
      const res = await axios.post('http://localhost:5000/api/roles', {
        title: roleForm.title.trim(),
        description: roleForm.description.trim()
      }, { timeout: 90000 });
      setRoleResult(res.data.data);
      setRoleForm({ title: '', description: '' });
      fetchRoles(); // Refresh roles drop-down list
    } catch (err) {
      if (err.code === 'ECONNABORTED') {
        setRoleError('Request timed out. The AI model may still be loading. Try again in a moment.');
      } else {
        setRoleError(err.response?.data?.error || 'Failed to create role. Please try again.');
      }
    } finally {
      setRoleCreating(false);
    }
  };

  // ── Toast helpers ────────────────────────────────────────────────────────
  const showToast = (message, type = 'success') => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 3500);
  };

  const openConfirm = ({ title, message, onConfirm }) =>
    setConfirmModal({ open: true, title, message, onConfirm, loading: false });

  const closeConfirm = () =>
    setConfirmModal({ open: false, title: '', message: '', onConfirm: null, loading: false });

  // ── Candidate Deletion ────────────────────────────────────────────────────
  const handleDeleteCandidate = (id, name) => {
    openConfirm({
      title: 'Delete Candidate',
      message: `Are you sure you want to permanently delete "${name}"? This will also remove all associated evaluation and interview records. This cannot be undone.`,
      onConfirm: async () => {
        setConfirmModal(prev => ({ ...prev, loading: true }));
        try {
          await axios.delete(`http://localhost:5000/api/dashboard/candidate/${id}`);
          setCandidates(prev => prev.filter(c => c._id !== id));
          setSelectedDetailCandidateId(null);
          showToast(`"${name}" deleted successfully.`, 'success');
          closeConfirm();
          fetchData();
        } catch (err) {
          showToast(err.response?.data?.message || 'Failed to delete candidate.', 'error');
          setConfirmModal(prev => ({ ...prev, loading: false }));
        }
      }
    });
  };

  const handleDeleteAllCandidates = () => {
    openConfirm({
      title: 'Delete All Candidates',
      message: 'This will permanently delete ALL candidates and every associated evaluation. This action cannot be undone.',
      onConfirm: async () => {
        setConfirmModal(prev => ({ ...prev, loading: true }));
        try {
          await axios.delete('http://localhost:5000/api/dashboard/candidates');
          setCandidates([]);
          setIntelligence(null);
          showToast('All candidates deleted successfully.', 'success');
          closeConfirm();
        } catch (err) {
          showToast(err.response?.data?.message || 'Failed to delete all candidates.', 'error');
          setConfirmModal(prev => ({ ...prev, loading: false }));
        }
      }
    });
  };

  // ── Role Deletion ─────────────────────────────────────────────────────────
  const handleDeleteRole = (roleId, roleTitle) => {
    openConfirm({
      title: 'Delete Role',
      message: `Are you sure you want to delete the "${roleTitle}" role? Candidates who applied for this role will not be affected.`,
      onConfirm: async () => {
        setConfirmModal(prev => ({ ...prev, loading: true }));
        try {
          await axios.delete(`http://localhost:5000/api/roles/id/${roleId}`);
          setRoles(prev => prev.filter(r => r._id !== roleId));
          showToast(`"${roleTitle}" role deleted.`, 'success');
          closeConfirm();
        } catch (err) {
          showToast(err.response?.data?.message || 'Failed to delete role.', 'error');
          setConfirmModal(prev => ({ ...prev, loading: false }));
        }
      }
    });
  };

  const handleDeleteAllRoles = () => {
    openConfirm({
      title: 'Delete All Roles',
      message: 'This will permanently delete ALL job roles. Candidates will not be affected. This action cannot be undone.',
      onConfirm: async () => {
        setConfirmModal(prev => ({ ...prev, loading: true }));
        try {
          await axios.delete('http://localhost:5000/api/roles');
          setRoles([]);
          showToast('All roles deleted successfully.', 'success');
          closeConfirm();
        } catch (err) {
          showToast(err.response?.data?.message || 'Failed to delete all roles.', 'error');
          setConfirmModal(prev => ({ ...prev, loading: false }));
        }
      }
    });
  };

  const toggleCompareCandidateSelection = (id) => {
    setSelectedCompareCandidates(prev => 
      prev.includes(id) ? prev.filter(item => item !== id) : 
      prev.length < 2 ? [...prev, id] : [prev[1], id]
    );
  };

  const filteredCandidates = candidates.filter(c => 
    c.name?.toLowerCase().includes(searchQuery.toLowerCase()) || 
    c.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.role?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <motion.div 
      initial={{ opacity: 0 }} 
      animate={{ opacity: 1 }}
      style={{ maxWidth: '1400px', margin: '0 auto', width: '100%', padding: '20px' }}
    >
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '32px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 className="outfit-font" style={{ fontSize: '3rem', marginBottom: '8px', background: 'linear-gradient(to right, #fff, #94a3b8)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            Hiring Intelligence
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '1.1rem' }}>
            AI-powered recruiter copilot and deep candidate analytics.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
          {[
            { key: 'candidates', label: <><Users size={16} style={{ marginRight: 6 }} />Candidates</> },
            { key: 'analytics', label: <><BarChart3 size={16} style={{ marginRight: 6 }} />Analytics</> },
            { key: 'comparison', label: <><GitCompare size={16} style={{ marginRight: 6 }} />Compare</> },
            { key: 'createRole', label: <><PlusCircle size={16} style={{ marginRight: 6 }} />Create Role</> }
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => {
                setActiveTab(tab.key);
                if (tab.key === 'comparison' && !comparisonResult) {
                  // Keep states, but don't reset completely unless recruiter hits start over
                }
              }}
              className={`btn ${activeTab === tab.key ? 'btn-primary' : 'btn-secondary'}`}
              style={{ padding: '10px 18px', borderRadius: '12px', fontSize: '0.9rem' }}
            >
              {tab.label}
            </button>
          ))}
          <button 
            onClick={() => { fetchData(); fetchRoles(); }}
            className="btn btn-secondary"
            style={{ padding: '10px', borderRadius: '12px' }}
            title="Refresh data"
            disabled={loading}
          >
            <RefreshCw size={18} className={loading ? 'lucide-spin' : ''} />
          </button>
        </div>
      </div>

      {/* Global fetch error banner */}
      {fetchError && (
        <div className="error-banner" style={{ marginBottom: '24px' }}>
          <AlertCircle size={20} />
          <span>{fetchError}</span>
          <button onClick={() => { fetchData(); fetchRoles(); }} style={{ marginLeft: 'auto', background: 'none', border: '1px solid rgba(244,63,94,0.4)', borderRadius: '8px', color: '#fca5a5', padding: '6px 14px', cursor: 'pointer', fontSize: '0.85rem' }}>
            Retry
          </button>
        </div>
      )}

      <AnimatePresence mode="wait">
        {/* â”€â”€ CANDIDATES TAB â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
        {activeTab === 'candidates' && (
          <motion.div 
            key="candidates-tab"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
          >
            {/* Stats Overview */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px', marginBottom: '32px' }}>
              {[
                { label: 'Total Pipeline', value: loading ? 'â€”' : candidates.length, sub: 'All candidates', icon: <Users color="#3b82f6" /> },
                { label: 'High Match', value: loading ? 'â€”' : candidates.filter(c => (c.semanticScore || 0) > 75).length, sub: 'Semantic Score > 75%', icon: <Zap color="#f59e0b" /> },
                { label: 'ATS Cleared', value: loading ? 'â€”' : candidates.filter(c => c.atsDecision === 'Selected').length, sub: 'Passed screening', icon: <TrendingUp color="#10b981" /> },
                { label: 'Avg Semantic', value: loading ? 'â€”' : candidates.length > 0 ? `${Math.round(candidates.reduce((a, c) => a + (c.semanticScore || 0), 0) / candidates.length)}%` : 'â€”', sub: 'Role alignment', icon: <Target color="#8b5cf6" /> },
              ].map((stat, i) => (
                <div key={i} className="glass-panel" style={{ padding: '24px', display: 'flex', alignItems: 'center', gap: '16px' }}>
                  <div style={{ padding: '12px', background: 'rgba(255,255,255,0.05)', borderRadius: '12px', flexShrink: 0 }}>{stat.icon}</div>
                  <div>
                    <h3 style={{ margin: 0, fontSize: '1.8rem' }}>{stat.value}</h3>
                    <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '0.85rem' }}>{stat.label}</p>
                    <p style={{ margin: '4px 0 0', color: 'rgba(255,255,255,0.4)', fontSize: '0.7rem' }}>{stat.sub}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="glass-panel" style={{ padding: '24px' }}>
              {/* Toolbar */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '12px' }}>
                <div style={{ position: 'relative', flex: 1, maxWidth: '400px' }}>
                  <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
                  <input 
                    type="text" 
                    placeholder="Search by name, email, or role..."
                    className="input-base"
                    style={{ paddingLeft: '40px', background: 'rgba(0,0,0,0.2)', padding: '10px 12px 10px 40px' }}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
                  <span style={{ color: 'var(--text-secondary)', fontSize: '0.88rem' }}>
                    {filteredCandidates.length} of {candidates.length} candidate{candidates.length !== 1 ? 's' : ''}
                  </span>
                  {candidates.length > 0 && (
                    <button
                      onClick={handleDeleteAllCandidates}
                      className="btn btn-danger"
                      style={{ padding: '8px 16px', fontSize: '0.82rem', borderRadius: '10px' }}
                    >
                      <Trash2 size={14} /> Delete All
                    </button>
                  )}
                </div>
              </div>

              {/* Candidate Grid */}
              {loading ? (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '16px' }}>
                  {[1,2,3,4].map(i => <SkeletonCard key={i} />)}
                </div>
              ) : filteredCandidates.length === 0 ? (
                <div className="empty-state">
                  <Inbox size={56} />
                  <h3 className="outfit-font" style={{ fontSize: '1.4rem', marginBottom: '8px', color: 'white' }}>
                    {searchQuery ? 'No candidates match your search' : 'No candidates yet'}
                  </h3>
                  <p style={{ fontSize: '0.95rem' }}>
                    {searchQuery ? `Try a different search term.` : 'Candidates will appear here once they complete the application portal.'}
                  </p>
                  {searchQuery && (
                    <button onClick={() => setSearchQuery('')} className="btn btn-secondary" style={{ marginTop: '16px', padding: '10px 20px' }}>
                      Clear Search
                    </button>
                  )}
                </div>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '16px' }}>
                  {filteredCandidates.map((candidate) => {
                    const decisionColor = candidate.atsDecision === 'Selected' ? '#10b981' : candidate.atsDecision === 'Borderline' ? '#fbbf24' : '#f43f5e';
                    return (
                      <motion.div 
                        key={candidate._id}
                        layout
                        whileHover={{ y: -4 }}
                        onClick={() => setSelectedDetailCandidateId(candidate._id)}
                        style={{ 
                          padding: '20px', 
                          borderRadius: '16px', 
                          background: 'rgba(255,255,255,0.03)', 
                          border: '2px solid rgba(255,255,255,0.05)',
                          cursor: 'pointer',
                          transition: 'all 0.2s ease',
                          position: 'relative'
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                          <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                            <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: 'linear-gradient(135deg, var(--accent-color), #8b5cf6)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.1rem', fontWeight: 'bold', flexShrink: 0 }}>
                              {candidate.name?.[0]?.toUpperCase() || '?'}
                            </div>
                            <div>
                              <h4 style={{ margin: 0, fontSize: '1rem', fontWeight: 700 }}>{candidate.name || 'Unknown'}</h4>
                              <p style={{ margin: '2px 0 0', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{candidate.role || 'â€”'}</p>
                            </div>
                          </div>
                          <div style={{ textAlign: 'right' }}>
                            <p style={{ margin: 0, fontSize: '1.3rem', fontWeight: '900', color: 'var(--accent-color)' }}>
                              {Math.round(candidate.semanticScore || 0)}%
                            </p>
                            <p style={{ margin: 0, fontSize: '0.65rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Semantic</p>
                          </div>
                        </div>

                        {/* Skill tags */}
                        <div style={{ marginBottom: '14px' }}>
                          <div style={{ display: 'flex', gap: '6px', marginBottom: '6px', flexWrap: 'wrap', alignItems: 'center' }}>
                            <span style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', minWidth: 50 }}>Matched:</span>
                            {candidate.skillGap?.matchedSkills?.slice(0, 3).map((skill, i) => (
                              <span key={i} style={{ padding: '2px 8px', borderRadius: '4px', background: 'rgba(16,185,129,0.1)', color: '#10b981', fontSize: '0.7rem', border: '1px solid rgba(16,185,129,0.2)' }}>{skill}</span>
                            ))}
                            {(candidate.skillGap?.matchedSkills?.length || 0) > 3 && (
                              <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>+{candidate.skillGap.matchedSkills.length - 3}</span>
                            )}
                            {(!candidate.skillGap?.matchedSkills?.length) && (
                              <span style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.25)' }}>None</span>
                            )}
                          </div>
                          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', alignItems: 'center' }}>
                            <span style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', minWidth: 50 }}>Missing:</span>
                            {candidate.skillGap?.missingSkills?.slice(0, 3).map((skill, i) => (
                              <span key={i} style={{ padding: '2px 8px', borderRadius: '4px', background: 'rgba(239,68,68,0.1)', color: '#ef4444', fontSize: '0.7rem', border: '1px solid rgba(239,68,68,0.2)' }}>{skill}</span>
                            ))}
                            {(candidate.skillGap?.missingSkills?.length || 0) > 3 && (
                              <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>+{candidate.skillGap.missingSkills.length - 3}</span>
                            )}
                            {(!candidate.skillGap?.missingSkills?.length) && (
                              <span style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.25)' }}>None</span>
                            )}
                          </div>
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '12px', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                          <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                            {candidate.createdAt ? new Date(candidate.createdAt).toLocaleDateString() : 'â€”'}
                          </span>
                          <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                            {candidate.atsDecision && (
                              <span style={{ fontSize: '0.75rem', fontWeight: 700, color: decisionColor, background: `${decisionColor}18`, padding: '2px 8px', borderRadius: '6px' }}>
                                {candidate.atsDecision}
                              </span>
                            )}
                            <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                              ATS: <strong style={{ color: 'white' }}>{candidate.atsScore ?? 'â€”'}</strong>
                            </span>
                            {candidate.fairnessScore != null && (
                              <span style={{ fontSize: '0.8rem', color: '#10b981', fontWeight: 600 }}>
                                F: {Number(candidate.fairnessScore).toFixed(2)}
                              </span>
                            )}
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              )}
            </div>
          </motion.div>
        )}

                {/* ── ANALYTICS TAB ─────────────────────────────────────────────────── */}
        {activeTab === 'analytics' && intelligence && (
          <motion.div
            key="analytics-tab"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
          >
            {/* ── ROW 1: KPI CARDS ─────────────────────────────────────────── */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '20px', marginBottom: '28px' }}>
              {[
                {
                  label: 'Total Applicants',
                  value: intelligence.funnel?.[0]?.count ?? 0,
                  icon: <Users size={22} color="#3b82f6" />,
                  color: '#3b82f6',
                  bg: 'rgba(59,130,246,0.1)'
                },
                {
                  label: 'ATS Cleared',
                  value: intelligence.funnel?.[1]?.count ?? 0,
                  icon: <CheckCircle size={22} color="#10b981" />,
                  color: '#10b981',
                  bg: 'rgba(16,185,129,0.1)'
                },
                {
                  label: 'Interviewed',
                  value: intelligence.funnel?.[2]?.count ?? 0,
                  icon: <Brain size={22} color="#8b5cf6" />,
                  color: '#8b5cf6',
                  bg: 'rgba(139,92,246,0.1)'
                },
                {
                  label: 'Selected',
                  value: intelligence.funnel?.[3]?.count ?? 0,
                  icon: <Award size={22} color="#f59e0b" />,
                  color: '#f59e0b',
                  bg: 'rgba(245,158,11,0.1)'
                },
                {
                  label: 'Avg Fairness',
                  value: intelligence.diversityMetrics ? intelligence.diversityMetrics.avgFairnessScore.toFixed(1) + '%' : 'N/A',
                  icon: <ShieldCheck size={22} color="#ec4899" />,
                  color: '#ec4899',
                  bg: 'rgba(236,72,153,0.1)'
                }
              ].map((kpi, i) => (
                <div key={i} style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '18px', padding: '22px 20px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <div style={{ width: 44, height: 44, borderRadius: 12, background: kpi.bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {kpi.icon}
                  </div>
                  <div>
                    <div style={{ fontSize: '2rem', fontWeight: '800', color: 'white', lineHeight: 1.1 }}>{kpi.value}</div>
                    <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginTop: '4px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{kpi.label}</div>
                  </div>
                </div>
              ))}
            </div>

            {/* ── ROW 2: Applications Over Time | Recruitment Funnel ────────── */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', marginBottom: '24px' }}>
              <div className="glass-panel" style={{ padding: '28px', height: '360px' }}>
                <h3 className="outfit-font" style={{ marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px', fontSize: '1.05rem' }}>
                  <Activity size={18} color="#3b82f6" /> Applications Over Time
                </h3>
                {intelligence.applicationsOverTime?.length > 0 ? (
                  <ResponsiveContainer width="100%" height="85%">
                    <LineChart data={intelligence.applicationsOverTime} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.07)" />
                      <XAxis dataKey="date" stroke="#64748b" tick={{ fontSize: 11 }} />
                      <YAxis stroke="#64748b" tick={{ fontSize: 11 }} />
                      <Tooltip contentStyle={{ background: '#1e293b', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px', fontSize: '0.85rem' }} />
                      <Line type="monotone" dataKey="count" name="Applications" stroke="#3b82f6" strokeWidth={3} dot={{ r: 4, fill: '#3b82f6' }} activeDot={{ r: 6 }} />
                    </LineChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="empty-state"><Inbox size={32} style={{ opacity: 0.3, marginBottom: 8 }} /><p>No timeline data yet.</p></div>
                )}
              </div>

              <div className="glass-panel" style={{ padding: '28px', height: '360px' }}>
                <h3 className="outfit-font" style={{ marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px', fontSize: '1.05rem' }}>
                  <TrendingUp size={18} color="#10b981" /> Recruitment Funnel
                </h3>
                {intelligence.funnel?.length > 0 ? (
                  <ResponsiveContainer width="100%" height="85%">
                    <FunnelChart>
                      <Tooltip contentStyle={{ background: '#1e293b', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px', fontSize: '0.85rem' }} />
                      <Funnel data={intelligence.funnel} dataKey="count" nameKey="step" isAnimationActive>
                        <LabelList position="right" fill="#94a3b8" stroke="none" dataKey="step" style={{ fontSize: 12 }} />
                        {intelligence.funnel.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} opacity={0.9} />
                        ))}
                      </Funnel>
                    </FunnelChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="empty-state"><Inbox size={32} style={{ opacity: 0.3, marginBottom: 8 }} /><p>No funnel data yet.</p></div>
                )}
              </div>
            </div>

            {/* ── ROW 3: Role Distribution | Average ATS per Role ───────────── */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', marginBottom: '24px' }}>
              <div className="glass-panel" style={{ padding: '28px', height: '360px' }}>
                <h3 className="outfit-font" style={{ marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px', fontSize: '1.05rem' }}>
                  <BriefcaseBusiness size={18} color="#f59e0b" /> Role Distribution
                </h3>
                {intelligence.roleStats?.length > 0 ? (
                  <ResponsiveContainer width="100%" height="85%">
                    <BarChart data={intelligence.roleStats} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.07)" vertical={false} />
                      <XAxis dataKey="role" stroke="#64748b" tick={{ fontSize: 10 }} />
                      <YAxis stroke="#64748b" tick={{ fontSize: 11 }} />
                      <Tooltip contentStyle={{ background: '#1e293b', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px', fontSize: '0.85rem' }} />
                      <Bar dataKey="applicants" name="Applicants" fill="#3b82f6" radius={[5, 5, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="empty-state"><Inbox size={32} style={{ opacity: 0.3, marginBottom: 8 }} /><p>No role data yet.</p></div>
                )}
              </div>

              <div className="glass-panel" style={{ padding: '28px', height: '360px' }}>
                <h3 className="outfit-font" style={{ marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px', fontSize: '1.05rem' }}>
                  <Target size={18} color="#ec4899" /> Average ATS per Role
                </h3>
                {intelligence.roleStats?.length > 0 ? (
                  <ResponsiveContainer width="100%" height="85%">
                    <BarChart data={intelligence.roleStats} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.07)" vertical={false} />
                      <XAxis dataKey="role" stroke="#64748b" tick={{ fontSize: 10 }} />
                      <YAxis stroke="#64748b" tick={{ fontSize: 11 }} domain={[0, 100]} />
                      <Tooltip contentStyle={{ background: '#1e293b', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px', fontSize: '0.85rem' }} formatter={(v) => [v != null ? v.toFixed(1) : 'N/A', 'Avg ATS']} />
                      <Bar dataKey="avgAtsScore" name="Avg ATS Score" fill="#ec4899" radius={[5, 5, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="empty-state"><Inbox size={32} style={{ opacity: 0.3, marginBottom: 8 }} /><p>No ATS data yet.</p></div>
                )}
              </div>
            </div>

            {/* ── ROW 4: Top Matched Skills | Top Missing Skills ─────────────── */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', marginBottom: '24px' }}>
              <div className="glass-panel" style={{ padding: '28px', height: '340px' }}>
                <h3 className="outfit-font" style={{ marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px', fontSize: '1.05rem' }}>
                  <CheckCircle size={18} color="#10b981" /> Top Matched Skills
                </h3>
                {intelligence.topMatchedSkills?.length > 0 ? (
                  <ResponsiveContainer width="100%" height="85%">
                    <BarChart data={intelligence.topMatchedSkills} layout="vertical" margin={{ top: 5, right: 20, left: 50, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.07)" horizontal={false} />
                      <XAxis type="number" stroke="#64748b" tick={{ fontSize: 11 }} />
                      <YAxis dataKey="skill" type="category" stroke="#64748b" width={90} tick={{ fontSize: 11 }} />
                      <Tooltip contentStyle={{ background: '#1e293b', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px', fontSize: '0.85rem' }} />
                      <Bar dataKey="count" name="Candidates" fill="#10b981" radius={[0, 5, 5, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="empty-state"><Inbox size={32} style={{ opacity: 0.3, marginBottom: 8 }} /><p>No matched skills data.</p></div>
                )}
              </div>

              <div className="glass-panel" style={{ padding: '28px', height: '340px' }}>
                <h3 className="outfit-font" style={{ marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px', fontSize: '1.05rem' }}>
                  <AlertTriangle size={18} color="#ef4444" /> Top Missing Skills
                </h3>
                {intelligence.topMissingSkills?.length > 0 ? (
                  <ResponsiveContainer width="100%" height="85%">
                    <BarChart data={intelligence.topMissingSkills} layout="vertical" margin={{ top: 5, right: 20, left: 50, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.07)" horizontal={false} />
                      <XAxis type="number" stroke="#64748b" tick={{ fontSize: 11 }} />
                      <YAxis dataKey="skill" type="category" stroke="#64748b" width={90} tick={{ fontSize: 11 }} />
                      <Tooltip contentStyle={{ background: '#1e293b', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px', fontSize: '0.85rem' }} />
                      <Bar dataKey="count" name="Candidates" fill="#ef4444" radius={[0, 5, 5, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="empty-state"><Inbox size={32} style={{ opacity: 0.3, marginBottom: 8 }} /><p>No missing skills data.</p></div>
                )}
              </div>
            </div>

            {/* ── ROW 5: Hiring Recommendation Distribution | Diversity Pulse ── */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', marginBottom: '24px' }}>
              <div className="glass-panel" style={{ padding: '28px', height: '380px' }}>
                <h3 className="outfit-font" style={{ marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px', fontSize: '1.05rem' }}>
                  <PieIcon size={18} color="#8b5cf6" /> Hiring Recommendation Distribution
                </h3>
                {intelligence.hiringRecommendations?.reduce((a, b) => a + b.value, 0) > 0 ? (
                  <ResponsiveContainer width="100%" height="85%">
                    <PieChart>
                      <Pie
                        data={intelligence.hiringRecommendations}
                        cx="50%" cy="45%"
                        innerRadius={65} outerRadius={105}
                        paddingAngle={4}
                        dataKey="value" nameKey="name"
                      >
                        <Cell fill="#10b981" />
                        <Cell fill="#3b82f6" />
                        <Cell fill="#f59e0b" />
                        <Cell fill="#ef4444" />
                      </Pie>
                      <Tooltip contentStyle={{ background: '#1e293b', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px', fontSize: '0.85rem' }} />
                      <Legend iconType="circle" iconSize={10} wrapperStyle={{ fontSize: '0.82rem', color: '#94a3b8' }} />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="empty-state"><Inbox size={32} style={{ opacity: 0.3, marginBottom: 8 }} /><p>No hiring decisions yet.</p></div>
                )}
              </div>

              <div className="glass-panel" style={{ padding: '28px', height: '380px', display: 'flex', flexDirection: 'column' }}>
                <h3 className="outfit-font" style={{ marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '10px', fontSize: '1.05rem' }}>
                  <ShieldCheck size={18} color="#ec4899" /> Diversity Pulse
                </h3>
                {intelligence.diversityMetrics ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', flex: 1, justifyContent: 'center' }}>
                    <div style={{ background: 'rgba(16,185,129,0.08)', borderRadius: '14px', padding: '20px', border: '1px solid rgba(16,185,129,0.2)', textAlign: 'center' }}>
                      <div style={{ fontSize: '2.6rem', fontWeight: '900', color: '#10b981', lineHeight: 1 }}>
                        {intelligence.diversityMetrics.avgFairnessScore?.toFixed(1)}%
                      </div>
                      <p style={{ color: 'var(--text-secondary)', fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: '1px', marginTop: '6px' }}>Average Fairness Score</p>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                      <div style={{
                        background: intelligence.diversityMetrics.totalBiasFlagsTriggered > 0 ? 'rgba(239,68,68,0.08)' : 'rgba(16,185,129,0.08)',
                        borderRadius: '12px', padding: '16px',
                        border: `1px solid ${intelligence.diversityMetrics.totalBiasFlagsTriggered > 0 ? 'rgba(239,68,68,0.25)' : 'rgba(16,185,129,0.2)'}`,
                        textAlign: 'center'
                      }}>
                        <div style={{ fontSize: '1.8rem', fontWeight: '800', color: intelligence.diversityMetrics.totalBiasFlagsTriggered > 0 ? '#ef4444' : '#10b981' }}>
                          {intelligence.diversityMetrics.totalBiasFlagsTriggered}
                        </div>
                        <p style={{ color: 'var(--text-secondary)', fontSize: '0.75rem', marginTop: '4px' }}>Bias Flags Triggered</p>
                      </div>
                      <div style={{ background: 'rgba(59,130,246,0.08)', borderRadius: '12px', padding: '16px', border: '1px solid rgba(59,130,246,0.2)', textAlign: 'center' }}>
                        <div style={{ fontSize: '1.8rem', fontWeight: '800', color: '#3b82f6' }}>
                          {intelligence.diversityMetrics.percentageBiasFree?.toFixed(1)}%
                        </div>
                        <p style={{ color: 'var(--text-secondary)', fontSize: '0.75rem', marginTop: '4px' }}>Bias-Free Evaluations</p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="empty-state"><Inbox size={32} style={{ opacity: 0.3, marginBottom: 8 }} /><p>No fairness data yet.</p></div>
                )}
              </div>
            </div>

            {/* ── ROW 6: Top Candidates Leaderboard | Recent Activity Feed ───── */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', marginBottom: '16px' }}>
              {/* Top Candidates Leaderboard */}
              <div className="glass-panel" style={{ padding: '28px' }}>
                <h3 className="outfit-font" style={{ marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px', fontSize: '1.05rem' }}>
                  <Award size={18} color="#f59e0b" /> Top Candidates Leaderboard
                </h3>
                {intelligence.topCandidates?.length > 0 ? (
                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '36px 1fr 56px 56px 70px', gap: '8px', padding: '6px 12px', marginBottom: '4px' }}>
                      {['#', 'Candidate / Role', 'ATS', 'Sem.', 'Score'].map((h, i) => (
                        <span key={i} style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px', textAlign: i > 1 ? 'center' : 'left' }}>{h}</span>
                      ))}
                    </div>
                    {intelligence.topCandidates.map((cand, idx) => {
                      const rankColor = idx === 0 ? '#f59e0b' : idx === 1 ? '#94a3b8' : idx === 2 ? '#b45309' : 'var(--text-secondary)';
                      return (
                        <div key={idx} style={{
                          display: 'grid', gridTemplateColumns: '36px 1fr 56px 56px 70px', gap: '8px',
                          padding: '11px 12px', borderRadius: '10px',
                          background: idx === 0 ? 'rgba(245,158,11,0.05)' : 'rgba(255,255,255,0.01)',
                          border: idx === 0 ? '1px solid rgba(245,158,11,0.15)' : '1px solid rgba(255,255,255,0.04)',
                          marginBottom: '6px', alignItems: 'center'
                        }}>
                          <span style={{ fontSize: '1rem', fontWeight: '800', color: rankColor, textAlign: 'center' }}>
                            {idx === 0 ? '\uD83E\uDD47' : idx === 1 ? '\uD83E\uDD48' : idx === 2 ? '\uD83E\uDD49' : `#${idx + 1}`}
                          </span>
                          <div style={{ minWidth: 0 }}>
                            <div style={{ fontSize: '0.88rem', fontWeight: '600', color: 'white', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{cand.name || 'Anonymous'}</div>
                            <div style={{ fontSize: '0.73rem', color: 'var(--text-secondary)', marginTop: '2px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{cand.role}</div>
                          </div>
                          <span style={{ fontSize: '0.85rem', fontWeight: '700', color: (cand.atsScore ?? 0) >= 75 ? '#10b981' : (cand.atsScore ?? 0) >= 60 ? '#f59e0b' : '#ef4444', textAlign: 'center' }}>
                            {cand.atsScore != null ? cand.atsScore.toFixed(0) : '\u2014'}
                          </span>
                          <span style={{ fontSize: '0.85rem', fontWeight: '700', color: '#8b5cf6', textAlign: 'center' }}>
                            {cand.semanticScore != null ? cand.semanticScore.toFixed(0) : '\u2014'}
                          </span>
                          <span style={{ fontSize: '0.88rem', fontWeight: '800', color: '#3b82f6', textAlign: 'center', background: 'rgba(59,130,246,0.1)', borderRadius: '8px', padding: '3px 6px' }}>
                            {cand.finalScore != null ? cand.finalScore.toFixed(1) : '\u2014'}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="empty-state"><Inbox size={32} style={{ opacity: 0.3, marginBottom: 8 }} /><p>No candidates yet.</p></div>
                )}
              </div>

              {/* Recent Activity Feed */}
              <div className="glass-panel" style={{ padding: '28px' }}>
                <h3 className="outfit-font" style={{ marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px', fontSize: '1.05rem' }}>
                  <Activity size={18} color="#3b82f6" /> Recent Activity Feed
                </h3>
                {intelligence.recentActivity?.length > 0 ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {intelligence.recentActivity.map((act, idx) => {
                      const now = new Date();
                      const then = new Date(act.createdAt);
                      const diffMs = now - then;
                      const diffMins = Math.floor(diffMs / 60000);
                      const diffHrs = Math.floor(diffMins / 60);
                      const diffDays = Math.floor(diffHrs / 24);
                      const timeAgo = diffMins < 1 ? 'just now' : diffMins < 60 ? `${diffMins}m ago` : diffHrs < 24 ? `${diffHrs}h ago` : `${diffDays}d ago`;
                      const badgeColor = act.atsDecision === 'Selected' ? '#10b981' : act.atsDecision === 'Borderline' ? '#f59e0b' : act.atsDecision === 'Rejected' ? '#ef4444' : '#64748b';
                      return (
                        <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 14px', background: 'rgba(255,255,255,0.02)', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)' }}>
                          <div style={{ width: 38, height: 38, borderRadius: '50%', background: 'rgba(59,130,246,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                            <Users size={16} color="#3b82f6" />
                          </div>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <p style={{ margin: 0, fontSize: '0.86rem', color: 'white', fontWeight: '500', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                              <strong>{act.name || 'Anonymous'}</strong> applied for <strong>{act.role}</strong>
                            </p>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px' }}>
                              {act.atsDecision && (
                                <span style={{ fontSize: '0.7rem', fontWeight: '700', color: badgeColor, background: `${badgeColor}18`, padding: '2px 8px', borderRadius: '20px', border: `1px solid ${badgeColor}40` }}>
                                  {act.atsDecision}
                                </span>
                              )}
                              <span style={{ fontSize: '0.73rem', color: 'var(--text-secondary)' }}>{timeAgo}</span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="empty-state"><Inbox size={32} style={{ opacity: 0.3, marginBottom: 8 }} /><p>No recent activity.</p></div>
                )}
              </div>
            </div>

          </motion.div>
        )}

        {/* â”€â”€ COMPARISON TAB â”€â”€ (Dedicated Compare Flow Wizard) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
        {activeTab === 'comparison' && (
          <motion.div 
            key="comparison-tab-wizard"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            {comparisonResult ? (
              /* Step 4: Display AI Recommendation screen */
              <div className="glass-panel" style={{ padding: '48px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '48px' }}>
                  <div>
                    <h2 className="outfit-font" style={{ fontSize: '2.4rem', marginBottom: '8px' }}>AI Hiring Recommendation</h2>
                    <p style={{ color: 'var(--text-secondary)' }}>Deep comparative analysis for role: <strong style={{ color: 'white' }}>{selectedRoleForCompare}</strong></p>
                  </div>
                  <button 
                    onClick={() => { setComparisonResult(null); setSelectedCompareCandidates([]); }}
                    className="btn btn-secondary"
                    style={{ padding: '8px 16px', display: 'flex', alignItems: 'center', gap: '8px' }}
                  >
                    <X size={18} /> Close recommendation
                  </button>
                </div>

                <div style={{ display: 'flex', gap: '48px', alignItems: 'flex-start', flexWrap: 'wrap' }}>
                  <div style={{ flex: 1, minWidth: 280 }}>
                    <div style={{ background: 'rgba(59,130,246,0.1)', padding: '32px', borderRadius: '24px', border: '1px solid rgba(59,130,246,0.2)', marginBottom: '32px' }}>
                      <p style={{ color: 'var(--accent-color)', fontWeight: 'bold', textTransform: 'uppercase', fontSize: '0.8rem', letterSpacing: '1px', marginBottom: '12px' }}>THE VERDICT</p>
                      <h3 style={{ fontSize: '2rem', marginBottom: '20px' }}>
                        Proceed with <span style={{ color: 'var(--accent-color)' }}>{comparisonResult.recommendation}</span>
                      </h3>
                      <p style={{ color: '#94a3b8', fontSize: '1.05rem', lineHeight: '1.7', margin: 0 }}>{comparisonResult.comparisonSummary}</p>
                    </div>

                    <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
                      <div style={{ flex: 1, minWidth: 200, padding: '24px', background: 'rgba(16,185,129,0.05)', borderRadius: '20px', border: '1px solid rgba(16,185,129,0.1)' }}>
                        <h4 style={{ color: '#10b981', display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}><Zap size={18} /> Core Strengths</h4>
                        <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                          {(comparisonResult.reasoning || []).map((r, i) => (
                            <li key={i} style={{ marginBottom: '12px', color: '#cbd5e1', display: 'flex', gap: '10px' }}>
                              <ChevronRight size={16} color="#10b981" style={{ flexShrink: 0, marginTop: 2 }} /> {r}
                            </li>
                          ))}
                        </ul>
                      </div>
                      <div style={{ flex: 1, minWidth: 200, padding: '24px', background: 'rgba(239,68,68,0.05)', borderRadius: '20px', border: '1px solid rgba(239,68,68,0.1)' }}>
                        <h4 style={{ color: '#ef4444', display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}><AlertTriangle size={18} /> Potential Risks</h4>
                        <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                          {(comparisonResult.risks || []).map((r, i) => (
                            <li key={i} style={{ marginBottom: '12px', color: '#cbd5e1', display: 'flex', gap: '10px' }}>
                              <ChevronRight size={16} color="#ef4444" style={{ flexShrink: 0, marginTop: 2 }} /> {r}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </div>

                  <div style={{ width: '380px', display: 'flex', flexDirection: 'column', gap: '16px', flexShrink: 0 }}>
                    {compareCandidatesList.filter(c => selectedCompareCandidates.includes(c._id)).map(c => {
                      const decisionColor = c.atsDecision === 'Selected' ? '#10b981' : c.atsDecision === 'Borderline' ? '#fbbf24' : '#f43f5e';
                      const metrics = [
                        { label: 'Semantic Match', value: Math.round(c.semanticScore || 0), color: '#8b5cf6', max: 100 },
                        { label: 'ATS Score', value: c.atsScore ?? 0, color: 'var(--accent-color)', max: 100 },
                        { label: 'Skill Coverage', value: c.skillGap?.matchedSkills?.length > 0 ? Math.min(100, Math.round((c.skillGap.matchedSkills.length / Math.max(1, c.skillGap.matchedSkills.length + c.skillGap.missingSkills.length)) * 100)) : 0, color: '#10b981', max: 100 },
                      ];
                      return (
                      <div key={c._id} style={{ padding: '24px', background: 'rgba(255,255,255,0.02)', borderRadius: '20px', border: '1px solid var(--border-subtle)' }}>
                        <div style={{ display: 'flex', gap: '16px', alignItems: 'center', marginBottom: '20px' }}>
                          <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'linear-gradient(135deg, var(--accent-color), #8b5cf6)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem', fontWeight: 'bold' }}>
                            {c.name?.[0]?.toUpperCase()}
                          </div>
                          <div style={{ flex: 1 }}>
                            <p style={{ margin: 0, fontWeight: 'bold' }}>{c.name}</p>
                            {c.atsDecision && (
                              <span style={{ fontSize: '0.7rem', fontWeight: 700, color: decisionColor, background: `${decisionColor}18`, padding: '2px 8px', borderRadius: '4px', display: 'inline-block', marginTop: '4px' }}>
                                {c.atsDecision}
                              </span>
                            )}
                          </div>
                        </div>
                        {metrics.map((m, i) => (
                          <div key={i} style={{ marginBottom: '12px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', marginBottom: '4px' }}>
                              <span style={{ color: 'var(--text-secondary)' }}>{m.label}</span>
                              <span style={{ color: m.color, fontWeight: 'bold' }}>{m.value}%</span>
                            </div>
                            <div style={{ height: '6px', width: '100%', background: 'rgba(255,255,255,0.05)', borderRadius: '3px', overflow: 'hidden' }}>
                              <div style={{ height: '100%', width: `${m.value}%`, background: `linear-gradient(90deg, ${m.color}, ${m.color}99)`, transition: 'width 0.6s ease' }} />
                            </div>
                          </div>
                        ))}
                      </div>
                      );
                    })}
                  </div>
                </div>

                <div style={{ marginTop: '40px', display: 'flex', gap: '12px' }}>
                  <button 
                    onClick={() => setComparisonResult(null)} 
                    className="btn btn-secondary"
                  >
                    â† Back to Candidates list
                  </button>
                  <button 
                    onClick={() => {
                      setComparisonResult(null);
                      setSelectedRoleForCompare('');
                      setCompareCandidatesList([]);
                      setSelectedCompareCandidates([]);
                    }} 
                    className="btn btn-primary"
                  >
                    Compare Another Role
                  </button>
                </div>
              </div>
            ) : !selectedRoleForCompare ? (
              /* Step 1: Select Role */
              <div className="glass-panel" style={{ padding: '40px', maxWidth: '800px', margin: '0 auto' }}>
                <div style={{ textAlign: 'center', marginBottom: '32px' }}>
                  <GitCompare size={48} color="var(--accent-color)" style={{ margin: '0 auto 16px' }} />
                  <h2 className="outfit-font" style={{ fontSize: '2rem', marginBottom: '8px' }}>Compare Candidates</h2>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>Select a target role requisition to begin evaluating candidate fit alignment.</p>
                </div>

                {rolesLoading ? (
                  <div style={{ textAlign: 'center', padding: '40px 0' }}>
                    <Loader2 size={32} className="lucide-spin" style={{ color: 'var(--accent-color)', marginBottom: '12px' }} />
                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Loading active job roles...</p>
                  </div>
                ) : roles.length === 0 ? (
                  <div className="empty-state" style={{ padding: '20px 0' }}>
                    <p style={{ color: 'var(--danger-color)', marginBottom: '16px' }}>âš ï¸ No active job roles found. You need to create a role first.</p>
                    <button onClick={() => setActiveTab('createRole')} className="btn btn-primary">Create New Role</button>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <label style={{ fontSize: '0.85rem', fontWeight: 'bold', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Job Role Requisition</label>
                    <select 
                      className="input-base"
                      value={selectedRoleForCompare}
                      onChange={(e) => setSelectedRoleForCompare(e.target.value)}
                      style={{ color: '#000', fontSize: '1.05rem' }}
                    >
                      <option value="" disabled style={{ color: '#aaa' }}>-- Select a Job Role --</option>
                      {roles.map((role) => (
                        <option key={role._id} value={role.title} style={{ color: '#000' }}>
                          {role.title} ({role.domain || 'Tech'})
                        </option>
                      ))}
                    </select>
                    <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Selecting a role will dynamically fetch the pipeline of candidates specifically matching that requisition.</p>
                  </div>
                )}
              </div>
            ) : (
              /* Step 2 & 3: Display & Select Candidates */
              <div className="glass-panel" style={{ padding: '32px' }}>
                
                {/* Header wizard indicators */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px', flexWrap: 'wrap', gap: '16px', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '20px' }}>
                  <div>
                    <span style={{ fontSize: '0.75rem', fontWeight: 'bold', background: 'rgba(59,130,246,0.15)', color: 'var(--accent-color)', padding: '4px 10px', borderRadius: '6px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Step 2 of 3</span>
                    <h2 className="outfit-font" style={{ fontSize: '1.8rem', margin: '6px 0 4px' }}>Select Candidates to Compare</h2>
                    <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                      Requisition: <strong style={{ color: 'white' }}>{selectedRoleForCompare}</strong>
                    </p>
                  </div>

                  <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                    <button 
                      onClick={() => setSelectedRoleForCompare('')}
                      className="btn btn-secondary"
                      style={{ padding: '8px 16px', fontSize: '0.9rem' }}
                    >
                      Clear & Choose Another Role
                    </button>
                    
                    <button
                      className="btn btn-primary"
                      disabled={selectedCompareCandidates.length !== 2 || comparing}
                      onClick={handleCompare}
                      style={{ padding: '10px 20px', fontSize: '0.9rem' }}
                    >
                      {comparing ? (
                        <>
                          <Loader2 size={16} className="lucide-spin" style={{ marginRight: 8 }} /> Comparing...
                        </>
                      ) : (
                        <>
                          Compare Candidates ({selectedCompareCandidates.length}/2)
                        </>
                      )}
                    </button>
                  </div>
                </div>

                {compareError && (
                  <div className="error-banner" style={{ marginBottom: '24px' }}>
                    <AlertCircle size={18} />
                    <span>Comparison failed: {compareError}</span>
                  </div>
                )}

                {/* Candidate Selection List/Grid */}
                {compareListLoading ? (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '16px' }}>
                    {[1,2,3].map(i => <SkeletonCard key={i} />)}
                  </div>
                ) : compareListError ? (
                  <div className="error-banner" style={{ margin: '20px 0', display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: '12px', padding: '24px' }}>
                    <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                      <AlertCircle size={24} />
                      <h4 style={{ margin: 0 }}>Error fetching candidates</h4>
                    </div>
                    <p style={{ margin: 0, fontSize: '0.9rem', color: '#fca5a5' }}>{compareListError}</p>
                    <button 
                      onClick={() => fetchCandidatesForRole(selectedRoleForCompare)} 
                      className="btn btn-secondary"
                      style={{ background: 'rgba(255,255,255,0.05)', color: '#fff', border: '1px solid var(--border-strong)', padding: '8px 16px', borderRadius: '8px' }}
                    >
                      <RefreshCw size={14} style={{ marginRight: 6 }} /> Retry
                    </button>
                  </div>
                ) : compareCandidatesList.length === 0 ? (
                  <div className="empty-state">
                    <Inbox size={48} />
                    <h3 className="outfit-font" style={{ fontSize: '1.4rem', color: 'white', marginBottom: '8px' }}>No candidates available for this role.</h3>
                    <p style={{ maxWidth: 440, margin: '0 auto 20px', fontSize: '0.9rem' }}>There are currently no candidates who applied for the "{selectedRoleForCompare}" role requisition.</p>
                    <button onClick={() => setSelectedRoleForCompare('')} className="btn btn-secondary" style={{ padding: '8px 20px' }}>Choose a Different Role</button>
                  </div>
                ) : (
                  <div>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '20px' }}>
                      Select exactly <strong>two candidates</strong> below to generate a side-by-side technical screening recommendation.
                    </p>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '16px' }}>
                      {compareCandidatesList.map((candidate) => {
                        const isSelected = selectedCompareCandidates.includes(candidate._id);
                        const decisionColor = candidate.atsDecision === 'Selected' ? '#10b981' : candidate.atsDecision === 'Borderline' ? '#fbbf24' : '#f43f5e';
                        return (
                          <motion.div 
                            key={candidate._id}
                            layout
                            whileHover={{ y: -4 }}
                            onClick={() => toggleCompareCandidateSelection(candidate._id)}
                            style={{ 
                              padding: '20px', 
                              borderRadius: '16px', 
                              background: isSelected ? 'rgba(59,130,246,0.06)' : 'rgba(255,255,255,0.03)', 
                              border: `2px solid ${isSelected ? 'var(--accent-color)' : 'rgba(255,255,255,0.05)'}`,
                              cursor: 'pointer',
                              transition: 'all 0.2s ease',
                              position: 'relative'
                            }}
                          >
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                              <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                                <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: 'linear-gradient(135deg, var(--accent-color), #8b5cf6)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.1rem', fontWeight: 'bold', flexShrink: 0 }}>
                                  {candidate.name?.[0]?.toUpperCase() || '?'}
                                </div>
                                <div>
                                  <h4 style={{ margin: 0, fontSize: '1rem', fontWeight: 700 }}>{candidate.name || 'Unknown'}</h4>
                                  <p style={{ margin: '2px 0 0', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{candidate.email || 'â€”'}</p>
                                </div>
                              </div>
                              <div style={{ textAlign: 'right' }}>
                                <p style={{ margin: 0, fontSize: '1.3rem', fontWeight: '900', color: 'var(--accent-color)' }}>
                                  {Math.round(candidate.semanticScore || 0)}%
                                </p>
                                <p style={{ margin: 0, fontSize: '0.65rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Semantic</p>
                              </div>
                            </div>

                            {/* Skill tags */}
                            <div style={{ marginBottom: '14px' }}>
                              <div style={{ display: 'flex', gap: '6px', marginBottom: '6px', flexWrap: 'wrap', alignItems: 'center' }}>
                                <span style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', minWidth: 50 }}>Matched:</span>
                                {candidate.skillGap?.matchedSkills?.slice(0, 3).map((skill, i) => (
                                  <span key={i} style={{ padding: '2px 8px', borderRadius: '4px', background: 'rgba(16,185,129,0.1)', color: '#10b981', fontSize: '0.7rem', border: '1px solid rgba(16,185,129,0.2)' }}>{skill}</span>
                                ))}
                                {(candidate.skillGap?.matchedSkills?.length || 0) > 3 && (
                                  <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>+{candidate.skillGap.matchedSkills.length - 3}</span>
                                )}
                              </div>
                              <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', alignItems: 'center' }}>
                                <span style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', minWidth: 50 }}>Missing:</span>
                                {candidate.skillGap?.missingSkills?.slice(0, 3).map((skill, i) => (
                                  <span key={i} style={{ padding: '2px 8px', borderRadius: '4px', background: 'rgba(239,68,68,0.1)', color: '#ef4444', fontSize: '0.7rem', border: '1px solid rgba(239,68,68,0.2)' }}>{skill}</span>
                                ))}
                                {(candidate.skillGap?.missingSkills?.length || 0) > 3 && (
                                  <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>+{candidate.skillGap.missingSkills.length - 3}</span>
                                )}
                              </div>
                            </div>

                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '12px', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                              <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                <Calendar size={12} /> {candidate.createdAt ? new Date(candidate.createdAt).toLocaleDateString() : 'â€”'}
                              </span>
                              <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                                {candidate.atsDecision && (
                                  <span style={{ fontSize: '0.75rem', fontWeight: 700, color: decisionColor, background: `${decisionColor}18`, padding: '2px 8px', borderRadius: '6px' }}>
                                    {candidate.atsDecision}
                                  </span>
                                )}
                                <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                                  ATS: <strong style={{ color: 'white' }}>{candidate.atsScore ?? 'â€”'}</strong>
                                </span>
                                {candidate.fairnessScore != null && (
                                  <span style={{ fontSize: '0.8rem', color: '#10b981', fontWeight: 600 }}>
                                    F: {Number(candidate.fairnessScore).toFixed(2)}
                                  </span>
                                )}
                              </div>
                            </div>

                            {isSelected && (
                              <div style={{ position: 'absolute', top: '10px', right: '10px' }}>
                                <CheckCheck size={18} color="var(--accent-color)" style={{ background: 'rgba(59,130,246,0.2)', padding: '2px', borderRadius: '50%' }} />
                              </div>
                            )}
                          </motion.div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            )}
          </motion.div>
        )}

        {/* â”€â”€ CREATE ROLE TAB â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
        {activeTab === 'createRole' && (
          <motion.div
            key="create-role-tab"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            style={{ maxWidth: '800px', margin: '0 auto' }}
          >
            <div className="glass-panel" style={{ padding: '48px', marginBottom: '32px' }}>
              <div style={{ marginBottom: '32px' }}>
                <h2 className="outfit-font" style={{ fontSize: '2.2rem', marginBottom: '8px' }}>
                  <BriefcaseBusiness size={30} style={{ verticalAlign: 'middle', marginRight: '12px', color: 'var(--accent-color)' }} />
                  Create New Role
                </h2>
                <p style={{ color: 'var(--text-secondary)', fontSize: '1rem', lineHeight: '1.6' }}>
                  Paste the full job description. Our AI will extract skills, generate a difficulty score, classify the domain, and build an interview rubric automatically.
                </p>
              </div>

              {roleError && (
                <div className="error-banner" style={{ marginBottom: '24px' }}>
                  <AlertCircle size={18} />
                  <span>{roleError}</span>
                </div>
              )}

              <form onSubmit={handleCreateRole}>
                <div style={{ marginBottom: '24px' }}>
                  <label style={{ display: 'block', marginBottom: '10px', fontWeight: '600', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '1px', fontSize: '0.8rem' }}>
                    Role Title *
                  </label>
                  <input
                    type="text"
                    className="input-base"
                    placeholder="e.g. Senior Backend Engineer"
                    value={roleForm.title}
                    onChange={(e) => setRoleForm(prev => ({ ...prev, title: e.target.value }))}
                    required
                    disabled={roleCreating}
                  />
                </div>

                <div style={{ marginBottom: '32px' }}>
                  <label style={{ display: 'block', marginBottom: '10px', fontWeight: '600', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '1px', fontSize: '0.8rem' }}>
                    Job Description
                  </label>
                  <textarea
                    className="input-base"
                    placeholder="Paste the full job description here. Our AI will analyze required skills, experience level, domain classification, interview difficulty, and generate a scoring rubric..."
                    value={roleForm.description}
                    onChange={(e) => setRoleForm(prev => ({ ...prev, description: e.target.value }))}
                    style={{ minHeight: '200px', lineHeight: '1.7' }}
                    disabled={roleCreating}
                  />
                </div>

                <button
                  type="submit"
                  className="btn btn-primary"
                  style={{ width: '100%', padding: '18px', fontSize: '1.1rem' }}
                  disabled={roleCreating}
                >
                  {roleCreating ? (
                    <>
                      <Loader2 size={20} className="lucide-spin" />
                      <span>Analyzing & Creating Roleâ€¦ (first run may take 15â€“30s)</span>
                    </>
                  ) : (
                    <><PlusCircle size={20} /> Create Role with AI Intelligence</>
                  )}
                </button>
              </form>

              {/* Loading hint */}
              {roleCreating && (
                <div style={{ marginTop: '20px', padding: '14px 18px', background: 'rgba(59,130,246,0.08)', border: '1px solid rgba(59,130,246,0.2)', borderRadius: '12px', color: '#93c5fd', fontSize: '0.9rem', lineHeight: '1.6' }}>
                  â³ <strong>Please wait.</strong> The AI is parsing the job description, extracting skills, and generating an interview rubric. On first run, the embedding model may take 15â€“30 seconds to load.
                </div>
              )}
            </div>

            {/* ── Roles Management Panel ──────────────────────────────────── */}
            <div className="glass-panel" style={{ padding: '32px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '12px' }}>
                <div>
                  <h3 className="outfit-font" style={{ fontSize: '1.4rem', margin: 0, display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <List size={20} color="var(--accent-color)" /> Manage Job Roles
                  </h3>
                  <p style={{ margin: '4px 0 0', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                    {roles.length} role{roles.length !== 1 ? 's' : ''} active
                  </p>
                </div>
                {roles.length > 0 && (
                  <button
                    onClick={handleDeleteAllRoles}
                    className="btn btn-danger"
                    style={{ padding: '10px 18px', fontSize: '0.85rem' }}
                  >
                    <Trash2 size={15} /> Delete All Roles
                  </button>
                )}
              </div>

              {rolesLoading ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {[1,2,3].map(i => <SkeletonCard key={i} />)}
                </div>
              ) : roles.length === 0 ? (
                <div className="empty-state" style={{ padding: '32px 0' }}>
                  <BriefcaseBusiness size={40} style={{ opacity: 0.3, marginBottom: '10px' }} />
                  <p>No roles yet. Use the form above to create your first role.</p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {roles.map(role => (
                    <div
                      key={role._id}
                      style={{
                        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                        padding: '16px 20px', borderRadius: '14px',
                        background: 'rgba(255,255,255,0.02)',
                        border: '1px solid var(--border-subtle)',
                        gap: '16px', flexWrap: 'wrap'
                      }}
                    >
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', marginBottom: '6px' }}>
                          <p style={{ margin: 0, fontWeight: '700', fontSize: '0.95rem', color: 'white' }}>{role.title}</p>
                          {role.domain && (
                            <span style={{ fontSize: '0.7rem', fontWeight: 700, padding: '2px 8px', borderRadius: '6px', background: 'rgba(59,130,246,0.12)', color: '#93c5fd', border: '1px solid rgba(59,130,246,0.2)' }}>
                              {role.domain}
                            </span>
                          )}
                          {role.difficulty && (
                            <span style={{ fontSize: '0.7rem', fontWeight: 700, padding: '2px 8px', borderRadius: '6px', background: 'rgba(245,158,11,0.12)', color: '#fbbf24', border: '1px solid rgba(245,158,11,0.2)' }}>
                              {role.difficulty}
                            </span>
                          )}
                        </div>
                        {role.skills?.length > 0 && (
                          <div style={{ display: 'flex', gap: '5px', flexWrap: 'wrap' }}>
                            {role.skills.slice(0, 5).map((s, i) => (
                              <span key={i} style={{ fontSize: '0.68rem', padding: '2px 7px', borderRadius: '4px', background: 'rgba(16,185,129,0.08)', color: '#6ee7b7', border: '1px solid rgba(16,185,129,0.15)' }}>{s}</span>
                            ))}
                            {role.skills.length > 5 && (
                              <span style={{ fontSize: '0.68rem', color: 'var(--text-secondary)' }}>+{role.skills.length - 5}</span>
                            )}
                          </div>
                        )}
                      </div>
                      <button
                        onClick={() => handleDeleteRole(role._id, role.title)}
                        style={{
                          background: 'rgba(244,63,94,0.08)', border: '1px solid rgba(244,63,94,0.25)',
                          color: '#f43f5e', borderRadius: '10px', padding: '8px 14px',
                          cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px',
                          fontSize: '0.82rem', fontWeight: '600', flexShrink: 0, transition: 'all 0.2s ease'
                        }}
                        onMouseEnter={e => { e.currentTarget.style.background='rgba(244,63,94,0.15)'; e.currentTarget.style.borderColor='rgba(244,63,94,0.4)'; }}
                        onMouseLeave={e => { e.currentTarget.style.background='rgba(244,63,94,0.08)'; e.currentTarget.style.borderColor='rgba(244,63,94,0.25)'; }}
                      >
                        <Trash2 size={14} /> Delete
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Success Result Panel */}
            {roleResult && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="glass-panel"
                style={{ padding: '40px' }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '32px' }}>
                  <CheckCircle size={36} color="var(--success-color)" />
                  <div>
                    <h3 className="outfit-font" style={{ fontSize: '1.8rem', margin: 0 }}>{roleResult.title}</h3>
                    <p style={{ color: 'var(--text-secondary)', margin: '4px 0 0' }}>Role created and indexed successfully.</p>
                  </div>
                </div>

                {/* Metadata Grid */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginBottom: '32px' }}>
                  {[
                    { label: 'Domain', value: roleResult.domain || 'General', color: '#3b82f6' },
                    { label: 'Difficulty', value: roleResult.difficulty || 'Medium', color: '#f59e0b' },
                    { label: 'Experience', value: roleResult.experience || 'Not specified', color: '#10b981' },
                  ].map((item, i) => (
                    <div key={i} style={{ background: 'rgba(0,0,0,0.3)', borderRadius: '14px', padding: '20px', textAlign: 'center', border: '1px solid rgba(255,255,255,0.05)' }}>
                      <p style={{ color: 'var(--text-secondary)', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '8px' }}>{item.label}</p>
                      <p style={{ fontSize: '1.2rem', fontWeight: '700', color: item.color, margin: 0 }}>{item.value}</p>
                    </div>
                  ))}
                </div>

                {/* Required Skills */}
                {roleResult.skills?.length > 0 && (
                  <div style={{ marginBottom: '24px' }}>
                    <h4 style={{ marginBottom: '12px', color: 'var(--text-secondary)', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '1px' }}>Required Skills Extracted</h4>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                      {roleResult.skills.map((skill, i) => (
                        <span key={i} style={{ padding: '6px 12px', borderRadius: '8px', background: 'rgba(59,130,246,0.1)', color: '#93c5fd', fontSize: '0.85rem', border: '1px solid rgba(59,130,246,0.2)' }}>
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Rubric */}
                {roleResult.rubric && Object.keys(roleResult.rubric).length > 0 && (
                  <div style={{ marginBottom: '24px' }}>
                    <h4 style={{ marginBottom: '12px', color: 'var(--text-secondary)', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '1px' }}>Scoring Rubric</h4>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                      {Object.entries(roleResult.rubric).map(([key, weight], i) => (
                        <div key={i}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                            <span style={{ fontSize: '0.9rem', color: '#e2e8f0' }}>{key}</span>
                            <span style={{ fontSize: '0.9rem', fontWeight: '700', color: 'var(--accent-color)' }}>{weight}%</span>
                          </div>
                          <div style={{ height: '6px', background: 'rgba(255,255,255,0.05)', borderRadius: '3px', overflow: 'hidden' }}>
                            <div style={{ height: '100%', width: `${weight}%`, background: 'linear-gradient(90deg, var(--accent-color), #8b5cf6)' }} />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div style={{ display: 'flex', gap: '12px' }}>
                  <button
                    onClick={() => { setRoleResult(null); setActiveTab('candidates'); fetchData(); }}
                    className="btn btn-secondary"
                    style={{ flex: 1, padding: '14px' }}
                  >
                    <Users size={16} /> View Candidate Pool
                  </button>
                  <button
                    onClick={() => setRoleResult(null)}
                    className="btn btn-primary"
                    style={{ flex: 1, padding: '14px' }}
                  >
                    <PlusCircle size={16} /> Create Another Role
                  </button>
                </div>
              </motion.div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Candidate Profile Details Drawer overlay */}
      <AnimatePresence>
        {selectedDetailCandidateId && (
          <CandidateDetailDrawer
            candidateId={selectedDetailCandidateId}
            onClose={() => setSelectedDetailCandidateId(null)}
            onDelete={handleDeleteCandidate}
          />
        )}
      </AnimatePresence>

      {/* Global Toast notifications */}
      <ToastContainer toasts={toasts} />

      {/* Global Confirmation Modal */}
      <ConfirmModal
        open={confirmModal.open}
        title={confirmModal.title}
        message={confirmModal.message}
        onConfirm={confirmModal.onConfirm}
        onCancel={closeConfirm}
        loading={confirmModal.loading}
      />
    </motion.div>
  );
}
