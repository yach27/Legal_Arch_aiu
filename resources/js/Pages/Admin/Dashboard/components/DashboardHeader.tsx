// components/DashboardHeader.tsx
import { Search, Upload } from 'lucide-react';
import { useContext } from 'react';
import { usePage } from '@inertiajs/react';
import { DashboardContext } from '../../../../Context/DashboardContext';

interface User {
  firstname?: string;
  name?: string;
}

interface PageProps {
  user?: User;
  auth?: {
    user?: User;
  };
  [key: string]: any;
}

interface DashboardHeaderProps {
  onUploadClick?: () => void;
}

export default function DashboardHeader({ onUploadClick }: DashboardHeaderProps) {
  const dashboardContext = useContext(DashboardContext);
  const collapsed = dashboardContext?.collapse;
  const pageData = usePage<PageProps>();
  const user = pageData.props.user || pageData.props.auth?.user;

  // Get user's first name, fallback to full name or 'User'
  const userName = user?.firstname || user?.name || 'User';

  return (
    <div className="bg-[#003A18] w-full shadow-lg rounded-b-3xl border-4 border-[#003A18]">
      <div className={`transition-all duration-300 ${
        collapsed ? 'px-4 py-4' : 'px-6 py-6'
      }`}>
        <div className="flex items-center justify-between">
          <div className="flex-shrink-0">
            <h1 className={`font-bold text-white mb-2 transition-all duration-300 ${
              collapsed ? 'text-2xl' : 'text-3xl'
            }`}>
              HELLO, {userName.toUpperCase()}!
            </h1>
            <p className={`text-green-100 flex items-center gap-2 transition-all duration-300 ${
              collapsed ? 'text-sm' : 'text-base'
            }`}>
              WELCOME BACK TO YOUR 
              <span className="font-semibold text-white">DASHBOARD</span>
              <span className="text-2xl">👋</span>
            </p>
          </div>
          
          <div className="flex items-center gap-3 flex-shrink-0">
            <button
              onClick={onUploadClick}
              className={`bg-white/20 hover:bg-white/30 backdrop-blur-sm text-white rounded-xl font-medium transition-all duration-300 flex items-center gap-2 border border-white/30 hover:border-white/40 shadow-md ${
                collapsed ? 'px-3 py-2 text-xs' : 'px-4 py-2 text-sm'
              }`}
            >
              <Upload size={collapsed ? 14 : 16} />
              {!collapsed && 'UPLOAD FILE'}
              {collapsed && 'UPLOAD'}
            </button>
            
            <div className="relative">
              <input
                type="text"
                placeholder={collapsed ? "Search..." : "Search here..."}
                className={`pl-4 pr-12 rounded-xl border-0 bg-white/90 backdrop-blur-sm shadow-md focus:outline-none focus:ring-2 focus:ring-white/50 focus:bg-white text-gray-700 placeholder-gray-500 transition-all duration-300 ${
                  collapsed ? 'w-48 py-2' : 'w-64 py-2.5'
                }`}
              />
              <button className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-[#003A18] hover:bg-[#002A12] p-1.5 rounded-lg transition-colors duration-200">
                <Search size={14} className="text-white" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}