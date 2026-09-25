import { useState, useEffect } from 'react';
import { 
  Users, GraduationCap, Phone, Bus, LayoutDashboard, Menu, X, 
  Sparkles, ChevronRight, ChevronLeft, LogOut, Settings, Bell, User,
  TrendingUp, Award, Calendar, Clock, BookOpen, FileText, 
  Truck, Briefcase, DollarSign, Heart,
  BookMarked, CalendarDays, MessageSquarePlus, UtensilsCrossed
} from 'lucide-react';
import Overview from './Overview';
import StudentDetails from './Students';
import Academics from './Academics';
import VendorManagement from './VendorManagement';
import StaffManagement from './StaffManagement';
import Enquiries from './Enquiries';
import LunchMenu from './LunchMenu';
import Finance from './Finance';
import ParentRegistration from './ParentRegistration';
import FacultyRegistration from './FacultyRegistration';
import LeaveManagement from './LeaveManagement';
import ClassAssignment from './ClassAssignment';
import HolidayLeaveManagement from './HolidayLeaveManagement';
import Login from './Login';

type Page = 'overview' | 'studentDetails' | 'academics' | 'vendor' | 'staff' | 'finance' | 'parents' | 'faculty' | 'leaves' | 'classAssignment' | 'holidayLeave' | 'enquiries' | 'lunchMenu';

// Hardcoded credentials
const VALID_CREDENTIALS = {
  email: 'admin@goldenplay.com',
  password: 'admin#playschool@098'
};

