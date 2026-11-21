import React, { useState, useEffect, useRef } from 'react';
import { 
  ShieldCheck, 
  CheckCircle2, 
  Clock, 
  AlertTriangle, 
  UserCheck, 
  Wrench, 
  Camera, 
  Filter, 
  BarChart3, 
  Volume2,
  User,
  Phone,
  Users,
  MapPin,
  Search,
  Calendar,
  ExternalLink
} from 'lucide-react';
import { CATEGORIES } from '../utils/translations';
import { speakText, playAudioFeedback } from '../utils/speech';
import { getComplaints, updateComplaintStatus, getUsers, subscribeUsers, subscribeComplaints } from '../firebaseActions';

export default function AuthorityDashboard({ currentLang }) {
  const [activeTab, setActiveTab] = useState('grievances'); // 'grievances' | 'citizens'
  const [stats, setStats] = useState(null);
  const [issues, setIssues] = useState([]);
  const [registeredUsers, setRegisteredUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedIssue, setSelectedIssue] = useState(null);
  const [filterWard, setFilterWard] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [citizenSearch, setCitizenSearch] = useState('');
  const [selectedCitizenUid, setSelectedCitizenUid] = useState(null);

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

    // Subscribe to live complaints
    const unsubComplaints = subscribeComplaints((liveComplaints) => {
      if (liveComplaints) {
        setIssues(liveComplaints);
        calculateStats(liveComplaints);
      }
    });

    // Subscribe to live registered citizens
    const unsubUsers = subscribeUsers((liveUsers) => {
      if (liveUsers) {
        setRegisteredUsers(liveUsers);
      }
    });

    return () => {
      if (typeof unsubComplaints === 'function') unsubComplaints();
      if (typeof unsubUsers === 'function') unsubUsers();
    };
  }, []);

  const calculateStats = (allComplaints) => {
    const total = allComplaints.length;
    const reported = allComplaints.filter(c => c.status === 'Pending' || c.status === 'reported').length;
    const in_progress = allComplaints.filter(c => c.status === 'in_progress' || c.status === 'work_started').length;
    const resolved = allComplaints.filter(c => c.status === 'resolved').length;
    const highUrgency = allComplaints.filter(c => (c.upvotes || c.votes || 0) >= 5).length;

    // Group by Ward
    const byWard = {};
    allComplaints.forEach(c => {
      const w = c.ward || c.area || 'Ward 4';
      byWard[w] = (byWard[w] || 0) + 1;
    });

    setStats({
      total,
      reported,
      inProgress: in_progress,
      resolved,
      highUrgency,
      byWard,
      resolvedPercent: total > 0 ? Math.round((resolved / total) * 100) : 0
    });
  };

  const loadData = async () => {
    setLoading(true);
    try {
      const [allComplaints, allUsers] = await Promise.all([
        getComplaints(),
        getUsers()
      ]);
      setIssues(allComplaints || []);
      setRegisteredUsers(allUsers || []);
      calculateStats(allComplaints || []);
    } catch (err) {
      console.error("Authority load error from Firestore:", err);
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
      await updateComplaintStatus(
        selectedIssue.id,
        newStatus,
        workerName,
        resolutionNote,
        resolvedPhotoPreview
      );

      playAudioFeedback('success');
      setSelectedIssue(null);
      loadData();
    } catch (err) {
      console.error("Status update error:", err);
      alert("Failed to update status");
    } finally {
      setUpdating(false);
    }
  };

  const speakSummary = () => {
    if (!stats) return;
    const summary = currentLang === 'te'
      ? `అధికార పోర్టల్ వివరాలు: మొత్తం సమస్యలు ${stats.total}, కొత్తగా నమోదైనవి ${stats.reported}, పురోగతిలో ఉన్నవి ${stats.inProgress}, పరిష్కరించబడినవి ${stats.resolved}.`
      : `Authority Summary: Total grievances: ${stats.total}, New: ${stats.reported}, In Progress: ${stats.inProgress}, Resolved: ${stats.resolved}.`;
    speakText(summary, currentLang);
  };

  // Filter grievances
  const filteredIssues = issues.filter(i => {
    if (filterWard !== 'all' && i.ward !== filterWard && i.area !== filterWard) return false;
    if (filterStatus !== 'all') {
      if (filterStatus === 'reported' && !(i.status === 'Pending' || i.status === 'reported')) return false;
      if (filterStatus === 'in_progress' && !(i.status === 'in_progress' || i.status === 'work_started')) return false;
      if (filterStatus === 'resolved' && i.status !== 'resolved') return false;
    }
    if (selectedCitizenUid && i.uid !== selectedCitizenUid && i.phone !== selectedCitizenUid) return false;
    return true;
  });

  // Filter registered citizens
  const filteredCitizens = registeredUsers.filter(u => {
    if (!citizenSearch.trim()) return true;
    const q = citizenSearch.toLowerCase();
    return (
      (u.name || '').toLowerCase().includes(q) ||
      (u.phone || '').includes(q) ||
      (u.areaName || u.ward || '').toLowerCase().includes(q) ||
      (u.uid || '').toLowerCase().includes(q)
    );
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
            🏛️ Authority Grievance & Citizen Portal
          </h2>
          <p className="text-slate-400 text-xs sm:text-sm mt-1">
            Real-time citizen reporting details, verified login accounts, and resolution workflow.
          </p>
        </div>

        <button
          onClick={speakSummary}
          className="flex items-center space-x-2 bg-slate-800 hover:bg-slate-700 text-amber-300 px-4 py-2.5 rounded-2xl border border-slate-700 text-xs font-extrabold transition active:scale-95 shadow cursor-pointer"
        >
          <Volume2 className="w-4 h-4" />
          <span>Listen to Daily Summary</span>
        </button>
      </div>

      {/* Main Tab Navigation: Grievances Queue vs Registered Citizens */}
      <div className="flex items-center space-x-3 mb-6 bg-slate-100 p-1.5 rounded-2xl border border-slate-200">
        <button
          onClick={() => {
            setActiveTab('grievances');
            playAudioFeedback('click');
          }}
          className={`flex-1 py-3 px-4 rounded-xl font-black text-xs sm:text-sm flex items-center justify-center space-x-2 transition cursor-pointer ${
            activeTab === 'grievances'
              ? 'bg-blue-600 text-white shadow-md'
              : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
          }`}
        >
          <ShieldCheck className="w-4 h-4" />
          <span>📋 Grievances & Reporter Details ({issues.length})</span>
        </button>

        <button
          onClick={() => {
            setActiveTab('citizens');
            playAudioFeedback('click');
          }}
          className={`flex-1 py-3 px-4 rounded-xl font-black text-xs sm:text-sm flex items-center justify-center space-x-2 transition cursor-pointer ${
            activeTab === 'citizens'
              ? 'bg-blue-600 text-white shadow-md'
              : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>👥 Registered Citizens / లాగిన్ వివరాలు ({registeredUsers.length})</span>
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
            <span className="text-xs font-bold text-purple-600 uppercase">Active Citizens</span>
            <p className="text-3xl font-black text-purple-700 mt-1">{registeredUsers.length}</p>
            <span className="text-[11px] text-purple-600 font-bold">Registered Users</span>
          </div>
        </div>
      )}

      {/* ================= VIEW 1: GRIEVANCES QUEUE WITH CITIZEN DETAILS ================= */}
      {activeTab === 'grievances' && (
        <>
          {/* Active Citizen Filter Banner if selected */}
          {selectedCitizenUid && (
            <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-2xl flex items-center justify-between text-xs">
              <span className="font-bold text-blue-900">
                🔍 Filtered for Citizen: <strong>{selectedCitizenUid}</strong>
              </span>
              <button
                onClick={() => setSelectedCitizenUid(null)}
                className="font-black text-blue-600 hover:text-blue-800 underline cursor-pointer"
              >
                Clear Filter (Show All)
              </button>
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
                <option value="all">All Wards (అన్ని వార్డులు)</option>
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
                  className={`px-3 py-1 rounded-xl text-xs font-bold transition capitalize cursor-pointer ${
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
                Live Reports with Citizen Contact & Identity
              </span>
            </div>

            <div className="divide-y divide-slate-100">
              {filteredIssues.length === 0 ? (
                <div className="p-12 text-center text-slate-400">
                  <p className="text-sm font-bold">No grievances found in this category.</p>
                </div>
              ) : (
                filteredIssues.map((issue) => {
                  const cat = CATEGORIES.find(c => c.id === issue.category);
                  const citizenName = issue.citizenName || issue.name || 'Anonymous Citizen';
                  const citizenPhone = issue.phone || '';
                  const issueDate = new Date(issue.createdAt?.toDate ? issue.createdAt.toDate() : (issue.createdAt || Date.now())).toLocaleString();

                  return (
                    <div key={issue.id} className="p-4 sm:p-5 hover:bg-slate-50 transition flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                      <div className="flex items-start space-x-3.5 flex-1">
                        <div className="w-16 h-16 rounded-2xl overflow-hidden bg-slate-100 flex-shrink-0 border border-slate-200">
                          {issue.photoUrl ? (
                            <img src={issue.photoUrl} alt="Complaint" className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-2xl">📸</div>
                          )}
                        </div>

                        <div className="flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="text-xl">{cat?.icon || '📢'}</span>
                            <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full border ${cat?.badgeColor || 'border-slate-300'}`}>
                              {cat?.names.en || issue.category}
                            </span>
                            <span className="text-xs font-bold text-slate-500">
                              {issue.ward || issue.area || 'Ward 4'}
                            </span>
                            {(issue.upvotes || issue.votes || 0) >= 5 && (
                              <span className="bg-red-500 text-white text-[10px] font-black uppercase px-2 py-0.5 rounded-full animate-pulse">
                                🚨 Urgent ({(issue.upvotes || issue.votes)} Votes)
                              </span>
                            )}
                          </div>

                          <h4 className="text-sm sm:text-base font-extrabold text-slate-900 mt-1">
                            {issue.description || issue.title || 'Civic Grievance Reported'}
                          </h4>

                          <p className="text-xs text-slate-500 mt-0.5 flex items-center gap-1">
                            <MapPin className="w-3.5 h-3.5 text-slate-400" />
                            <span>{issue.address || issue.area || 'Ward 4, Municipal Zone'}</span>
                          </p>

                          {/* PROMINENT CITIZEN DETAILS BADGE */}
                          <div className="mt-2.5 p-2.5 bg-blue-50/80 border border-blue-200/80 rounded-xl flex flex-wrap items-center gap-3 text-xs text-slate-700">
                            <div className="flex items-center space-x-1 font-black text-blue-900">
                              <User className="w-3.5 h-3.5 text-blue-600" />
                              <span>నివేదించిన పౌరుడు (Citizen): <strong>{citizenName}</strong></span>
                            </div>

                            {citizenPhone && (
                              <a
                                href={`tel:${citizenPhone}`}
                                className="flex items-center space-x-1 font-black text-emerald-800 bg-emerald-100 hover:bg-emerald-200 px-2.5 py-1 rounded-lg transition"
                                title="Click to Call Citizen"
                              >
                                <Phone className="w-3 h-3 text-emerald-600" />
                                <span>+91 {citizenPhone}</span>
                              </a>
                            )}

                            {issue.uid && (
                              <span className="text-[11px] font-mono text-slate-600 bg-white px-2 py-0.5 rounded border border-slate-200 font-bold">
                                ID: {issue.uid}
                              </span>
                            )}

                            <span className="text-[11px] text-slate-500 flex items-center gap-1 ml-auto">
                              <Clock className="w-3 h-3 text-slate-400" />
                              <span>{issueDate}</span>
                            </span>
                          </div>

                          {issue.assignedTo && (
                            <p className="text-xs text-blue-700 font-semibold mt-1.5 flex items-center gap-1">
                              <Wrench className="w-3.5 h-3.5" />
                              <span>Assigned Staff: <strong>{issue.assignedTo}</strong></span>
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Status & Action Button */}
                      <div className="flex items-center space-x-3 w-full sm:w-auto justify-end">
                        <span className={`text-xs font-black px-3 py-1 rounded-full uppercase ${
                          issue.status === 'resolved'
                            ? 'bg-emerald-100 text-emerald-800'
                            : issue.status === 'in_progress' || issue.status === 'work_started'
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {issue.status === 'Pending' ? 'Reported (Pending)' : issue.status.replace('_', ' ')}
                        </span>

                        <button
                          onClick={() => handleOpenActionModal(issue)}
                          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-black text-xs rounded-xl shadow transition cursor-pointer"
                        >
                          Take Action
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </>
      )}

      {/* ================= VIEW 2: REGISTERED & LOGGED-IN CITIZENS DIRECTORY ================= */}
      {activeTab === 'citizens' && (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden p-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-slate-100">
            <div>
              <h3 className="font-black text-slate-900 text-lg flex items-center gap-2">
                <Users className="w-5 h-5 text-blue-600" />
                <span>లాగిన్ అయిన పౌరుల వివరాలు (Registered Citizens Directory)</span>
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                All citizens who have logged into JanSeva, their verified phone numbers, and activity records.
              </p>
            </div>

            {/* Citizen Search */}
            <div className="relative w-full sm:w-64">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                type="text"
                placeholder="Search citizen name or phone..."
                value={citizenSearch}
                onChange={(e) => setCitizenSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div className="mt-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredCitizens.length === 0 ? (
              <div className="col-span-full text-center py-12 text-slate-400">
                <Users className="w-10 h-10 mx-auto text-slate-300 mb-2" />
                <p className="font-bold text-sm">No registered citizens matching search.</p>
              </div>
            ) : (
              filteredCitizens.map((user) => {
                const userComplaints = issues.filter(i => i.uid === user.uid || i.phone === user.phone);
                const regDate = user.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'Active Citizen';

                return (
                  <div key={user.uid} className="bg-slate-50 hover:bg-blue-50/40 border border-slate-200 rounded-2xl p-4 transition shadow-sm space-y-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 rounded-full bg-blue-600 text-white font-black text-base flex items-center justify-center shadow">
                          {user.name ? user.name.charAt(0).toUpperCase() : 'C'}
                        </div>
                        <div>
                          <h4 className="font-black text-slate-900 text-sm">{user.name || 'Citizen'}</h4>
                          <span className="text-[11px] font-bold text-slate-500">Role: {user.role || 'Citizen'}</span>
                        </div>
                      </div>

                      <span className="bg-blue-100 text-blue-800 text-[10px] font-black px-2 py-0.5 rounded-full">
                        {userComplaints.length} Grievance{userComplaints.length === 1 ? '' : 's'}
                      </span>
                    </div>

                    <div className="space-y-1.5 text-xs text-slate-600 pt-2 border-t border-slate-200/60">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-slate-500">Phone Number:</span>
                        <a
                          href={`tel:${user.phone}`}
                          className="font-black text-emerald-700 bg-emerald-100 hover:bg-emerald-200 px-2 py-0.5 rounded-lg flex items-center gap-1 transition"
                        >
                          <Phone className="w-3 h-3 text-emerald-600" />
                          <span>+91 {user.phone}</span>
                        </a>
                      </div>

                      <div className="flex items-center justify-between">
                        <span className="font-bold text-slate-500">Ward / Area:</span>
                        <span className="font-extrabold text-slate-800">{user.areaName || user.ward || 'Ward 4'}</span>
                      </div>

                      <div className="flex items-center justify-between">
                        <span className="font-bold text-slate-500">Citizen ID:</span>
                        <span className="font-mono text-[11px] text-slate-700 bg-white px-1.5 py-0.5 rounded border border-slate-200">
                          {user.uid}
                        </span>
                      </div>

                      <div className="flex items-center justify-between">
                        <span className="font-bold text-slate-500">Registered:</span>
                        <span className="text-slate-700 font-semibold">{regDate}</span>
                      </div>
                    </div>

                    {userComplaints.length > 0 && (
                      <button
                        onClick={() => {
                          setSelectedCitizenUid(user.uid);
                          setActiveTab('grievances');
                          playAudioFeedback('click');
                        }}
                        className="w-full py-2 bg-white hover:bg-blue-600 hover:text-white border border-blue-200 text-blue-700 rounded-xl text-xs font-black transition flex items-center justify-center gap-1 shadow-sm cursor-pointer"
                      >
                        <Search className="w-3 h-3" />
                        <span>View Citizen's {userComplaints.length} Grievances</span>
                      </button>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

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
                className="text-slate-400 hover:text-slate-600 text-sm font-bold cursor-pointer"
              >
                ✕ Close
              </button>
            </div>

            {/* CITIZEN REPORTER DETAILS BOX IN MODAL */}
            <div className="bg-blue-50/80 border border-blue-200 rounded-2xl p-3.5 mb-4 space-y-2 text-xs">
              <span className="font-black text-blue-900 uppercase text-[10px] tracking-wider block">
                👤 Citizen Reporter Profile (ఫిర్యాదు చేసిన పౌరుని వివరాలు)
              </span>

              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-black text-slate-900 text-sm">
                    {selectedIssue.citizenName || selectedIssue.name || 'Anonymous Citizen'}
                  </h4>
                  <p className="text-[11px] text-slate-500 font-bold">
                    Citizen ID: {selectedIssue.uid || 'N/A'}
                  </p>
                </div>

                {selectedIssue.phone && (
                  <a
                    href={`tel:${selectedIssue.phone}`}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white font-black px-3 py-1.5 rounded-xl flex items-center gap-1.5 shadow transition"
                  >
                    <Phone className="w-3.5 h-3.5" />
                    <span>Call: +91 {selectedIssue.phone}</span>
                  </a>
                )}
              </div>

              <div className="pt-2 border-t border-blue-200/60 grid grid-cols-2 gap-2 text-[11px] text-slate-600">
                <div>
                  <span className="font-bold text-slate-500">Location: </span>
                  <span className="font-extrabold text-slate-800">{selectedIssue.address || selectedIssue.area || selectedIssue.ward}</span>
                </div>
                <div>
                  <span className="font-bold text-slate-500">Reported At: </span>
                  <span className="font-semibold text-slate-800">
                    {new Date(selectedIssue.createdAt?.toDate ? selectedIssue.createdAt.toDate() : (selectedIssue.createdAt || Date.now())).toLocaleString()}
                  </span>
                </div>
                {selectedIssue.coordinates && (
                  <div className="col-span-2">
                    <span className="font-bold text-slate-500">GPS Pin: </span>
                    <span className="font-mono text-slate-800">
                      {selectedIssue.coordinates.lat?.toFixed(4)}, {selectedIssue.coordinates.lng?.toFixed(4)}
                    </span>
                  </div>
                )}
              </div>
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
                  <option value="reported">🔴 1. Reported (Pending Assignment)</option>
                  <option value="work_started">🔵 2. Work Started (Assigned / Dispatched)</option>
                  <option value="in_progress">🟡 3. In Progress (On-site Action)</option>
                  <option value="resolved">🟢 4. Resolved (Work Completed)</option>
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
                      className="absolute bottom-2 right-2 bg-black/70 text-white text-xs px-2.5 py-1 rounded-lg cursor-pointer"
                    >
                      Change Photo
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full py-4 border-2 border-dashed border-slate-300 hover:border-blue-500 rounded-xl text-xs font-bold text-slate-600 flex items-center justify-center space-x-2 bg-slate-50 cursor-pointer"
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
                  className="flex-1 py-3 rounded-xl border border-slate-200 text-slate-700 font-bold text-sm hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={updating}
                  className="flex-1 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-sm shadow transition disabled:opacity-50 cursor-pointer"
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
