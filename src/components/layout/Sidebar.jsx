import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { LogOut, User as UserIcon } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { formatRole } from '../../utils/formatters';

export const Sidebar = ({ links = [], title = 'Navigation' }) => {
  const { user, role, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <aside className="w-64 bg-white border-r border-slate-200/80 min-h-[calc(100vh-4rem)] flex flex-col justify-between p-4 shrink-0">
      <div>
        {/* User Card */}
        <div className="p-3 mb-6 rounded-xl bg-slate-50 border border-slate-100 flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-primary-100 text-primary-700 flex items-center justify-center font-bold text-sm">
            {user?.username ? user.username.charAt(0).toUpperCase() : <UserIcon className="w-5 h-5" />}
          </div>
          <div className="overflow-hidden">
            <h4 className="text-sm font-semibold text-slate-900 truncate">
              {user?.full_name || user?.username || 'Guest User'}
            </h4>
            <span className="inline-block text-[11px] font-medium text-primary-700 bg-primary-50 px-2 py-0.5 rounded-full border border-primary-200/60 capitalize">
              {formatRole(role)}
            </span>
          </div>
        </div>

        {/* Section title */}
        {title && (
          <h5 className="px-3 text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
            {title}
          </h5>
        )}

        {/* Nav Links */}
        <nav className="space-y-1">
          {links.map((link) => {
            const Icon = link.icon;
            return (
              <NavLink
                key={link.path}
                to={link.path}
                end={link.end}
                className={({ isActive }) =>
                  `flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-primary-50 text-primary-800 font-semibold'
                      : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                  }`
                }
              >
                <div className="flex items-center gap-3">
                  {Icon && <Icon className="w-4 h-4 shrink-0 text-slate-400 group-hover:text-primary-600" />}
                  <span>{link.label}</span>
                </div>
                {link.badge && (
                  <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 font-medium">
                    {link.badge}
                  </span>
                )}
              </NavLink>
            );
          })}
        </nav>
      </div>

      {/* Bottom logout */}
      <div className="pt-4 border-t border-slate-100">
        <button
          type="button"
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-slate-600 hover:text-red-600 hover:bg-red-50 transition-colors text-left"
        >
          <LogOut className="w-4 h-4 shrink-0 text-slate-400" />
          <span>Sign Out</span>
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
