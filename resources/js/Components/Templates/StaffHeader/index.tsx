import { FC, useContext } from 'react';
import { usePage } from '@inertiajs/react';
import { DashboardContext } from '../../../Context/DashboardContext';

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

const StaffHeader: FC = () => {
  const dashboardContext = useContext(DashboardContext);
  const collapsed = dashboardContext?.collapse;
  const pageData = usePage<PageProps>();
  const user = pageData.props.user || pageData.props.auth?.user;
  const userName = user?.firstname || user?.name || 'User';

  return (
    <div className="w-full shadow-lg rounded-b-3xl" style={{
      background: 'linear-gradient(135deg, #228B22 0%, #1a6b1a 100%)'
    }}>
      <div className={`transition-all duration-300 ${
        collapsed ? 'px-4 py-5' : 'px-8 py-6'
      }`}>
        <div className="flex items-center justify-between">
          <div className="flex-shrink-0">
            <div className="relative">
              <h1 className={`font-bold text-white mb-2 transition-all duration-300 tracking-wide ${
                collapsed ? 'text-2xl' : 'text-3xl'
              }`}
              style={{
                textShadow: '0 2px 4px rgba(0,0,0,0.1)'
              }}>
                HELLO, {userName.toUpperCase()}!
              </h1>
              <div className={`h-1 bg-gradient-to-r from-yellow-400 to-transparent rounded-full transition-all duration-300 ${
                collapsed ? 'w-40' : 'w-64'
              }`}></div>
            </div>
            <p className={`text-white/90 font-medium mt-3 transition-all duration-300 ${
              collapsed ? 'text-sm' : 'text-base'
            }`}
            style={{
              letterSpacing: '0.05em'
            }}>
              WELCOME BACK TO YOUR <span className="font-bold text-yellow-300">DASHBOARD</span>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StaffHeader;
