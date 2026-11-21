import React, { useState, useEffect, useRef } from 'react';
import { Wrench, CheckCircle2, Clock, AlertTriangle, UserCheck, Camera, Filter, Search, Volume2, MapPin, ArrowRight, Shield, Check, RefreshCw, Sparkles, AlertCircle } from 'lucide-react';
import { CATEGORIES } from '../utils/translations';
import { speakText, playAudioFeedback } from '../utils/speech';
import { getComplaints, updateComplaintStatus } from '../firebaseActions';

export default function WorkerDashboard({ currentLang, currentUser }) {
  const [stats, setStats] = useState(null);
  const [issues, setIssues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedIssue, setSelectedIssue] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterWard, setFilterWard] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterCategory, setFilterCategory] = useState('all');

  // Modal action states
  const [newStatus, setNewStatus] = useState('');
  const [workerName, setWorkerName] = useState(currentUser?.name || 'Municipal Field Worker');
  const [resolutionNote, setResolutionNote] = useState('');
  const [resolvedPhotoFile, setResolvedPhotoFile] = useState(null);
  const [resolvedPhotoPreview, setResolvedPhotoPreview] = useState(null);
  const [updating, setUpdating] = useState(false);
  const [actionSuccessNotice, setActionSuccessNotice] = useState('');

  const fileInputRef = useRef(null);

  useEffect(() => {
    loadData();
  }, [filterStatus]);

  const loadData = async () => {
    setLoading(true);
    try {
      const allComplaints = await getComplaints();
      const total = allComplaints.length;
      const reported = allComplaints.filter(c => c.status === 'Pending' || c.status === 'reported').length;
      const in_progress = allComplaints.filter(c => c.status === 'in_progress' || c.status === 'work_started').length;
      const resolved = allComplaints.filter(c => c.status === 'resolved').length;

      setStats({
        total,
        reported,
        in_progress,
        resolved,
        resolvedPercent: total > 0 ? Math.round((resolved / total) * 100) : 0
      });

      let filtered = allComplaints;
      if (filterStatus !== 'all') {
        filtered = filtered.filter(item => {
          if (filterStatus === 'reported') return item.status === 'Pending' || item.status === 'reported';
          if (filterStatus === 'in_progress') return item.status === 'in_progress' || item.status === 'work_started';
          if (filterStatus === 'resolved') return item.status === 'resolved';
          return item.status === filterStatus;
        });
      }
      setIssues(filtered);
    } catch (err) {
      console.error("Worker load error from Firestore:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenActionModal = (issue) => {
    playAudioFeedback('click');
    setSelectedIssue(issue);
    setNewStatus(issue.status === 'reported' || issue.status === 'Pending' ? 'in_progress' : issue.status);
    setWorkerName(issue.assignedTo || currentUser?.name || 'Field Worker');
    setResolutionNote(issue.resolutionNote || '');
    setResolvedPhotoFile(null);
    setResolvedPhotoPreview(issue.resolvedPhotoUrl || null);
    setActionSuccessNotice('');
  };

  const handleQuickAccept = async (issue) => {
    playAudioFeedback('click');
    setUpdating(true);
    try {
      await updateComplaintStatus(
        issue.id,
        'in_progress',
        currentUser?.name || 'Assigned Field Worker',
        'Task accepted by field worker. Action in progress.'
      );

      playAudioFeedback('success');
      loadData();
    } catch (err) {
      console.error('Accept task error:', err);
    } finally {
      setUpdating(false);
    }
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
      await updateComplaintStatus(
        selectedIssue.id,
        newStatus,
        workerName,
        resolutionNote,
        resolvedPhotoPreview
      );

      playAudioFeedback('success');
      setActionSuccessNotice('Task updated successfully!');
      setTimeout(() => {
        setSelectedIssue(null);
        setActionSuccessNotice('');
      }, 1200);
      loadData();
    } catch (err) {
      console.error("Status update error:", err);
      alert("Failed to update status");
    } finally {
      setUpdating(false);
    }
  };

  const speakIssue = (issue) => {
    const cat = CATEGORIES.find(c => c.id === issue.category);
    const catName = cat?.names[currentLang] || issue.category;
    const text = `సమస్య: ${catName}। స్థలం: ${issue.address}। వార్డు: ${issue.ward}। స్టేటస్: ${issue.status === 'resolved' ? 'పరిష్కరించబడింది' : issue.status === 'in_progress' ? 'పని జరుగుతోంది' : 'కొత్త ఫిర్యాదు'}।`;
    speakText(text, currentLang || 'te');
  };

  // Filter issues based on ward, category, search
  const filteredIssues = issues.filter(i => {
    if (filterWard !== 'all' && i.ward !== filterWard) return false;
    if (filterCategory !== 'all' && i.category !== filterCategory) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchTitle = (i.title || '').toLowerCase().includes(q);
      const matchAddress = (i.address || '').toLowerCase().includes(q);
      const matchWard = (i.ward || '').toLowerCase().includes(q);
      if (!matchTitle && !matchAddress && !matchWard) return false;
    }
    return true;
  });

  const myWard = currentUser?.ward || 'Ward 4';
  const myWardCount = issues.filter(i => i.ward === myWard).length;

  return (
    <div className="max-w-7xl mx-auto px-3 sm:px-6 py-6 space-y-6">
      
      {/* 1. WORKER ON-DUTY HERO BANNER */}
      <div className="bg-gradient-to-r from-amber-600 via-orange-600 to-amber-700 rounded-3xl p-6 sm:p-8 text-white shadow-xl shadow-orange-500/20 relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center space-x-2 bg-black/20 backdrop-blur-md px-3.5 py-1.5 rounded-full text-xs font-black tracking-wider uppercase border border-white/20">
              <Wrench className="w-4 h-4 text-amber-200" />
              <span>Municipal Field Staff • On-Duty Portal</span>
            </div>
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black tracking-tight">
              Field Worker Task & Problem Redressal Portal
            </h1>
            <p className="text-sm sm:text-base text-amber-100 font-medium max-w-2xl">
              ప్రజలు రిపోర్ట్ చేసిన సమస్యలన్నింటినీ ఇక్కడ వీక్షించండి. పనులను అంగీకరించండి, పరిష్కరించి ఫోటో ప్రూఫ్ అప్‌లోడ్ చేయండి.
            </p>
          </div>

          {/* Worker Profile Card */}
          <div className="bg-white/15 backdrop-blur-lg border border-white/25 rounded-2xl p-4 flex-shrink-0 min-w-[260px] text-xs space-y-2">
            <div className="flex items-center justify-between border-b border-white/20 pb-2">
              <span className="text-amber-200 font-bold">Worker Name:</span>
              <span className="font-black text-sm text-white">{currentUser?.name || 'M. Ramesh'}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-amber-200 font-bold">Assigned Ward:</span>
              <span className="font-extrabold text-white bg-black/30 px-2 py-0.5 rounded-md">{currentUser?.ward || 'Ward 4'}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-amber-200 font-bold">Staff ID:</span>
              <span className="font-mono font-bold text-white">{currentUser?.username || 'worker1'}</span>
            </div>
            <div className="flex items-center justify-between pt-1">
              <span className="text-amber-200 font-bold">Duty Status:</span>
              <span className="font-black text-emerald-300 flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                Active In Field
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 2. REAL-TIME PROBLEM COUNTER METRICS */}
      {stats && (
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4">
          <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center space-x-3.5">
            <div className="w-12 h-12 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center font-black">
              📋
            </div>
            <div>
              <p className="text-2xl font-black text-slate-900">{stats.total || issues.length}</p>
              <p className="text-xs text-slate-500 font-bold">All Reported Problems</p>
            </div>
          </div>

          <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center space-x-3.5">
            <div className="w-12 h-12 rounded-xl bg-red-100 text-red-600 flex items-center justify-center font-black">
              🚨
            </div>
            <div>
              <p className="text-2xl font-black text-red-600">{stats.reported || 0}</p>
              <p className="text-xs text-slate-500 font-bold">New (Needs Action)</p>
            </div>
          </div>

          <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center space-x-3.5">
            <div className="w-12 h-12 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center font-black">
              ⏳
            </div>
            <div>
              <p className="text-2xl font-black text-amber-700">{stats.inProgress || 0}</p>
              <p className="text-xs text-slate-500 font-bold">In Progress</p>
            </div>
          </div>

          <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center space-x-3.5">
            <div className="w-12 h-12 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-black">
              ✅
            </div>
            <div>
              <p className="text-2xl font-black text-emerald-700">{stats.resolved || 0}</p>
              <p className="text-xs text-slate-500 font-bold">Resolved Work</p>
            </div>
          </div>

          <div className="col-span-2 lg:col-span-1 bg-gradient-to-br from-indigo-50 to-blue-50 p-4 sm:p-5 rounded-2xl border border-indigo-200 shadow-sm flex items-center space-x-3.5">
            <div className="w-12 h-12 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-black">
              📍
            </div>
            <div>
              <p className="text-2xl font-black text-indigo-900">{myWardCount}</p>
              <p className="text-xs text-indigo-700 font-bold">In Your {myWard}</p>
            </div>
          </div>
        </div>
      )}

      {/* 3. FILTERING & SEARCH CONTROLS */}
      <div className="bg-white p-4 sm:p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl sm:text-2xl font-black text-slate-900">
              Reported Civic Problems ({filteredIssues.length})
            </h2>
            <p className="text-xs text-slate-500 font-medium">
              Live complaints submitted by citizens across wards.
            </p>
          </div>

          {/* Search bar */}
          <div className="relative w-full md:w-80">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
            <input
              type="text"
              placeholder="Search colony, street, ward, or problem..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs sm:text-sm font-semibold focus:ring-2 focus:ring-amber-500"
            />
          </div>
        </div>

        {/* Filter Pills */}
        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-100">
          <span className="text-xs font-black text-slate-500 uppercase mr-1">Status:</span>
          {[
            { id: 'all', label: 'All Problems' },
            { id: 'reported', label: '🚨 New (Unassigned)' },
            { id: 'in_progress', label: '⏳ In Progress' },
            { id: 'resolved', label: '✅ Resolved' }
          ].map(s => (
            <button
              key={s.id}
              onClick={() => { setFilterStatus(s.id); playAudioFeedback('click'); }}
              className={`px-3 py-1.5 rounded-xl text-xs font-extrabold transition cursor-pointer ${filterStatus === s.id
                ? 'bg-amber-600 text-white shadow-xs'
                : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                }`}
            >
              {s.label}
            </button>
          ))}

          <span className="text-xs font-black text-slate-500 uppercase ml-3 mr-1">Ward:</span>
          <select
            value={filterWard}
            onChange={(e) => { setFilterWard(e.target.value); playAudioFeedback('click'); }}
            className="py-1.5 px-3 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold text-slate-800"
          >
            <option value="all">All Wards</option>
            <option value={myWard}>📍 My Ward ({myWard})</option>
            <option value="Ward 4">Ward 4</option>
            <option value="Ward 5">Ward 5</option>
            <option value="Ward 8">Ward 8</option>
            <option value="Ward 9">Ward 9</option>
            <option value="Ward 12">Ward 12</option>
          </select>

          <span className="text-xs font-black text-slate-500 uppercase ml-3 mr-1">Category:</span>
          <select
            value={filterCategory}
            onChange={(e) => { setFilterCategory(e.target.value); playAudioFeedback('click'); }}
            className="py-1.5 px-3 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold text-slate-800"
          >
            <option value="all">All Categories</option>
            <option value="garbage">Garbage</option>
            <option value="pothole">Pothole</option>
            <option value="streetlight">Streetlight</option>
            <option value="water_leak">Water Leak</option>
            <option value="electrical">Electrical</option>
          </select>

          <button
            onClick={() => loadData()}
            className="ml-auto px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold flex items-center space-x-1 cursor-pointer"
            title="Refresh issues list"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* 4. ALL REPORTED PROBLEMS LIST */}
      {loading ? (
        <div className="p-12 text-center text-slate-400 font-bold bg-white rounded-3xl border border-slate-200">
          <RefreshCw className="w-8 h-8 mx-auto mb-2 animate-spin text-amber-500" />
          <p>Loading real-time reported problems...</p>
        </div>
      ) : filteredIssues.length === 0 ? (
        <div className="p-12 text-center text-slate-400 font-bold bg-white rounded-3xl border border-slate-200">
          <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto mb-2" />
          <p className="text-lg font-black text-slate-700">No matching issues found</p>
          <p className="text-xs text-slate-400">All tasks in this filter are resolved or none reported yet.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredIssues.map((issue) => {
            const isUrgent = issue.votes >= 5;
            const cat = CATEGORIES.find(c => c.id === issue.category);

            return (
              <div
                key={issue.id}
                className={`bg-white rounded-3xl border-2 transition-all duration-200 flex flex-col justify-between overflow-hidden shadow-sm hover:shadow-lg ${
                  issue.status === 'resolved'
                    ? 'border-emerald-200'
                    : isUrgent
                    ? 'border-red-300 ring-2 ring-red-100'
                    : 'border-slate-200'
                }`}
              >
                {/* Photo & Badges */}
                <div className="relative h-48 sm:h-52 w-full bg-slate-100 overflow-hidden">
                  <img
                    src={issue.photoUrl}
                    alt={issue.title}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-black/20" />

                  {/* Top Badges */}
                  <div className="absolute top-3 left-3 right-3 flex items-center justify-between">
                    <span className="px-2.5 py-1 rounded-xl text-xs font-black bg-black/60 text-white backdrop-blur-md border border-white/20 flex items-center space-x-1">
                      <span>{cat?.icon || '📢'}</span>
                      <span className="capitalize">{issue.category.replace('_', ' ')}</span>
                    </span>

                    {/* Status Pill */}
                    <span className={`px-2.5 py-1 rounded-xl text-xs font-black shadow-sm ${
                      issue.status === 'resolved'
                        ? 'bg-emerald-500 text-white'
                        : issue.status === 'in_progress'
                        ? 'bg-amber-400 text-slate-950 animate-pulse'
                        : 'bg-red-500 text-white'
                    }`}>
                      {issue.status === 'resolved' ? 'Resolved' : issue.status === 'in_progress' ? 'In Progress' : 'Reported'}
                    </span>
                  </div>

                  {/* Bottom Image Info */}
                  <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between text-white text-xs">
                    <span className="font-bold flex items-center gap-1 drop-shadow-md">
                      <MapPin className="w-3.5 h-3.5 text-amber-300" />
                      <span>{issue.ward}</span>
                    </span>
                    {isUrgent && (
                      <span className="bg-red-600 text-white text-[10px] font-black uppercase px-2 py-0.5 rounded-full shadow-sm animate-pulse">
                        🔥 High Priority ({issue.votes} Votes)
                      </span>
                    )}
                  </div>
                </div>

                {/* Card Body */}
                <div className="p-5 flex-1 flex flex-col justify-between space-y-3">
                  <div>
                    <h3 className="text-base sm:text-lg font-black text-slate-900 leading-snug">
                      {issue.title}
                    </h3>
                    <p className="text-xs text-slate-500 font-semibold mt-1 flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                      <span>{issue.address}</span>
                    </p>

                    {/* Citizen Voice Transcript */}
                    {issue.voiceTranscript && (
                      <div className="mt-3 p-2.5 bg-amber-50/70 border border-amber-200 rounded-xl text-xs text-amber-950 italic flex items-start justify-between gap-2">
                        <span>"{issue.voiceTranscript}"</span>
                        <button
                          type="button"
                          onClick={() => speakIssue(issue)}
                          className="p-1 rounded-lg bg-amber-200 text-amber-900 hover:bg-amber-300 flex-shrink-0 cursor-pointer"
                          title="Listen in Telugu"
                        >
                          <Volume2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}

                    {/* Assigned Worker / Resolution Notes */}
                    {issue.assignedTo && (
                      <div className="mt-2 text-xs font-bold text-slate-600 bg-slate-50 p-2 rounded-lg border border-slate-100 flex items-center justify-between">
                        <span>Assigned:</span>
                        <span className="text-indigo-700 font-extrabold">{issue.assignedTo}</span>
                      </div>
                    )}

                    {issue.resolutionNote && (
                      <div className="mt-2 text-xs text-emerald-800 bg-emerald-50 p-2 rounded-lg border border-emerald-200">
                        <span className="font-bold">Work Done: </span>{issue.resolutionNote}
                      </div>
                    )}
                  </div>

                  {/* Card Actions */}
                  <div className="pt-3 border-t border-slate-100 flex items-center space-x-2">
                    {issue.status === 'reported' && (
                      <button
                        type="button"
                        onClick={() => handleQuickAccept(issue)}
                        disabled={updating}
                        className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black shadow-xs transition active:scale-95 cursor-pointer flex items-center justify-center space-x-1"
                      >
                        <Wrench className="w-3.5 h-3.5" />
                        <span>Accept Task</span>
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() => handleOpenActionModal(issue)}
                      className={`py-2.5 px-3 rounded-xl text-xs font-black transition active:scale-95 cursor-pointer flex items-center justify-center space-x-1 ${
                        issue.status === 'reported'
                          ? 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                          : 'flex-1 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white shadow-md'
                      }`}
                    >
                      <Camera className="w-3.5 h-3.5" />
                      <span>{issue.status === 'resolved' ? 'View Resolution' : 'Update & Upload Proof'}</span>
                    </button>
                  </div>
                </div>

              </div>
            );
          })}
        </div>
      )}

      {/* 5. WORKER ACTION / RESOLUTION PROOF MODAL */}
      {selectedIssue && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 space-y-4 max-h-[90vh] overflow-y-auto">
            
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center space-x-2">
                <Wrench className="w-5 h-5 text-amber-600" />
                <h3 className="text-base sm:text-lg font-black text-slate-900">
                  Update Task & Upload Resolution Proof
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedIssue(null)}
                className="w-8 h-8 rounded-lg bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500 font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            {actionSuccessNotice && (
              <div className="p-3 bg-emerald-50 border-2 border-emerald-400 text-emerald-900 text-xs font-black rounded-xl flex items-center space-x-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>{actionSuccessNotice}</span>
              </div>
            )}

            {/* Target Issue Summary */}
            <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 flex items-center space-x-3 text-xs">
              <img
                src={selectedIssue.photoUrl}
                alt={selectedIssue.title}
                className="w-14 h-14 rounded-xl object-cover border border-slate-300"
              />
              <div className="flex-1 min-w-0">
                <h4 className="font-extrabold text-slate-900 truncate">{selectedIssue.title}</h4>
                <p className="text-slate-500 truncate">{selectedIssue.address}</p>
                <span className="text-[10px] font-bold text-blue-700 bg-blue-100 px-2 py-0.5 rounded-md">
                  {selectedIssue.ward}
                </span>
              </div>
            </div>

            <form onSubmit={handleSaveStatus} className="space-y-4">
              {/* Status Select */}
              <div>
                <label className="block text-xs font-black uppercase text-slate-700 mb-1">
                  Update Task Status: *
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {[
                    { id: 'reported', label: '1. Reported 📝', color: 'border-red-400 text-red-700' },
                    { id: 'work_started', label: '2. Work Started 👷', color: 'border-blue-400 text-blue-800' },
                    { id: 'in_progress', label: '3. In Progress ⚡', color: 'border-amber-400 text-amber-800' },
                    { id: 'resolved', label: '4. Resolved ✅', color: 'border-emerald-500 text-emerald-800' }
                  ].map(s => (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => setNewStatus(s.id)}
                      className={`py-2 px-1 text-center rounded-xl text-xs font-black border-2 transition cursor-pointer ${
                        newStatus === s.id
                          ? 'bg-amber-600 text-white border-amber-600 shadow-sm'
                          : `bg-slate-50 hover:bg-slate-100 ${s.color}`
                      }`}
                    >
                      {s.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Assigned Worker Name */}
              <div>
                <label className="block text-xs font-black uppercase text-slate-700 mb-1">
                  Worker / Team In-Charge:
                </label>
                <input
                  type="text"
                  value={workerName}
                  onChange={(e) => setWorkerName(e.target.value)}
                  placeholder="e.g. M. Ramesh (Sanitation Unit 4)"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold focus:ring-2 focus:ring-amber-500"
                />
              </div>

              {/* Resolution Notes */}
              <div>
                <label className="block text-xs font-black uppercase text-slate-700 mb-1">
                  Work Completion Notes:
                </label>
                <textarea
                  rows={2}
                  value={resolutionNote}
                  onChange={(e) => setResolutionNote(e.target.value)}
                  placeholder="Describe work done: e.g. Garbage cleared using hydraulic dumper and road sanitized..."
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-medium focus:ring-2 focus:ring-amber-500"
                />
              </div>

              {/* Resolution Photo Upload */}
              <div>
                <label className="block text-xs font-black uppercase text-slate-700 mb-1">
                  Attach Resolved Photo Proof (After Work):
                </label>
                <input
                  type="file"
                  accept="image/*"
                  ref={fileInputRef}
                  onChange={handleResolvedPhotoChange}
                  className="hidden"
                />

                {resolvedPhotoPreview ? (
                  <div className="relative rounded-2xl overflow-hidden border-2 border-emerald-400 h-36 bg-slate-100">
                    <img
                      src={resolvedPhotoPreview}
                      alt="Resolution Proof"
                      className="w-full h-full object-cover"
                    />
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="absolute bottom-2 right-2 px-3 py-1 bg-black/70 hover:bg-black/90 text-white text-xs font-bold rounded-lg cursor-pointer"
                    >
                      Change Photo
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full py-4 border-2 border-dashed border-slate-300 hover:border-amber-500 rounded-2xl bg-slate-50 hover:bg-amber-50/50 flex flex-col items-center justify-center text-xs font-bold text-slate-600 transition cursor-pointer"
                  >
                    <Camera className="w-6 h-6 text-amber-600 mb-1" />
                    <span>Click to Capture / Upload Resolution Proof Photo</span>
                  </button>
                )}
              </div>

              {/* Submit Buttons */}
              <div className="flex items-center space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setSelectedIssue(null)}
                  className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={updating}
                  className="flex-1 py-2.5 bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 text-white rounded-xl text-xs font-black shadow-md transition active:scale-95 disabled:opacity-50 cursor-pointer flex items-center justify-center space-x-1.5"
                >
                  <Check className="w-4 h-4" />
                  <span>{updating ? 'Saving Work Record...' : 'Confirm & Save Status Update'}</span>
                </button>
              </div>
            </form>

          </div>
        </div>
      )}

    </div>
  );
}
