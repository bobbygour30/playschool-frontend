// components/AchievementTimeline.jsx
import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import {
  Award, Star, Trophy, Medal, Plus, X, Edit, Trash2, Calendar,
  TrendingUp, Loader2, Sparkles, BookOpen, Dumbbell, Palette,
  Heart, Users as UsersIcon, Zap, ChevronDown, ChevronUp, Image as ImageIcon,
} from 'lucide-react';
import { achievementApi } from '../services/api';

const CATEGORY_META = {
  Academic:        { icon: BookOpen,  color: '#3B82F6' },
  Sports:          { icon: Dumbbell,  color: '#F97316' },
  'Arts & Craft':  { icon: Palette,   color: '#A855F7' },
  Behavior:        { icon: Heart,     color: '#EC4899' },
  Attendance:      { icon: Calendar,  color: '#10B981' },
  Leadership:      { icon: UsersIcon, color: '#6366F1' },
  Extracurricular: { icon: Zap,       color: '#EAB308' },
  Other:           { icon: Star,      color: '#6B7280' },
};

const LEVELS = ['Classroom', 'School', 'Inter-School', 'District', 'State', 'National'];
const CATEGORIES = Object.keys(CATEGORY_META);

const emptyForm = {
  title: '', category: 'Academic', description: '',
  date: new Date().toISOString().split('T')[0], level: 'Classroom',
  awarded_by: '', points: 0, badge_color: '#3B82F6',
  certificate: null, photo: null, is_milestone: false,
};

