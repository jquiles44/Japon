import React, { useEffect, useState } from 'react';
import { Map, Clock, Navigation, Utensils, Train, Sparkles, X, Plus, Trash2, StickyNote, ArrowRight, Minimize2, Maximize2, Save, Loader2, Pencil } from 'lucide-react';
import { getItinerary, getBacklogActivities, updateItinerary, addBacklogItem } from '../services/dataService';
import { getNearbyRecommendations, getCoordinates } from '../services/geminiService';
import { ItineraryDay, Activity } from '../types';

const Itinerary: React.FC = () => {
  const [days, setDays] = useState<ItineraryDay[]>([]);
  const [backlog, setBacklog] = useState<Activity[]>([]);
  const [selectedDay, setSelectedDay] = useState<ItineraryDay | null>(null);
  const [aiRecommendation, setAiRecommendation] = useState<string>("");
  const [loadingAi, setLoadingAi] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [isCompact, setIsCompact] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // New Idea / Edit Form State
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingActivity, setEditingActivity] = useState<Activity | null>(null);
  const [isEditingBacklog, setIsEditingBacklog] = useState(false);
  
  const [newIdeaTitle, setNewIdeaTitle] = useState('');
  const [newIdeaLoc, setNewIdeaLoc] = useState('');
  const [newIdeaDesc, setNewIdeaDesc] = useState('');
  const [newIdeaType, setNewIdeaType] = useState<'visit' | 'food'>('visit');
  const [newIdeaTime, setNewIdeaTime] = useState('');
  const [creatingIdea, setCreatingIdea] = useState(false);

  useEffect(() => {
    // Load initial data
    const loadData = async () => {
      const daysData = await getItinerary();
      const backlogData = await getBacklogActivities();
      setDays(daysData);
      setBacklog(backlogData);
    };
    loadData();
  }, []);

  // Helper for nice dates
  const formatDate = (dateString: string) => {
    if (!dateString) return '';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' });
    } catch (e) {
      return dateString;
    }
  };

  const handleOpenDay = (day: ItineraryDay) => {
    setSelectedDay(day);
    setAiRecommendation("");
    setIsCompact(false);
  };

  const handleSmartGuide = async (location: string, date: string) => {
    setLoadingAi(true);
    const result = await getNearbyRecommendations(location, date);
    setAiRecommendation(result || "No se encontraron recomendaciones.");
    setLoadingAi(false);
  };

  const handleRemoveActivity = async (dayId: string, activityId: string) => {
      if (!confirm("¿Mover esta actividad de vuelta al cajón de ideas?")) return;
      setIsSaving(true);
      
      // Deep copy to ensure no reference issues
      const newDays = JSON.parse(JSON.stringify(days));
      const dayIndex = newDays.findIndex((d: ItineraryDay) => d.id === dayId);
      
      if (dayIndex === -1) { setIsSaving(false); return; }
      
      const activityIndex = newDays[dayIndex].activities.findIndex((a: Activity) => a.id === activityId);
      if (activityIndex === -1) { setIsSaving(false); return; }

      const activity = newDays[dayIndex].activities[activityIndex];
      
      // Remove from Day
      newDays[dayIndex].activities.splice(activityIndex, 1);
      
      // Add to Backlog
      // Reset time to flexible when moving back
      const updatedActivity = { ...activity, time: '-' };
      const newBacklog = [...backlog, updatedActivity];

      setDays(newDays);
      setBacklog(newBacklog);
      
      // Update selected day view if open
      if (selectedDay && selectedDay.id === dayId) {
          setSelectedDay(newDays[dayIndex]);
      }

      // Save to Backend
      await updateItinerary(newDays, newBacklog);
      setIsSaving(false);
  };

  const handleEditActivity = (activity: Activity) => {
      setEditingActivity(activity);
      setIsEditingBacklog(false);
      setNewIdeaTitle(activity.title);
      setNewIdeaLoc(activity.location);
      setNewIdeaDesc(activity.description);
      setNewIdeaType(activity.type as any);
      setNewIdeaTime(activity.time);
      setShowCreateModal(true);
  };

  const handleEditBacklogItem = (activity: Activity) => {
    setEditingActivity(activity);
    setIsEditingBacklog(true);
    setNewIdeaTitle(activity.title);
    setNewIdeaLoc(activity.location);
    setNewIdeaDesc(activity.description);
    setNewIdeaType(activity.type as any);
    setNewIdeaTime('-');
    setShowCreateModal(true);
  };

  const handleDeleteBacklogItem = async (id: string) => {
      if (!confirm("¿Borrar esta idea para siempre?")) return;
      setIsSaving(true);
      const newBacklog = backlog.filter(i => i.id !== id);
      setBacklog(newBacklog);
      await updateItinerary(days, newBacklog);
      setIsSaving(false);
  };

  const handleAddFromBacklog = async (activity: Activity) => {
      if (!selectedDay) return;
      setIsSaving(true);

      // Deep copy
      const newDays = JSON.parse(JSON.stringify(days));
      const dayIndex = newDays.findIndex((d: ItineraryDay) => d.id === selectedDay.id);
      
      // Assign a default time or keep existing
      const newActivity = { ...activity, time: "FLEX" }; 
      newDays[dayIndex].activities.push(newActivity);
      
      const newBacklog = backlog.filter(a => a.id !== activity.id);

      setDays(newDays);
      setBacklog(newBacklog);
      setSelectedDay(newDays[dayIndex]);
      setShowAddModal(false);

      await updateItinerary(newDays, newBacklog);
      setIsSaving(false);
  };

  const handleSaveIdeaOrActivity = async (e: React.FormEvent) => {
      e.preventDefault();
      setCreatingIdea(true);
      setIsSaving(true);

      // Deep Copy
      const newDays = JSON.parse(JSON.stringify(days));

      // Scenario 1: Editing Activity in a Day
      if (editingActivity && selectedDay && !isEditingBacklog) {
          const dayIndex = newDays.findIndex((d: ItineraryDay) => d.id === selectedDay.id);
          
          const updatedActivity = {
              ...editingActivity,
              title: newIdeaTitle,
              location: newIdeaLoc,
              description: newIdeaDesc,
              type: newIdeaType,
              time: newIdeaTime
          };
          
          const actIndex = newDays[dayIndex].activities.findIndex((a: Activity) => a.id === editingActivity.id);
          if (actIndex !== -1) {
              newDays[dayIndex].activities[actIndex] = updatedActivity;
              setDays(newDays);
              setSelectedDay(newDays[dayIndex]);
              await updateItinerary(newDays, backlog);
          }
      } 
      // Scenario 2: Editing Backlog Item
      else if (editingActivity && isEditingBacklog) {
          const newBacklog = backlog.map(item => 
            item.id === editingActivity.id 
            ? { ...item, title: newIdeaTitle, location: newIdeaLoc, description: newIdeaDesc, type: newIdeaType } 
            : item
          );
          setBacklog(newBacklog);
          await updateItinerary(days, newBacklog);
      }
      // Scenario 3: Creating New Idea
      else {
        // Auto-geocode using Gemini
        const coords = await getCoordinates(`${newIdeaTitle} ${newIdeaLoc}`);

        const newActivity: Activity = {
            id: `new_${Date.now()}`,
            title: newIdeaTitle,
            location: newIdeaLoc,
            description: newIdeaDesc,
            type: newIdeaType,
            time: '-',
            mapLink: '',
            coordinates: coords
        };

        const updatedBacklog = await addBacklogItem(newActivity);
        setBacklog(updatedBacklog);
      }

      setCreatingIdea(false);
      setIsSaving(false);
      setShowCreateModal(false);
      setEditingActivity(null);
      setIsEditingBacklog(false);
      resetForm();
  };

  const resetForm = () => {
      setNewIdeaTitle('');
      setNewIdeaLoc('');
      setNewIdeaDesc('');
      setNewIdeaTime('');
  }

  return (
    <div className="pb-24 relative">
      {isSaving && (
        <div className="fixed top-20 right-4 z-50 bg-slate-900 text-white px-3 py-1.5 rounded-full text-xs font-bold flex items-center gap-2 shadow-lg animate-in fade-in slide-in-from-top-2">
            <Loader2 size={12} className="animate-spin" /> Guardando...
        </div>
      )}

      <h2 className="text-2xl font-bold text-slate-800 mb-6 px-2">Itinerario</h2>
      
      {/* Timeline List */}
      <div className="space-y-4">
        {days.map((day) => (
          <div 
            key={day.id} 
            onClick={() => handleOpenDay(day)}
            className="glass-panel p-5 rounded-3xl hover:bg-white/80 transition-all cursor-pointer border-l-4 border-l-rose-400"
          >
            <div className="flex justify-between items-center">
              <div>
                <span className="text-xs font-bold text-rose-500 uppercase tracking-wide">{formatDate(day.date)}</span>
                <h3 className="text-lg font-bold text-slate-800">{day.dayTitle}</h3>
                <span className="text-xs text-slate-400">{day.activities.length} actividades</span>
              </div>
              <div className="bg-white/50 p-2 rounded-full">
                <Navigation size={20} className="text-slate-400" />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Backlog Preview Section */}
      <div className="mt-8">
          <div className="flex justify-between items-center px-2 mb-4">
            <h3 className="text-lg font-bold text-slate-700 flex items-center gap-2">
                <StickyNote size={20} /> Cajón de Ideas ({backlog.length})
            </h3>
            <button 
                onClick={() => { setEditingActivity(null); setIsEditingBacklog(false); resetForm(); setShowCreateModal(true); }}
                className="w-8 h-8 bg-rose-500 rounded-full flex items-center justify-center text-white shadow-md hover:bg-rose-600 transition-colors"
            >
                <Plus size={16} />
            </button>
          </div>
          
          <div className="flex overflow-x-auto gap-4 px-2 pb-4 scrollbar-hide">
              {backlog.map(item => (
                  <div key={item.id} className="glass-panel p-4 rounded-2xl min-w-[200px] w-[200px] flex flex-col justify-between group relative">
                      <div>
                          <h4 className="font-bold text-slate-800 text-sm truncate pr-6">{item.title}</h4>
                          <p className="text-xs text-slate-500 line-clamp-2">{item.description}</p>
                      </div>
                      <div className="mt-2 text-[10px] text-rose-400 font-bold uppercase">{item.location}</div>
                      
                      {/* Edit/Delete Overlay */}
                      <div className="absolute top-2 right-2 flex gap-1 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                        <button 
                            onClick={(e) => { e.stopPropagation(); handleEditBacklogItem(item); }}
                            className="p-1.5 bg-white/90 rounded-full text-blue-500 hover:text-blue-600 shadow-sm"
                        >
                            <Pencil size={12} />
                        </button>
                        <button 
                            onClick={(e) => { e.stopPropagation(); handleDeleteBacklogItem(item.id); }}
                            className="p-1.5 bg-white/90 rounded-full text-red-500 hover:text-red-600 shadow-sm"
                        >
                            <Trash2 size={12} />
                        </button>
                      </div>
                  </div>
              ))}
          </div>
      </div>

      {/* Day Modal */}
      {selectedDay && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-slate-900/60 backdrop-blur-sm p-0 sm:p-4">
          <div className="bg-[#fcfcfc] w-full max-w-lg h-[90vh] sm:h-auto sm:max-h-[85vh] rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden flex flex-col animate-in slide-in-from-bottom duration-300">
            
            {/* Modal Header */}
            <div className="p-6 bg-rose-50 border-b border-rose-100 flex justify-between items-start">
              <div>
                <h2 className="text-2xl font-bold text-slate-800">{selectedDay.dayTitle}</h2>
                <p className="text-rose-500 font-medium">{formatDate(selectedDay.date)}</p>
              </div>
              <div className="flex gap-2">
                <button
                    onClick={() => setIsCompact(!isCompact)}
                    className="p-2 bg-white rounded-full hover:bg-slate-100 text-slate-500 transition-colors"
                    title={isCompact ? "Ver detalles" : "Vista compacta"}
                >
                    {isCompact ? <Maximize2 size={20} /> : <Minimize2 size={20} />}
                </button>
                <button 
                    onClick={() => setSelectedDay(null)}
                    className="p-2 bg-white rounded-full hover:bg-slate-100 text-slate-500 transition-colors"
                >
                    <X size={20} />
                </button>
              </div>
            </div>

            {/* Modal Content */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              
              {/* Add Activity Button */}
              <button 
                onClick={() => setShowAddModal(true)}
                className="w-full py-3 border-2 border-dashed border-rose-300 rounded-2xl text-rose-500 font-bold flex items-center justify-center gap-2 hover:bg-rose-50 transition-colors"
              >
                  <Plus size={20} /> Añadir desde Ideas
              </button>

              {/* Timeline Items */}
              {selectedDay.activities.map((act) => (
                <div key={act.id} className={`relative pl-8 border-l-2 border-slate-200 last:border-0 group ${isCompact ? 'pb-4' : 'pb-8'}`}>
                  <div className="absolute -left-[9px] top-0 w-4 h-4 rounded-full bg-rose-400 border-2 border-white shadow-sm" />
                  
                  <div className="flex justify-between items-start mb-1">
                    <span className="text-xs font-bold text-slate-400 bg-slate-100 px-2 py-0.5 rounded-md flex items-center gap-1">
                      <Clock size={10} /> {act.time}
                    </span>
                    <div className="flex gap-2">
                        {act.type === 'visit' && (
                        <button 
                        onClick={() => handleSmartGuide(act.location, selectedDay.date)}
                        className="text-[10px] bg-indigo-100 text-indigo-700 px-2 py-1 rounded-full flex items-center gap-1 hover:bg-indigo-200"
                        >
                        <Sparkles size={10} /> {isCompact ? '' : 'Guía IA'}
                        </button>
                        )}
                        <button onClick={() => handleEditActivity(act)} className="text-slate-300 hover:text-blue-500"><Pencil size={14}/></button>
                        <button onClick={() => handleRemoveActivity(selectedDay.id, act.id)} className="text-slate-300 hover:text-red-500"><Trash2 size={14}/></button>
                    </div>
                  </div>
                  
                  <h4 className="font-bold text-slate-800 text-lg">{act.title}</h4>
                  
                  {!isCompact && (
                    <>
                        <p className="text-sm text-slate-500 mb-3">{act.description}</p>
                        <div className="flex gap-2">
                            {act.mapLink && (
                            <a 
                            href={act.mapLink} 
                            target="_blank" 
                            rel="noreferrer"
                            className="flex-1 bg-slate-800 text-white text-xs py-2 px-3 rounded-xl flex items-center justify-center gap-2 hover:bg-slate-700"
                            >
                            <Navigation size={14} /> Ir
                            </a>
                            )}
                        </div>
                    </>
                  )}
                </div>
              ))}

              {/* AI Recommendation Area */}
              {loadingAi && (
                <div className="p-4 bg-indigo-50 rounded-2xl animate-pulse text-indigo-800 text-sm">
                  Consultando a los espíritus del lugar...
                </div>
              )}
              
              {aiRecommendation && (
                <div className="p-4 bg-indigo-50 rounded-2xl border border-indigo-100">
                  <h5 className="font-bold text-indigo-900 mb-2 flex items-center gap-2">
                    <Sparkles size={16} /> Ideas de Gemini
                  </h5>
                  <p className="text-sm text-indigo-800 whitespace-pre-line leading-relaxed">
                    {aiRecommendation}
                  </p>
                </div>
              )}

            </div>
          </div>
        </div>
      )}

      {/* Add From Backlog Modal */}
      {showAddModal && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
              <div className="bg-white w-full max-w-md rounded-3xl p-6 shadow-2xl max-h-[80vh] overflow-y-auto">
                  <div className="flex justify-between items-center mb-4">
                      <h3 className="text-lg font-bold text-slate-800">Añadir Actividad</h3>
                      <button onClick={() => setShowAddModal(false)}><X size={20} className="text-slate-400"/></button>
                  </div>
                  
                  {backlog.length === 0 ? (
                      <p className="text-center text-slate-500 py-8">No hay más ideas en el cajón.</p>
                  ) : (
                      <div className="space-y-3">
                          {backlog.map(item => (
                              <div key={item.id} className="border border-slate-100 p-4 rounded-xl hover:bg-rose-50 transition-colors flex justify-between items-center group">
                                  <div>
                                      <h4 className="font-bold text-slate-800 text-sm">{item.title}</h4>
                                      <span className="text-[10px] text-slate-400">{item.location}</span>
                                  </div>
                                  <button 
                                    onClick={() => handleAddFromBacklog(item)}
                                    className="bg-rose-500 text-white p-2 rounded-full shadow-lg shadow-rose-200"
                                  >
                                      <Plus size={16} />
                                  </button>
                              </div>
                          ))}
                      </div>
                  )}
              </div>
          </div>
      )}

      {/* Create New Idea / Edit Activity Modal */}
      {showCreateModal && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
              <div className="bg-white w-full max-w-sm rounded-3xl p-6 shadow-2xl animate-in fade-in zoom-in duration-200">
                  <div className="flex justify-between items-center mb-6">
                      <h3 className="text-lg font-bold text-slate-800">{editingActivity ? 'Editar Actividad' : 'Nueva Idea'}</h3>
                      <button onClick={() => { setShowCreateModal(false); setEditingActivity(null); setIsEditingBacklog(false); resetForm(); }}><X size={20} className="text-slate-400"/></button>
                  </div>
                  
                  <form onSubmit={handleSaveIdeaOrActivity} className="space-y-4">
                      <div>
                          <label className="block text-xs font-bold text-slate-500 mb-1">Nombre</label>
                          <input 
                              type="text" 
                              required
                              value={newIdeaTitle}
                              onChange={e => setNewIdeaTitle(e.target.value)}
                              className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-rose-400 transition-colors"
                          />
                      </div>
                      <div>
                          <label className="block text-xs font-bold text-slate-500 mb-1">Ubicación</label>
                          <input 
                              type="text" 
                              required
                              value={newIdeaLoc}
                              onChange={e => setNewIdeaLoc(e.target.value)}
                              className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-rose-400 transition-colors"
                          />
                      </div>
                      
                      {/* Only show time input if editing an activity already assigned to a day */}
                      {editingActivity && !isEditingBacklog && (
                          <div>
                            <label className="block text-xs font-bold text-slate-500 mb-1">Hora (Texto Libre)</label>
                            <input 
                                type="text" 
                                value={newIdeaTime}
                                onChange={e => setNewIdeaTime(e.target.value)}
                                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-rose-400 transition-colors"
                            />
                        </div>
                      )}

                       <div>
                          <label className="block text-xs font-bold text-slate-500 mb-1">Tipo</label>
                          <div className="flex gap-2">
                              <button 
                                type="button"
                                onClick={() => setNewIdeaType('visit')}
                                className={`flex-1 py-2 rounded-xl text-sm font-bold border transition-colors ${newIdeaType === 'visit' ? 'bg-rose-50 border-rose-200 text-rose-600' : 'bg-white border-slate-200 text-slate-500'}`}
                              >
                                  Visita
                              </button>
                              <button 
                                type="button"
                                onClick={() => setNewIdeaType('food')}
                                className={`flex-1 py-2 rounded-xl text-sm font-bold border transition-colors ${newIdeaType === 'food' ? 'bg-orange-50 border-orange-200 text-orange-600' : 'bg-white border-slate-200 text-slate-500'}`}
                              >
                                  Comida
                              </button>
                          </div>
                      </div>
                      <div>
                          <label className="block text-xs font-bold text-slate-500 mb-1">Nota</label>
                          <textarea 
                              value={newIdeaDesc}
                              onChange={e => setNewIdeaDesc(e.target.value)}
                              className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-rose-400 transition-colors h-24 resize-none"
                          />
                      </div>

                      <button 
                        type="submit" 
                        disabled={creatingIdea}
                        className="w-full py-3 bg-rose-500 text-white font-bold rounded-xl shadow-lg shadow-rose-200 hover:bg-rose-600 transition-colors flex items-center justify-center gap-2 disabled:opacity-70"
                      >
                          {creatingIdea ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
                          {creatingIdea ? "Procesando..." : "Guardar"}
                      </button>
                  </form>
              </div>
          </div>
      )}
    </div>
  );
};

export default Itinerary;