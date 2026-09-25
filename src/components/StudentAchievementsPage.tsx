// components/StudentAchievementsPage.jsx
import { useEffect, useState } from 'react';
import { Search, Trophy, Award, Sparkles, Loader2, Star } from 'lucide-react';
import { getStudents, achievementApi } from '../services/api';
import AchievementTimeline from './AchievementTimeline';

export default function StudentAchievementsPage() {
  const [students, setStudents] = useState([]);
  const [recent, setRecent] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStudent, setSelectedStudent] = useState(null);

  const load = async () => {
    try {
      setLoading(true);
      const [studentsRes, recentRes] = await Promise.all([
        getStudents(),
        achievementApi.getAll({ limit: 8 }),
      ]);
      setStudents(Array.isArray(studentsRes.data) ? studentsRes.data : (studentsRes.data?.data || []));
      setRecent(recentRes.data?.data || []);
    } catch (error) {
      console.error('Error loading achievements page:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const filteredStudents = students.filter((s) =>
    !searchTerm || s.name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-yellow-50 p-6 flex items-center justify-center">
        <Loader2 className="animate-spin text-amber-500" size={36} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-yellow-50">
      <div className="p-6 md:p-8">
        <div className="mb-8">
          <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-amber-600 to-orange-600 bg-clip-text text-transparent">
            Achievement Chain
          </h1>
          <p className="text-gray-600 mt-2 flex items-center gap-2">
            <Trophy size={18} className="text-amber-500" />
            Track every student's milestones, awards, and growth over time
          </p>
        </div>

        {recent.length > 0 && (
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 mb-8 shadow-lg border border-gray-200/50">
            <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
              <Sparkles size={18} className="text-amber-500" /> Recently Added
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
              {recent.map((a) => (
                <div
                  key={a._id}
                  onClick={() => setSelectedStudent({ id: a.student_id?._id, name: a.student_id?.name })}
                  className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-xl p-3 border border-amber-100 cursor-pointer hover:shadow-md transition-all"
                >
                  <div className="flex items-center gap-2 mb-1">
                    <Award size={14} className="text-amber-600" />
                    <span className="text-xs font-semibold text-gray-700 truncate">{a.student_id?.name}</span>
                  </div>
                  <p className="text-sm font-medium text-gray-800 truncate">{a.title}</p>
                  <p className="text-xs text-gray-500 mt-1">{a.category} • {new Date(a.date).toLocaleDateString()}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-4 mb-6 shadow-lg border border-gray-200/50">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Search student to view their achievement chain..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-transparent"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {filteredStudents.map((s) => (
            <button
              key={s._id}
              onClick={() => setSelectedStudent({ id: s._id, name: s.name })}
              className="bg-white rounded-2xl p-4 shadow-md hover:shadow-xl border border-gray-200 transition-all text-left group"
            >
              <div className="flex items-center gap-3">
                {s.documents?.student_photo ? (
                  <img src={s.documents.student_photo} alt={s.name} className="w-11 h-11 rounded-full object-cover" />
                ) : (
                  <div className="w-11 h-11 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-white font-bold">
                    {s.name?.[0] || '?'}
                  </div>
                )}
                <div className="min-w-0">
                  <p className="font-semibold text-gray-800 truncate">{s.name}</p>
                  <p className="text-xs text-gray-500">{s.class_id} • Section {s.section || 'A'}</p>
                </div>
              </div>
              <div className="mt-3 flex items-center gap-1 text-amber-600 text-xs font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                <Star size={12} /> View achievement chain
              </div>
            </button>
          ))}
        </div>

        {filteredStudents.length === 0 && (
          <div className="text-center py-16 text-gray-500">No students found</div>
        )}
      </div>

      {selectedStudent && (
        <AchievementTimeline
          studentId={selectedStudent.id}
          studentName={selectedStudent.name}
          asModal
          onClose={() => setSelectedStudent(null)}
        />
      )}
    </div>
  );
}