export default function Dashboard() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentPage, setCurrentPage] = useState<Page>('overview');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [isMobile, setIsMobile] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());

  // Check if user is already logged in (session)
  useEffect(() => {
    const authStatus = localStorage.getItem('isAuthenticated');
    if (authStatus === 'true') {
      setIsAuthenticated(true);
    }
  }, []);

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

  // Handle login
  const handleLogin = (email: string, password: string) => {
    if (email === VALID_CREDENTIALS.email && password === VALID_CREDENTIALS.password) {
      setIsAuthenticated(true);
      localStorage.setItem('isAuthenticated', 'true');
      return true;
    }
    return false;
  };

  // Handle logout
  const handleLogout = () => {
    setIsAuthenticated(false);
    localStorage.removeItem('isAuthenticated');
    setCurrentPage('overview');
  };

  // Navigation handler function
  const handleNavigate = (page: string) => {
    setCurrentPage(page as Page);
  };

  // If not authenticated, show login page
  if (!isAuthenticated) {
    return <Login onLogin={handleLogin} />;
  }

  const navigation = [
  { id: 'overview' as Page, name: 'Dashboard', icon: LayoutDashboard, color: 'from-blue-500 to-cyan-500', bgColor: 'bg-blue-50', textColor: 'text-blue-600' },
  { id: 'studentDetails' as Page, name: 'Student Details', icon: Users, color: 'from-purple-500 to-pink-500', bgColor: 'bg-purple-50', textColor: 'text-purple-600' },
  { id: 'academics' as Page, name: 'Academics', icon: BookOpen, color: 'from-green-500 to-emerald-500', bgColor: 'bg-green-50', textColor: 'text-green-600' },
  { id: 'parents' as Page, name: 'Parents', icon: Heart, color: 'from-blue-500 to-indigo-500', bgColor: 'bg-blue-50', textColor: 'text-blue-600' },
  { id: 'enquiries' as Page, name: 'Admission Enquiries', icon: MessageSquarePlus, color: 'from-orange-500 to-amber-600', bgColor: 'bg-orange-50', textColor: 'text-orange-600' },
  { id: 'faculty' as Page, name: 'Faculty', icon: GraduationCap, color: 'from-green-500 to-teal-500', bgColor: 'bg-green-50', textColor: 'text-green-600' },
  { id: 'classAssignment' as Page, name: 'Class Assignment', icon: BookMarked, color: 'from-indigo-500 to-purple-500', bgColor: 'bg-indigo-50', textColor: 'text-indigo-600' },
  { id: 'holidayLeave' as Page, name: 'Holiday & Leave', icon: CalendarDays, color: 'from-blue-500 to-purple-500', bgColor: 'bg-blue-50', textColor: 'text-blue-600' },
  { id: 'leaves' as Page, name: 'Leave Management', icon: Calendar, color: 'from-blue-500 to-purple-500', bgColor: 'bg-blue-50', textColor: 'text-blue-600' },
  { id: 'lunchMenu' as Page, name: 'Lunch Menu', icon: UtensilsCrossed, color: 'from-rose-500 to-orange-500', bgColor: 'bg-rose-50', textColor: 'text-rose-600' },
  { id: 'vendor' as Page, name: 'Vendor Management', icon: Truck, color: 'from-orange-500 to-red-500', bgColor: 'bg-orange-50', textColor: 'text-orange-600' },
  { id: 'staff' as Page, name: 'Staff Management', icon: Briefcase, color: 'from-indigo-500 to-purple-500', bgColor: 'bg-indigo-50', textColor: 'text-indigo-600' },
  { id: 'finance' as Page, name: 'Finance', icon: DollarSign, color: 'from-cyan-500 to-teal-500', bgColor: 'bg-cyan-50', textColor: 'text-cyan-600' },
];

  const renderPage = () => {
    switch (currentPage) {
      case 'overview':
        return <Overview onNavigate={handleNavigate} />;
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
      case 'parents':
        return <ParentRegistration />;
      case 'enquiries':
        return <Enquiries />;
      case 'classAssignment':
        return <ClassAssignment />;
      case 'faculty':
        return <FacultyRegistration />;
      case 'leaves':
        return <LeaveManagement />;
      case 'holidayLeave':
        return <HolidayLeaveManagement />;
      case 'lunchMenu':
        return <LunchMenu />;
      default:
        return <Overview onNavigate={handleNavigate} />;
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

  // Handle nav item click — on desktop when collapsed, expand first
  const handleNavClick = (item: typeof navigation[number]) => {
    if (!isMobile && !sidebarOpen) {
      // Expand sidebar first, don't navigate
      setSidebarOpen(true);
      return;
    }
    setCurrentPage(item.id);
    if (isMobile) setSidebarOpen(false);
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
        className={`
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
          md:translate-x-0
          fixed md:relative z-30
          ${sidebarOpen ? 'w-72' : 'md:w-20'}
          bg-white/95 backdrop-blur-xl
          border-r border-gray-200/50
          transition-all duration-300 ease-in-out
          flex flex-col
          shadow-2xl
        `}
      >
        {/* Logo Section */}
        <div className={`h-[88px] border-b border-gray-200/50 flex items-center ${sidebarOpen ? 'px-6 justify-between' : 'justify-center px-2'}`}>
          {sidebarOpen ? (
            <div className="flex items-center gap-3 min-w-0">
              <div className="relative flex-shrink-0">
                <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg blur-md opacity-50"></div>
                <div className="relative bg-gradient-to-r from-blue-500 to-purple-600 p-2 rounded-lg">
                  <Sparkles className="text-white" size={24} />
                </div>
              </div>
              <div className="min-w-0">
                <h1 className="text-sm font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent truncate">
                  Golden PlaySchool
                </h1>
                <p className="text-xs text-gray-500">Admin Dashboard</p>
              </div>
            </div>
          ) : (
            <div className="relative flex-shrink-0">
              <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg blur-md opacity-50"></div>
              <div className="relative bg-gradient-to-r from-blue-500 to-purple-600 p-2 rounded-lg">
                <Sparkles className="text-white" size={22} />
              </div>
            </div>
          )}

          {/* Close button — mobile only */}
          {sidebarOpen && isMobile && (
            <button
              onClick={() => setSidebarOpen(false)}
              className="p-2 hover:bg-gray-100 rounded-xl transition-all duration-300"
              aria-label="Close sidebar"
            >
              <X size={20} className="text-gray-600" />
            </button>
          )}
        </div>

        {/* Navigation */}
        <nav className={`flex-1 overflow-y-auto overflow-x-hidden ${sidebarOpen ? 'p-4 space-y-2' : 'p-3 space-y-2'}`}>
          {navigation.map((item) => {
            const Icon = item.icon;
            const isActive = currentPage === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleNavClick(item)}
                className={`
                  group relative w-full flex items-center
                  ${sidebarOpen ? 'gap-3 px-4 py-3' : 'justify-center px-0 py-3'}
                  rounded-xl
                  transition-all duration-300
                  ${isActive
                    ? `bg-gradient-to-r ${item.color} text-white shadow-lg`
                    : 'text-gray-700 hover:bg-gray-100'
                  }
                `}
                aria-label={item.name}
              >
                <Icon
                  size={20}
                  className={`flex-shrink-0 ${isActive ? 'text-white' : 'text-gray-500 group-hover:text-gray-700'} transition-colors`}
                />

                {/* Label — only when open */}
                <span
                  className={`
                    font-medium text-left truncate
                    transition-all duration-200
                    ${sidebarOpen ? 'opacity-100 w-auto' : 'opacity-0 w-0 overflow-hidden'}
                    ${isActive ? 'text-white' : 'text-gray-700'}
                  `}
                >
                  {item.name}
                </span>

                {/* Active dot */}
                {isActive && sidebarOpen && (
                  <div className="ml-auto w-1.5 h-1.5 bg-white rounded-full animate-pulse flex-shrink-0" />
                )}

                {/* Tooltip when collapsed (desktop) */}
                {!sidebarOpen && !isMobile && (
                  <div className="
                    absolute left-full ml-3 px-3 py-1.5
                    bg-gray-900 text-white text-xs font-medium
                    rounded-lg opacity-0 group-hover:opacity-100
                    transition-opacity duration-200 pointer-events-none
                    whitespace-nowrap z-50 shadow-lg
                  ">
                    {item.name}
                    <div className="absolute top-1/2 -left-1 -translate-y-1/2 w-2 h-2 bg-gray-900 rotate-45" />
                  </div>
                )}
              </button>
            );
          })}
        </nav>

        {/* Footer Section — collapse button + logout */}
        <div className={`border-t border-gray-200/50 ${sidebarOpen ? 'p-4 space-y-2' : 'p-3 space-y-2'}`}>
          {/* Logout */}
          <button
            onClick={handleLogout}
            className={`
              group relative w-full flex items-center
              ${sidebarOpen ? 'gap-3 px-4 py-2' : 'justify-center px-0 py-3'}
              rounded-xl
              text-red-600 hover:bg-red-50
              transition-all duration-300
            `}
            aria-label="Logout"
          >
            <LogOut size={20} className="flex-shrink-0" />
            <span
              className={`
                font-medium truncate
                transition-all duration-200
                ${sidebarOpen ? 'opacity-100 w-auto' : 'opacity-0 w-0 overflow-hidden'}
              `}
            >
              Logout
            </span>
            {!sidebarOpen && !isMobile && (
              <div className="
                absolute left-full ml-3 px-3 py-1.5
                bg-gray-900 text-white text-xs font-medium
                rounded-lg opacity-0 group-hover:opacity-100
                transition-opacity duration-200 pointer-events-none
                whitespace-nowrap z-50 shadow-lg
              ">
                Logout
                <div className="absolute top-1/2 -left-1 -translate-y-1/2 w-2 h-2 bg-gray-900 rotate-45" />
              </div>
            )}
          </button>

          {/* Collapse / Expand toggle — desktop only, beautiful pill */}
          {!isMobile && (
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className={`
                group relative w-full flex items-center
                ${sidebarOpen ? 'gap-3 px-4 py-2' : 'justify-center px-0 py-3'}
                rounded-xl
                text-gray-500 hover:text-gray-800 hover:bg-gray-100
                transition-all duration-300
              `}
              aria-label={sidebarOpen ? 'Collapse sidebar' : 'Expand sidebar'}
              title={sidebarOpen ? 'Collapse sidebar' : 'Expand sidebar'}
            >
              <span className="flex-shrink-0 flex items-center justify-center w-5 h-5">
                {sidebarOpen ? <ChevronLeft size={20} /> : <ChevronRight size={20} />}
              </span>
              <span
                className={`
                  font-medium truncate
                  transition-all duration-200
                  ${sidebarOpen ? 'opacity-100 w-auto' : 'opacity-0 w-0 overflow-hidden'}
                `}
              >
                Collapse
              </span>
              {!sidebarOpen && (
                <div className="
                  absolute left-full ml-3 px-3 py-1.5
                  bg-gray-900 text-white text-xs font-medium
                  rounded-lg opacity-0 group-hover:opacity-100
                  transition-opacity duration-200 pointer-events-none
                  whitespace-nowrap z-50 shadow-lg
                ">
                  Expand
                  <div className="absolute top-1/2 -left-1 -translate-y-1/2 w-2 h-2 bg-gray-900 rotate-45" />
                </div>
              )}
            </button>
          )}
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        {/* Header */}
        <div className="sticky top-0 z-10 bg-white/80 backdrop-blur-md border-b border-gray-200/50 shadow-sm">
          <div className="px-6 py-4">
            <div className="flex items-center justify-between">
              {/* Page Title */}
              <div className="flex items-center gap-3">
                {/* Mobile hamburger */}
                <button
                  onClick={() => setSidebarOpen(!sidebarOpen)}
                  className="md:hidden p-2 hover:bg-gray-100 rounded-xl transition-all duration-300"
                  aria-label="Toggle sidebar"
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
              </div>
            </div>
          </div>

          {/* Gradient Bar */}
          <div className={`h-1 bg-gradient-to-r ${getCurrentPageColor()}`} />
        </div>

        {/* Page Content */}
        <div className="relative z-0">
          {renderPage()}
        </div>
      </main>
    </div>
  );
}