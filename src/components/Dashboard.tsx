import { useState } from 'react';
import { Users, GraduationCap, Phone, Bus, LayoutDashboard, Menu, X } from 'lucide-react';
import Overview from './Overview';
import Students from './Students';
import Faculty from './Faculty';
import Leads from './Leads';
import Vehicles from './Vehicles';

type Page = 'overview' | 'students' | 'faculty' | 'leads' | 'vehicles';

export default function Dashboard() {
  const [currentPage, setCurrentPage] = useState<Page>('overview');
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const navigation = [
    { id: 'overview' as Page, name: 'Overview', icon: LayoutDashboard },
    { id: 'students' as Page, name: 'Students', icon: Users },
    { id: 'faculty' as Page, name: 'Faculty', icon: GraduationCap },
    { id: 'leads' as Page, name: 'Leads', icon: Phone },
    { id: 'vehicles' as Page, name: 'Vehicles', icon: Bus },
  ];

  const renderPage = () => {
    switch (currentPage) {
      case 'overview':
        return <Overview />;
      case 'students':
        return <Students />;
      case 'faculty':
        return <Faculty />;
      case 'leads':
        return <Leads />;
      case 'vehicles':
        return <Vehicles />;
      default:
        return <Overview />;
    }
  };

  return (
    <div className="flex h-screen bg-gray-50">
      <aside
        className={`${
          sidebarOpen ? 'w-64' : 'w-20'
        } bg-white border-r border-gray-200 transition-all duration-300 flex flex-col`}
      >
        <div className="p-4 border-b border-gray-200 flex items-center justify-between">
          {sidebarOpen && (
            <h1 className="text-xl font-bold text-blue-600">PlaySchool Admin</h1>
          )}
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>

        <nav className="flex-1 p-4 space-y-2">
          {navigation.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                onClick={() => setCurrentPage(item.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                  currentPage === item.id
                    ? 'bg-blue-50 text-blue-600'
                    : 'text-gray-700 hover:bg-gray-50'
                }`}
              >
                <Icon size={20} />
                {sidebarOpen && <span className="font-medium">{item.name}</span>}
              </button>
            );
          })}
        </nav>
      </aside>

      <main className="flex-1 overflow-auto">
        {renderPage()}
      </main>
    </div>
  );
}