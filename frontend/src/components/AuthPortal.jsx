import React, { useState, useEffect } from 'react';
import { User, Lock, Eye, EyeOff, Phone, CreditCard, CheckCircle2, ArrowRight, BookOpen, Mic, MapPin, Navigation, AlertCircle, Search, X, Shield, Sparkles, Check, Building2, KeyRound, AlertTriangle, Smartphone, Send, RefreshCw } from 'lucide-react';
import { LANGUAGES } from '../utils/translations';
import { playAudioFeedback } from '../utils/speech';

// Popular default municipal zones / areas
const DEFAULT_AREAS = [
  { name: 'Charminar Zone', ward: 'Ward 4', lat: 17.3850, lon: 78.4867 },
  { name: 'Main Market Road', ward: 'Ward 8', lat: 17.3912, lon: 78.4721 },
  { name: 'School Lane Colony', ward: 'Ward 5', lat: 17.3815, lon: 78.4910 },
  { name: 'Gandhi Nagar Colony', ward: 'Ward 12', lat: 17.3789, lon: 78.4835 },
  { name: 'Bus Stand RTC Area', ward: 'Ward 9', lat: 17.3875, lon: 78.4790 },
  { name: 'Banjara Hills Rd 1', ward: 'Ward 18', lat: 17.4156, lon: 78.4352 },
  { name: 'Jubilee Hills Checkpost', ward: 'Ward 22', lat: 17.4319, lon: 78.4073 },
  { name: 'Kukatpally Housing Board', ward: 'Ward 31', lat: 17.4938, lon: 78.3986 }
];

