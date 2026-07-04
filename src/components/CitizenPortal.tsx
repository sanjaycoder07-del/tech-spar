import React, { useState } from 'react';
import { 
  User, Phone, MapPin, Upload, Image as ImageIcon, Mic, 
  Search, ArrowRight, CheckCircle2, AlertTriangle, Play, Square, Loader2, RefreshCw
} from 'lucide-react';
import { Region, Grievance } from '../types';
import { INITIAL_REGIONS } from '../data/mockData';

interface CitizenPortalProps {
  onSubmissionSuccess: () => void;
}

// Sample templates in multiple languages for easy testing
const SAMPLE_TEMPLATES = [
  {
    lang: 'Hindi',
    title: 'Drinking Water Outage',
    desc: 'मुख्य पेयजल पाइपलाइन फट गई है। आंबेडकर नगर के सेक्टर-3 में पिछले ४ दिनों से एक बूंद पानी नहीं आया है। पानी की सख्त किल्लत है।',
    category: 'Water'
  },
  {
    lang: 'Tamil',
    title: 'Broken Mud Road',
    desc: 'ராம்பூர் கிராமத்தை நெடுஞ்சாலையுடன் இணைக்கும் சாலை முற்றிலும் சேதமடைந்துள்ளது. மழைக்காலத்தில் சேறும் சகதியுமாக மாறி ஆம்புலன்ஸ் கூட உள்ளே வர முடிவதில்லை.',
    category: 'Roads'
  },
  {
    lang: 'Telugu',
    title: 'Severe Electricity Cuts',
    desc: 'గోపాలపూర్ గ్రామంలో రోజుకు 12 గంటల కంటే ఎక్కువ కరెంట్ కోతలు విధిస్తున్నారు. పిల్లల బోర్డు పరీక్షల సమయంలో చదువుకోవడానికి కరెంట్ లేక చాలా ఇబ్బంది పడుతున్నారు.',
    category: 'Power'
  },
  {
    lang: 'English',
    title: 'Sewage Overflow',
    desc: 'Main drain line is blocked and sewage water is overflowing onto the street in Ward 4 sector 2. Foul smell is spreading and dengue risks are rising.',
    category: 'Sanitation'
  }
];

// Pre-packaged visual scenarios for easy photo ingestion
const PHOTO_SCENARIOS = [
  {
    id: 'road_damage',
    label: 'Broken Road',
    category: 'Roads',
    url: 'https://images.unsplash.com/photo-1515162305285-0293e4767cc2?auto=format&fit=crop&q=80&w=400',
    description: 'Visual evidence of deep potholes on a water-logged road.'
  },
  {
    id: 'sewer_leak',
    label: 'Sewage Leak',
    category: 'Sanitation',
    url: 'https://images.unsplash.com/photo-1541888946425-d81bb19240f5?auto=format&fit=crop&q=80&w=400',
    description: 'Black water logging overflowing from main public sewers.'
  },
  {
    id: 'water_pump',
    label: 'Damaged Pump',
    category: 'Water',
    url: 'https://images.unsplash.com/photo-1585320806297-9794b3e4eeae?auto=format&fit=crop&q=80&w=400',
    description: 'Rusty water dripping from damaged public tapstand pumps.'
  },
  {
    id: 'unlit_road',
    label: 'Dark Junction',
    category: 'Safety',
    url: 'https://images.unsplash.com/photo-1509114397022-ed747cca3f65?auto=format&fit=crop&q=80&w=400',
    description: 'Unlit rural junction adjacent to main highway.'
  }
];