// Use as a modal: <AchievementTimeline studentId={id} studentName={name} onClose={...} />
// Or embed inline on a page:  <AchievementTimeline studentId={id} asModal={false} />
export default function AchievementTimeline({ studentId, studentName, asModal = true, onClose }) {
  const [loading, setLoading] = useState(true);
  const [student, setStudent] = useState(null);
  const [achievements, setAchievements] = useState([]);
  const [stats, setStats] = useState({ total: 0, totalPoints: 0, byCategory: {}, milestones: 0 });
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [expanded, setExpanded] = useState(null);

  const load = async () => {
    try {
      setLoading(true);
      const res = await achievementApi.getForStudent(studentId);
      if (res.data?.success) {
        setStudent(res.data.data.student);
        setAchievements(res.data.data.achievements || []);
        setStats(res.data.data.stats || { total: 0, totalPoints: 0, byCategory: {}, milestones: 0 });
      }
    } catch (error) {
      console.error('Error loading achievements:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (studentId) load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [studentId]);

  const handleFile = (e, field) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => setFormData((prev) => ({ ...prev, [field]: reader.result }));
    reader.readAsDataURL(file);
  };

  const openAdd = () => {
    setEditingId(null);
    setFormData(emptyForm);
    setShowForm(true);
  };

  const openEdit = (a) => {
    setEditingId(a._id);
    setFormData({
      title: a.title, category: a.category, description: a.description || '',
      date: a.date ? a.date.split('T')[0] : new Date().toISOString().split('T')[0],
      level: a.level, awarded_by: a.awarded_by || '', points: a.points || 0,
      badge_color: a.badge_color || CATEGORY_META[a.category]?.color || '#3B82F6',
      certificate: null, photo: null,
      is_milestone: a.is_milestone || false,
    });
    setShowForm(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.title.trim()) {
      alert('Please enter a title for this achievement.');
      return;
    }
    try {
      setSaving(true);
      const payload = {
        student_id: studentId,
        title: formData.title,
        category: formData.category,
        description: formData.description,
        date: formData.date,
        level: formData.level,
        awarded_by: formData.awarded_by,
        points: formData.points,
        badge_color: formData.badge_color,
        certificate: formData.certificate || undefined,
        photo: formData.photo || undefined,
        is_milestone: formData.is_milestone,
      };
      if (editingId) {
        await achievementApi.update(editingId, payload);
      } else {
        await achievementApi.create(payload);
      }
      setShowForm(false);
      await load();
    } catch (error) {
      console.error('Error saving achievement:', error);
      alert('Failed to save achievement. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this achievement? This cannot be undone.')) return;
    try {
      await achievementApi.remove(id);
      await load();
    } catch (error) {
      console.error('Error deleting achievement:', error);
      alert('Failed to delete achievement.');
    }
  };

  const filtered = categoryFilter === 'all'
    ? achievements
    : achievements.filter((a) => a.category === categoryFilter);

  const content = (
    <div className={asModal ? 'bg-white rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto shadow-2xl' : ''}>
      <div className={`${asModal ? 'sticky top-0 z-10' : ''} bg-gradient-to-r from-amber-500 to-orange-600 px-6 py-4 flex items-center justify-between ${asModal ? '' : 'rounded-2xl mb-6'}`}>
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Trophy size={22} /> {studentName || student?.name || 'Student'}'s Achievement Chain
          </h2>
          <p className="text-white/80 text-sm mt-0.5">
            {student?.class_id ? `${student.class_id} • Section ${student.section || 'A'}` : ''}
          </p>
        </div>
        {asModal && (
          <button onClick={onClose} className="text-white hover:bg-white/20 rounded-lg p-1 transition-colors">
            <X size={22} />
          </button>
        )}
      </div>

      <div className="p-6">
        {loading ? (
          <div className="flex justify-center py-16">
            <Loader2 className="animate-spin text-amber-500" size={32} />
          </div>
        ) : (
          <>
            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
              <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-xl p-4 border border-amber-100">
                <Trophy size={18} className="text-amber-600 mb-1" />
                <p className="text-xs text-gray-500">Total Achievements</p>
                <p className="text-2xl font-bold text-gray-800">{stats.total}</p>
              </div>
              <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl p-4 border border-purple-100">
                <Sparkles size={18} className="text-purple-600 mb-1" />
                <p className="text-xs text-gray-500">Total Points</p>
                <p className="text-2xl font-bold text-gray-800">{stats.totalPoints}</p>
              </div>
              <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-4 border border-blue-100">
                <Medal size={18} className="text-blue-600 mb-1" />
                <p className="text-xs text-gray-500">Milestones</p>
                <p className="text-2xl font-bold text-gray-800">{stats.milestones}</p>
              </div>
              <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-4 border border-green-100">
                <TrendingUp size={18} className="text-green-600 mb-1" />
                <p className="text-xs text-gray-500">Categories Earned</p>
                <p className="text-2xl font-bold text-gray-800">{Object.keys(stats.byCategory || {}).length}</p>
              </div>
            </div>

            {/* Filters + Add */}
            <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => setCategoryFilter('all')}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                    categoryFilter === 'all' ? 'bg-gray-800 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  All ({achievements.length})
                </button>
                {CATEGORIES.filter((c) => stats.byCategory?.[c]).map((c) => {
                  const meta = CATEGORY_META[c];
                  return (
                    <button
                      key={c}
                      onClick={() => setCategoryFilter(c)}
                      className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all flex items-center gap-1 ${
                        categoryFilter === c ? 'text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                      style={categoryFilter === c ? { backgroundColor: meta.color } : {}}
                    >
                      {c} ({stats.byCategory[c]})
                    </button>
                  );
                })}
              </div>
              <button
                onClick={openAdd}
                className="px-4 py-2 bg-gradient-to-r from-amber-500 to-orange-600 text-white rounded-xl hover:shadow-lg transition-all flex items-center gap-2 text-sm font-medium"
              >
                <Plus size={16} /> Add Achievement
              </button>
            </div>

            {/* Timeline / Chain */}
            {filtered.length === 0 ? (
              <div className="text-center py-12 bg-gray-50 rounded-2xl border border-dashed border-gray-300">
                <Trophy className="mx-auto text-gray-300 mb-3" size={40} />
                <p className="text-gray-500">No achievements recorded yet</p>
                <button onClick={openAdd} className="mt-2 text-amber-600 hover:text-amber-800 font-medium text-sm">
                  Add the first one
                </button>
              </div>
            ) : (
              <div className="relative pl-8">
                <div className="absolute left-[15px] top-2 bottom-2 w-0.5 bg-gradient-to-b from-amber-300 via-orange-300 to-transparent" />
                {filtered.map((a) => {
                  const meta = CATEGORY_META[a.category] || CATEGORY_META.Other;
                  const Icon = meta.icon;
                  const isOpen = expanded === a._id;
                  return (
                    <div key={a._id} className="relative mb-5">
                      <div
                        className="absolute -left-8 top-1 w-8 h-8 rounded-full flex items-center justify-center ring-4 ring-white shadow"
                        style={{ backgroundColor: a.badge_color || meta.color }}
                      >
                        <Icon size={15} className="text-white" />
                      </div>
                      <div className="bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-all p-4">
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <h4 className="font-semibold text-gray-800">{a.title}</h4>
                              {a.is_milestone && (
                                <span className="text-[10px] px-2 py-0.5 bg-amber-100 text-amber-700 rounded-full font-semibold flex items-center gap-1">
                                  <Sparkles size={10} /> Milestone
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-2 flex-wrap mt-1 text-xs text-gray-500">
                              <span className="px-2 py-0.5 rounded-full font-medium" style={{ backgroundColor: `${meta.color}20`, color: meta.color }}>
                                {a.category}
                              </span>
                              <span>•</span>
                              <span>{a.level}</span>
                              <span>•</span>
                              <span className="flex items-center gap-1"><Calendar size={11} /> {new Date(a.date).toLocaleDateString()}</span>
                              {a.points > 0 && (
                                <>
                                  <span>•</span>
                                  <span className="text-amber-600 font-semibold">+{a.points} pts</span>
                                </>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-1 flex-shrink-0">
                            <button onClick={() => openEdit(a)} className="text-blue-500 hover:text-blue-700 p-1"><Edit size={14} /></button>
                            <button onClick={() => handleDelete(a._id)} className="text-red-500 hover:text-red-700 p-1"><Trash2 size={14} /></button>
                            {(a.description || a.awarded_by || a.certificate_url || a.photo_url) && (
                              <button onClick={() => setExpanded(isOpen ? null : a._id)} className="text-gray-400 hover:text-gray-600 p-1">
                                {isOpen ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                              </button>
                            )}
                          </div>
                        </div>
                        {isOpen && (
                          <div className="mt-3 pt-3 border-t border-gray-100 space-y-2">
                            {a.description && <p className="text-sm text-gray-600">{a.description}</p>}
                            {a.awarded_by && <p className="text-xs text-gray-500">Awarded by: <span className="font-medium">{a.awarded_by}</span></p>}
                            <div className="flex gap-2">
                              {a.certificate_url && (
                                <a href={a.certificate_url} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-600 hover:underline flex items-center gap-1">
                                  <ImageIcon size={12} /> View Certificate
                                </a>
                              )}
                              {a.photo_url && (
                                <a href={a.photo_url} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-600 hover:underline flex items-center gap-1">
                                  <ImageIcon size={12} /> View Photo
                                </a>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}
      </div>

      {/* Add/Edit Form Modal */}
      {showForm && createPortal(
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[110] p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="bg-gradient-to-r from-amber-500 to-orange-600 px-6 py-4 flex items-center justify-between">
              <h3 className="text-lg font-bold text-white">{editingId ? 'Edit Achievement' : 'Add Achievement'}</h3>
              <button onClick={() => setShowForm(false)} className="text-white hover:bg-white/20 rounded-lg p-1">
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Title *</label>
                <input
                  type="text" required value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                  placeholder="e.g. Won 1st Place — Painting Competition"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value, badge_color: CATEGORY_META[e.target.value]?.color || '#3B82F6' })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                  >
                    {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Level</label>
                  <select
                    value={formData.level}
                    onChange={(e) => setFormData({ ...formData, level: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                  >
                    {LEVELS.map((l) => <option key={l} value={l}>{l}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Date</label>
                  <input
                    type="date" value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Points</label>
                  <input
                    type="number" min="0" value={formData.points}
                    onChange={(e) => setFormData({ ...formData, points: parseInt(e.target.value) || 0 })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Awarded By</label>
                <input
                  type="text" value={formData.awarded_by}
                  onChange={(e) => setFormData({ ...formData, awarded_by: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                  placeholder="Teacher / organization name"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                <textarea
                  rows={2} value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                  placeholder="Short note about the achievement..."
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Certificate</label>
                  <input type="file" accept=".pdf,.jpg,.jpeg,.png" onChange={(e) => handleFile(e, 'certificate')}
                    className="w-full text-xs text-gray-500 file:mr-2 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-amber-50 file:text-amber-700 hover:file:bg-amber-100" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Photo</label>
                  <input type="file" accept=".jpg,.jpeg,.png" onChange={(e) => handleFile(e, 'photo')}
                    className="w-full text-xs text-gray-500 file:mr-2 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-amber-50 file:text-amber-700 hover:file:bg-amber-100" />
                </div>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox" id="isMilestone" checked={formData.is_milestone}
                  onChange={(e) => setFormData({ ...formData, is_milestone: e.target.checked })}
                  className="w-4 h-4 rounded border-gray-300 text-amber-600 focus:ring-amber-500"
                />
                <label htmlFor="isMilestone" className="text-sm text-gray-700">Mark as a milestone (highlighted on the chain)</label>
              </div>
              <div className="flex justify-end gap-3 pt-3 border-t border-gray-200">
                <button type="button" onClick={() => setShowForm(false)} className="px-5 py-2 border border-gray-300 rounded-xl text-gray-700 hover:bg-gray-50">
                  Cancel
                </button>
                <button type="submit" disabled={saving} className="px-5 py-2 bg-gradient-to-r from-amber-500 to-orange-600 text-white rounded-xl hover:shadow-lg disabled:opacity-60 flex items-center gap-2">
                  {saving && <Loader2 size={16} className="animate-spin" />}
                  {editingId ? 'Update' : 'Add'} Achievement
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}
    </div>
  );

  if (!asModal) return content;

  return createPortal(
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[100] p-4">
      {content}
    </div>,
    document.body
  );
}