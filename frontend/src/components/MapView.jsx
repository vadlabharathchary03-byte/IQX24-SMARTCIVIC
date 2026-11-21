import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import { Volume2, MapPin, CheckCircle2, AlertTriangle, Layers } from 'lucide-react';
import { CATEGORIES } from '../utils/translations';
import { speakText, playAudioFeedback } from '../utils/speech';
import { getComplaints, subscribeComplaints, DEFAULT_SEED_ISSUES } from '../firebaseActions';

export default function MapView({ currentLang, currentUser }) {
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const [issues, setIssues] = useState(DEFAULT_SEED_ISSUES);
  const [selectedIssue, setSelectedIssue] = useState(null);

  useEffect(() => {
    fetchIssues();
    const unsub = subscribeComplaints((liveComplaints) => {
      if (liveComplaints && liveComplaints.length > 0) {
        setIssues(liveComplaints);
      }
    });

    const handleLocal = (e) => {
      if (e.detail && Array.isArray(e.detail)) setIssues(e.detail);
    };
    window.addEventListener('janseva_complaint_updated', handleLocal);

    return () => {
      if (typeof unsub === 'function') unsub();
      window.removeEventListener('janseva_complaint_updated', handleLocal);
    };
  }, []);

  const fetchIssues = async () => {
    try {
      const data = await getComplaints();
      setIssues(data);
    } catch (err) {
      console.error("Map fetch failed from Firestore:", err);
    }
  };

  useEffect(() => {
    if (!mapContainerRef.current) return;
    if (mapInstanceRef.current) return; // Map already initialized

    // Center on user's registered area coordinates if available
    const initialLat = currentUser?.latitude || 17.3850;
    const initialLon = currentUser?.longitude || 78.4867;
    const map = L.map(mapContainerRef.current).setView([initialLat, initialLon], 14);
    mapInstanceRef.current = map;

    // OpenStreetMap tiles
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors'
    }).addTo(map);

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  // Place custom markers for all issues
  useEffect(() => {
    if (!mapInstanceRef.current || issues.length === 0) return;
    const map = mapInstanceRef.current;

    // Clear existing markers layer if any
    const markersGroup = L.layerGroup().addTo(map);

    const categoryIcons = {
      garbage: '🗑️',
      pothole: '🕳️',
      streetlight: '💡',
      water_leak: '🚰',
      electrical: '⚡',
      other: '📢'
    };

    const bounds = [];

    issues.forEach((issue) => {
      if (!issue.latitude || !issue.longitude) return;

      const iconEmoji = categoryIcons[issue.category] || '📢';
      const isUrgent = issue.votes >= 5;

      const markerHtml = `
        <div style="
          background: ${issue.status === 'resolved' ? '#10b981' : isUrgent ? '#ef4444' : '#3b82f6'};
          color: white;
          width: 38px;
          height: 38px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 20px;
          border: 3px solid white;
          box-shadow: 0 4px 10px rgba(0,0,0,0.3);
          cursor: pointer;
        ">
          ${iconEmoji}
        </div>
      `;

      const customIcon = L.divIcon({
        className: 'custom-leaflet-marker',
        html: markerHtml,
        iconSize: [38, 38],
        iconAnchor: [19, 19]
      });

      const marker = L.marker([issue.latitude, issue.longitude], { icon: customIcon }).addTo(markersGroup);

      marker.on('click', () => {
        playAudioFeedback('click');
        setSelectedIssue(issue);
      });

      bounds.push([issue.latitude, issue.longitude]);
    });

    // Add citizen's registered locality pin
    if (currentUser?.latitude && currentUser?.longitude) {
      const homeHtml = `
        <div style="background:#4f46e5;color:white;width:40px;height:40px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:22px;border:3px solid white;box-shadow:0 4px 12px rgba(0,0,0,0.4);cursor:pointer;">
          🏡
        </div>
      `;
      const homeIcon = L.divIcon({
        className: 'custom-home-marker',
        html: homeHtml,
        iconSize: [40, 40],
        iconAnchor: [20, 20]
      });
      const homeMarker = L.marker([currentUser.latitude, currentUser.longitude], { icon: homeIcon }).addTo(markersGroup);
      homeMarker.bindPopup(`<b>Your Registered Locality:</b><br/>${currentUser.areaName || 'Local Area'} (${currentUser.ward || 'Ward'})`);
      bounds.push([currentUser.latitude, currentUser.longitude]);
    }

    if (bounds.length > 0) {
      map.fitBounds(bounds, { padding: [50, 50], maxZoom: 15 });
    }

    return () => {
      markersGroup.clearLayers();
    };
  }, [issues]);

  const speakIssue = (issue) => {
    const cat = CATEGORIES.find(c => c.id === issue.category);
    const catName = cat?.names[currentLang] || issue.category;
    const text = currentLang === 'te'
      ? `${catName} సమస్య. స్థలం: ${issue.address}. మొత్తం ఓట్లు: ${issue.votes}.`
      : currentLang === 'hi'
      ? `${catName} समस्या। स्थान: ${issue.address}। कुल वोट: ${issue.votes}।`
      : `${catName} issue at ${issue.address}. Total citizen votes: ${issue.votes}.`;
    speakText(text, currentLang);
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
        <div>
          <h2 className="text-2xl sm:text-3xl font-black text-slate-900 flex items-center gap-2">
            <span>🗺️ {currentLang === 'te' ? 'పబ్లిక్ మ్యాప్ (Public Map)' : currentLang === 'hi' ? 'पब्लिक मैप (Public Map)' : 'Public Map'}</span>
            <span className="text-xs font-bold bg-blue-100 text-blue-800 px-3 py-1 rounded-full">
              GPS Geo-Tagged
            </span>
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Pins show real-time civic issues across city wards. Tap any pin to view details and listen.
          </p>
        </div>

        {/* Legend */}
        <div className="flex items-center space-x-3 text-xs font-bold bg-white p-2.5 rounded-2xl border border-slate-200 shadow-sm">
          <span className="flex items-center space-x-1">
            <span className="w-3 h-3 rounded-full bg-blue-600"></span>
            <span>Normal</span>
          </span>
          <span className="flex items-center space-x-1">
            <span className="w-3 h-3 rounded-full bg-red-600"></span>
            <span>Urgent (5+ Votes)</span>
          </span>
          <span className="flex items-center space-x-1">
            <span className="w-3 h-3 rounded-full bg-emerald-500"></span>
            <span>Resolved</span>
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Map Container */}
        <div className="lg:col-span-2 bg-white rounded-3xl overflow-hidden border border-slate-200 shadow-md h-[550px] relative">
          <div ref={mapContainerRef} className="w-full h-full z-10" />
        </div>

        {/* Selected Issue Preview Card */}
        <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-md flex flex-col justify-between">
          {selectedIssue ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black uppercase bg-blue-100 text-blue-800 px-3 py-1 rounded-full">
                  Selected Problem
                </span>
                <button
                  onClick={() => speakIssue(selectedIssue)}
                  className="w-9 h-9 rounded-full bg-blue-50 text-blue-600 hover:bg-blue-100 flex items-center justify-center transition"
                  title="Speak details"
                >
                  <Volume2 className="w-5 h-5" />
                </button>
              </div>

              <div className="rounded-2xl overflow-hidden h-44 bg-slate-100 border border-slate-200">
                <img
                  src={selectedIssue.photoUrl}
                  alt={selectedIssue.title}
                  className="w-full h-full object-cover"
                />
              </div>

              <div>
                <h3 className="text-lg font-black text-slate-900 leading-tight">
                  {selectedIssue.title}
                </h3>
                <p className="text-xs text-slate-500 mt-1 flex items-center space-x-1">
                  <MapPin className="w-3.5 h-3.5 text-blue-500" />
                  <span>{selectedIssue.address}</span>
                </p>
              </div>

              {selectedIssue.voiceTranscript && (
                <div className="p-3 bg-slate-50 rounded-xl text-xs text-slate-700 italic border border-slate-200">
                  🎙️ "{selectedIssue.voiceTranscript}"
                </div>
              )}

              <div className="flex items-center justify-between text-xs font-bold pt-2 border-t border-slate-100">
                <span className="text-slate-500">Citizen Support:</span>
                <span className="text-blue-600 font-extrabold text-sm">
                  {selectedIssue.votes} Votes 🚨
                </span>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-center p-8 text-slate-400">
              <MapPin className="w-12 h-12 text-slate-300 mb-2 animate-bounce" />
              <p className="font-bold text-slate-700">Tap Any Pin on the Map</p>
              <p className="text-xs text-slate-400 mt-1">
                Click any colored marker to view the photo, problem details, and listen to voice notes.
              </p>
            </div>
          )}

          <div className="pt-4 mt-auto">
            <button
              onClick={() => {
                if (issues.length > 0) {
                  const totalMsg = currentLang === 'te'
                    ? `మ్యాప్‌లో మొత్తం ${issues.length} సమస్యలు ఉన్నాయి.`
                    : currentLang === 'hi'
                    ? `नक्शे पर कुल ${issues.length} समस्याएं दर्ज हैं।`
                    : `Total ${issues.length} civic issues plotted on map.`;
                  speakText(totalMsg, currentLang);
                }
              }}
              className="w-full py-3 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-extrabold flex items-center justify-center space-x-2 transition"
            >
              <Volume2 className="w-4 h-4 text-blue-600" />
              <span>Announce Total Issues on Map</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