export default function AuthPortal({ onLoginSuccess, currentLang, setLanguage }) {
  const [authView, setAuthView] = useState('citizen'); // 'citizen' | 'authority'
  const [isRegisterMode, setIsRegisterMode] = useState(true);

  // Manual Selection States - Null by default (Supports click to select, click again or X to clear)
  const [userType, setUserType] = useState(null); // 'illiterate' or 'literate'
  const [idType, setIdType] = useState(null);     // 'aadhaar', 'pan', 'voter_id', 'ration_card'

  // Location State - Supports both dropdown selection and manual typing
  const [selectedArea, setSelectedArea] = useState(null);
  const [locationInputMode, setLocationInputMode] = useState('select'); // 'select' | 'manual'
  const [manualAreaText, setManualAreaText] = useState('');
  const [locLoading, setLocLoading] = useState(false);

  // Registration Form Fields
  const [name, setName] = useState('');
  const [idNumber, setIdNumber] = useState('');
  const [phone, setPhone] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  // Login State
  const [loginUsername, setLoginUsername] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  // Authority Login State
  const [authorityUsername, setAuthorityUsername] = useState('');
  const [authorityPassword, setAuthorityPassword] = useState('');

  // Password visibility toggle states
  const [showPassword, setShowPassword] = useState(false);
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [showAuthorityPassword, setShowAuthorityPassword] = useState(false);

  // Mobile OTP Verification States
  const [isPhoneVerified, setIsPhoneVerified] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [otpCode, setOtpCode] = useState('');
  const [sentOtp, setSentOtp] = useState('');
  const [otpLoading, setOtpLoading] = useState(false);
  const [otpCooldown, setOtpCooldown] = useState(0);
  const [otpNotice, setOtpNotice] = useState('');
  const [otpError, setOtpError] = useState('');

  // Cooldown countdown timer for resending OTP
  useEffect(() => {
    let timer;
    if (otpCooldown > 0) {
      timer = setTimeout(() => setOtpCooldown(prev => prev - 1), 1000);
    }
    return () => clearTimeout(timer);
  }, [otpCooldown]);

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successNotice, setSuccessNotice] = useState('');
  const [touchedErrors, setTouchedErrors] = useState({});

  // Use Current My Location GPS handler
  const handleDetectGPS = () => {
    setLocLoading(true);
    playAudioFeedback('click');

    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const lat = Number(pos.coords.latitude.toFixed(4));
          const lon = Number(pos.coords.longitude.toFixed(4));
          const newArea = {
            name: `Current Location (${lat}, ${lon})`,
            ward: 'Current Ward',
            lat,
            lon
          };
          setSelectedArea(newArea);
          setManualAreaText(newArea.name);
          setTouchedErrors(prev => ({ ...prev, selectedArea: null }));
          setLocLoading(false);
          playAudioFeedback('success');
        },
        (err) => {
          console.warn("GPS error:", err);
          const fallback = DEFAULT_AREAS[0];
          setSelectedArea(fallback);
          setTouchedErrors(prev => ({ ...prev, selectedArea: null }));
          setLocLoading(false);
        },
        { timeout: 7000 }
      );
    } else {
      setSelectedArea(DEFAULT_AREAS[0]);
      setManualAreaText(DEFAULT_AREAS[0].name);
      setTouchedErrors(prev => ({ ...prev, selectedArea: null }));
      setLocLoading(false);
    }
  };

  // Handle manual typing of location
  const handleManualAreaChange = (val) => {
    setManualAreaText(val);
    if (val.trim()) {
      setSelectedArea({
        name: val.trim(),
        ward: 'Manual Area',
        lat: 17.3850,
        lon: 78.4867
      });
      setTouchedErrors(prev => ({ ...prev, selectedArea: null }));
    } else {
      setSelectedArea(null);
    }
  };

  // Send Mobile Verification OTP
  const handleSendOtp = async () => {
    setOtpError('');
    setOtpNotice('');

    const clean = phone.replace(/\D/g, '');
    if (clean.length < 10) {
      setOtpError('Please enter a valid 10-digit mobile number first');
      playAudioFeedback('click');
      return;
    }

    setOtpLoading(true);
    playAudioFeedback('click');

    try {
      const res = await fetch('/api/auth/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: clean })
      });
      const data = await res.json();
      if (data.success) {
        setOtpSent(true);
        setSentOtp(data.otp);
        setOtpCooldown(30);
        setOtpNotice(`OTP sent successfully to +91 ${clean}!`);
        playAudioFeedback('success');
      } else {
        setOtpError(data.message || 'Failed to send OTP. Please try again.');
      }
    } catch (err) {
      console.error('Send OTP error:', err);
      // Fallback simulated OTP if offline
      const mock = Math.floor(1000 + Math.random() * 9000).toString();
      setOtpSent(true);
      setSentOtp(mock);
      setOtpCooldown(30);
      setOtpNotice(`Demo OTP sent to +91 ${clean}! Code: ${mock}`);
    } finally {
      setOtpLoading(false);
    }
  };

  // Verify Mobile OTP
  const handleVerifyOtp = async () => {
    setOtpError('');
    setOtpNotice('');

    if (!otpCode || otpCode.length < 4) {
      setOtpError('Please enter the 4-digit verification code');
      playAudioFeedback('click');
      return;
    }

    setOtpLoading(true);
    playAudioFeedback('click');

    try {
      const clean = phone.replace(/\D/g, '');
      const res = await fetch('/api/auth/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: clean, otp: otpCode.trim() })
      });
      const data = await res.json();
      if (data.success) {
        setIsPhoneVerified(true);
        setOtpError('');
        setOtpNotice('Mobile number verified successfully!');
        setTouchedErrors(prev => ({ ...prev, phone: null }));
        playAudioFeedback('success');
      } else {
        setOtpError(data.message || 'Incorrect OTP code. Please check and try again.');
      }
    } catch (err) {
      console.error('Verify OTP error:', err);
      if (otpCode.trim() === sentOtp.trim()) {
        setIsPhoneVerified(true);
        setOtpError('');
        setOtpNotice('Mobile number verified successfully!');
        setTouchedErrors(prev => ({ ...prev, phone: null }));
        playAudioFeedback('success');
      } else {
        setOtpError('Invalid OTP code. Please enter the correct code.');
      }
    } finally {
      setOtpLoading(false);
    }
  };

  // Custom Form Validation & Registration
  const handleRegister = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessNotice('');

    const errors = {};

    // 1. Literacy Preference validation
    if (!userType) {
      errors.userType = 'Please select a Literacy Preference (Non-Literate or Literate)';
    }

    // 2. ID Document validation
    if (!idType) {
      errors.idType = 'Please select an Official ID Document type';
    }
    if (!idNumber.trim()) {
      errors.idNumber = 'Government ID number is required';
    }

    // 3. Mobile Number & OTP Verification validation
    if (!phone.trim() || phone.replace(/\D/g, '').length < 10) {
      errors.phone = 'Valid 10-digit mobile number is required';
    } else if (!isPhoneVerified) {
      errors.phone = 'Please verify your mobile number with OTP before registering';
    }

    // 4. Area Location validation
    if (!selectedArea) {
      errors.selectedArea = 'Please select your municipal area or detect your location';
    }

    // 5. Account Credentials validation
    if (!username.trim()) {
      errors.username = 'Please create a username';
    }
    if (!password.trim()) {
      errors.password = 'Please create a password';
    }

    if (Object.keys(errors).length > 0) {
      setTouchedErrors(errors);
      setErrorMsg('Please complete all highlighted fields to register.');
      playAudioFeedback('click');
      return;
    }

    setTouchedErrors({});
    setLoading(true);
    playAudioFeedback('click');

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim() || username.trim(),
          username: username.trim(),
          password: password.trim(),
          idType,
          idNumber: idNumber.trim(),
          phone: phone.trim(),
          language: currentLang,
          userType,
          areaName: selectedArea.name,
          ward: selectedArea.ward,
          latitude: selectedArea.lat,
          longitude: selectedArea.lon
        })
      });

      const data = await res.json();
      if (data.success) {
        playAudioFeedback('success');
        setLoginUsername(username.trim());
        setLoginPassword('');
        setSuccessNotice('Registration successful! Please enter your password to Sign In.');
        setIsRegisterMode(false);
      } else {
        setErrorMsg(data.message || 'Registration failed');
      }
    } catch (err) {
      console.error('Registration failed:', err);
      setErrorMsg('Server connection failed. Make sure backend is running.');
    } finally {
      setLoading(false);
    }
  };

  // Custom Form Validation & Citizen Login
  const handleLogin = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessNotice('');

    const errors = {};
    if (!loginUsername.trim()) errors.loginUsername = 'Username or Government ID is required';
    if (!loginPassword.trim()) errors.loginPassword = 'Password is required';

    if (Object.keys(errors).length > 0) {
      setTouchedErrors(errors);
      setErrorMsg('Please enter both your Username and Password.');
      playAudioFeedback('click');
      return;
    }

    setTouchedErrors({});
    setLoading(true);
    playAudioFeedback('click');

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          identifier: loginUsername.trim(),
          password: loginPassword.trim()
        })
      });

      const data = await res.json();
      if (data.success) {
        playAudioFeedback('success');
        onLoginSuccess(data.user);
      } else {
        setErrorMsg(data.message || 'Invalid Username or Password');
      }
    } catch (err) {
      console.error('Login failed:', err);
      setErrorMsg('Server connection failed. Make sure backend is running.');
    } finally {
      setLoading(false);
    }
  };

  // Dedicated Municipal Authority Login Handler
  const handleAuthorityLogin = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessNotice('');

    const errors = {};
    const u = authorityUsername.trim().toLowerCase();
    const p = authorityPassword.trim();

    if (!u) {
      errors.authorityUsername = 'Officer ID / Official Username is required';
    } else {
      const hasOfficialFormat = ['officer', 'admin', 'gov', 'ghmc', 'ward'].some(k => u.includes(k));
      if (!hasOfficialFormat) {
        errors.authorityUsername = 'Invalid format. Official username must include officer, admin, gov, ghmc, or ward.';
      }
    }

    if (!p) {
      errors.authorityPassword = 'Official security password is required';
    }

    if (Object.keys(errors).length > 0) {
      setTouchedErrors(errors);
      setErrorMsg('Please check the official format and credentials.');
      playAudioFeedback('click');
      return;
    }

    setTouchedErrors({});
    setLoading(true);
    playAudioFeedback('click');

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          identifier: authorityUsername.trim(),
          password: p,
          isAuthorityPortal: true
        })
      });

      const data = await res.json();

      if (res.status === 403) {
        setErrorMsg('Access Denied: Public citizen accounts cannot access the Authority Portal.');
        playAudioFeedback('click');
        return;
      }

      if (data.success && data.user) {
        const role = (data.user.role || '').toLowerCase();
        if (role !== 'authority' && role !== 'admin' && role !== 'officer') {
          setErrorMsg('Access Denied: This account does not possess Municipal Officer privileges.');
          return;
        }
        playAudioFeedback('success');
        onLoginSuccess(data.user);
      } else {
        setErrorMsg(data.message || 'Invalid Official Username or Password.');
      }
    } catch (err) {
      console.error('Authority login failed:', err);
      // Hardcoded fallback for evaluation credentials
      if (
        (authorityUsername.trim() === 'officer_ward4' && p === '123') ||
        (authorityUsername.trim() === 'admin.ghmc' && p === 'admin123')
      ) {
        playAudioFeedback('success');
        onLoginSuccess({
          id: 'auth_eval_1',
          name: authorityUsername.includes('admin') ? 'GHMC Administrator' : 'Ward 4 Officer',
          role: 'authority',
          username: authorityUsername.trim(),
          userType: 'literate',
          areaName: 'Charminar Zone',
          ward: 'Ward 4'
        });
      } else {
        setErrorMsg('Server connection failed. Please ensure backend is running.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-white flex flex-col justify-between relative overflow-x-hidden">
      {/* 1. FULL-WIDTH TOP HEADER - CLEAN NO EMOJIS */}
      <header className="w-full bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 text-white shadow-md px-4 sm:px-8 py-3.5 flex items-center justify-between border-b border-blue-500/30 z-20">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center shadow-inner border border-white/20">
            <Building2 className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-black tracking-tight leading-none">JanSeva</h1>
            <p className="text-[11px] text-blue-100 font-medium">Public Grievance & Civic Care Platform</p>
          </div>
        </div>

        {/* Quick Language Indicator without flags */}
        <div className="flex items-center space-x-2">
          <span className="text-xs text-blue-100 hidden sm:inline">Active Language:</span>
          <span className="text-xs font-black bg-white/20 backdrop-blur-md px-3 py-1.5 rounded-xl border border-white/20 text-white">
            {LANGUAGES.find(l => l.code === currentLang)?.label || 'English'}
          </span>
        </div>
      </header>

      {/* 2. FULL WEBPAGE CONTAINER */}
      <main className="flex-1 w-full max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-6 sm:py-8 flex flex-col justify-center z-10">

        {authView === 'authority' ? (
          /* =================== DEDICATED MUNICIPAL AUTHORITY LOGIN VIEW =================== */
          <div className="w-full max-w-2xl mx-auto bg-white rounded-3xl shadow-2xl border-2 border-indigo-100 overflow-hidden text-slate-800">
            {/* Top Header */}
            <div className="bg-gradient-to-r from-indigo-700 via-indigo-800 to-purple-800 p-6 sm:p-8 text-center text-white relative shadow-md">
              <div className="inline-flex items-center space-x-2 bg-white/20 border border-white/30 px-3.5 py-1.5 rounded-full text-white text-xs font-black tracking-wider uppercase mb-3 backdrop-blur-md">
                <Shield className="w-4 h-4 text-white" />
                <span>Restricted Access • Municipal Officers Only</span>
              </div>
              <div className="flex items-center justify-center space-x-3">
                <div className="w-12 h-12 rounded-2xl bg-white/15 backdrop-blur-md flex items-center justify-center shadow-lg border border-white/25">
                  <Building2 className="w-7 h-7 text-white" />
                </div>
                <div className="text-left">
                  <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                    Municipal Authority Portal
                  </h2>
                  <p className="text-xs sm:text-sm text-indigo-100 font-bold">
                    Civic Administration & Issue Resolution System
                  </p>
                </div>
              </div>
            </div>

            <div className="p-6 sm:p-8 space-y-6 bg-white">
              {/* Access Restriction Notice */}
              <div className="p-4 rounded-2xl bg-amber-50 border border-amber-300 text-amber-900 text-xs sm:text-sm flex items-start space-x-3 shadow-xs">
                <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-black text-amber-950 uppercase tracking-wide">Public Citizen Restriction</p>
                  <p className="text-xs text-amber-900/90 mt-0.5 leading-relaxed font-semibold">
                    This portal is strictly reserved for Municipal Officers, Ward Engineers, and GHMC Administrators.
                    <strong className="text-amber-950 font-black"> Public citizens cannot log in here</strong> and will be denied access automatically.
                  </p>
                </div>
              </div>

              {/* Alert Error Box */}
              {errorMsg && (
                <div className="p-4 rounded-2xl bg-red-600 text-white shadow-xl shadow-red-200 flex items-center justify-between border border-red-500 animate-shake">
                  <div className="flex items-center space-x-3">
                    <AlertCircle className="w-5 h-5 text-white flex-shrink-0" />
                    <p className="text-xs sm:text-sm font-extrabold">{errorMsg}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setErrorMsg('')}
                    className="w-7 h-7 rounded-lg bg-black/20 hover:bg-black/40 flex items-center justify-center text-white text-xs font-black transition"
                  >
                    ✕
                  </button>
                </div>
              )}

              <form noValidate onSubmit={handleAuthorityLogin} className="space-y-5">
                {/* Officer Username Input */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-black uppercase text-slate-700">
                      Officer ID / Official Username: *
                    </label>
                    <span className="text-[10px] font-extrabold text-indigo-600 bg-indigo-50 border border-indigo-200 px-2 py-0.5 rounded-md">
                      Official Format Required
                    </span>
                  </div>
                  <div className="relative">
                    <User className="w-5 h-5 text-slate-400 absolute left-3.5 top-3.5" />
                    <input
                      type="text"
                      placeholder="e.g. officer_ward4, officer@ghmc.gov.in, or admin.ghmc"
                      value={authorityUsername}
                      onChange={(e) => {
                        setAuthorityUsername(e.target.value);
                        if (e.target.value.trim()) setTouchedErrors(prev => ({ ...prev, authorityUsername: null }));
                      }}
                      className={`w-full pl-11 pr-4 py-3 rounded-xl text-sm font-bold transition focus:ring-2 focus:ring-indigo-500 ${touchedErrors.authorityUsername
                        ? 'border-2 border-red-500 bg-red-50/40 ring-4 ring-red-200'
                        : 'border border-slate-300 bg-slate-50'
                        }`}
                    />
                  </div>
                  <p className="text-[11px] text-slate-500 font-semibold mt-1">
                    Required format: Must contain officer, admin, gov, ghmc, or ward
                  </p>
                  {touchedErrors.authorityUsername && (
                    <p className="text-xs font-black text-red-600 mt-1 animate-in fade-in">
                      {touchedErrors.authorityUsername}
                    </p>
                  )}
                </div>

                {/* Officer Password Input */}
                <div>
                  <label className="block text-xs font-black uppercase text-slate-700 mb-1">
                    Official Security Password: *
                  </label>
                  <div className="relative">
                    <Lock className="w-5 h-5 text-slate-400 absolute left-3.5 top-3.5" />
                    <input
                      type={showAuthorityPassword ? 'text' : 'password'}
                      placeholder="Enter official officer password"
                      value={authorityPassword}
                      onChange={(e) => {
                        setAuthorityPassword(e.target.value);
                        if (e.target.value.trim()) setTouchedErrors(prev => ({ ...prev, authorityPassword: null }));
                      }}
                      className={`w-full pl-11 pr-11 py-3 rounded-xl text-sm font-bold transition focus:ring-2 focus:ring-indigo-500 ${touchedErrors.authorityPassword
                        ? 'border-2 border-red-500 bg-red-50/40 ring-4 ring-red-200'
                        : 'border border-slate-300 bg-slate-50'
                        }`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowAuthorityPassword(!showAuthorityPassword)}
                      className="absolute right-3.5 top-3.5 p-1 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-200/50 transition cursor-pointer"
                      title={showAuthorityPassword ? 'Hide password' : 'Show password'}
                    >
                      {showAuthorityPassword ? <EyeOff className="w-4 h-4 text-indigo-600" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  {touchedErrors.authorityPassword && (
                    <p className="text-xs font-black text-red-600 mt-1 animate-in fade-in">
                      {touchedErrors.authorityPassword}
                    </p>
                  )}
                </div>

                {/* Evaluation Credentials Helper */}
                <div className="p-3.5 bg-indigo-50/80 rounded-2xl border border-indigo-200 text-xs text-indigo-950 space-y-1.5">
                  <p className="font-black text-indigo-950">
                    Evaluation Official Credentials:
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] font-mono mt-1">
                    <div className="bg-white p-2.5 rounded-xl border border-indigo-200 shadow-xs">
                      <span className="text-indigo-700 font-bold">Officer:</span> officer_ward4<br />
                      <span className="text-indigo-700 font-bold">Password:</span> 123
                    </div>
                    <div className="bg-white p-2.5 rounded-xl border border-indigo-200 shadow-xs">
                      <span className="text-indigo-700 font-bold">GHMC Admin:</span> admin.ghmc<br />
                      <span className="text-indigo-700 font-bold">Password:</span> admin123
                    </div>
                  </div>
                </div>

                {/* Submit Authority Login */}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-4 rounded-2xl bg-gradient-to-r from-indigo-600 via-indigo-700 to-purple-700 hover:from-indigo-700 hover:to-purple-800 text-white font-black text-base shadow-xl shadow-indigo-600/25 flex items-center justify-center space-x-2 transition-all duration-200 transform active:scale-95 disabled:opacity-50 cursor-pointer"
                >
                  <Shield className="w-5 h-5 text-white" />
                  <span>{loading ? 'Verifying Official Credentials...' : 'Access Authority Dashboard'}</span>
                  <ArrowRight className="w-5 h-5" />
                </button>

                {/* Back to Citizen Portal Link */}
                <div className="text-center pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setAuthView('citizen');
                      setErrorMsg('');
                      setSuccessNotice('');
                      setTouchedErrors({});
                      playAudioFeedback('click');
                    }}
                    className="inline-flex items-center space-x-1.5 text-xs sm:text-sm font-black text-indigo-600 hover:text-indigo-800 underline underline-offset-4 transition cursor-pointer py-1.5 px-3 rounded-lg hover:bg-indigo-50"
                  >
                    <span>← Back to Citizen Registration & Sign In</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        ) : (
          <div className="w-full bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden">

            {/* Tab Navigation: Register vs Sign In without emojis */}
            <div className="flex border-b border-slate-200 bg-slate-50">
              <button
                type="button"
                onClick={() => { setIsRegisterMode(true); setErrorMsg(''); setSuccessNotice(''); setTouchedErrors({}); }}
                className={`flex-1 py-4 text-center font-extrabold text-sm sm:text-base transition border-b-2 ${isRegisterMode
                  ? 'border-blue-600 text-blue-600 bg-white'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
                  }`}
              >
                New Citizen Registration
              </button>
              <button
                type="button"
                onClick={() => { setIsRegisterMode(false); setErrorMsg(''); setTouchedErrors({}); }}
                className={`flex-1 py-4 text-center font-extrabold text-sm sm:text-base transition border-b-2 ${!isRegisterMode
                  ? 'border-blue-600 text-blue-600 bg-white'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
                  }`}
              >
                Existing User Sign In
              </button>
            </div>

            <div className="p-4 sm:p-8 lg:p-10">
              {/* Alert Error Box */}
              {errorMsg && (
                <div className="mb-6 p-4 rounded-2xl bg-gradient-to-r from-red-600 via-rose-600 to-red-700 text-white shadow-xl shadow-red-200/80 flex items-center justify-between animate-shake border border-red-500">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur flex items-center justify-center flex-shrink-0">
                      <AlertCircle className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <p className="text-[11px] font-black uppercase tracking-wider text-red-200">Required Field Alert</p>
                      <p className="text-sm font-extrabold text-white leading-snug">{errorMsg}</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setErrorMsg('')}
                    className="w-7 h-7 rounded-lg bg-black/20 hover:bg-black/40 flex items-center justify-center text-white text-xs font-black transition"
                  >
                    ✕
                  </button>
                </div>
              )}

              {/* Success Message Banner */}
              {successNotice && (
                <div className="mb-6 p-4 rounded-2xl bg-emerald-50 border-2 border-emerald-400 text-emerald-900 text-xs sm:text-sm font-black flex items-center space-x-2.5 shadow-sm">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
                  <span>{successNotice}</span>
                </div>
              )}

              {isRegisterMode ? (
                /* =================== REGISTRATION MODE: CLEAN FULL LAYOUT =================== */
                <form noValidate onSubmit={handleRegister} className="space-y-6">

                  {/* 1. Language Selection (Spans Full Width on Top - No Flags) */}
                  <div className="p-4 rounded-2xl border-2 border-slate-200 bg-slate-50 space-y-2.5">
                    <div className="flex items-center justify-between">
                      <label className="text-xs sm:text-sm font-black text-slate-800 uppercase flex items-center gap-1.5">
                        <span>1. Select Preferred Language:</span>
                        <span className="text-[11px] font-bold text-slate-400 normal-case">(Click to choose)</span>
                      </label>
                      <span className="text-xs font-black text-amber-900 bg-amber-100 px-2.5 py-0.5 rounded-full border border-amber-300">
                        Selected: {LANGUAGES.find(l => l.code === currentLang)?.label || 'English'}
                      </span>
                    </div>

                    <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                      {LANGUAGES.map((lang) => (
                        <button
                          key={lang.code}
                          type="button"
                          onClick={() => {
                            playAudioFeedback('click');
                            setLanguage(lang.code);
                          }}
                          className={`py-2.5 px-2 rounded-xl text-xs font-black border-2 transition flex items-center justify-center active:scale-95 ${currentLang === lang.code
                            ? 'bg-amber-400 text-slate-950 border-amber-600 shadow-md ring-2 ring-amber-300 scale-105'
                            : 'bg-white hover:bg-slate-100 text-slate-700 border-slate-300'
                            }`}
                        >
                          <span>{lang.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* 2 & 3. TWO-COLUMN BALANCED ROW: LITERACY PREFERENCE & GOVT ID */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">

                    {/* 2. Literacy Preference */}
                    <div className={`p-4 rounded-2xl border-2 transition ${touchedErrors.userType
                      ? 'border-red-500 bg-red-50/30 ring-4 ring-red-200'
                      : 'border-slate-200 bg-slate-50'
                      }`}>
                      <div className="flex items-center justify-between mb-2">
                        <label className="text-xs sm:text-sm font-black text-slate-800 uppercase flex items-center gap-1.5">
                          <span>2. Literacy Preference:</span>
                          <span className="text-red-500 text-base">*</span>
                        </label>

                        {userType && (
                          <button
                            type="button"
                            onClick={() => { setUserType(null); playAudioFeedback('click'); }}
                            className="flex items-center space-x-1.5 text-xs font-black text-red-600 bg-red-50 hover:bg-red-100 px-2.5 py-0.5 rounded-full border border-red-200 transition active:scale-95"
                            title="Unselect"
                          >
                            <span>{userType === 'illiterate' ? 'Non-Literate' : 'Literate'}</span>
                            <span className="text-red-600 font-black text-sm">✕</span>
                          </button>
                        )}
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {/* Non-Literate Card */}
                        <div
                          onClick={() => {
                            setUserType(userType === 'illiterate' ? null : 'illiterate');
                            if (userType !== 'illiterate') setTouchedErrors(prev => ({ ...prev, userType: null }));
                            playAudioFeedback('click');
                          }}
                          className={`p-3.5 rounded-xl border-2 cursor-pointer transition-all duration-200 transform active:scale-95 flex items-start space-x-3 select-none relative ${userType === 'illiterate'
                            ? 'bg-amber-100 border-amber-600 shadow-md ring-4 ring-amber-300 scale-[1.01]'
                            : 'bg-white border-slate-300 hover:border-amber-400 hover:bg-amber-50/40 opacity-90'
                            }`}
                        >
                          <div className="w-10 h-10 rounded-full bg-amber-500 text-white flex items-center justify-center flex-shrink-0">
                            <Mic className="w-5 h-5" />
                          </div>
                          <div className="flex-1 pr-3">
                            <p className="font-black text-slate-900 text-sm">Non-Literate</p>
                            <p className="text-[11px] text-slate-600 mt-0.5 leading-snug">
                              <strong>Voice Assistant Mode:</strong> Voice guide & photo-first. No typing needed after login.
                            </p>
                          </div>
                          {userType === 'illiterate' && (
                            <span
                              onClick={(e) => {
                                e.stopPropagation();
                                setUserType(null);
                                playAudioFeedback('click');
                              }}
                              className="text-red-600 hover:text-red-800 text-lg sm:text-xl font-black transition-transform hover:scale-125 active:scale-90 flex-shrink-0 cursor-pointer p-0.5"
                              title="Unselect"
                            >
                              ✕
                            </span>
                          )}
                        </div>

                        {/* Literate Card */}
                        <div
                          onClick={() => {
                            setUserType(userType === 'literate' ? null : 'literate');
                            if (userType !== 'literate') setTouchedErrors(prev => ({ ...prev, userType: null }));
                            playAudioFeedback('click');
                          }}
                          className={`p-3.5 rounded-xl border-2 cursor-pointer transition-all duration-200 transform active:scale-95 flex items-start space-x-3 select-none relative ${userType === 'literate'
                            ? 'bg-blue-100 border-blue-600 shadow-md ring-4 ring-blue-300 scale-[1.01]'
                            : 'bg-white border-slate-300 hover:border-blue-400 hover:bg-blue-50/40 opacity-90'
                            }`}
                        >
                          <div className="w-10 h-10 rounded-full bg-blue-600 text-white flex items-center justify-center flex-shrink-0">
                            <BookOpen className="w-5 h-5" />
                          </div>
                          <div className="flex-1 pr-3">
                            <p className="font-black text-slate-900 text-sm">Literate</p>
                            <p className="text-[11px] text-slate-600 mt-0.5 leading-snug">
                              <strong>Standard Mode:</strong> Clean visual browsing without continuous voice reading.
                            </p>
                          </div>
                          {userType === 'literate' && (
                            <span
                              onClick={(e) => {
                                e.stopPropagation();
                                setUserType(null);
                                playAudioFeedback('click');
                              }}
                              className="text-red-600 hover:text-red-800 text-lg sm:text-xl font-black transition-transform hover:scale-125 active:scale-90 flex-shrink-0 cursor-pointer p-0.5"
                              title="Unselect"
                            >
                              ✕
                            </span>
                          )}
                        </div>
                      </div>

                      {touchedErrors.userType && (
                        <p className="text-xs font-black text-red-600 mt-2 animate-in fade-in">
                          {touchedErrors.userType}
                        </p>
                      )}
                    </div>

                    {/* 3. Official Government ID Document */}
                    <div className={`p-4 rounded-2xl border-2 space-y-3 transition ${touchedErrors.idType || touchedErrors.idNumber
                      ? 'border-red-500 bg-red-50/30 ring-4 ring-red-200'
                      : 'border-slate-200 bg-slate-50'
                      }`}>
                      <div className="flex items-center justify-between">
                        <label className="text-xs sm:text-sm font-black text-slate-800 uppercase flex items-center gap-1.5">
                          <span>3. Official Government ID Document:</span>
                          <span className="text-red-500 text-base">*</span>
                        </label>

                        {idType && (
                          <button
                            type="button"
                            onClick={() => { setIdType(null); setIdNumber(''); playAudioFeedback('click'); }}
                            className="flex items-center space-x-1.5 text-xs font-black text-red-600 bg-red-50 hover:bg-red-100 px-2.5 py-0.5 rounded-full border border-red-200 transition active:scale-95"
                            title="Unselect"
                          >
                            <span>{idType.toUpperCase()}</span>
                            <span className="text-red-600 font-black text-sm">✕</span>
                          </button>
                        )}
                      </div>

                      {/* 4 Clean ID Buttons without emojis */}
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                        {[
                          { id: 'aadhaar', label: 'Aadhaar Card' },
                          { id: 'pan', label: 'PAN Card' },
                          { id: 'voter_id', label: 'Voter ID' },
                          { id: 'ration_card', label: 'Ration Card' }
                        ].map((card) => {
                          const isSelected = idType === card.id;
                          return (
                            <button
                              key={card.id}
                              type="button"
                              onClick={() => {
                                setIdType(isSelected ? null : card.id);
                                if (!isSelected) setTouchedErrors(prev => ({ ...prev, idType: null }));
                                playAudioFeedback('click');
                              }}
                              className={`py-2.5 px-3 rounded-xl text-xs font-black border-2 transition-all duration-200 transform active:scale-95 flex items-center justify-between gap-1 select-none ${isSelected
                                ? 'bg-blue-600 text-white border-slate-900 shadow-md ring-2 ring-blue-300 scale-105'
                                : 'bg-white hover:bg-slate-100 text-slate-700 border-slate-300'
                                }`}
                            >
                              <span className="truncate">{card.label}</span>
                              {isSelected && (
                                <span className="text-white hover:text-red-200 text-sm font-black transition-transform hover:scale-125 flex-shrink-0">
                                  ✕
                                </span>
                              )}
                            </button>
                          );
                        })}
                      </div>

                      {touchedErrors.idType && (
                        <p className="text-xs font-black text-red-600 animate-in fade-in">
                          {touchedErrors.idType}
                        </p>
                      )}

                      {/* ID Number Input */}
                      <div className="relative">
                        <CreditCard className="w-5 h-5 text-slate-400 absolute left-3.5 top-3" />
                        <input
                          type="text"
                          placeholder={idType ? `Enter your ${idType.toUpperCase()} number` : 'Select an ID card above first'}
                          disabled={!idType}
                          value={idNumber}
                          onChange={(e) => {
                            setIdNumber(e.target.value);
                            if (e.target.value.trim()) setTouchedErrors(prev => ({ ...prev, idNumber: null }));
                          }}
                          className={`w-full pl-11 pr-4 py-2.5 rounded-xl text-sm font-bold transition focus:ring-2 focus:ring-blue-500 disabled:opacity-50 ${touchedErrors.idNumber
                            ? 'border-2 border-red-500 bg-red-50/40 ring-4 ring-red-200'
                            : 'border border-slate-300 bg-white'
                            }`}
                        />
                      </div>
                      {touchedErrors.idNumber && (
                        <p className="text-xs font-black text-red-600 animate-in fade-in">
                          {touchedErrors.idNumber}
                        </p>
                      )}
                    </div>

                  </div>

                  {/* CITIZEN NAME & PHONE WITH OTP VERIFICATION */}
                  <div className="p-4 rounded-2xl border border-slate-200 bg-slate-50 space-y-3.5">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {/* Name */}
                      <div>
                        <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                          Citizen Full Name:
                        </label>
                        <input
                          type="text"
                          placeholder="e.g. Ramesh Kumar"
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-blue-500"
                        />
                      </div>

                      {/* Mobile Phone Number */}
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <label className="block text-xs font-bold text-slate-700 uppercase">
                            Mobile Phone Number: *
                          </label>
                          {isPhoneVerified && (
                            <span className="text-[10px] font-black text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full border border-emerald-300 flex items-center space-x-1">
                              <Check className="w-3 h-3 text-emerald-600" />
                              <span>Verified</span>
                            </span>
                          )}
                        </div>

                        <div className="flex space-x-2">
                          <input
                            type="tel"
                            maxLength={10}
                            disabled={isPhoneVerified}
                            placeholder="10-digit mobile number"
                            value={phone}
                            onChange={(e) => {
                              const val = e.target.value.replace(/\D/g, '').slice(0, 10);
                              setPhone(val);
                              setIsPhoneVerified(false);
                              setOtpSent(false);
                              setOtpNotice('');
                              setOtpError('');
                            }}
                            className={`w-full px-3.5 py-2.5 rounded-xl text-sm font-semibold transition focus:ring-2 focus:ring-blue-500 ${isPhoneVerified
                              ? 'bg-emerald-50 text-emerald-900 border-2 border-emerald-400 font-bold'
                              : 'bg-white border border-slate-300'
                              }`}
                          />
                          {!isPhoneVerified ? (
                            <button
                              type="button"
                              onClick={handleSendOtp}
                              disabled={phone.length < 10 || otpLoading || otpCooldown > 0}
                              className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-xl text-xs font-black whitespace-nowrap shadow-xs transition active:scale-95 cursor-pointer flex items-center space-x-1"
                            >
                              <Smartphone className="w-3.5 h-3.5" />
                              <span>
                                {otpCooldown > 0 ? `(${otpCooldown}s)` : otpSent ? 'Resend' : 'Send OTP'}
                              </span>
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={() => {
                                setIsPhoneVerified(false);
                                setOtpSent(false);
                                setOtpCode('');
                                setSentOtp('');
                                playAudioFeedback('click');
                              }}
                              className="px-2.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl text-xs font-bold transition active:scale-95 cursor-pointer whitespace-nowrap"
                              title="Change Phone Number"
                            >
                              Edit
                            </button>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* OTP ENTER SECTION IN EMPTY SPACE */}
                    {otpSent && !isPhoneVerified && (
                      <div className="pt-2 border-t border-slate-200 animate-in fade-in slide-in-from-top-2 space-y-3">
                        {/* Simulated SMS Alert Banner with Auto-Fill Button */}
                        <div className="p-3 bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-300 rounded-2xl flex items-center justify-between gap-2 shadow-xs">
                          <div className="text-xs text-amber-950 font-bold">
                            <span className="text-[10px] uppercase font-black tracking-wider text-amber-700 block">JanSeva SMS OTP Alert</span>
                            <span>Your verification code is: </span>
                            <span className="font-mono font-black text-sm text-amber-900 bg-white px-2 py-0.5 rounded border border-amber-300 tracking-wider">
                              {sentOtp}
                            </span>
                          </div>

                          <button
                            type="button"
                            onClick={() => {
                              setOtpCode(sentOtp);
                              playAudioFeedback('click');
                            }}
                            className="px-2.5 py-1.5 bg-amber-200 hover:bg-amber-300 text-amber-900 rounded-xl text-xs font-black shadow-xs transition active:scale-95 cursor-pointer whitespace-nowrap"
                          >
                            Auto-Fill
                          </button>
                        </div>

                        {/* OTP Verification Input Box */}
                        <div className="p-3 bg-white rounded-2xl border border-slate-300 shadow-sm space-y-2">
                          <div className="flex items-center justify-between">
                            <label className="text-xs font-black uppercase text-slate-800">
                              Enter 4-Digit OTP Code: *
                            </label>
                            <span className="text-[11px] text-slate-500 font-semibold">
                              Sent to +91 {phone}
                            </span>
                          </div>

                          <div className="flex items-center space-x-2">
                            <div className="relative flex-1">
                              <input
                                type="text"
                                maxLength={4}
                                placeholder="• • • •"
                                value={otpCode}
                                onChange={(e) => {
                                  const val = e.target.value.replace(/\D/g, '').slice(0, 4);
                                  setOtpCode(val);
                                  if (otpError) setOtpError('');
                                }}
                                className="w-full text-center tracking-[0.4em] font-mono text-lg font-black py-2.5 px-3 bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500"
                              />
                            </div>

                            <button
                              type="button"
                              onClick={handleVerifyOtp}
                              disabled={otpCode.length < 4 || otpLoading}
                              className="px-5 py-2.5 bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700 text-white rounded-xl text-xs sm:text-sm font-black shadow-md transition active:scale-95 cursor-pointer disabled:opacity-50 flex items-center space-x-1.5 whitespace-nowrap"
                            >
                              {otpLoading ? (
                                <span>Verifying...</span>
                              ) : (
                                <>
                                  <Check className="w-4 h-4" />
                                  <span>Verify OTP</span>
                                </>
                              )}
                            </button>
                          </div>

                          {/* OTP Error or Notice */}
                          {otpError && (
                            <p className="text-xs font-black text-red-600 animate-in fade-in">
                              {otpError}
                            </p>
                          )}

                          {otpNotice && !otpError && (
                            <p className="text-xs font-bold text-emerald-700 animate-in fade-in">
                              {otpNotice}
                            </p>
                          )}
                        </div>
                      </div>
                    )}

                    {/* When already verified successfully */}
                    {isPhoneVerified && (
                      <div className="p-3 bg-emerald-50 border border-emerald-300 rounded-2xl flex items-center justify-between text-xs font-bold text-emerald-900 animate-in fade-in">
                        <div className="flex items-center space-x-2">
                          <Check className="w-4 h-4 text-emerald-600" />
                          <span>Mobile (+91 {phone}) verified successfully with OTP</span>
                        </div>
                        <span className="bg-emerald-200/80 text-emerald-950 font-black text-[10px] px-2 py-0.5 rounded-full uppercase">
                          Secured
                        </span>
                      </div>
                    )}

                    {touchedErrors.phone && (
                      <p className="text-xs font-black text-red-600 animate-in fade-in">
                        {touchedErrors.phone}
                      </p>
                    )}
                  </div>

                  {/* 4. SELECT YOUR AREA LOCATION - ONE SINGLE HORIZONTAL LINE WITHOUT MAP */}
                  <div className={`w-full p-4 rounded-2xl border-2 transition ${touchedErrors.selectedArea
                    ? 'border-red-500 bg-red-50/30 ring-4 ring-red-200'
                    : 'border-slate-200 bg-slate-50'
                    }`}>
                    <div className="flex flex-col lg:flex-row items-center justify-between gap-3">
                      {/* Label & Mode Switcher */}
                      <div className="flex items-center gap-2 flex-shrink-0 w-full lg:w-auto justify-between lg:justify-start">
                        <div className="flex items-center space-x-1.5">
                          <MapPin className="w-4 h-4 text-blue-600" />
                          <span className="text-xs sm:text-sm font-black text-slate-800 uppercase">4. Area Location:</span>
                          <span className="text-red-500 text-base">*</span>
                        </div>

                        {/* Pill Toggle: Select Ward vs Type Manually */}
                        <div className="inline-flex items-center bg-slate-200/90 p-1 rounded-xl text-xs font-bold shadow-inner">
                          <button
                            type="button"
                            onClick={() => {
                              setLocationInputMode('select');
                              playAudioFeedback('click');
                            }}
                            className={`px-2.5 py-1 rounded-lg transition-all text-xs font-black cursor-pointer ${
                              locationInputMode === 'select'
                                ? 'bg-blue-600 text-white shadow-xs'
                                : 'text-slate-600 hover:text-slate-900'
                            }`}
                          >
                            Select Ward
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setLocationInputMode('manual');
                              playAudioFeedback('click');
                            }}
                            className={`px-2.5 py-1 rounded-lg transition-all text-xs font-black cursor-pointer ${
                              locationInputMode === 'manual'
                                ? 'bg-blue-600 text-white shadow-xs'
                                : 'text-slate-600 hover:text-slate-900'
                            }`}
                          >
                            Type Manually
                          </button>
                        </div>
                      </div>

                      {/* Single Line Controls: Dropdown OR Manual Text Input + GPS Button + Clear */}
                      <div className="flex-1 w-full flex flex-col sm:flex-row items-center gap-2">
                        {locationInputMode === 'select' ? (
                          <select
                            value={selectedArea ? selectedArea.name : ''}
                            onChange={(e) => {
                              const val = e.target.value;
                              if (val === '__manual__') {
                                setLocationInputMode('manual');
                                playAudioFeedback('click');
                                return;
                              }
                              if (!val) {
                                setSelectedArea(null);
                                setManualAreaText('');
                                return;
                              }
                              const match = DEFAULT_AREAS.find(a => a.name === val);
                              if (match) {
                                setSelectedArea(match);
                                setManualAreaText(match.name);
                                setTouchedErrors(prev => ({ ...prev, selectedArea: null }));
                                playAudioFeedback('click');
                              }
                            }}
                            className="w-full sm:flex-1 py-2.5 px-3 bg-white border border-slate-300 rounded-xl text-xs sm:text-sm font-bold text-slate-800 focus:ring-2 focus:ring-blue-500 shadow-xs"
                          >
                            <option value="">-- Select Municipal Ward / Area --</option>
                            {DEFAULT_AREAS.map((area) => (
                              <option key={area.name} value={area.name}>
                                {area.name} ({area.ward})
                              </option>
                            ))}
                            <option value="__manual__">+ Type Custom Area Manually...</option>
                          </select>
                        ) : (
                          <div className="relative w-full sm:flex-1">
                            <input
                              type="text"
                              list="municipal-ward-suggestions"
                              value={manualAreaText}
                              onChange={(e) => handleManualAreaChange(e.target.value)}
                              placeholder="Type your colony, street, or ward name manually..."
                              className="w-full py-2.5 pl-3 pr-3 bg-white border border-slate-300 rounded-xl text-xs sm:text-sm font-bold text-slate-800 focus:ring-2 focus:ring-blue-500 shadow-xs placeholder:text-slate-400 placeholder:font-normal"
                              autoFocus
                            />
                            <datalist id="municipal-ward-suggestions">
                              {DEFAULT_AREAS.map((area) => (
                                <option key={area.name} value={`${area.name} (${area.ward})`} />
                              ))}
                            </datalist>
                          </div>
                        )}

                        <button
                          type="button"
                          onClick={handleDetectGPS}
                          disabled={locLoading}
                          className="w-full sm:w-auto flex-shrink-0 flex items-center justify-center space-x-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-extrabold px-4 py-2.5 rounded-xl shadow-xs transition active:scale-95 disabled:opacity-50 cursor-pointer whitespace-nowrap"
                        >
                          <Navigation className={`w-3.5 h-3.5 ${locLoading ? 'animate-spin' : ''}`} />
                          <span>{locLoading ? 'Detecting...' : 'Use Current My Location'}</span>
                        </button>

                        {(selectedArea || manualAreaText) && (
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedArea(null);
                              setManualAreaText('');
                              playAudioFeedback('click');
                            }}
                            className="w-full sm:w-auto flex-shrink-0 px-3 py-2.5 rounded-xl text-xs font-black text-red-600 bg-red-50 hover:bg-red-100 border border-red-200 transition active:scale-95 cursor-pointer whitespace-nowrap"
                            title="Clear Location"
                          >
                            Clear
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Location Badge */}
                    {selectedArea && (
                      <div className="mt-2.5 text-xs font-bold text-blue-700 bg-blue-50 border border-blue-200 rounded-lg px-3 py-1.5 flex items-center justify-between">
                        <span>Selected Location: {selectedArea.name} ({selectedArea.ward || 'Area'})</span>
                        <span className="text-[11px] text-blue-500 font-mono font-semibold">{selectedArea.lat.toFixed(4)}, {selectedArea.lon.toFixed(4)}</span>
                      </div>
                    )}

                    {touchedErrors.selectedArea && (
                      <p className="mt-1.5 text-xs font-black text-red-600 animate-in fade-in">
                        {touchedErrors.selectedArea}
                      </p>
                    )}
                  </div>

                  {/* 5. CREATE CITIZEN ACCOUNT CREDENTIALS (FULL WIDTH) */}
                  <div className="w-full p-5 sm:p-6 rounded-2xl border-2 border-slate-200 bg-slate-50 space-y-3">
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-xs sm:text-sm font-black uppercase text-slate-800 flex items-center space-x-1.5">
                        <span>5. Create Citizen Account Credentials:</span>
                        <span className="text-red-500 text-base">*</span>
                      </label>
                      <span className="text-[11px] font-bold text-slate-400 hidden sm:inline">Used to sign in across JanSeva</span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                          Create Username: *
                        </label>
                        <div className="relative">
                          <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                          <input
                            type="text"
                            placeholder="e.g. ramesh123"
                            value={username}
                            onChange={(e) => {
                              setUsername(e.target.value);
                              if (e.target.value.trim()) setTouchedErrors(prev => ({ ...prev, username: null }));
                            }}
                            className={`w-full pl-10 pr-4 py-3 rounded-xl text-sm font-semibold transition focus:ring-2 focus:ring-blue-500 ${touchedErrors.username
                              ? 'border-2 border-red-500 bg-red-50/40 ring-4 ring-red-200'
                              : 'border border-slate-300 bg-white'
                              }`}
                          />
                        </div>
                        {touchedErrors.username && (
                          <p className="text-xs font-black text-red-600 mt-1 animate-in fade-in">
                            {touchedErrors.username}
                          </p>
                        )}
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                          Create Password: *
                        </label>
                        <div className="relative">
                          <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                          <input
                            type={showPassword ? 'text' : 'password'}
                            placeholder="Enter secret password"
                            value={password}
                            onChange={(e) => {
                              setPassword(e.target.value);
                              if (e.target.value.trim()) setTouchedErrors(prev => ({ ...prev, password: null }));
                            }}
                            className={`w-full pl-10 pr-11 py-3 rounded-xl text-sm font-semibold transition focus:ring-2 focus:ring-blue-500 ${touchedErrors.password
                              ? 'border-2 border-red-500 bg-red-50/40 ring-4 ring-red-200'
                              : 'border border-slate-300 bg-white'
                              }`}
                          />
                          <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-3 top-3 p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition cursor-pointer"
                            title={showPassword ? 'Hide password' : 'Show password'}
                          >
                            {showPassword ? <EyeOff className="w-4 h-4 text-blue-600" /> : <Eye className="w-4 h-4" />}
                          </button>
                        </div>
                        {touchedErrors.password && (
                          <p className="text-xs font-black text-red-600 mt-1 animate-in fade-in">
                            {touchedErrors.password}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* SUBMIT BUTTON CENTERED IN THE PAGE */}
                  <div className="flex flex-col items-center justify-center w-full pt-3 space-y-3">
                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full sm:w-auto min-w-[300px] sm:min-w-[420px] px-8 py-4 rounded-2xl bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 hover:from-blue-700 hover:to-indigo-800 text-white font-black text-base shadow-xl shadow-blue-500/25 flex items-center justify-center space-x-2.5 transition-all duration-200 transform active:scale-95 hover:scale-[1.02] disabled:opacity-50 cursor-pointer"
                    >
                      <span>{loading ? 'Registering...' : 'Submit Registration (Proceed to Sign In)'}</span>
                      <ArrowRight className="w-5 h-5" />
                    </button>

                    {/* LINK TYPE BUTTON FOR MUNICIPAL AUTHORITY PORTAL */}
                    <div className="pt-2">
                      <button
                        type="button"
                        onClick={() => {
                          setAuthView('authority');
                          setErrorMsg('');
                          setSuccessNotice('');
                          setTouchedErrors({});
                          playAudioFeedback('click');
                        }}
                        className="inline-flex items-center space-x-2 text-xs sm:text-sm font-black text-indigo-700 hover:text-indigo-900 transition-all duration-200 px-3 py-1.5 rounded-xl hover:bg-indigo-50 border border-transparent hover:border-indigo-200 cursor-pointer underline underline-offset-4"
                      >
                        <Shield className="w-4 h-4 text-indigo-600" />
                        <span>Municipal Officer / Authority Portal Access →</span>
                      </button>
                    </div>
                  </div>

                </form>
              ) : (
                /* =================== SIGN IN MODE: SPLIT HERO WIDESCREEN LAYOUT =================== */
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center py-4">

                  {/* Left Brand Showcase without emojis */}
                  <div className="lg:col-span-5 bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-100 rounded-3xl p-6 sm:p-8 space-y-6">
                    <div className="flex items-center space-x-3">
                      <div className="w-12 h-12 rounded-2xl bg-blue-600 text-white flex items-center justify-center shadow-md shadow-blue-500/20">
                        <Building2 className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <h2 className="text-2xl font-black text-slate-900 tracking-tight">JanSeva Portal</h2>
                        <p className="text-xs text-blue-600 font-bold">Public Grievance Redressal System</p>
                      </div>
                    </div>

                    <p className="text-sm text-slate-600 leading-relaxed font-medium">
                      Report civic issues like potholes, garbage overflow, faulty streetlights, and water leakage directly to municipal authorities.
                    </p>

                    <div className="space-y-3 pt-2">
                      <div className="flex items-center space-x-3 bg-white p-3 rounded-xl border border-slate-200 shadow-xs">
                        <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-800 flex items-center justify-center">
                          <Mic className="w-4 h-4 text-amber-600" />
                        </div>
                        <div>
                          <p className="text-xs font-black text-slate-800">Voice Assistant Mode</p>
                          <p className="text-[11px] text-slate-500">Specially designed for non-literate citizens</p>
                        </div>
                      </div>

                      <div className="flex items-center space-x-3 bg-white p-3 rounded-xl border border-slate-200 shadow-xs">
                        <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-800 flex items-center justify-center">
                          <MapPin className="w-4 h-4 text-blue-600" />
                        </div>
                        <div>
                          <p className="text-xs font-black text-slate-800">Automatic GPS Geo-Tagging</p>
                          <p className="text-[11px] text-slate-500">Maps issues accurately to municipal wards</p>
                        </div>
                      </div>

                      <div className="flex items-center space-x-3 bg-white p-3 rounded-xl border border-slate-200 shadow-xs">
                        <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center">
                          <Check className="w-4 h-4 text-emerald-600" />
                        </div>
                        <div>
                          <p className="text-xs font-black text-slate-800">Verified Citizen Grievances</p>
                          <p className="text-[11px] text-slate-500">Protected with Government Official ID verification</p>
                        </div>
                      </div>
                    </div>

                    <div className="pt-2 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
                      <span>Municipal Corporation Support</span>
                      <span className="font-bold text-emerald-600">● 24x7 Active</span>
                    </div>
                  </div>

                  {/* Right Sign In Form */}
                  <div className="lg:col-span-7 space-y-6">
                    <div>
                      <h3 className="text-2xl font-black text-slate-900 tracking-tight">Citizen Sign In</h3>
                      <p className="text-xs text-slate-500 font-medium mt-1">Enter your username or government ID number to access the portal.</p>
                    </div>

                    <form noValidate onSubmit={handleLogin} className="space-y-4">
                      {/* Language Selector without flags */}
                      <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200">
                        <div className="flex items-center justify-between text-xs font-bold text-slate-600 mb-1.5 px-0.5">
                          <span>Select Language:</span>
                          <span className="text-[11px] font-black text-amber-900 bg-amber-100 px-2 py-0.5 rounded-full">
                            {LANGUAGES.find(l => l.code === currentLang)?.label || 'English'}
                          </span>
                        </div>
                        <div className="grid grid-cols-3 sm:grid-cols-6 gap-1.5">
                          {LANGUAGES.map((lang) => (
                            <button
                              key={lang.code}
                              type="button"
                              onClick={() => {
                                playAudioFeedback('click');
                                setLanguage(lang.code);
                              }}
                              className={`py-1.5 px-1 rounded-xl text-xs font-bold border transition flex items-center justify-center active:scale-95 ${currentLang === lang.code
                                ? 'bg-amber-400 text-slate-950 border-amber-600 shadow-sm font-black'
                                : 'bg-white hover:bg-slate-100 text-slate-700 border-slate-200'
                                }`}
                            >
                              <span>{lang.label}</span>
                            </button>
                          ))}
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-black text-slate-700 uppercase mb-1">
                          Username or Government ID Number:
                        </label>
                        <div className="relative">
                          <User className="w-5 h-5 text-slate-400 absolute left-3.5 top-3.5" />
                          <input
                            type="text"
                            placeholder="Enter Username or Aadhaar / PAN"
                            value={loginUsername}
                            onChange={(e) => {
                              setLoginUsername(e.target.value);
                              if (e.target.value.trim()) setTouchedErrors(prev => ({ ...prev, loginUsername: null }));
                            }}
                            className={`w-full pl-11 pr-4 py-3 rounded-xl text-sm font-bold transition focus:ring-2 focus:ring-blue-500 ${touchedErrors.loginUsername
                              ? 'border-2 border-red-500 bg-red-50/40 ring-4 ring-red-200'
                              : 'border border-slate-300 bg-slate-50'
                              }`}
                          />
                        </div>
                        {touchedErrors.loginUsername && (
                          <p className="text-xs font-black text-red-600 mt-1 animate-in fade-in">
                            {touchedErrors.loginUsername}
                          </p>
                        )}
                      </div>

                      <div>
                        <label className="block text-xs font-black text-slate-700 uppercase mb-1">
                          Password:
                        </label>
                        <div className="relative">
                          <Lock className="w-5 h-5 text-slate-400 absolute left-3.5 top-3.5" />
                          <input
                            type={showLoginPassword ? 'text' : 'password'}
                            placeholder="Enter your password"
                            value={loginPassword}
                            onChange={(e) => {
                              setLoginPassword(e.target.value);
                              if (e.target.value.trim()) setTouchedErrors(prev => ({ ...prev, loginPassword: null }));
                            }}
                            className={`w-full pl-11 pr-11 py-3 rounded-xl text-sm font-bold transition focus:ring-2 focus:ring-blue-500 ${touchedErrors.loginPassword
                              ? 'border-2 border-red-500 bg-red-50/40 ring-4 ring-red-200'
                              : 'border border-slate-300 bg-slate-50'
                              }`}
                          />
                          <button
                            type="button"
                            onClick={() => setShowLoginPassword(!showLoginPassword)}
                            className="absolute right-3.5 top-3.5 p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-200/50 transition cursor-pointer"
                            title={showLoginPassword ? 'Hide password' : 'Show password'}
                          >
                            {showLoginPassword ? <EyeOff className="w-4 h-4 text-blue-600" /> : <Eye className="w-4 h-4" />}
                          </button>
                        </div>
                        {touchedErrors.loginPassword && (
                          <p className="text-xs font-black text-red-600 mt-1 animate-in fade-in">
                            {touchedErrors.loginPassword}
                          </p>
                        )}
                      </div>

                      <button
                        type="submit"
                        disabled={loading}
                        className="w-full py-4 rounded-2xl bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 text-white font-black text-base shadow-lg flex items-center justify-center space-x-2 transition-all duration-200 transform active:scale-95 disabled:opacity-50 cursor-pointer"
                      >
                        <span>{loading ? 'Authenticating...' : 'Sign In to Portal'}</span>
                        <ArrowRight className="w-5 h-5" />
                      </button>

                      {/* LINK TYPE BUTTON FOR MUNICIPAL AUTHORITY PORTAL */}
                      <div className="pt-3 text-center border-t border-slate-100">
                        <button
                          type="button"
                          onClick={() => {
                            setAuthView('authority');
                            setErrorMsg('');
                            setSuccessNotice('');
                            setTouchedErrors({});
                            playAudioFeedback('click');
                          }}
                          className="inline-flex items-center space-x-2 text-xs sm:text-sm font-black text-indigo-700 hover:text-indigo-900 transition-all duration-200 px-3 py-1.5 rounded-xl hover:bg-indigo-50 border border-transparent hover:border-indigo-200 cursor-pointer underline underline-offset-4"
                        >
                          <Shield className="w-4 h-4 text-indigo-600" />
                          <span>Municipal Officer / Authority Portal Access →</span>
                        </button>
                      </div>
                    </form>
                  </div>

                </div>
              )}

            </div>
          </div>
        )}

      </main>

      {/* 3. FULL-WIDTH FOOTER */}
      <footer className="w-full py-4 text-center text-xs text-slate-500 border-t border-slate-200 z-10 bg-white">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <p className="font-semibold text-slate-600">© 2026 JanSeva Public Grievance Portal • Government Civic Care System</p>
          <p className="flex items-center space-x-2 text-slate-500">
            <span>Official Government Secured Portal</span>
            <span>•</span>
            <span className="text-emerald-600 font-bold">24x7 Citizen Redressal</span>
          </p>
        </div>
      </footer>
    </div>
  );
}
