import { useState, useEffect, useRef } from "react";
import Sidebar from "../components/sidebar/Sidebar";
import { Search, Bell, User, Sun, Moon, Menu } from "lucide-react";
import { useNavigate, Link } from "react-router-dom";

const MainLayout = ({ children }) => {
  const [theme, setTheme] = useState(localStorage.getItem("theme") || "light");
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [globalSearch, setGlobalSearch] = useState("");
  const navigate = useNavigate();
  const profileMenuRef = useRef(null);

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem("theme", theme);
  }, [theme]);

  useEffect(() => {
    const syncTheme = (event) => {
      const nextTheme = event.detail?.theme || localStorage.getItem("theme") || "light";
      setTheme(nextTheme);
    };

    window.addEventListener("inventory-theme-change", syncTheme);
    return () => window.removeEventListener("inventory-theme-change", syncTheme);
  }, []);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (profileMenuRef.current && !profileMenu.current.contains(event.target)) {
        setIsProfileOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const toggleTheme = () => {
    setTheme((prevTheme) => (prevTheme === "light" ? "dark" : "light"));
  };

  const handleGlobalSearch = (e) => {
    if (e.key === 'Enter' && globalSearch.trim() !== '') {
      navigate(`/inventory?search=${encodeURIComponent(globalSearch.trim())}`);
      setGlobalSearch("");
    }
  };

  return (
    <div className="flex h-screen theme-app overflow-hidden selection:theme-cyan-bg font-sans">
      {/* Mobile Overlay */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 md:hidden animate-in fade-in"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Fixed Sidebar */}
      <Sidebar isOpen={isSidebarOpen} setIsOpen={setIsSidebarOpen} />

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col h-full relative overflow-hidden">
        {/* Top Navbar / Command Bar */}
        <header className="h-16 flex items-center justify-between px-4 md:px-8 border-b theme-border theme-bg-header backdrop-blur-xl z-20 shrink-0">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setIsSidebarOpen(true)}
              className="md:hidden theme-muted hover:text-cyan-400 transition-colors"
            >
              <Menu size={24} />
            </button>
            <div className="hidden md:flex items-center gap-2 px-4 py-2 theme-bg-input border theme-border rounded-full w-96 transition-all focus-within:theme-cyan-border focus-within:shadow-[0_0_15px_rgba(34,211,238,0.1)]">
              <Search size={16} className="theme-muted" />
              <input 
                type="text"
                value={globalSearch}
                onChange={(e) => setGlobalSearch(e.target.value)}
                onKeyDown={handleGlobalSearch}
                placeholder="Search datasets, inventory parts, or insights..." 
                className="bg-transparent border-none outline-none text-sm theme-text w-full placeholder:theme-subtle"
              />
            </div>
          </div>

          <div className="flex items-center gap-4">
            <button 
              onClick={toggleTheme}
              className="relative theme-muted hover:theme-cyan transition-colors"
              title="Toggle Theme"
            >
              {theme === "light" ? <Moon size={20} /> : <Sun size={20} />}
            </button>
            <div className="relative" ref={profileMenuRef}>
              <button 
                onClick={() => setIsProfileOpen(prev => !prev)}
                className="w-8 h-8 rounded-full border theme-border theme-bg-card flex items-center justify-center overflow-hidden hover:theme-cyan-border transition-colors cursor-pointer"
              >
                <User size={16} className="theme-muted" />
              </button>

              {isProfileOpen && (
                <div className="absolute top-full right-0 mt-3 w-72 theme-bg-card border theme-border rounded-2xl shadow-2xl backdrop-blur-xl animate-in fade-in zoom-in-95 duration-300 origin-top-right">
                  <div className="p-4 border-b theme-border">
                    <h3 className="font-semibold theme-text">Sarthak Goyal</h3>
                    <p className="text-xs theme-muted">System Operator</p>
                    <p className="text-[10px] theme-subtle mt-2 uppercase tracking-wider">Inventory Intelligence Platform</p>
                  </div>
                  <div className="p-4 text-xs theme-muted space-y-2">
                    <div className="flex justify-between"><span>Role:</span><span className="font-medium theme-text">Admin</span></div>
                    <div className="flex justify-between"><span>Environment:</span><span className="font-medium theme-text">Production</span></div>
                    <div className="flex justify-between"><span>Backend:</span><span className="font-medium theme-text">HuggingFace API</span></div>
                    <div className="flex justify-between"><span>Frontend:</span><span className="font-medium theme-text">Vercel</span></div>
                    <div className="flex justify-between"><span>AI Mode:</span><span className="font-medium text-amber-400">Fallback Active</span></div>
                  </div>
                  <hr className="theme-border" />
                  <div className="p-2">
                    <Link to="#" className="block px-3 py-2 rounded-lg text-sm theme-text hover:bg-white/5 transition-colors">Profile</Link>
                    <Link to="/settings" onClick={() => setIsProfileOpen(false)} className="block px-3 py-2 rounded-lg text-sm theme-text hover:bg-white/5 transition-colors">System Settings</Link>
                    <Link to="/upload" onClick={() => setIsProfileOpen(false)} className="block px-3 py-2 rounded-lg text-sm theme-text hover:bg-white/5 transition-colors">Data Sources</Link>
                    <button className="w-full text-left px-3 py-2 rounded-lg text-sm theme-text hover:bg-white/5 transition-colors disabled:opacity-50" disabled>Export Reports</button>
                    <button 
                      onClick={() => {
                        toggleTheme();
                        setIsProfileOpen(false);
                      }} 
                      className="w-full text-left px-3 py-2 rounded-lg text-sm theme-text hover:bg-white/5 transition-colors"
                    >
                      Theme Preferences
                    </button>
                  </div>
                  <hr className="theme-border" />
                  <div className="p-2">
                    <button 
                      onClick={() => setIsProfileOpen(false)}
                      className="w-full text-left px-3 py-2 rounded-lg text-sm text-rose-400 hover:bg-rose-500/10 transition-colors"
                    >
                      Sign Out
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Scrollable Page Content */}
        <div className="flex-1 overflow-y-auto relative scrollbar-hide">
          {children}
        </div>
      </main>

    </div>
  );
};

export default MainLayout;
