import React, { useState, useEffect, useRef } from 'react';
import { ShieldCheck, CheckCircle2, Clock, AlertTriangle, UserCheck, Wrench, Camera, Filter, BarChart3, Volume2 } from 'lucide-react';
import { CATEGORIES } from '../utils/translations';
import { speakText, playAudioFeedback } from '../utils/speech';

export default function AuthorityDashboard({ currentLang }) {
  const [stats, setStats] = useState(null);
  const [issues, setIssues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedIssue, setSelectedIssue] = useState(null);
  const [filterWard, setFilterWard] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');

  // Modal action states
  const [newStatus, setNewStatus] = useState('');
  const [workerName, setWorkerName] = useState('');
  const [resolutionNote, setResolutionNote] = useState('');
  const [resolvedPhotoFile, setResolvedPhotoFile] = useState(null);
  const [resolvedPhotoPreview, setResolvedPhotoPreview] = useState(null);
  const [updating, setUpdating] = useState(false);

  const fileInputRef = useRef(null);

  useEffect(() => {
    loadData();
  }, [filterStatus]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [statsRes, issuesRes] = await Promise.all([
        fetch('/api/stats'),
        fetch(`/api/issues?status=${filterStatus}`)
      ]);
      const statsData = await statsRes.json();
      const issuesData = await issuesRes.json();

      if (statsData.success) setStats(statsData.data);
      if (issuesData.success) setIssues(issuesData.data);
    } catch (err) {
      console.error("Authority load error:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenActionModal = (issue) => {
    playAudioFeedback('click');
    setSelectedIssue(issue);
    setNewStatus(issue.status);
    setWorkerName(issue.assignedTo || '');
    setResolutionNote(issue.resolutionNote || '');
    setResolvedPhotoFile(null);
    setResolvedPhotoPreview(issue.resolvedPhotoUrl || null);
  };

  const handleResolvedPhotoChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setResolvedPhotoFile(file);
    setResolvedPhotoPreview(URL.createObjectURL(file));
  };

  const handleSaveStatus = async (e) => {
    e.preventDefault();
    if (!selectedIssue) return;

    setUpdating(true);
    playAudioFeedback('click');

    try {
      const formData = new FormData();
      formData.append('status', newStatus);
      formData.append('assignedTo', workerName);
      formData.append('resolutionNote', resolutionNote);
      if (resolvedPhotoFile) {
        formData.append('resolvedPhoto', resolvedPhotoFile);
      }

      const res = await fetch(`/api/issues/${selectedIssue.id}/status`, {
        method: 'PATCH',
        body: formData
      });
      const data = await res.json();

      if (data.success) {
        playAudioFeedback('success');
        setSelectedIssue(null);
        loadData();
      }
    } catch (err) {
      console.error("Status update error:", err);
      alert("Failed to update status");
    } finally {
      setUpdating(false);
    }
  };

  const speakSummary = () => {
    if (!stats) return;
    const summary = `नगर निगम डैशबोर्ड। कुल शिकायतें: ${stats.total}। नई शिकायतें: ${stats.reported}। काम प्रगति पर: ${stats.inProgress}। हल की गई: ${stats.resolved}। उच्च प्राथमिकता: ${stats.highUrgency}।`;
    speakText(summary, currentLang);
  };

  const filteredIssues = issues.filter(i => {
    if (filterWard !== 'all' && i.ward !== filterWard) return false;
    return true;
  });

  return (
    <div className="max-w-6xl mx-auto px-4 py-6">
      {/* Header */}
      <div className="bg-slate-900 rounded-3xl p-6 text-white shadow-xl mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 text-amber-400 text-xs font-bold uppercase tracking-wider mb-1">
            <ShieldCheck className="w-4 h-4" />
            <span>Municipal Authority & Panchayat Command Center</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-black">
            🏛️ Authority Grievance Portal
          </h2>
          <p className="text-slate-400 text-xs sm:text-sm mt-1">
            Monitor incoming citizen issues, assign municipal workers, and attach resolution proof.
          </p>
        </div>

        <button
          onClick={speakSummary}
          className="flex items-center space-x-2 bg-slate-800 hover:bg-slate-700 text-amber-300 px-4 py-2.5 rounded-2xl border border-slate-700 text-xs font-extrabold transition active:scale-95 shadow"
        >
          <Volume2 className="w-4 h-4" />
          <span>Listen to Daily Summary</span>
        </button>
      </div>

      {/* KPI Stats Cards */}
      {stats && (
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-3.5 mb-6">
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
            <span className="text-xs font-bold text-slate-400 uppercase">Total Logged</span>
            <p className="text-3xl font-black text-slate-800 mt-1">{stats.total}</p>
            <span className="text-[11px] text-blue-600 font-bold">100% Geo-Tagged</span>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-red-200 shadow-sm bg-red-50/30">
            <span className="text-xs font-bold text-red-500 uppercase">Reported / New</span>
            <p className="text-3xl font-black text-red-600 mt-1">{stats.reported}</p>
            <span className="text-[11px] text-red-500 font-bold">Pending Triage</span>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-amber-200 shadow-sm bg-amber-50/30">
            <span className="text-xs font-bold text-amber-600 uppercase">In Progress</span>
            <p className="text-3xl font-black text-amber-600 mt-1">{stats.inProgress}</p>
            <span className="text-[11px] text-amber-600 font-bold">Worker Dispatched</span>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-emerald-200 shadow-sm bg-emerald-50/30">
            <span className="text-xs font-bold text-emerald-600 uppercase">Resolved</span>
            <p className="text-3xl font-black text-emerald-600 mt-1">{stats.resolved}</p>
            <span className="text-[11px] text-emerald-600 font-bold">With Photo Proof</span>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-purple-200 shadow-sm bg-purple-50/30 col-span-2 lg:col-span-1">
            <span className="text-xs font-bold text-purple-600 uppercase">Critical (5+ Votes)</span>
            <p className="text-3xl font-black text-purple-700 mt-1">{stats.highUrgency}</p>
            <span className="text-[11px] text-purple-600 font-bold">High Citizen Urgency</span>
          </div>
        </div>
      )}

      {/* Filter Toolbar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm mb-6 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center space-x-2">
          <Filter className="w-4 h-4 text-slate-400" />
          <span className="text-xs font-bold text-slate-500 uppercase">Ward Filter:</span>
          <select
            value={filterWard}
            onChange={(e) => setFilterWard(e.target.value)}
            className="text-xs font-bold bg-slate-100 border border-slate-300 rounded-xl px-3 py-1.5 focus:outline-none"
          >
            <option value="all">All Wards (सभी वार्ड)</option>
            {stats && Object.keys(stats.byWard || {}).map(w => (
              <option key={w} value={w}>{w} ({stats.byWard[w]})</option>
            ))}
          </select>
        </div>

        <div className="flex items-center space-x-1">
          {['all', 'reported', 'in_progress', 'resolved'].map(st => (
            <button
              key={st}
              onClick={() => setFilterStatus(st)}
              className={`px-3 py-1 rounded-xl text-xs font-bold transition capitalize ${
                filterStatus === st
                  ? 'bg-slate-900 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {st.replace('_', ' ')}
            </button>
          ))}
        </div>
      </div>

      {/* Issue Table / List */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
          <h3 className="font-black text-slate-800 text-base">
            Citizen Grievances Queue ({filteredIssues.length})
          </h3>
          <span className="text-xs text-slate-400 font-bold">
            Sorted by Urgency / Citizen Votes
          </span>
        </div>

        <div className="divide-y divide-slate-100">
          {filteredIssues.map((issue) => {
            const cat = CATEGORIES.find(c => c.id === issue.category);

            return (
              <div key={issue.id} className="p-4 sm:p-5 hover:bg-slate-50 transition flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex items-start space-x-3.5">
                  <div className="w-16 h-16 rounded-2xl overflow-hidden bg-slate-100 flex-shrink-0 border border-slate-200">
                    <img src={issue.photoUrl} alt="Thumbnail" className="w-full h-full object-cover" />
                  </div>

                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="text-xl">{cat?.icon || '📢'}</span>
                      <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full border ${cat?.badgeColor}`}>
                        {cat?.names.en || issue.category}
                      </span>
                      <span className="text-xs font-bold text-slate-400">
                        {issue.ward || 'Ward 6'}
                      </span>
                      {issue.votes >= 5 && (
                        <span className="bg-red-500 text-white text-[10px] font-black uppercase px-2 py-0.5 rounded-full animate-pulse">
                          🚨 Urgent ({issue.votes} Votes)
                        </span>
                      )}
                    </div>

                    <h4 className="text-sm sm:text-base font-extrabold text-slate-900 mt-1">
                      {issue.title}
                    </h4>

                    <p className="text-xs text-slate-500 mt-0.5">
                      📍 {issue.address}
                    </p>

                    {issue.assignedTo && (
                      <p className="text-xs text-blue-700 font-semibold mt-1">
                        👷 Assigned: {issue.assignedTo}
                      </p>
                    )}
                  </div>
                </div>

                {/* Status & Action */}
                <div className="flex items-center space-x-3 w-full sm:w-auto justify-end">
                  <span className={`text-xs font-bold px-3 py-1 rounded-full uppercase ${
                    issue.status === 'resolved'
                      ? 'bg-emerald-100 text-emerald-800'
                      : issue.status === 'in_progress'
                      ? 'bg-amber-100 text-amber-800'
                      : 'bg-red-100 text-red-800'
                  }`}>
                    {issue.status.replace('_', ' ')}
                  </span>

                  <button
                    onClick={() => handleOpenActionModal(issue)}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow transition"
                  >
                    Take Action
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ACTION MODAL (Assign Worker, Change Status, Upload Resolution Proof) */}
      {selectedIssue && (
        <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <div>
                <span className="text-xs font-bold uppercase text-slate-400">Manage Complaint</span>
                <h3 className="text-lg font-black text-slate-900">
                  Ticket #{selectedIssue.id}
                </h3>
              </div>
              <button
                onClick={() => setSelectedIssue(null)}
                className="text-slate-400 hover:text-slate-600 text-sm font-bold"
              >
                ✕ Close
              </button>
            </div>

            <form onSubmit={handleSaveStatus} className="space-y-4">
              {/* Status Selector */}
              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase mb-1">
                  Update Grievance Status
                </label>
                <select
                  value={newStatus}
                  onChange={(e) => setNewStatus(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-sm font-bold focus:ring-2 focus:ring-blue-500"
                >
                  <option value="reported">🔴 Reported (Pending)</option>
                  <option value="in_progress">🟡 In Progress (Action Started)</option>
                  <option value="resolved">🟢 Resolved (Work Completed)</option>
                </select>
              </div>

              {/* Assign Worker / Team */}
              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase mb-1">
                  Assign Officer / Contractor
                </label>
                <input
                  type="text"
                  placeholder="e.g. Sanitation Crew Ward 4, Ramesh Kumar"
                  value={workerName}
                  onChange={(e) => setWorkerName(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-sm focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Resolution Note */}
              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase mb-1">
                  Resolution Note / Action Taken
                </label>
                <textarea
                  rows="2"
                  placeholder="Explain what steps were taken to resolve this problem..."
                  value={resolutionNote}
                  onChange={(e) => setResolutionNote(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-sm focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Upload "After" Proof Photo */}
              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase mb-1">
                  Resolution Proof Photo (After Work Completed)
                </label>
                <input
                  type="file"
                  accept="image/*"
                  ref={fileInputRef}
                  onChange={handleResolvedPhotoChange}
                  className="hidden"
                />

                {resolvedPhotoPreview ? (
                  <div className="relative rounded-xl overflow-hidden h-36 border border-slate-200">
                    <img src={resolvedPhotoPreview} alt="Resolution Proof" className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="absolute bottom-2 right-2 bg-black/70 text-white text-xs px-2.5 py-1 rounded-lg"
                    >
                      Change Photo
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full py-4 border-2 border-dashed border-slate-300 hover:border-blue-500 rounded-xl text-xs font-bold text-slate-600 flex items-center justify-center space-x-2 bg-slate-50"
                  >
                    <Camera className="w-4 h-4 text-blue-600" />
                    <span>Upload "After" Resolution Proof Photo</span>
                  </button>
                )}
              </div>

              {/* Action Buttons */}
              <div className="pt-2 flex gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedIssue(null)}
                  className="flex-1 py-3 rounded-xl border border-slate-200 text-slate-700 font-bold text-sm hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={updating}
                  className="flex-1 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-sm shadow transition disabled:opacity-50"
                >
                  {updating ? 'Saving...' : 'Save & Publish Update'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
