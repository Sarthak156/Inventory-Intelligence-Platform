import {
  LayoutDashboard,
  Upload,
  TrendingUp,
  Boxes,
  AlertTriangle,
  Bot,
  Settings,
  X
} from "lucide-react";

import { Link, useLocation } from "react-router-dom";

const Sidebar = ({ isOpen, setIsOpen }) => {
  const location = useLocation();

  const navItems = [
    { path: "/", name: "Dashboard", icon: LayoutDashboard },
    { path: "/upload", name: "Upload Center", icon: Upload },
    { path: "/forecast", name: "Forecast Analytics", icon: TrendingUp },
    { path: "/inventory", name: "Inventory Optimization", icon: Boxes },
    { path: "/risks", name: "Risk Assessment", icon: AlertTriangle },
    { path: "/recommendations", name: "AI Recommendations", icon: Bot },
    { path: "/settings", name: "Settings", icon: Settings },
  ];

  return (
    <div className={`fixed md:relative inset-y-0 left-0 transform ${isOpen ? "translate-x-0" : "-translate-x-full"} md:translate-x-0 transition-transform duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] flex flex-col w-72 h-screen px-5 py-6 theme-bg-sidebar border-r theme-border theme-sidebar-shadow z-50`}>
      {/* Brand Header */}
      <div className="flex items-center justify-between mb-10 px-2">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-600 to-blue-900 flex items-center justify-center border border-cyan-500/30 shadow-[0_0_15px_rgba(34,211,238,0.2)]">
            <Boxes size={20} strokeWidth={2} className="text-cyan-50" />
          </div>
          <div className="flex flex-col">
            <h2 className="text-base font-bold theme-text tracking-tight">Inventory AI</h2>
            <span className="text-[10px] text-cyan-500 font-semibold uppercase tracking-widest">Enterprise Core</span>
          </div>
        </div>
        <button onClick={() => setIsOpen(false)} className="md:hidden p-1 theme-muted hover:text-white transition-colors">
          <X size={20} />
        </button>
      </div>

      {/* Navigation Links */}
      <div className="flex flex-col gap-2 flex-1">
        <div className="text-[10px] font-bold theme-subtle uppercase tracking-widest mb-3 px-2">Main Menu</div>
        <ul className="flex flex-col gap-1.5">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            const Icon = item.icon;
            return (
              <li key={item.path}>
                <Link
                  to={item.path}
                  onClick={() => setIsOpen(false)}
                  className={`flex items-center gap-3 px-3 py-3 rounded-xl transition-all duration-300 text-sm font-medium ${
                    isActive
                      ? "theme-nav-active"
                      : "theme-nav-inactive"
                  }`}
                >
                  <Icon size={18} strokeWidth={isActive ? 2 : 1.5} className={isActive ? "theme-nav-active-text" : "theme-nav-text"} />
                  {item.name}
                </Link>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
};

export default Sidebar;