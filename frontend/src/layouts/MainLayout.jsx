import { useState, useEffect } from "react";
import Sidebar from "../components/sidebar/Sidebar";
import { Search, Bell, User, Sun, Moon, Menu } from "lucide-react";

const MainLayout = ({ children }) => {
  const [theme, setTheme] = useState(localStorage.getItem("theme") || "light");
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem("theme", theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prevTheme) => (prevTheme === "light" ? "dark" : "light"));
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
                placeholder="Search datasets, inventory parts, or insights..." 
                className="bg-transparent border-none outline-none text-sm theme-text w-full placeholder:theme-subtle"
              />
            </div>
          </div>

          <div className="flex items-center gap-6">
            <button 
              onClick={toggleTheme}
              className="relative theme-muted hover:theme-cyan transition-colors"
              title="Toggle Theme"
            >
              {theme === "light" ? <Moon size={20} /> : <Sun size={20} />}
            </button>
            <button className="relative theme-muted hover:theme-cyan transition-colors">
              <Bell size={20} />
              <span className="absolute -top-1 -right-1 w-2 h-2 bg-cyan-400 rounded-full shadow-[0_0_8px_rgba(34,211,238,0.8)]"></span>
            </button>
            <div className="w-8 h-8 rounded-full border theme-border theme-bg-card flex items-center justify-center overflow-hidden hover:theme-cyan-border transition-colors cursor-pointer">
              <User size={16} className="theme-muted" />
            </div>
          </div>
        </header>

        {/* Scrollable Page Content */}
        <div className="flex-1 overflow-y-auto p-8 relative scrollbar-hide">
          {children}
        </div>
      </main>

    </div>
  );
};

export default MainLayout;