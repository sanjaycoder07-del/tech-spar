import { useState, useEffect } from 'react';
import Header from './components/Header';
import CitizenPortal from './components/CitizenPortal';
import MPDashboard from './components/MPDashboard';
import MPLogin from './components/MPLogin';

export default function App() {
  const [activeTab, setActiveTab] = useState<'citizen' | 'mp'>('citizen');
  // Incremented on submission success to force a hot reload of administrative dashboards
  const [refreshCounter, setRefreshCounter] = useState(0);
  const [isMpAuthenticated, setIsMpAuthenticated] = useState<boolean>(false);

  useEffect(() => {
    // Check if authenticated in the current session
    const authStatus = sessionStorage.getItem('isMpAuthenticated');
    if (authStatus === 'true') {
      setIsMpAuthenticated(true);
    }
  }, []);

  const handleSubmissionSuccess = () => {
    setRefreshCounter(prev => prev + 1);
  };

  const handleLoginSuccess = () => {
    setIsMpAuthenticated(true);
    sessionStorage.setItem('isMpAuthenticated', 'true');
  };

  const handleLogout = () => {
    setIsMpAuthenticated(false);
    sessionStorage.removeItem('isMpAuthenticated');
    setActiveTab('citizen');
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 font-sans" id="citizen-voice-app">
      {/* Universal Header */}
      <Header activeTab={activeTab} onTabChange={setActiveTab} />

      {/* Main Content Areas */}
      <main className="transition-all duration-300">
        {activeTab === 'citizen' ? (
          <CitizenPortal onSubmissionSuccess={handleSubmissionSuccess} />
        ) : !isMpAuthenticated ? (
          <MPLogin 
            onLoginSuccess={handleLoginSuccess} 
            onCancel={() => setActiveTab('citizen')} 
          />
        ) : (
          <div className="relative">
            {/* Quick Logout Banner */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4 flex justify-end">
              <button 
                onClick={handleLogout}
                className="bg-red-50 hover:bg-red-100 text-red-700 text-[10px] font-bold uppercase tracking-wider font-mono px-3 py-1.5 rounded-lg border border-red-150 transition-colors cursor-pointer"
              >
                Sign Out from Secretariat
              </button>
            </div>
            <MPDashboard onRefreshCounter={refreshCounter} />
          </div>
        )}
      </main>

      {/* Universal Footer */}
      <footer className="bg-white border-t border-slate-100 py-6 text-center text-xs text-slate-400 font-semibold font-mono">
        <div>© 2026 CitizenVoice MP Priority Platform. Powered by Antigravity Full-Stack AI.</div>
      </footer>
    </div>
  );
}

