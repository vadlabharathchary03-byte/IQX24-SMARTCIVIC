import React, { useState, useEffect } from 'react';
import { ThumbsUp, Volume2, MapPin, Clock, CheckCircle2, AlertCircle, Wrench, Filter, Search, Sparkles, Check, Activity, FileCheck, ArrowRight, UserCheck } from 'lucide-react';
import { CATEGORIES, UI_STRINGS } from '../utils/translations';
import { speakText, playAudioFeedback } from '../utils/speech';
import { getComplaints, voteComplaint, subscribeComplaints } from '../firebaseActions';

// Resolution Stepper Tracker Component for each Issue
function IssueResolutionTracker({ issue, currentLang }) {
  // Determine level:
  // 1 = Reported
  // 2 = Work Started (assignedTo present or status is work_started)
  // 3 = In Progress (status is in_progress)
  // 4 = Work Completed / Resolved (status is resolved)
  let level = 1;
  if (issue.status === 'resolved') {
    level = 4;
  } else if (issue.status === 'in_progress') {
    level = 3;
  } else if (issue.status === 'work_started' || issue.assignedTo) {
    level = 2;
  } else {
    level = 1;
  }

  const steps = [
    {
      num: 1,
      name: {
        en: '1. Problem Reported',
        te: '1. సమస్య నమోదైంది',
        hi: '1. शिकायत दर्ज हुई',
        ta: '1. புகார் பதிவானது',
        kn: '1. ದೂರು ದಾಖಲಾಗಿದೆ',
        mr: '1. तक्रार नोंदवली'
      },
      desc: {
        en: 'Complaint Registered',
        te: 'రసీదు రికార్డయింది',
        hi: 'शिकायत दर्ज हुई',
        ta: 'பதிவு செய்யப்பட்டது',
        kn: 'ದಾಖಲು ಮಾಡಲಾಗಿದೆ',
        mr: 'नोंदणीकृत'
      },
      date: new Date(issue.createdAt?.toDate ? issue.createdAt.toDate() : (issue.createdAt || Date.now())).toLocaleDateString()
    },
    {
      num: 2,
      name: {
        en: '2. Work Started',
        te: '2. పని ప్రారంభమైంది',
        hi: '2. काम शुरू हुआ',
        ta: '2. வேலை தொடங்கியது',
        kn: '2. ಕೆಲಸ ಆರಂಭವಾಗಿದೆ',
        mr: '2. काम सुरू झाले'
      },
      desc: {
        en: issue.assignedTo ? `Staff: ${issue.assignedTo}` : (level >= 2 ? 'Staff Dispatched' : 'Pending Assignment'),
        te: issue.assignedTo ? `సిబ్బంది: ${issue.assignedTo}` : (level >= 2 ? 'సిబ్బందికి అప్పగించబడింది' : 'పరిశీలనలో ఉంది'),
        hi: issue.assignedTo ? `कर्मचारी: ${issue.assignedTo}` : (level >= 2 ? 'स्टाफ भेजा गया' : 'आवंटन लंबित'),
        ta: issue.assignedTo ? `${issue.assignedTo}` : (level >= 2 ? 'பணியாளர் நியமிப்பு' : 'நிலுவையில்'),
        kn: issue.assignedTo ? `${issue.assignedTo}` : (level >= 2 ? 'ಸಿಬ್ಬಂದಿ ನಿಯೋಜನೆ' : 'ಬಾಕಿ ಇದೆ'),
        mr: issue.assignedTo ? `${issue.assignedTo}` : (level >= 2 ? 'कर्मचारी नियुक्त' : 'प्रलंबित')
      }
    },
    {
      num: 3,
      name: {
        en: '3. Work In Progress',
        te: '3. పని జరుగుతోంది',
        hi: '3. काम प्रगति पर है',
        ta: '3. வேலை நடக்கிறது',
        kn: '3. ಕೆಲಸ ಪ್ರಗತಿಯಲ್ಲಿದೆ',
        mr: '3. काम चालू आहे'
      },
      desc: {
        en: level >= 3 ? 'Active Field Work' : 'Field Action Queued',
        te: level >= 3 ? 'క్షేత్రస్థాయిలో పని జరుగుతోంది' : 'వరుసలో ఉంది',
        hi: level >= 3 ? 'साइट पर काम चालू है' : 'कतार में है',
        ta: level >= 3 ? 'வேலை நடக்கிறது' : 'வரிசையில் உள்ளது',
        kn: level >= 3 ? 'ಕಾರ್ಯ ಪ್ರಗತಿಯಲ್ಲಿದೆ' : 'ಸರತಿಯಲ್ಲಿದೆ',
        mr: level >= 3 ? 'जागेवर काम सुरू आहे' : 'प्रतिक्षेत आहे'
      }
    },
    {
      num: 4,
      name: {
        en: '4. Work Completed',
        te: '4. పని పూర్తయింది',
        hi: '4. काम पूरा हुआ',
        ta: '4. வேலை முடிந்தது',
        kn: '4. ಕೆಲಸ ಪೂರ್ಣಗೊಂಡಿದೆ',
        mr: '4. काम पूर्ण झाले'
      },
      desc: {
        en: level === 4 ? (issue.resolutionNote || 'Resolved & Verified ✓') : 'Final Resolution',
        te: level === 4 ? (issue.resolutionNote || 'పరిష్కారం పూర్తయింది ✓') : 'చివరి పరిష్కారం',
        hi: level === 4 ? (issue.resolutionNote || 'सफलतापूर्वक हल हुआ ✓') : 'अंतिम समाधान',
        ta: level === 4 ? 'தீர்க்கப்பட்டது ✓' : 'இறுதி தீர்வு',
        kn: level === 4 ? 'ಪೂರ್ಣಗೊಂಡಿದೆ ✓' : 'ಅಂತಿಮ ಪರಿಹಾರ',
        mr: level === 4 ? 'सोडवले गेले ✓' : 'अंतिम टप्पा'
      }
    }
  ];

  // Visual width for connecting gradient progress line
  const progressPercent = level === 1 ? '12%' : level === 2 ? '38%' : level === 3 ? '72%' : '100%';

  return (
    <div className="w-full bg-slate-50/90 rounded-2xl p-4 sm:p-5 border border-slate-200 space-y-3.5 shadow-2xs">
      {/* Tracker Header Bar */}
      <div className="flex items-center justify-between flex-wrap gap-2 pb-2.5 border-b border-slate-200">
        <div className="flex items-center space-x-2">
          <span className="relative flex h-3 w-3">
            <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
              level === 4 ? 'bg-emerald-400' : level === 3 ? 'bg-amber-400' : 'bg-blue-400'
            }`}></span>
            <span className={`relative inline-flex rounded-full h-3 w-3 ${
              level === 4 ? 'bg-emerald-500' : level === 3 ? 'bg-amber-500' : 'bg-blue-600'
            }`}></span>
          </span>
          <span className="text-xs font-black uppercase tracking-wider text-slate-800">
            {currentLang === 'te' ? 'లైవ్ పని పురోగతి ట్రాకింగ్ (Live Work Tracking)' : 'Live Resolution Tracking'}
          </span>
        </div>

        {/* Current Active Status Pill */}
        <div className={`px-3 py-1 rounded-full text-xs font-black border flex items-center space-x-1.5 shadow-xs ${
          level === 4
            ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
            : level === 3
            ? 'bg-amber-100 text-amber-900 border-amber-300 animate-pulse'
            : level === 2
            ? 'bg-blue-100 text-blue-900 border-blue-300'
            : 'bg-red-100 text-red-800 border-red-300'
        }`}>
          <span>
            {level === 4
              ? (currentLang === 'te' ? '✅ పని పూర్తయింది (Work Completed)' : '✅ Work Completed')
              : level === 3
              ? (currentLang === 'te' ? '⏳ పని జరుగుతోంది (In Progress)' : '⏳ Work In Progress')
              : level === 2
              ? (currentLang === 'te' ? '👷 పని ప్రారంభమైంది (Work Started)' : '👷 Work Started')
              : (currentLang === 'te' ? '📝 సమస్య నమోదైంది (Reported)' : '📝 Problem Reported')}
          </span>
        </div>
      </div>

      {/* Stepper Visual Bar */}
      <div className="relative pt-3 pb-2 px-2">
        {/* Gray Background Connecting Line */}
        <div className="absolute top-7 left-6 right-6 h-2 bg-slate-200 rounded-full -translate-y-1/2"></div>
        
        {/* Active Gradient Connecting Line */}
        <div
          className="absolute top-7 left-6 h-2 bg-gradient-to-r from-blue-600 via-amber-500 to-emerald-500 rounded-full -translate-y-1/2 transition-all duration-700 ease-out"
          style={{ width: `calc(${progressPercent} - 16px)` }}
        ></div>

        {/* 4 Milestone Step Nodes */}
        <div className="relative grid grid-cols-4 gap-2 text-center">
          {steps.map((step) => {
            const isCompleted = level > step.num;
            const isCurrent = level === step.num;
            const isPending = level < step.num;

            return (
              <div key={step.num} className="flex flex-col items-center group">
                {/* Node Circle */}
                <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center font-black text-xs sm:text-sm transition-all duration-300 z-10 ${
                  isCompleted
                    ? 'bg-emerald-600 text-white shadow-md ring-4 ring-emerald-100'
                    : isCurrent
                    ? 'bg-gradient-to-tr from-blue-600 to-indigo-600 text-white shadow-xl ring-4 ring-blue-200 scale-110'
                    : 'bg-white text-slate-400 border-2 border-slate-300 shadow-2xs'
                }`}>
                  {isCompleted ? (
                    <Check className="w-5 h-5 stroke-[3]" />
                  ) : isCurrent ? (
                    <span className="font-black text-xs sm:text-sm">{step.num}</span>
                  ) : (
                    <span className="font-bold">{step.num}</span>
                  )}
                </div>

                {/* Step Title */}
                <p className={`mt-2 text-[11px] sm:text-xs font-black max-w-full leading-tight ${
                  isCurrent
                    ? 'text-blue-900 font-extrabold'
                    : isCompleted
                    ? 'text-emerald-900'
                    : 'text-slate-500'
                }`}>
                  {step.name[currentLang] || step.name.en}
                </p>

                {/* Step Subtitle / Description */}
                <p className={`text-[10px] sm:text-[11px] font-semibold leading-tight line-clamp-1 max-w-full mt-0.5 ${
                  isCurrent ? 'text-blue-700 font-bold' : isCompleted ? 'text-slate-600' : 'text-slate-400'
                }`}>
                  {typeof step.desc === 'object' ? (step.desc[currentLang] || step.desc.en) : step.desc}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

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
    // Real-time updates from Firestore complaints collection
    const unsubscribe = subscribeComplaints((liveComplaints) => {
      if (liveComplaints && liveComplaints.length > 0) {
        setIssues(liveComplaints);
      }
    });
    return () => {
      if (typeof unsubscribe === 'function') unsubscribe();
    };
  }, [filterCategory, filterStatus]);

  const fetchIssues = async () => {
    setLoading(true);
    try {
      const data = await getComplaints();
      let filtered = data;
      if (filterCategory !== 'all') {
        filtered = filtered.filter(item => item.category === filterCategory);
      }
      if (filterStatus !== 'all') {
        filtered = filtered.filter(item => {
          if (filterStatus === 'reported') return item.status === 'Pending' || item.status === 'reported';
          if (filterStatus === 'in_progress') return item.status === 'in_progress' || item.status === 'work_started';
          if (filterStatus === 'resolved') return item.status === 'resolved';
          return true;
        });
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        filtered = filtered.filter(item => 
          (item.description || '').toLowerCase().includes(q) ||
          (item.citizenName || '').toLowerCase().includes(q) ||
          (item.area || '').toLowerCase().includes(q) ||
          (item.ward || '').toLowerCase().includes(q)
        );
      }
      setIssues(filtered);
    } catch (err) {
      console.error("Failed to load issues from Firestore:", err);
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
      await voteComplaint(id);
      setIssues(prev => prev.map(issue => issue.id === id ? { ...issue, upvotes: (issue.upvotes || 0) + 1 } : issue));

      const voteSpeech = {
        hi: 'धन्यवाद! आपके वोट से इस समस्या की प्राथमिकता बढ़ गई है।',
        te: 'ధన్యవాదాలు! మీ ఓటుతో దీని ప్రాధాన్యత పెరిగింది.',
        ta: 'நன்றி! உங்கள் ஆதரவால் இதன் முன்னுரிமை அதிகரித்துள்ளது.',
        kn: 'ಧನ್ಯವಾದಗಳು! ನಿಮ್ಮ ಮತದಿಂದ ಇದರ ಆದ್ಯತೆ ಹೆಚ್ಚಿದೆ.',
        mr: 'धन्यवाद! आपल्या मताने या समस्येला प्राधान्य मिळाले.',
        en: 'Thank you! Your vote raised this issue urgency.'
      };
      speakText(voteSpeech[currentLang] || voteSpeech.en, currentLang);
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
      ? (currentLang === 'te' ? 'పని పూర్తయింది, సమస్య పరిష్కరించబడింది' : (UI_STRINGS.statusResolved[currentLang] || 'Work Completed'))
      : issue.status === 'in_progress'
      ? (currentLang === 'te' ? 'పని జరుగుతోంది, పురోగతిలో ఉంది' : (UI_STRINGS.statusInProgress[currentLang] || 'In Progress'))
      : (issue.status === 'work_started' || issue.assignedTo)
      ? (currentLang === 'te' ? `పని ప్రారంభమైంది. కేటాయించిన వర్కర్: ${issue.assignedTo || 'సిబ్బంది'}` : 'Work Started')
      : (currentLang === 'te' ? 'సమస్య నమోదైంది, పరిశీలనలో ఉంది' : (UI_STRINGS.statusReported[currentLang] || 'Reported'));

    const speech = `${catName}. స్థలం: ${issue.address}. ప్రస్తుత పని ట్రాకింగ్ స్థితి: ${statusText}. పౌరుల మద్దతు ఓట్లు: ${issue.votes}. ${issue.voiceTranscript ? 'వివరాలు: ' + issue.voiceTranscript : ''}`;
    speakText(speech, currentLang);
  };

  const getStatusBadge = (status, assignedTo) => {
    if (status === 'resolved') {
      return (
        <span className="inline-flex items-center space-x-1.5 bg-emerald-100 text-emerald-800 border border-emerald-300 font-black text-xs px-3 py-1 rounded-full shadow-2xs">
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
          <span>{currentLang === 'te' ? 'పని పూర్తయింది' : (UI_STRINGS.statusResolved[currentLang] || 'Work Completed')}</span>
        </span>
      );
    }
    if (status === 'in_progress') {
      return (
        <span className="inline-flex items-center space-x-1.5 bg-amber-100 text-amber-900 border border-amber-300 font-black text-xs px-3 py-1 rounded-full shadow-2xs">
          <Wrench className="w-3.5 h-3.5 text-amber-600 animate-spin" />
          <span>{currentLang === 'te' ? 'పని జరుగుతోంది' : (UI_STRINGS.statusInProgress[currentLang] || 'In Progress')}</span>
        </span>
      );
    }
    if (status === 'work_started' || assignedTo) {
      return (
        <span className="inline-flex items-center space-x-1.5 bg-blue-100 text-blue-900 border border-blue-300 font-black text-xs px-3 py-1 rounded-full shadow-2xs">
          <UserCheck className="w-3.5 h-3.5 text-blue-600" />
          <span>{currentLang === 'te' ? 'పని ప్రారంభమైంది' : 'Work Started'}</span>
        </span>
      );
    }
    return (
      <span className="inline-flex items-center space-x-1.5 bg-red-100 text-red-800 border border-red-300 font-black text-xs px-3 py-1 rounded-full shadow-2xs">
        <AlertCircle className="w-3.5 h-3.5 text-red-600" />
        <span>{currentLang === 'te' ? 'నమోదైంది' : (UI_STRINGS.statusReported[currentLang] || 'Reported')}</span>
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
      <div className="flex items-center space-x-2 mb-6 overflow-x-auto pb-1">
        <span className="text-xs font-black text-slate-400 uppercase mr-1">Status:</span>
        {[
          { id: 'all', label: currentLang === 'te' ? 'అన్నీ (All)' : 'All' },
          { id: 'reported', label: currentLang === 'te' ? 'నమోదైంది (Reported)' : (UI_STRINGS.statusReported[currentLang] || 'Reported'), color: 'text-red-600' },
          { id: 'work_started', label: currentLang === 'te' ? 'పని ప్రారంభం (Started)' : (UI_STRINGS.statusWorkStarted?.[currentLang] || 'Work Started'), color: 'text-blue-600' },
          { id: 'in_progress', label: currentLang === 'te' ? 'పురోగతిలో ఉంది (In Progress)' : (UI_STRINGS.statusInProgress[currentLang] || 'In Progress'), color: 'text-amber-600' },
          { id: 'resolved', label: currentLang === 'te' ? 'పూర్తయింది (Resolved)' : (UI_STRINGS.statusResolved[currentLang] || 'Resolved'), color: 'text-emerald-600' }
        ].map(st => (
          <button
            key={st.id}
            onClick={() => { playAudioFeedback('click'); setFilterStatus(st.id); }}
            className={`px-3 py-1.5 rounded-xl text-xs font-black transition whitespace-nowrap cursor-pointer ${
              filterStatus === st.id
                ? 'bg-blue-600 text-white shadow-md'
                : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
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

                      {/* Location and Ward + Citizen Upvote Button */}
                      <div className="mt-4 pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-500">
                        <div className="flex flex-wrap items-center gap-3">
                          <span className="flex items-center space-x-1 font-bold text-slate-700">
                            <MapPin className="w-3.5 h-3.5 text-blue-500" />
                            <span>{issue.address}</span>
                          </span>
                          <span className="flex items-center space-x-1 font-medium">
                            <Clock className="w-3.5 h-3.5 text-slate-400" />
                            <span>{new Date(issue.createdAt?.toDate ? issue.createdAt.toDate() : (issue.createdAt || Date.now())).toLocaleDateString()}</span>
                          </span>
                        </div>

                        {/* Citizen Upvote Button ("Me Too!" / "Urgent") */}
                        <button
                          onClick={() => handleVote(issue.id)}
                          disabled={votingId === issue.id || issue.status === 'resolved'}
                          className={`px-4 py-2 rounded-2xl font-black text-xs sm:text-sm flex items-center justify-center space-x-2 transition active:scale-95 shadow-sm cursor-pointer ${
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

                  {/* FULL-WIDTH LIVE RESOLUTION TRACKER ON EVERY SINGLE REPORTED PROBLEM */}
                  <div className="border-t border-slate-100 px-5 sm:px-6 pb-5 pt-3 bg-gradient-to-b from-white to-slate-50/70">
                    <IssueResolutionTracker issue={issue} currentLang={currentLang} />
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
