import { useState, useEffect } from 'react';
import { 
  Users, GraduationCap, Phone, Bus, LayoutDashboard, Menu, X, 
  Sparkles, ChevronRight, LogOut, Settings, Bell, User,
  TrendingUp, Award, Calendar, Clock, BookOpen, FileText, 
  Truck, Briefcase, DollarSign
} from 'lucide-react';
import Overview from './Overview';
import StudentDetails from './Students';
import Academics from './Academics';
import VendorManagement from './VendorManagement';
import StaffManagement from './StaffManagement';
import Finance from './Finance';

type Page = 'overview' | 'studentDetails' | 'academics' | 'vendor' | 'staff' | 'finance';

export default function Dashboard() {
  const [currentPage, setCurrentPage] = useState<Page>('overview');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [isMobile, setIsMobile] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());

  // Handle responsive sidebar
  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      if (mobile) {
        setSidebarOpen(false);
      } else {
        setSidebarOpen(true);
      }
    };
    
    handleResize();
    window.addEventListener('resize', handleResize);
    
    // Update time every minute
    const timer = setInterval(() => setCurrentTime(new Date()), 60000);
    
    return () => {
      window.removeEventListener('resize', handleResize);
      clearInterval(timer);
    };
  }, []);

  const navigation = [
    { id: 'overview' as Page, name: 'Dashboard', icon: LayoutDashboard, color: 'from-blue-500 to-cyan-500', bgColor: 'bg-blue-50', textColor: 'text-blue-600' },
    { id: 'studentDetails' as Page, name: 'Student Details', icon: Users, color: 'from-purple-500 to-pink-500', bgColor: 'bg-purple-50', textColor: 'text-purple-600' },
    { id: 'academics' as Page, name: 'Academics', icon: BookOpen, color: 'from-green-500 to-emerald-500', bgColor: 'bg-green-50', textColor: 'text-green-600' },
    { id: 'vendor' as Page, name: 'Vendor Management', icon: Truck, color: 'from-orange-500 to-red-500', bgColor: 'bg-orange-50', textColor: 'text-orange-600' },
    { id: 'staff' as Page, name: 'Staff Management', icon: Briefcase, color: 'from-indigo-500 to-purple-500', bgColor: 'bg-indigo-50', textColor: 'text-indigo-600' },
    { id: 'finance' as Page, name: 'Finance', icon: DollarSign, color: 'from-cyan-500 to-teal-500', bgColor: 'bg-cyan-50', textColor: 'text-cyan-600' },
  ];

  const renderPage = () => {
    switch (currentPage) {
      case 'overview':
        return <Overview />;
      case 'studentDetails':
        return <StudentDetails />;
      case 'academics':
        return <Academics />;
      case 'vendor':
        return <VendorManagement />;
      case 'staff':
        return <StaffManagement />;
      case 'finance':
        return <Finance />;
      default:
        return <Overview />;
    }
  };

  const getCurrentPageColor = () => {
    const page = navigation.find(nav => nav.id === currentPage);
    return page?.color || 'from-blue-500 to-cyan-500';
  };

  const formatTime = () => {
    return currentTime.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: true 
    });
  };

  const formatDate = () => {
    return currentTime.toLocaleDateString('en-US', { 
      weekday: 'long', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  return (
    <div className="flex h-screen bg-gradient-to-br from-gray-50 via-gray-100 to-gray-200">
      {/* Mobile overlay */}
      {isMobile && sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-20 transition-opacity duration-300"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        } fixed md:relative md:translate-x-0 z-30 ${
          sidebarOpen ? 'w-72' : 'md:w-20'
        } bg-white/95 backdrop-blur-xl border-r border-gray-200/50 transition-all duration-300 flex flex-col shadow-2xl`}
      >
        {/* Logo Section */}
        <div className={`p-6 border-b border-gray-200/50 flex items-center ${sidebarOpen ? 'justify-between' : 'justify-center'}`}>
          {sidebarOpen && (
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg blur-md opacity-50"></div>
                <div className="relative bg-gradient-to-r from-blue-500 to-purple-600 p-2 rounded-lg">
                  <Sparkles className="text-white" size={24} />
                </div>
              </div>
              <div>
                <h1 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  PlaySchool
                </h1>
                <p className="text-xs text-gray-500">Admin Dashboard</p>
              </div>
            </div>
          )}
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-2 hover:bg-gray-100 rounded-xl transition-all duration-300 hover:scale-110"
          >
            {sidebarOpen ? <X size={20} className="text-gray-600" /> : <Menu size={20} className="text-gray-600" />}
          </button>
        </div>

        {/* User Profile Section */}
        {sidebarOpen && (
          <div className="p-4 border-b border-gray-200/50">
            <div className="flex items-center gap-3 p-3 bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl">
              <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
                <User className="text-white" size={20} />
              </div>
              <div className="flex-1">
                <p className="font-semibold text-gray-800">Admin User</p>
                <p className="text-xs text-gray-500">Super Administrator</p>
              </div>
              <ChevronRight size={16} className="text-gray-400" />
            </div>
          </div>
        )}

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
          {navigation.map((item) => {
            const Icon = item.icon;
            const isActive = currentPage === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  setCurrentPage(item.id);
                  if (isMobile) setSidebarOpen(false);
                }}
                className={`relative w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 group ${
                  isActive
                    ? `bg-gradient-to-r ${item.color} text-white shadow-lg`
                    : 'text-gray-700 hover:bg-gray-50 hover:scale-105'
                }`}
              >
                <Icon size={20} className={isActive ? 'text-white' : 'text-gray-500 group-hover:text-gray-700'} />
                {sidebarOpen && (
                  <>
                    <span className={`font-medium ${isActive ? 'text-white' : 'text-gray-700'}`}>
                      {item.name}
                    </span>
                    {isActive && (
                      <div className="absolute right-4 w-1.5 h-1.5 bg-white rounded-full animate-pulse" />
                    )}
                  </>
                )}
                {!sidebarOpen && (
                  <div className="absolute left-full ml-2 px-2 py-1 bg-gray-900 text-white text-sm rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50">
                    {item.name}
                  </div>
                )}
              </button>
            );
          })}
        </nav>

        {/* Footer Section */}
        {sidebarOpen && (
          <div className="p-4 border-t border-gray-200/50 space-y-2">
            <button className="w-full flex items-center gap-3 px-4 py-2 rounded-xl text-gray-600 hover:bg-gray-50 transition-all duration-300">
              <Settings size={20} />
              <span className="font-medium">Settings</span>
            </button>
            <button className="w-full flex items-center gap-3 px-4 py-2 rounded-xl text-red-600 hover:bg-red-50 transition-all duration-300">
              <LogOut size={20} />
              <span className="font-medium">Logout</span>
            </button>
          </div>
        )}
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        {/* Header */}
        <div className="sticky top-0 z-10 bg-white/80 backdrop-blur-md border-b border-gray-200/50 shadow-sm">
          <div className="px-6 py-4">
            <div className="flex items-center justify-between">
              {/* Page Title */}
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setSidebarOpen(!sidebarOpen)}
                  className="md:hidden p-2 hover:bg-gray-100 rounded-xl transition-all duration-300"
                >
                  <Menu size={24} className="text-gray-600" />
                </button>
                <div>
                  <h2 className="text-2xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent">
                    {navigation.find(nav => nav.id === currentPage)?.name}
                  </h2>
                  <p className="text-sm text-gray-500 mt-1">
                    Welcome back! Here's what's happening today
                  </p>
                </div>
              </div>

              {/* Right Side Header */}
              <div className="flex items-center gap-4">
                {/* Date & Time */}
                <div className="hidden md:flex items-center gap-4 px-4 py-2 bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl">
                  <div className="flex items-center gap-2">
                    <Calendar size={16} className="text-gray-500" />
                    <span className="text-sm text-gray-600">{formatDate()}</span>
                  </div>
                  <div className="w-px h-4 bg-gray-300" />
                  <div className="flex items-center gap-2">
                    <Clock size={16} className="text-gray-500" />
                    <span className="text-sm text-gray-600 font-medium">{formatTime()}</span>
                  </div>
                </div>

                {/* Notification Bell */}
                <button className="relative p-2 hover:bg-gray-100 rounded-xl transition-all duration-300">
                  <Bell size={20} className="text-gray-600" />
                  <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                </button>

                {/* User Avatar (Mobile) */}
                <div className="md:hidden">
                  <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
                    <User className="text-white" size={16} />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Gradient Bar */}
          <div className={`h-1 bg-gradient-to-r ${getCurrentPageColor()}`} />
        </div>

        {/* Page Content */}
        <div className="p-6 md:p-8">
          {renderPage()}
        </div>
      </main>
    </div>
  );
}