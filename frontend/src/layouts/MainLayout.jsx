import { useState } from "react";
import Sidebar from "../components/sidebar/Sidebar";
import { Search, Bell, User, Moon, Sun } from "lucide-react";

const MainLayout = ({ children }) => {
  const [theme, setTheme] = useState("light");
  const isDark = theme === "dark";

  const toggleTheme = () => {
    setTheme((currentTheme) => (currentTheme === "light" ? "dark" : "light"));
  };

  return (
    <div data-theme={theme} className="theme-app flex h-screen overflow-hidden selection:bg-cyan-500/30 font-sans">
      <Sidebar theme={theme} />

      <main className="flex-1 flex flex-col h-full relative overflow-hidden">
        <header className="h-16 flex items-center justify-between px-8 border-b theme-border theme-bg-header backdrop-blur-xl z-20">
          <div className="flex items-center gap-2 px-4 py-2 theme-bg-input theme-border rounded-full w-96 transition-all focus-within:theme-cyan-border">
            <Search size={16} className="theme-muted" />
            <input 
              type="text" 
              placeholder="Search datasets, inventory parts, or insights..." 
              className="bg-transparent border-none outline-none text-sm theme-text w-full placeholder:theme-subtle"
            />
          </div>

          <div className="flex items-center gap-6">
            <button className="relative theme-nav-inactive transition-colors">
              <Bell size={20} />
              <span className="absolute -top-1 -right-1 w-2 h-2 bg-cyan-400 rounded-full shadow-[0_0_8px_rgba(34,211,238,0.8)]"></span>
            </button>
            <button
              onClick={toggleTheme}
              className="w-8 h-8 rounded-full theme-border theme-bg-icon flex items-center justify-center overflow-hidden hover:theme-cyan-border transition-colors cursor-pointer theme-muted hover:theme-cyan"
            >
              {isDark ? <Sun size={16} /> : <Moon size={16} />}
            </button>
            <div className="w-8 h-8 rounded-full theme-border theme-bg-icon flex items-center justify-center overflow-hidden hover:theme-cyan-border transition-colors cursor-pointer theme-muted">
              <User size={16} />
            </div>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-8 relative scrollbar-hide">
          {children}
        </div>
      </main>

    </div>
  );
};

export default MainLayout;
