import React, { useState, useEffect } from 'react';
import { ThumbsUp, Volume2, MapPin, Clock, CheckCircle2, AlertCircle, Wrench, Filter, Search, Sparkles } from 'lucide-react';
import { CATEGORIES, UI_STRINGS } from '../utils/translations';
import { speakText, playAudioFeedback } from '../utils/speech';

export default function IssueFeed({ currentLang }) {
  const [issues, setIssues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterCategory, setFilterCategory] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [votingId, setVotingId] = useState(null);
  const [activePhotoView, setActivePhotoView] = useState({}); // { [issueId]: 'before' | 'after' }

  useEffect(() => {
    fetchIssues();
  }, [filterCategory, filterStatus]);

  const fetchIssues = async () => {
    setLoading(true);
    try {
      let url = `/api/issues?sortBy=urgent`;
      if (filterCategory !== 'all') url += `&category=${filterCategory}`;
      if (filterStatus !== 'all') url += `&status=${filterStatus}`;
      if (searchQuery) url += `&search=${encodeURIComponent(searchQuery)}`;

      const res = await fetch(url);
      const data = await res.json();
      if (data.success) {
        setIssues(data.data);
      }
    } catch (err) {
      console.error("Failed to load issues:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchIssues();
  };

  const handleVote = async (id) => {
    playAudioFeedback('vote');
    setVotingId(id);

    try {
      const res = await fetch(`/api/issues/${id}/vote`, { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        setIssues(prev => prev.map(issue => issue.id === id ? data.data : issue));

        const voteSpeech = {
          hi: 'धन्यवाद! आपके वोट से इस समस्या की प्राथमिकता बढ़ गई है।',
          te: 'ధన్యవాదాలు! మీ ఓటుతో దీని ప్రాధాన్యత పెరిగింది.',
          ta: 'நன்றி! உங்கள் ஆதரவால் இதன் முன்னுரிமை அதிகரித்துள்ளது.',
          kn: 'ಧನ್ಯವಾದಗಳು! ನಿಮ್ಮ ಮತದಿಂದ ಇದರ ಆದ್ಯತೆ ಹೆಚ್ಚಿದೆ.',
          mr: 'धन्यवाद! आपल्या मताने या समस्येला प्राधान्य मिळाले.',
          en: 'Thank you! Your vote raised this issue urgency.'
        };
        speakText(voteSpeech[currentLang] || voteSpeech.en, currentLang);
      }
    } catch (err) {
      console.error("Vote failed:", err);
    } finally {
      setVotingId(null);
    }
  };

  const speakIssueDetails = (issue) => {
    playAudioFeedback('click');
    const cat = CATEGORIES.find(c => c.id === issue.category);
    const catName = cat?.names[currentLang] || issue.category;
    const statusText = issue.status === 'resolved'
      ? (UI_STRINGS.statusResolved[currentLang] || 'Resolved')
      : issue.status === 'in_progress'
      ? (UI_STRINGS.statusInProgress[currentLang] || 'In Progress')
      : (UI_STRINGS.statusReported[currentLang] || 'Reported');

    const speech = `${catName}. स्थान: ${issue.address}. स्थिति: ${statusText}. नागरिकों के कुल वोट: ${issue.votes}. ${issue.voiceTranscript ? 'विवरण: ' + issue.voiceTranscript : ''}`;
    speakText(speech, currentLang);
  };

  const getStatusBadge = (status) => {
    if (status === 'resolved') {
      return (
        <span className="inline-flex items-center space-x-1 bg-emerald-100 text-emerald-800 border border-emerald-300 font-extrabold text-xs px-3 py-1 rounded-full">
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
          <span>{UI_STRINGS.statusResolved[currentLang] || 'Resolved'}</span>
        </span>
      );
    }
    if (status === 'in_progress') {
      return (
        <span className="inline-flex items-center space-x-1 bg-amber-100 text-amber-800 border border-amber-300 font-extrabold text-xs px-3 py-1 rounded-full">
          <Wrench className="w-3.5 h-3.5 text-amber-600 animate-spin" />
          <span>{UI_STRINGS.statusInProgress[currentLang] || 'In Progress'}</span>
        </span>
      );
    }
    return (
      <span className="inline-flex items-center space-x-1 bg-red-100 text-red-800 border border-red-300 font-extrabold text-xs px-3 py-1 rounded-full">
        <AlertCircle className="w-3.5 h-3.5 text-red-600" />
        <span>{UI_STRINGS.statusReported[currentLang] || 'Reported'}</span>
      </span>
    );
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-6">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="text-2xl sm:text-3xl font-black text-slate-900 flex items-center gap-2">
            <span>{UI_STRINGS.navFeed[currentLang] || 'Public Issues'}</span>
            <span className="text-sm font-extrabold bg-blue-100 text-blue-800 px-3 py-0.5 rounded-full">
              {issues.length} Issues
            </span>
          </h2>
          <p className="text-slate-500 text-sm mt-1">
            Track problem resolution, listen to audio reports, and vote to escalate urgency.
          </p>
        </div>

        {/* Search */}
        <form onSubmit={handleSearchSubmit} className="flex items-center space-x-2">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            <input
              type="text"
              placeholder="Search ward, locality..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 pr-4 py-2 bg-white rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 w-48 sm:w-64"
            />
          </div>
          <button
            type="submit"
            className="px-4 py-2 bg-blue-600 text-white rounded-xl text-sm font-bold shadow hover:bg-blue-700 transition"
          >
            Find
          </button>
        </form>
      </div>

      {/* Category Filter Pills (with Spoken Prompts) */}
      <div className="flex items-center space-x-2 overflow-x-auto pb-3 mb-4">
        <button
          onClick={() => { playAudioFeedback('click'); setFilterCategory('all'); }}
          className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-extrabold transition whitespace-nowrap ${
            filterCategory === 'all'
              ? 'bg-slate-900 text-white shadow-md'
              : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          All (सभी)
        </button>

        {CATEGORIES.map((cat) => {
          const isSelected = filterCategory === cat.id;
          const name = cat.names[currentLang] || cat.names.en;

          return (
            <button
              key={cat.id}
              onClick={() => { playAudioFeedback('click'); setFilterCategory(cat.id); }}
              className={`flex items-center space-x-1.5 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-extrabold transition whitespace-nowrap border ${
                isSelected
                  ? `${cat.color} border-slate-900 shadow-md scale-105`
                  : 'bg-white text-slate-700 hover:bg-slate-100 border-slate-200'
              }`}
            >
              <span>{cat.icon}</span>
              <span>{name}</span>
            </button>
          );
        })}
      </div>

      {/* Status Filter Tabs */}
      <div className="flex items-center space-x-2 mb-6">
        <span className="text-xs font-bold text-slate-400 uppercase mr-1">Status:</span>
        {[
          { id: 'all', label: 'All' },
          { id: 'reported', label: UI_STRINGS.statusReported[currentLang] || 'Reported', color: 'text-red-600' },
          { id: 'in_progress', label: UI_STRINGS.statusInProgress[currentLang] || 'In Progress', color: 'text-amber-600' },
          { id: 'resolved', label: UI_STRINGS.statusResolved[currentLang] || 'Resolved', color: 'text-emerald-600' }
        ].map(st => (
          <button
            key={st.id}
            onClick={() => { playAudioFeedback('click'); setFilterStatus(st.id); }}
            className={`px-3 py-1 rounded-lg text-xs font-bold transition ${
              filterStatus === st.id
                ? 'bg-blue-100 text-blue-800 border border-blue-300'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            {st.label}
          </button>
        ))}
      </div>

      {/* Loading Skeleton */}
      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map(n => (
            <div key={n} className="bg-white rounded-3xl p-5 border border-slate-200 animate-pulse h-48"></div>
          ))}
        </div>
      ) : issues.length === 0 ? (
        <div className="bg-white rounded-3xl p-12 text-center border border-slate-200">
          <span className="text-6xl mb-3 block">🎉</span>
          <h3 className="text-xl font-bold text-slate-800">No issues found in this category!</h3>
          <p className="text-slate-500 text-sm mt-1">Everything looks clean and resolved here.</p>
        </div>
      ) : (
        /* Issues Feed Cards */
        <div className="space-y-5">
          {issues.map((issue) => {
            const cat = CATEGORIES.find(c => c.id === issue.category);
            const isCritical = issue.votes >= 5 && issue.status !== 'resolved';
            const showAfter = activePhotoView[issue.id] === 'after' && issue.resolvedPhotoUrl;

            return (
              <div
                key={issue.id}
                className={`bg-white rounded-3xl overflow-hidden border shadow-sm transition hover:shadow-md ${
                  isCritical ? 'border-red-400 ring-2 ring-red-300' : 'border-slate-200'
                }`}
              >
                {/* Critical Urgency Banner */}
                {isCritical && (
                  <div className="bg-gradient-to-r from-red-600 to-rose-600 text-white px-4 py-1.5 text-xs font-black tracking-wide uppercase flex items-center justify-between">
                    <span className="flex items-center space-x-1.5">
                      <span className="inline-block w-2 h-2 rounded-full bg-white animate-ping"></span>
                      <span>🚨 CRITICAL ISSUE - {issue.votes} CITIZENS AFFECTED</span>
                    </span>
                    <span>High Municipal Priority</span>
                  </div>
                )}

                <div className="p-5 sm:p-6 flex flex-col md:flex-row gap-5">
                  {/* Photo Section with Before/After Toggle if Resolved */}
                  <div className="w-full md:w-56 flex-shrink-0">
                    <div className="relative rounded-2xl overflow-hidden h-48 md:h-full min-h-[160px] bg-slate-100 border border-slate-200 group">
                      <img
                        src={showAfter ? issue.resolvedPhotoUrl : issue.photoUrl}
                        alt="Issue"
                        className="w-full h-full object-cover"
                      />

                      {/* Photo Badge */}
                      <span className={`absolute top-2 left-2 text-[11px] font-black uppercase px-2.5 py-0.5 rounded-full shadow ${
                        showAfter ? 'bg-emerald-600 text-white' : 'bg-slate-900/80 text-white backdrop-blur'
                      }`}>
                        {showAfter ? '✓ AFTER (FIXED)' : 'BEFORE (REPORT)'}
                      </span>

                      {/* Toggle button if both before & after exist */}
                      {issue.resolvedPhotoUrl && (
                        <div className="absolute bottom-2 left-2 right-2 flex gap-1">
                          <button
                            type="button"
                            onClick={() => setActivePhotoView(prev => ({ ...prev, [issue.id]: 'before' }))}
                            className={`flex-1 py-1 text-[11px] font-black rounded-lg transition ${
                              !showAfter ? 'bg-blue-600 text-white' : 'bg-black/60 text-white/80 hover:bg-black/80'
                            }`}
                          >
                            Before
                          </button>
                          <button
                            type="button"
                            onClick={() => setActivePhotoView(prev => ({ ...prev, [issue.id]: 'after' }))}
                            className={`flex-1 py-1 text-[11px] font-black rounded-lg transition ${
                              showAfter ? 'bg-emerald-600 text-white' : 'bg-black/60 text-white/80 hover:bg-black/80'
                            }`}
                          >
                            After Fixed ✨
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Details Section */}
                  <div className="flex-1 flex flex-col justify-between">
                    <div>
                      {/* Top Meta: Category + Status Badge + Listen Button */}
                      <div className="flex items-center justify-between gap-2 mb-2">
                        <div className="flex items-center space-x-2">
                          <span className="text-2xl">{cat?.icon || '📢'}</span>
                          <span className={`text-xs font-black uppercase px-2.5 py-0.5 rounded-full border ${cat?.badgeColor || 'bg-slate-100'}`}>
                            {cat?.names[currentLang] || issue.category}
                          </span>
                          {getStatusBadge(issue.status)}
                        </div>

                        {/* Read Issue Details Aloud Button (For Non-Literate Users) */}
                        <button
                          onClick={() => speakIssueDetails(issue)}
                          className="w-9 h-9 rounded-full bg-blue-50 hover:bg-blue-100 text-blue-600 flex items-center justify-center transition active:scale-95 shadow-sm"
                          title="Listen to details"
                        >
                          <Volume2 className="w-5 h-5" />
                        </button>
                      </div>

                      {/* Issue Title */}
                      <h3 className="text-lg sm:text-xl font-black text-slate-900 leading-snug">
                        {issue.title}
                      </h3>

                      {/* Voice Note / Transcript if provided */}
                      {issue.voiceTranscript && (
                        <div className="mt-2 p-2.5 bg-slate-50 rounded-xl border border-slate-200 text-xs sm:text-sm text-slate-700 italic flex items-start space-x-2">
                          <span className="text-base">🎙️</span>
                          <span>"{issue.voiceTranscript}"</span>
                        </div>
                      )}

                      {/* Authority Resolution Note if resolved */}
                      {issue.resolutionNote && (
                        <div className="mt-2 p-2.5 bg-emerald-50 rounded-xl border border-emerald-200 text-xs text-emerald-900 font-medium">
                          <span className="font-bold">Authority Note: </span>
                          <span>{issue.resolutionNote}</span>
                        </div>
                      )}

                      {/* Location and Ward */}
                      <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-slate-500">
                        <span className="flex items-center space-x-1 font-semibold text-slate-700">
                          <MapPin className="w-3.5 h-3.5 text-blue-500" />
                          <span>{issue.address}</span>
                        </span>
                        <span className="flex items-center space-x-1">
                          <Clock className="w-3.5 h-3.5" />
                          <span>{new Date(issue.createdAt).toLocaleDateString()}</span>
                        </span>
                      </div>
                    </div>

                    {/* Progress Bar & Citizen Voting Button */}
                    <div className="mt-4 pt-3 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3">
                      {/* Step Progress Dots */}
                      <div className="flex items-center space-x-2 w-full sm:w-auto">
                        <div className="flex items-center space-x-1.5 text-xs font-bold">
                          <span className={`w-3 h-3 rounded-full ${issue.status ? 'bg-blue-600' : 'bg-slate-300'}`}></span>
                          <span className="text-slate-600">Reported</span>
                          <span className="text-slate-300">→</span>
                          <span className={`w-3 h-3 rounded-full ${issue.status === 'in_progress' || issue.status === 'resolved' ? 'bg-amber-500' : 'bg-slate-300'}`}></span>
                          <span className="text-slate-600">In Progress</span>
                          <span className="text-slate-300">→</span>
                          <span className={`w-3 h-3 rounded-full ${issue.status === 'resolved' ? 'bg-emerald-500' : 'bg-slate-300'}`}></span>
                          <span className="text-slate-600">Resolved</span>
                        </div>
                      </div>

                      {/* Citizen Upvote Button ("Me Too!" / "Urgent") */}
                      <button
                        onClick={() => handleVote(issue.id)}
                        disabled={votingId === issue.id || issue.status === 'resolved'}
                        className={`w-full sm:w-auto px-4 py-2 rounded-2xl font-black text-xs sm:text-sm flex items-center justify-center space-x-2 transition active:scale-95 shadow-sm ${
                          issue.status === 'resolved'
                            ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                            : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white'
                        }`}
                      >
                        <ThumbsUp className="w-4 h-4" />
                        <span>{UI_STRINGS.btnVoteUrgent[currentLang] || 'Me Too!'}</span>
                        <span className="bg-white/20 px-2 py-0.5 rounded-full text-xs font-black">
                          {issue.votes}
                        </span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
