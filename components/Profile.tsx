import React, { useState, useEffect } from 'react';
import { User, Mail, LogOut, Chrome, Camera, Save, Loader2 } from 'lucide-react';
import { UserProfile } from '../types';
import { getUserProfile, loginWithGoogleMock, logout, updateUserProfile } from '../services/authService';

const Profile: React.FC = () => {
  const [user, setUser] = useState<UserProfile>(getUserProfile());
  const [loading, setLoading] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [tempName, setTempName] = useState('');

  useEffect(() => {
    setTempName(user.name);
  }, [user]);

  const handleLogin = async () => {
    setLoading(true);
    const loggedUser = await loginWithGoogleMock();
    setUser(loggedUser);
    setLoading(false);
  };

  const handleLogout = () => {
    const defaultUser = logout();
    setUser(defaultUser);
    setEditMode(false);
  };

  const handleSave = () => {
    const updated = { ...user, name: tempName };
    updateUserProfile(updated);
    setUser(updated);
    setEditMode(false);
  };

  if (!user.isLoggedIn) {
    return (
      <div className="pb-24 flex flex-col items-center justify-center min-h-[60vh] text-center px-6">
        <div className="w-24 h-24 bg-rose-100 rounded-full flex items-center justify-center text-rose-500 mb-6 animate-bounce">
          <User size={48} />
        </div>
        <h2 className="text-2xl font-bold text-slate-800 mb-2">Bienvenido a Bordo</h2>
        <p className="text-slate-500 mb-8 max-w-xs">
          Inicia sesión para sincronizar tus preferencias y personalizar tu experiencia en Japón.
        </p>
        
        <button 
          onClick={handleLogin}
          disabled={loading}
          className="w-full max-w-xs bg-white border border-slate-200 text-slate-700 font-bold py-4 rounded-xl shadow-sm flex items-center justify-center gap-3 hover:bg-slate-50 transition-all active:scale-95"
        >
          {loading ? (
             <Loader2 size={24} className="animate-spin text-slate-400" />
          ) : (
            <>
              <Chrome size={24} className="text-slate-900" />
              Continuar con Google
            </>
          )}
        </button>
      </div>
    );
  }

  return (
    <div className="pb-24 space-y-6">
      {/* Header Profile */}
      <div className="relative">
        <div className="h-32 bg-gradient-to-r from-rose-400 to-orange-400 rounded-3xl opacity-90"></div>
        <div className="absolute -bottom-12 left-1/2 transform -translate-x-1/2">
           <div className="w-24 h-24 rounded-full border-4 border-white shadow-xl overflow-hidden bg-white">
              {user.photoUrl ? (
                <img src={user.photoUrl} alt="Profile" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-slate-300">
                  <User size={40} />
                </div>
              )}
           </div>
           <button className="absolute bottom-0 right-0 bg-slate-900 text-white p-2 rounded-full shadow-lg">
             <Camera size={14} />
           </button>
        </div>
      </div>

      <div className="pt-14 px-4 text-center">
        {editMode ? (
          <input 
            value={tempName}
            onChange={(e) => setTempName(e.target.value)}
            className="text-2xl font-bold text-slate-800 text-center bg-transparent border-b border-rose-300 outline-none pb-1"
            autoFocus
          />
        ) : (
          <h2 className="text-2xl font-bold text-slate-800">{user.name}</h2>
        )}
        <p className="text-slate-400 text-sm mt-1">{user.email}</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 gap-4 px-2">
        <div className="glass-panel p-4 rounded-2xl text-center">
           <span className="block text-3xl font-bold text-rose-500">11</span>
           <span className="text-xs text-slate-500 uppercase font-bold">Días de Viaje</span>
        </div>
        <div className="glass-panel p-4 rounded-2xl text-center">
           <span className="block text-3xl font-bold text-indigo-500">4</span>
           <span className="text-xs text-slate-500 uppercase font-bold">Ciudades</span>
        </div>
      </div>

      {/* Settings List */}
      <div className="glass-panel rounded-3xl overflow-hidden mx-2">
         <div className="p-4 border-b border-slate-100 flex items-center justify-between cursor-pointer hover:bg-slate-50" onClick={() => !editMode && setEditMode(true)}>
            <div className="flex items-center gap-3">
              <div className="bg-slate-100 p-2 rounded-full text-slate-600"><User size={18}/></div>
              <span className="font-medium text-slate-700">Editar Nombre</span>
            </div>
         </div>
         <div className="p-4 border-b border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-slate-100 p-2 rounded-full text-slate-600"><Mail size={18}/></div>
              <span className="font-medium text-slate-700">Notificaciones</span>
            </div>
            <div className="w-10 h-6 bg-rose-500 rounded-full relative cursor-pointer">
               <div className="absolute right-1 top-1 w-4 h-4 bg-white rounded-full shadow-sm"></div>
            </div>
         </div>
         <button 
           onClick={handleLogout}
           className="w-full p-4 flex items-center gap-3 text-red-500 hover:bg-red-50 transition-colors text-left"
         >
             <div className="bg-red-50 p-2 rounded-full"><LogOut size={18}/></div>
             <span className="font-medium">Cerrar Sesión</span>
         </button>
      </div>
      
      {editMode && (
        <div className="px-4">
          <button onClick={handleSave} className="w-full py-3 bg-slate-900 text-white rounded-xl font-bold flex items-center justify-center gap-2">
            <Save size={18} /> Guardar Cambios
          </button>
        </div>
      )}
    </div>
  );
};

export default Profile;