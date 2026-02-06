import React, { useEffect, useState } from 'react';
import { Trophy, Swords, Scroll, Sparkles, Target, CheckCircle2, User, HelpCircle, Loader2, Award } from 'lucide-react';
import { getGameData, updateGameData, getItinerary } from '../services/dataService';
import { generateTripQuiz } from '../services/geminiService';
import { GameUser, GameMission, ItineraryDay } from '../types';

const Games: React.FC = () => {
  const [users, setUsers] = useState<GameUser[]>([]);
  const [missions, setMissions] = useState<GameMission[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Quiz State
  const [quizModalOpen, setQuizModalOpen] = useState(false);
  const [generatingQuiz, setGeneratingQuiz] = useState(false);
  const [activeQuiz, setActiveQuiz] = useState<any>(null);
  const [quizAnswered, setQuizAnswered] = useState(false);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);

  useEffect(() => {
    loadGame();
  }, []);

  const loadGame = async () => {
    const data = await getGameData();
    // Sort users by score descending
    setUsers(data.users.sort((a, b) => b.score - a.score));
    setMissions(data.missions);
    setLoading(false);
  };

  const handleGenerateQuiz = async () => {
    setGeneratingQuiz(true);
    setQuizModalOpen(true);
    setActiveQuiz(null);
    setQuizAnswered(false);
    setSelectedAnswer(null);

    // Get context from today's itinerary (simulate today as Day 3 for demo, or real date)
    const itinerary = await getItinerary();
    // For demo purposes, pick a random activity from the trip to learn about
    const randomDay = itinerary[Math.floor(Math.random() * itinerary.length)];
    const randomActivity = randomDay.activities[Math.floor(Math.random() * randomDay.activities.length)];
    const context = `${randomActivity.title} en ${randomActivity.location}`;

    const quiz = await generateTripQuiz(context);
    setActiveQuiz(quiz);
    setGeneratingQuiz(false);
  };

  const handleAnswerQuiz = (index: number) => {
    if (quizAnswered) return;
    setSelectedAnswer(index);
    setQuizAnswered(true);
  };

  const handleAssignPoints = async (userId: string, points: number, missionId?: string) => {
    setSaving(true);
    
    // Update Users
    const updatedUsers = users.map(u => 
        u.id === userId ? { ...u, score: u.score + points } : u
    ).sort((a, b) => b.score - a.score); // Re-sort immediately

    // Update Missions if applicable
    let updatedMissions = missions;
    if (missionId) {
        updatedMissions = missions.map(m => 
            m.id === missionId ? { ...m, completedBy: [...m.completedBy, userId] } : m
        );
    }

    setUsers(updatedUsers);
    setMissions(updatedMissions);

    // Close Quiz Modal if open
    if (quizModalOpen) {
        setTimeout(() => setQuizModalOpen(false), 1500);
    }

    await updateGameData(updatedUsers, updatedMissions);
    setSaving(false);
  };

  return (
    <div className="pb-24 space-y-8">
      
      {/* HEADER */}
      <div className="flex items-center gap-3 px-2">
          <div className="p-3 bg-amber-100 text-amber-600 rounded-2xl">
            <Trophy size={28} />
          </div>
          <div>
              <h2 className="text-2xl font-bold text-slate-800">Dojo de Leyendas</h2>
              <p className="text-xs text-slate-500">Compite por el honor y el sushi.</p>
          </div>
      </div>

      {/* LEADERBOARD */}
      <div className="glass-panel p-6 rounded-3xl relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-5">
              <Swords size={120} />
          </div>
          <h3 className="font-bold text-slate-700 mb-4 flex items-center gap-2">
              <Award size={18} className="text-rose-500"/> Ranking Daimyo
          </h3>
          
          <div className="space-y-4 relative z-10">
              {users.map((user, index) => (
                  <div key={user.id} className="flex items-center gap-3">
                      <div className="font-mono text-slate-400 font-bold w-4">{index + 1}</div>
                      <div className={`w-8 h-8 rounded-full ${user.avatarColor} flex items-center justify-center text-white font-bold text-xs shadow-md border-2 border-white`}>
                          {user.name.charAt(0)}
                      </div>
                      <div className="flex-1">
                          <div className="flex justify-between items-center mb-1">
                              <span className="font-bold text-slate-700 text-sm">{user.name}</span>
                              <span className="font-mono text-amber-500 font-bold text-sm">{user.score} XP</span>
                          </div>
                          <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                              <div 
                                className={`h-full ${user.avatarColor} opacity-80`} 
                                style={{ width: `${Math.min(100, (user.score / 1000) * 100)}%` }}
                              />
                          </div>
                      </div>
                  </div>
              ))}
          </div>
      </div>

      {/* DAILY CHALLENGE (QUIZ) */}
      <div className="px-2">
          <button 
            onClick={handleGenerateQuiz}
            className="w-full py-6 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-3xl shadow-xl shadow-indigo-200 text-white relative overflow-hidden group transition-transform hover:scale-[1.02]"
          >
              <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="relative z-10 flex flex-col items-center gap-2">
                  <Sparkles size={32} className="animate-pulse" />
                  <span className="text-lg font-bold">Invocar Desafío del Sabio</span>
                  <span className="text-xs bg-white/20 px-3 py-1 rounded-full">+100 XP Instantáneos</span>
              </div>
          </button>
      </div>

      {/* MISSIONS LIST */}
      <div className="glass-panel p-6 rounded-3xl">
          <h3 className="font-bold text-slate-700 mb-4 flex items-center gap-2">
              <Scroll size={18} className="text-emerald-500"/> Senda del Ninja
          </h3>
          <div className="space-y-4">
              {missions.map(mission => (
                  <div key={mission.id} className="border border-slate-100 bg-white/50 rounded-2xl p-4">
                      <div className="flex justify-between items-start mb-2">
                          <div className="flex items-center gap-2">
                              <span className="text-2xl">{mission.icon}</span>
                              <h4 className="font-bold text-slate-800 text-sm leading-tight max-w-[180px]">{mission.title}</h4>
                          </div>
                          <span className="text-xs font-bold bg-emerald-100 text-emerald-600 px-2 py-1 rounded-lg">+{mission.points} XP</span>
                      </div>
                      
                      {/* Completed Avatars */}
                      <div className="flex items-center justify-between mt-3 pl-9">
                          <div className="flex -space-x-2">
                              {mission.completedBy.map((uid) => {
                                  const u = users.find(user => user.id === uid);
                                  if (!u) return null;
                                  return (
                                      <div key={uid} className={`w-6 h-6 rounded-full ${u.avatarColor} border-2 border-white`} title={u.name} />
                                  )
                              })}
                              {mission.completedBy.length === 0 && <span className="text-xs text-slate-400 italic">Nadie aún...</span>}
                          </div>

                          {/* Action Button */}
                          <div className="relative group">
                              <button className="text-xs font-bold text-slate-400 border border-slate-200 px-3 py-1 rounded-full hover:bg-emerald-50 hover:text-emerald-600 hover:border-emerald-200 transition-colors">
                                  Marcar
                              </button>
                              {/* Dropdown to assign */}
                              <div className="absolute bottom-full right-0 mb-2 w-32 bg-white shadow-xl rounded-xl p-2 hidden group-hover:block z-20 animate-in slide-in-from-bottom-2">
                                  <p className="text-[10px] text-center text-slate-400 mb-2">¿Quién lo hizo?</p>
                                  <div className="grid grid-cols-2 gap-2">
                                      {users.map(u => (
                                          <button 
                                            key={u.id}
                                            onClick={() => handleAssignPoints(u.id, mission.points, mission.id)}
                                            disabled={mission.completedBy.includes(u.id)}
                                            className={`w-8 h-8 rounded-full ${u.avatarColor} text-white text-xs font-bold flex items-center justify-center disabled:opacity-20`}
                                          >
                                              {u.name.charAt(0)}
                                          </button>
                                      ))}
                                  </div>
                              </div>
                          </div>
                      </div>
                  </div>
              ))}
          </div>
      </div>

      {/* --- QUIZ MODAL --- */}
      {quizModalOpen && (
          <div className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-900/80 backdrop-blur-md p-4">
              <div className="bg-white w-full max-w-md rounded-3xl p-6 shadow-2xl relative overflow-hidden animate-in zoom-in duration-300">
                  
                  {/* Close Btn */}
                  {!generatingQuiz && (
                    <button onClick={() => setQuizModalOpen(false)} className="absolute top-4 right-4 text-slate-400 hover:text-slate-600">
                        <User size={20} className="rotate-45" /> {/* X icon hack */}
                    </button>
                  )}

                  {generatingQuiz ? (
                      <div className="py-12 flex flex-col items-center text-center">
                          <Loader2 size={48} className="text-indigo-500 animate-spin mb-4" />
                          <h3 className="text-lg font-bold text-slate-800">Consultando a los ancestros...</h3>
                          <p className="text-slate-500 text-sm">Generando pregunta basada en tu ubicación.</p>
                      </div>
                  ) : activeQuiz ? (
                      <div>
                          <div className="flex justify-center mb-6">
                              <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-600 animate-bounce">
                                  <HelpCircle size={32} />
                              </div>
                          </div>
                          
                          <h3 className="text-xl font-bold text-slate-800 text-center mb-6 leading-tight">
                              {activeQuiz.question}
                          </h3>

                          <div className="space-y-3 mb-6">
                              {activeQuiz.options.map((option: string, idx: number) => {
                                  let btnClass = "bg-white border-2 border-slate-200 text-slate-600 hover:border-indigo-300";
                                  
                                  if (quizAnswered) {
                                      if (idx === activeQuiz.correctIndex) btnClass = "bg-emerald-500 border-emerald-500 text-white shadow-lg shadow-emerald-200";
                                      else if (idx === selectedAnswer) btnClass = "bg-red-500 border-red-500 text-white";
                                      else btnClass = "bg-slate-100 border-transparent text-slate-400 opacity-50";
                                  }

                                  return (
                                    <button
                                        key={idx}
                                        onClick={() => handleAnswerQuiz(idx)}
                                        disabled={quizAnswered}
                                        className={`w-full p-4 rounded-xl text-left font-bold transition-all text-sm ${btnClass}`}
                                    >
                                        {option}
                                    </button>
                                  )
                              })}
                          </div>

                          {/* Result Feedback */}
                          {quizAnswered && (
                              <div className="animate-in fade-in slide-in-from-bottom-4">
                                  {selectedAnswer === activeQuiz.correctIndex ? (
                                      <div className="text-center">
                                          <div className="inline-block px-4 py-1 bg-emerald-100 text-emerald-700 rounded-full text-xs font-bold mb-4">
                                              ¡RESPUESTA CORRECTA!
                                          </div>
                                          <p className="text-xs text-slate-500 mb-4">{activeQuiz.explanation}</p>
                                          
                                          <p className="font-bold text-slate-800 mb-2">¿Quién ha sido el sabio?</p>
                                          <div className="flex justify-center gap-2">
                                              {users.map(u => (
                                                  <button 
                                                    key={u.id}
                                                    onClick={() => handleAssignPoints(u.id, 100)}
                                                    className={`w-10 h-10 rounded-full ${u.avatarColor} text-white font-bold shadow-lg hover:scale-110 transition-transform`}
                                                  >
                                                      {u.name.charAt(0)}
                                                  </button>
                                              ))}
                                          </div>
                                      </div>
                                  ) : (
                                      <div className="text-center">
                                          <div className="inline-block px-4 py-1 bg-red-100 text-red-700 rounded-full text-xs font-bold mb-2">
                                              INCORRECTO...
                                          </div>
                                          <p className="text-xs text-slate-500">{activeQuiz.explanation}</p>
                                          <button onClick={() => setQuizModalOpen(false)} className="mt-4 text-slate-400 text-sm hover:text-slate-600">Cerrar</button>
                                      </div>
                                  )}
                              </div>
                          )}
                      </div>
                  ) : (
                      <div className="text-center py-8">
                          <p>Error cargando la pregunta.</p>
                          <button onClick={() => setQuizModalOpen(false)}>Cerrar</button>
                      </div>
                  )}
              </div>
          </div>
      )}

      {saving && (
        <div className="fixed top-20 right-4 z-[100] bg-emerald-500 text-white px-3 py-1.5 rounded-full text-xs font-bold flex items-center gap-2 shadow-lg animate-in fade-in slide-in-from-top-2">
            <CheckCircle2 size={12} /> Guardado
        </div>
      )}
    </div>
  );
};

export default Games;