export default function CitizenPortal({ onSubmissionSuccess }: CitizenPortalProps) {
  // Form State
  const [citizenName, setCitizenName] = useState('');
  const [citizenPhone, setCitizenPhone] = useState('');
  const [description, setDescription] = useState('');
  const [categoryPreference, setCategoryPreference] = useState('Sanitation');
  const [latitude, setLatitude] = useState(28.6139);
  const [longitude, setLongitude] = useState(77.2090);
  const [resolvedRegion, setResolvedRegion] = useState<Region>(INITIAL_REGIONS[3]); // Ambedkar Nagar default
  
  // Audio Note Recording Mocks
  const [isRecording, setIsRecording] = useState(false);
  const [voiceRecorded, setVoiceRecorded] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [recordingIntervalId, setRecordingIntervalId] = useState<any>(null);

  // Photo uploads
  const [selectedPhotoScenario, setSelectedPhotoScenario] = useState<string | null>(null);
  const [customPhotoBase64, setCustomPhotoBase64] = useState<string | null>(null);

  // Ingestion State
  const [isIngesting, setIsIngesting] = useState(false);
  const [ingestionStep, setIngestionStep] = useState('');
  const [submittedGrievance, setSubmittedGrievance] = useState<Grievance | null>(null);

  // Tracking Search State
  const [searchId, setSearchId] = useState('');
  const [trackedGrievance, setTrackedGrievance] = useState<Grievance | null>(null);
  const [searchAttempted, setSearchAttempted] = useState(false);
  const [isTrackingLoading, setIsTrackingLoading] = useState(false);

  // Start voice intake recording simulation
  const startRecording = () => {
    setIsRecording(true);
    setVoiceRecorded(false);
    setRecordingSeconds(0);
    const interval = setInterval(() => {
      setRecordingSeconds(prev => prev + 1);
    }, 1000);
    setRecordingIntervalId(interval);
  };

  const stopRecording = () => {
    setIsRecording(false);
    setVoiceRecorded(true);
    if (recordingIntervalId) {
      clearInterval(recordingIntervalId);
      setRecordingIntervalId(null);
    }
    // Set a quick simulated text in description for voice
    if (!description) {
      setDescription("[Intake Voice Note Recalled] Drinking water pipelines are rusted and releasing yellow muddy water in our neighborhood. Action is urgently requested.");
      setCategoryPreference('Water');
    }
  };

  // Coordinate Picker on SVG map
  const handleMapClick = (e: React.MouseEvent<SVGSVGElement>) => {
    const svgRect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - svgRect.left;
    const clickY = e.clientY - svgRect.top;

    // Map SVG pixels (800x500) to Delhi geo coordinates
    // SVG X: 50 to 750 -> Lon: 77.1950 to 77.2500
    // SVG Y: 50 to 450 -> Lat: 28.6300 to 28.6050
    const lonMin = 77.1950;
    const lonMax = 77.2500;
    const latMin = 28.6050;
    const latMax = 28.6300;

    const scaleX = (clickX - 50) / 700; // 0 to 1
    const scaleY = (clickY - 50) / 400; // 0 to 1

    const computedLon = lonMin + scaleX * (lonMax - lonMin);
    const computedLat = latMax - scaleY * (latMax - latMin); // Lat decreases as Y increases

    // Bound values
    const finalLat = Math.min(latMax, Math.max(latMin, Number(computedLat.toFixed(4))));
    const finalLon = Math.min(lonMax, Math.max(lonMin, Number(computedLon.toFixed(4))));

    setLatitude(finalLat);
    setLongitude(finalLon);

    // Dynamic administrative region resolution based on coordinate boundaries
    // Let's find closest region
    const centers: Record<string, { lat: number; lng: number }> = {
      'ward-1': { lat: 28.6160, lng: 77.2010 },
      'ward-2': { lat: 28.6120, lng: 77.2050 },
      'ward-3': { lat: 28.6150, lng: 77.1950 },
      'ward-4': { lat: 28.6139, lng: 77.2090 },
      'village-1': { lat: 28.6210, lng: 77.2340 },
      'village-2': { lat: 28.6300, lng: 77.2500 },
      'village-3': { lat: 28.6180, lng: 77.2180 },
      'village-4': { lat: 28.6050, lng: 77.1980 },
    };

    let closestId = 'ward-4';
    let minDistance = Infinity;

    for (const [id, coord] of Object.entries(centers)) {
      const dist = Math.sqrt(Math.pow(finalLat - coord.lat, 2) + Math.pow(finalLon - coord.lng, 2));
      if (dist < minDistance) {
        minDistance = dist;
        closestId = id;
      }
    }

    const reg = INITIAL_REGIONS.find(r => r.id === closestId);
    if (reg) {
      setResolvedRegion(reg);
    }
  };

  // Convert uploaded image to base64
  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setCustomPhotoBase64(reader.result as string);
        setSelectedPhotoScenario(null);
      };
      reader.readAsDataURL(file);
    }
  };

  // Ingestion submission trigger
  const handleIngestGrievance = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!description && !selectedPhotoScenario && !customPhotoBase64) {
      alert("Please provide either a written description or attach/select a visual scenario.");
      return;
    }

    setIsIngesting(true);
    setSubmittedGrievance(null);

    // AI Pipeline Animation Checklist
    try {
      setIngestionStep("Initializing Multi-Channel Intake Node...");
      await new Promise(r => setTimeout(r, 600));

      if (voiceRecorded) {
        setIngestionStep("Running Whisper speech-to-text transcriber...");
        await new Promise(r => setTimeout(r, 800));
      }

      if (selectedPhotoScenario || customPhotoBase64) {
        setIngestionStep("Running Gemini Tesseract multimodal OCR analyzer...");
        await new Promise(r => setTimeout(r, 900));
      }

      setIngestionStep("Analyzing language grammar & executing IndicTrans2 English translator...");
      await new Promise(r => setTimeout(r, 700));

      setIngestionStep("Assessing spatial coordinate boundaries and resolving local region ID...");
      await new Promise(r => setTimeout(r, 600));

      setIngestionStep("Filing grievance with Member of Parliament dynamic scoring engine...");
      
      const payloadPhoto = customPhotoBase64 || 
        (selectedPhotoScenario ? PHOTO_SCENARIOS.find(s => s.id === selectedPhotoScenario)?.url : undefined);

      const response = await fetch('/api/submissions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          citizenName: citizenName || "Anonymous",
          citizenPhone: citizenPhone || "+91 99999 99999",
          description,
          categoryPreference,
          latitude,
          longitude,
          photoUrl: payloadPhoto,
          voiceUrl: voiceRecorded ? 'simulated_audio_stream.wav' : undefined
        })
      });

      if (!response.ok) {
        throw new Error("Ingestion pipeline failed");
      }

      const data = await response.json();
      if (data.success && data.grievance) {
        setSubmittedGrievance(data.grievance);
        // Clear Form fields
        setCitizenName('');
        setCitizenPhone('');
        setDescription('');
        setVoiceRecorded(false);
        setSelectedPhotoScenario(null);
        setCustomPhotoBase64(null);
        // Trigger parent state update
        onSubmissionSuccess();
      } else {
        throw new Error(data.error || "Submission rejected");
      }
    } catch (err: any) {
      console.error(err);
      alert(`Ingestion Failure: ${err.message || 'Server did not respond'}`);
    } finally {
      setIsIngesting(false);
    }
  };

  // Tracking Lookup
  const handleTrackGrievance = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchId.trim()) return;

    setIsTrackingLoading(true);
    setSearchAttempted(true);
    setTrackedGrievance(null);

    try {
      const response = await fetch('/api/submissions');
      if (response.ok) {
        const grievances: Grievance[] = await response.json();
        const found = grievances.find(g => g.id.toUpperCase() === searchId.toUpperCase().trim());
        if (found) {
          setTrackedGrievance(found);
        }
      }
    } catch (err) {
      console.error("Tracking lookup error:", err);
    } finally {
      setIsTrackingLoading(false);
    }
  };

  return (
    <div className="py-6 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto" id="citizen-portal">
      {/* Intro Hero Section */}
      <div className="bg-gradient-to-r from-emerald-800 to-teal-700 text-white p-6 sm:p-8 rounded-2xl shadow-md mb-8">
        <h1 className="font-display font-bold text-2xl sm:text-3xl tracking-tight mb-2">
          Public Grievance Portal
        </h1>
        <p className="text-emerald-100 text-sm sm:text-base max-w-3xl leading-relaxed">
          Submit local development concerns (water shortages, broken roads, sewer leaks, power outages, and public safety issues). Your report will be instantly translated, categorized by AI, mapped geotag-wise, and prioritized in the Member of Parliament (MP) scoring system.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Form Fields */}
        <div className="lg:col-span-7 bg-white p-6 rounded-2xl border border-slate-100 shadow-xs">
          <h2 className="font-display font-semibold text-lg text-slate-800 mb-6 flex items-center space-x-2">
            <span className="bg-emerald-100 text-emerald-800 p-1.5 rounded-lg flex items-center justify-center">
              <User className="h-4 w-4" />
            </span>
            <span>File a New Grievance Submission</span>
          </h2>

          <form onSubmit={handleIngestGrievance} className="space-y-5">
            {/* Citizen Details */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
                  Your Full Name
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                  <input
                    type="text"
                    required
                    placeholder="e.g. Ramesh Chandra"
                    value={citizenName}
                    onChange={(e) => setCitizenName(e.target.value)}
                    className="pl-9 w-full rounded-xl border border-slate-200 py-2.5 text-sm text-slate-800 placeholder-slate-400 focus:outline-hidden focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
                  Mobile Number (For Status SMS)
                </label>
                <div className="relative">
                  <Phone className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                  <input
                    type="tel"
                    required
                    placeholder="e.g. +91 98765 43210"
                    value={citizenPhone}
                    onChange={(e) => setCitizenPhone(e.target.value)}
                    className="pl-9 w-full rounded-xl border border-slate-200 py-2.5 text-sm text-slate-800 placeholder-slate-400 focus:outline-hidden focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600"
                  />
                </div>
              </div>
            </div>

            {/* Quick Language Selection Templates */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Select Quick Test Template (Optional)
                </label>
                <span className="text-[10px] bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full font-mono font-medium">
                  Multilingual AI Test
                </span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {SAMPLE_TEMPLATES.map((t) => (
                  <button
                    key={t.lang}
                    type="button"
                    onClick={() => {
                      setDescription(t.desc);
                      setCategoryPreference(t.category);
                    }}
                    className="text-left text-xs bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg p-2 transition-all cursor-pointer"
                  >
                    <span className="font-bold text-slate-700 block">{t.lang}</span>
                    <span className="text-slate-500 font-medium truncate block">{t.title}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Description Text Box */}
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
                Grievance Description (Type in Hindi, Tamil, Telugu, or English)
              </label>
              <textarea
                rows={4}
                required
                placeholder="Explain the development issue in detail. State when it occurred, location details, and the daily impact on residents..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full rounded-xl border border-slate-200 p-3 text-sm text-slate-800 placeholder-slate-400 focus:outline-hidden focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 leading-relaxed"
              />
            </div>

            {/* Ingestion Parameters: Category & Geotag Inputs */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
                  Issue Category Preference
                </label>
                <select
                  value={categoryPreference}
                  onChange={(e) => setCategoryPreference(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 py-2.5 px-3 text-sm text-slate-800 bg-white focus:outline-hidden focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 cursor-pointer"
                >
                  <option value="Roads">Roads & Connectivity Gaps</option>
                  <option value="Water">Water Supply & Leakages</option>
                  <option value="Power">Power Outages & Lines</option>
                  <option value="Sanitation">Sanitation, Sewers & Waste</option>
                  <option value="Safety">Public Safety & Lighting</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
                  Resolved Coordinate Region
                </label>
                <div className="flex items-center space-x-2 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5">
                  <MapPin className="h-4 w-4 text-emerald-600 shrink-0" />
                  <span className="text-xs text-slate-700 font-medium truncate">
                    {resolvedRegion ? resolvedRegion.name : 'Click the map to select location'}
                  </span>
                </div>
              </div>
            </div>

            {/* Submitting Status / Actions */}
            <div className="pt-2">
              {isIngesting ? (
                <div className="bg-emerald-50 border border-emerald-100 text-emerald-800 rounded-xl p-4 flex flex-col items-center justify-center space-y-3">
                  <Loader2 className="h-7 w-7 text-emerald-600 animate-spin" />
                  <span className="text-sm font-semibold tracking-tight animate-pulse">{ingestionStep}</span>
                </div>
              ) : (
                <button
                  type="submit"
                  className="w-full bg-emerald-700 hover:bg-emerald-800 text-white font-semibold py-3 px-4 rounded-xl shadow-xs transition-colors cursor-pointer flex items-center justify-center space-x-2"
                >
                  <span>Submit to MP Prioritization Pipeline</span>
                  <ArrowRight className="h-4 w-4" />
                </button>
              )}
            </div>
          </form>

          {/* AI Intake Feedback Modal */}
          {submittedGrievance && (
            <div className="mt-6 bg-emerald-50 border border-emerald-200 rounded-2xl p-5 text-slate-800 shadow-xs">
              <div className="flex items-start space-x-3">
                <CheckCircle2 className="h-6 w-6 text-emerald-600 shrink-0 mt-0.5" />
                <div className="flex-1">
                  <h3 className="font-display font-bold text-emerald-900 text-base">
                    Grievance Ingested Successfully!
                  </h3>
                  <p className="text-xs text-emerald-800 font-medium mt-1">
                    The dynamic pipeline classified and processed the submission on the fly.
                  </p>

                  <div className="mt-4 grid grid-cols-2 gap-3 bg-white border border-emerald-100 p-3.5 rounded-xl font-mono text-xs">
                    <div>
                      <span className="text-slate-400 block font-semibold uppercase tracking-wider text-[9px]">Grievance ID</span>
                      <span className="font-bold text-slate-800 text-sm">{submittedGrievance.id}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block font-semibold uppercase tracking-wider text-[9px]">Language Detection</span>
                      <span className="font-bold text-emerald-700">{submittedGrievance.language}</span>
                    </div>
                    <div className="mt-2">
                      <span className="text-slate-400 block font-semibold uppercase tracking-wider text-[9px]">AI Category</span>
                      <span className="bg-slate-100 text-slate-700 font-semibold px-2 py-0.5 rounded-full inline-block">
                        {submittedGrievance.category}
                      </span>
                    </div>
                    <div className="mt-2">
                      <span className="text-slate-400 block font-semibold uppercase tracking-wider text-[9px]">AI Urgency Rating</span>
                      <span className={`font-semibold px-2 py-0.5 rounded-full inline-block ${
                        submittedGrievance.urgency === 'Critical' ? 'bg-red-50 text-red-700 border border-red-100' :
                        submittedGrievance.urgency === 'High' ? 'bg-orange-50 text-orange-700' :
                        submittedGrievance.urgency === 'Medium' ? 'bg-yellow-50 text-yellow-700' : 'bg-blue-50 text-blue-700'
                      }`}>
                        {submittedGrievance.urgency}
                      </span>
                    </div>
                  </div>

                  <div className="mt-4 bg-white/70 border border-emerald-100 p-3 rounded-xl">
                    <span className="text-emerald-900 font-bold text-xs block mb-1">AI Translated English Description:</span>
                    <p className="text-xs text-slate-600 leading-relaxed italic">
                      "{submittedGrievance.description}"
                    </p>
                  </div>

                  <p className="text-[10px] text-emerald-600 mt-3 font-semibold">
                    *Note down the Tracking ID. Enter it in the lookup tracker below to follow live MP actions.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Audio Rec, Photo Pick & Interactive SVG Map */}
        <div className="lg:col-span-5 space-y-6">
          
          {/* Geotag Coordinate Picker SVG Map */}
          <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-xs">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-display font-semibold text-sm text-slate-800 flex items-center space-x-2">
                <MapPin className="h-4 w-4 text-emerald-600" />
                <span>Constituency Coordinate Geotagger</span>
              </h3>
              <span className="text-[10px] text-slate-400 font-mono font-bold uppercase">
                Grid: Lat/Lng Bounds
              </span>
            </div>
            
            <p className="text-xs text-slate-500 mb-3 leading-relaxed">
              Click anywhere on the administrative map grid below to pick geographic coordinates for your grievance location.
            </p>

            {/* Interactive map widget */}
            <div className="relative bg-slate-50 border border-slate-100 rounded-xl overflow-hidden shadow-inner">
              <svg 
                viewBox="0 0 800 500" 
                className="w-full h-auto cursor-crosshair hover:opacity-95 transition-opacity"
                onClick={handleMapClick}
              >
                {/* Background grid */}
                <defs>
                  <pattern id="mapGrid" width="40" height="40" patternUnits="userSpaceOnUse">
                    <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#e2e8f0" strokeWidth="0.5" />
                  </pattern>
                </defs>
                <rect width="800" height="500" fill="url(#mapGrid)" />

                {/* Draw Wards and Villages */}
                {INITIAL_REGIONS.map((r) => (
                  <g key={r.id}>
                    <path
                      d={r.pathData}
                      className={`transition-colors duration-200 stroke-2 ${
                        resolvedRegion?.id === r.id 
                          ? 'fill-emerald-100/70 stroke-emerald-600' 
                          : 'fill-slate-100/50 stroke-slate-300 hover:fill-slate-100'
                      }`}
                    />
                    <text
                      x={r.centerCoords[0]}
                      y={r.centerCoords[1]}
                      className={`text-[13px] font-display font-bold select-none pointer-events-none text-center ${
                        resolvedRegion?.id === r.id ? 'fill-emerald-800' : 'fill-slate-400'
                      }`}
                      textAnchor="middle"
                    >
                      {r.name.split(' - ')[0]}
                    </text>
                  </g>
                ))}

                {/* Interactive coordinate crosshair pointer circle */}
                {latitude && longitude && (
                  <g>
                    {/* SVG X conversion: lon is 77.1950 to 77.2500 -> SVG: 50 to 750 */}
                    {/* SVG Y conversion: lat is 28.6050 to 28.6300 -> SVG: 450 to 50 */}
                    {(() => {
                      const lonMin = 77.1950;
                      const lonMax = 77.2500;
                      const latMin = 28.6050;
                      const latMax = 28.6300;
                      const x = 50 + ((longitude - lonMin) / (lonMax - lonMin)) * 700;
                      const y = 450 - ((latitude - latMin) / (latMax - latMin)) * 400;
                      return (
                        <g>
                          <circle cx={x} cy={y} r="18" fill="#10b981" fillOpacity="0.25" className="animate-ping" />
                          <circle cx={x} cy={y} r="8" fill="#10b981" stroke="#ffffff" strokeWidth="2" shadow-md="true" />
                          <path d={`M ${x-15} ${y} L ${x+15} ${y} M ${x} ${y-15} L ${x} ${y+15}`} stroke="#0f766e" strokeWidth="1" />
                        </g>
                      );
                    })()}
                  </g>
                )}
              </svg>
            </div>

            {/* Coordinates Log */}
            <div className="mt-3 grid grid-cols-2 gap-2 bg-slate-50 border border-slate-100 rounded-xl p-2.5 font-mono text-xs">
              <div>
                <span className="text-slate-400 block text-[9px] uppercase tracking-wider font-semibold">Latitude</span>
                <span className="font-bold text-slate-700">{latitude}° N</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[9px] uppercase tracking-wider font-semibold">Longitude</span>
                <span className="font-bold text-slate-700">{longitude}° E</span>
              </div>
            </div>
          </div>

          {/* Photo Scenario selector */}
          <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-xs">
            <h3 className="font-display font-semibold text-sm text-slate-800 mb-3 flex items-center space-x-2">
              <ImageIcon className="h-4 w-4 text-emerald-600" />
              <span>Attach Visual Photo Evidence</span>
            </h3>

            <p className="text-xs text-slate-500 mb-4 leading-relaxed">
              Select one of our mock scenario photographs below to attach visual proof, or upload your own file.
            </p>

            {/* Mock Visual Grid */}
            <div className="grid grid-cols-4 gap-2 mb-4">
              {PHOTO_SCENARIOS.map((s) => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => {
                    setSelectedPhotoScenario(s.id);
                    setCategoryPreference(s.category);
                    setCustomPhotoBase64(null);
                  }}
                  className={`relative aspect-video rounded-lg overflow-hidden border cursor-pointer transition-all ${
                    selectedPhotoScenario === s.id 
                      ? 'border-emerald-600 ring-2 ring-emerald-600/30 ring-offset-1 scale-102 shadow-xs' 
                      : 'border-slate-200 hover:opacity-90'
                  }`}
                >
                  <img src={s.url} alt={s.label} className="w-full h-full object-cover" />
                  <div className="absolute inset-x-0 bottom-0 bg-black/65 py-0.5 text-center">
                    <span className="text-[10px] text-white font-semibold font-mono tracking-wide">{s.label}</span>
                  </div>
                </button>
              ))}
            </div>

            {/* Manual file upload */}
            <div className="border border-dashed border-slate-200 rounded-xl p-3 text-center bg-slate-50 hover:bg-slate-100 transition-colors relative">
              <input
                type="file"
                accept="image/*"
                onChange={handlePhotoUpload}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              />
              <div className="flex items-center justify-center space-x-2 text-slate-500 cursor-pointer">
                <Upload className="h-4 w-4 text-slate-400" />
                <span className="text-xs font-semibold">
                  {customPhotoBase64 ? '✓ Photo Attached' : 'Or upload custom image'}
                </span>
              </div>
            </div>
          </div>

          {/* Voice Intake recorder mock */}
          <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-xs">
            <h3 className="font-display font-semibold text-sm text-slate-800 mb-2 flex items-center space-x-2">
              <Mic className="h-4 w-4 text-emerald-600" />
              <span>Voice Note Dictation Recorder</span>
            </h3>

            <p className="text-xs text-slate-500 mb-3 leading-relaxed">
              Dictate your complaint in your spoken native language (Whisper AI transcribes and translates).
            </p>

            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex items-center justify-between">
              {isRecording ? (
                <div className="flex items-center space-x-3">
                  <span className="flex h-3 w-3 relative">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-red-600"></span>
                  </span>
                  <div className="flex flex-col">
                    <span className="text-xs font-bold text-slate-800 font-mono">Recording Voice Note...</span>
                    <span className="text-[10px] text-slate-400 font-mono font-medium">00:{recordingSeconds < 10 ? `0${recordingSeconds}` : recordingSeconds} seconds</span>
                  </div>
                </div>
              ) : (
                <span className="text-xs text-slate-500 font-medium">
                  {voiceRecorded ? '✓ Voice file cached (142 KB)' : 'Microphone ready for intake'}
                </span>
              )}

              {isRecording ? (
                <button
                  type="button"
                  onClick={stopRecording}
                  className="bg-red-600 text-white p-2.5 rounded-full hover:bg-red-700 transition-colors shadow-xs flex items-center justify-center cursor-pointer"
                >
                  <Square className="h-4 w-4" />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={startRecording}
                  className="bg-emerald-700 text-white p-2.5 rounded-full hover:bg-emerald-800 transition-colors shadow-xs flex items-center justify-center cursor-pointer"
                >
                  <Mic className="h-4 w-4" />
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Live Grievance Tracking Status Lookups */}
      <div className="mt-8 bg-white border border-slate-100 rounded-2xl p-6 shadow-xs">
        <h2 className="font-display font-semibold text-lg text-slate-800 mb-4 flex items-center space-x-2">
          <Search className="h-5 w-5 text-emerald-600" />
          <span>Live Citizen Submission Status Tracker</span>
        </h2>
        
        <p className="text-xs text-slate-500 mb-5 leading-relaxed">
          Type your unique Tracking ID (e.g., <span className="font-mono bg-slate-100 text-slate-700 px-1.5 py-0.5 rounded-md font-bold">CV-1001</span> or <span className="font-mono bg-slate-100 text-slate-700 px-1.5 py-0.5 rounded-md font-bold">CV-1002</span>) to search the administrative database and review official action schedules.
        </p>

        <form onSubmit={handleTrackGrievance} className="flex gap-2 max-w-md">
          <input
            type="text"
            required
            placeholder="Enter Grievance ID (e.g. CV-1002)"
            value={searchId}
            onChange={(e) => setSearchId(e.target.value)}
            className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm text-slate-800 focus:outline-hidden focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 uppercase font-mono font-semibold"
          />
          <button
            type="submit"
            className="bg-slate-800 hover:bg-slate-900 text-white font-semibold px-5 rounded-xl text-xs flex items-center justify-center space-x-1.5 transition-colors cursor-pointer"
          >
            {isTrackingLoading ? (
              <RefreshCw className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <>
                <Search className="h-3.5 w-3.5" />
                <span>Search</span>
              </>
            )}
          </button>
        </form>

        {/* Search Results Display */}
        {searchAttempted && (
          <div className="mt-6 border-t border-slate-100 pt-6">
            {trackedGrievance ? (
              <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
                <div className="md:col-span-8 space-y-4">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-mono font-bold text-slate-800 text-sm bg-slate-100 px-2 py-1 rounded-md border border-slate-200">
                      {trackedGrievance.id}
                    </span>
                    <span className="text-sm font-semibold text-slate-800 font-display">
                      {trackedGrievance.title}
                    </span>
                  </div>

                  <p className="text-xs text-slate-600 bg-slate-50 border border-slate-100 rounded-xl p-3.5 leading-relaxed font-medium">
                    <span className="text-slate-400 block text-[9px] uppercase tracking-wider font-semibold font-mono mb-1">Citizen Description</span>
                    "{trackedGrievance.description}"
                  </p>

                  {trackedGrievance.originalDescription && trackedGrievance.originalDescription !== trackedGrievance.description && (
                    <p className="text-xs text-slate-400 font-mono italic">
                      Original raw submission: "{trackedGrievance.originalDescription}" ({trackedGrievance.language})
                    </p>
                  )}

                  {/* MP official statement */}
                  {trackedGrievance.mpComment ? (
                    <div className="bg-amber-50/60 border border-amber-200 rounded-xl p-4 text-slate-800">
                      <div className="flex items-start space-x-2">
                        <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
                        <div>
                          <span className="text-[10px] uppercase font-bold text-amber-700 tracking-wider font-mono block mb-1">
                            Official MP Secretariat Comment
                          </span>
                          <p className="text-xs text-slate-700 leading-relaxed font-semibold">
                            "{trackedGrievance.mpComment}"
                          </p>
                          <span className="text-[10px] text-slate-400 font-mono mt-1.5 block font-medium">
                            Updated: {new Date(trackedGrievance.mpCommentedAt!).toLocaleString()}
                          </span>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-slate-500 text-xs italic">
                      No official MP action notes have been published yet. The issue is currently queuing in the prioritization catalog.
                    </div>
                  )}
                </div>

                {/* Progress Tracking Timeline */}
                <div className="md:col-span-4 bg-slate-50 border border-slate-100 p-4 rounded-xl">
                  <h4 className="text-xs font-semibold text-slate-700 uppercase tracking-wider mb-4 font-mono">
                    Administrative Schedule
                  </h4>

                  <div className="space-y-4">
                    {/* Step 1: Ingestion */}
                    <div className="flex space-x-3">
                      <div className="flex flex-col items-center">
                        <div className="h-4 w-4 rounded-full bg-emerald-600 flex items-center justify-center text-[8px] text-white font-bold">✓</div>
                        <div className="w-0.5 h-8 bg-emerald-600"></div>
                      </div>
                      <div className="flex-1">
                        <span className="text-xs font-bold text-slate-800 block">Ingested & Filed</span>
                        <span className="text-[10px] text-slate-400 font-mono">{new Date(trackedGrievance.createdAt).toLocaleDateString()}</span>
                      </div>
                    </div>

                    {/* Step 2: AI triage */}
                    <div className="flex space-x-3">
                      <div className="flex flex-col items-center">
                        <div className="h-4 w-4 rounded-full bg-emerald-600 flex items-center justify-center text-[8px] text-white font-bold">✓</div>
                        <div className="w-0.5 h-8 bg-emerald-600"></div>
                      </div>
                      <div className="flex-1">
                        <span className="text-xs font-bold text-slate-800 block">AI Categorized</span>
                        <span className="text-[10px] text-emerald-600 font-mono font-medium">Urgency: {trackedGrievance.urgency}</span>
                      </div>
                    </div>

                    {/* Step 3: MP Review */}
                    <div className="flex space-x-3">
                      <div className="flex flex-col items-center">
                        <div className={`h-4 w-4 rounded-full flex items-center justify-center text-[8px] font-bold ${
                          trackedGrievance.status !== 'Pending' ? 'bg-emerald-600 text-white' : 'bg-slate-200 text-slate-500'
                        }`}>{trackedGrievance.status !== 'Pending' ? '✓' : '3'}</div>
                        <div className={`w-0.5 h-8 ${
                          trackedGrievance.status === 'Work Ordered' || trackedGrievance.status === 'Completed' ? 'bg-emerald-600' : 'bg-slate-200'
                        }`}></div>
                      </div>
                      <div className="flex-1">
                        <span className="text-xs font-bold text-slate-800 block">MP Reviewed</span>
                        <span className="text-[10px] text-slate-400 font-mono">
                          {trackedGrievance.status !== 'Pending' ? 'Priority cataloged' : 'Pending assessment'}
                        </span>
                      </div>
                    </div>

                    {/* Step 4: Executive execution */}
                    <div className="flex space-x-3">
                      <div className="flex flex-col items-center">
                        <div className={`h-4 w-4 rounded-full flex items-center justify-center text-[8px] font-bold ${
                          trackedGrievance.status === 'Work Ordered' || trackedGrievance.status === 'Completed' ? 'bg-emerald-600 text-white' : 'bg-slate-200 text-slate-500'
                        }`}>{trackedGrievance.status === 'Work Ordered' || trackedGrievance.status === 'Completed' ? '✓' : '4'}</div>
                        <div className={`w-0.5 h-8 ${
                          trackedGrievance.status === 'Completed' ? 'bg-emerald-600' : 'bg-slate-200'
                        }`}></div>
                      </div>
                      <div className="flex-1">
                        <span className="text-xs font-bold text-slate-800 block">Executive Work Ordered</span>
                        <span className="text-[10px] text-slate-400 font-mono">
                          {trackedGrievance.status === 'Work Ordered' || trackedGrievance.status === 'Completed' ? 'Funds allocated' : 'Awaiting department orders'}
                        </span>
                      </div>
                    </div>

                    {/* Step 5: Completed */}
                    <div className="flex space-x-3">
                      <div className="flex flex-col items-center">
                        <div className={`h-4 w-4 rounded-full flex items-center justify-center text-[8px] font-bold ${
                          trackedGrievance.status === 'Completed' ? 'bg-emerald-600 text-white' : 'bg-slate-200 text-slate-500'
                        }`}>{trackedGrievance.status === 'Completed' ? '✓' : '5'}</div>
                      </div>
                      <div className="flex-1">
                        <span className="text-xs font-bold text-slate-800 block">Issue Resolved</span>
                        <span className="text-[10px] text-slate-400 font-mono">
                          {trackedGrievance.status === 'Completed' ? 'Work completed on site' : 'Awaiting department execution'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-center space-x-2 text-amber-800 text-sm font-semibold">
                <AlertTriangle className="h-4 w-4 shrink-0" />
                <span>No grievance with ID "{searchId}" could be found. Please check spelling or submit a new grievance first.</span>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
