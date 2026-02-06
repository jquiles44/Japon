import React, { useEffect, useState, useRef } from 'react';
import { Sparkles, Plane, Timer, Gamepad2, Camera, Quote, MapPin } from 'lucide-react';
import { getJapanCuriosity } from '../services/geminiService';
import { ViewState } from '../types';

interface HomeProps {
  setView: (view: ViewState) => void;
}

const Home: React.FC<HomeProps> = ({ setView }) => {
  const [curiosity, setCuriosity] = useState<string>("Cargando curiosidad del día...");
  const [heroImage, setHeroImage] = useState<string>("https://images.unsplash.com/photo-1524413840807-0c3cb6fa808d?q=80&w=2070&auto=format&fit=crop");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [daysLeft, setDaysLeft] = useState(0);

  useEffect(() => {
    getJapanCuriosity().then(setCuriosity);
    
    const savedHero = localStorage.getItem('nippon_hero_img');
    if (savedHero) setHeroImage(savedHero);

    const tripDate = new Date('2026-04-02T00:00:00').getTime();
    const now = new Date().getTime();
    const diff = tripDate - now;
    const days = Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
    setDaysLeft(days);

  }, []);

  const handleHeroUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        setHeroImage(base64String);
        localStorage.setItem('nippon_hero_img', base64String);
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="space-y-6 pb-24">
      
      {/* Immersive Hero Section */}
      <div className="relative w-full h-[45vh] rounded-[2.5rem] overflow-hidden shadow-2xl group border-[6px] border-white">
        <img 
          src={heroImage} 
          alt="Japan Hero" 
          className="absolute inset-0 w-full h-full object-cover transition-transform duration-[2s] hover:scale-110"
        />
        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-black/10 flex flex-col justify-between p-6">
          
          {/* Top Bar */}
          <div className="flex justify-between items-start">
             <div className="flex flex-col">
                 <span className="text-white/80 text-[10px] tracking-[0.2em] font-bold uppercase mb-1">Proyecto</span>
                 <span className="text-2xl font-bold text-white tracking-tighter">Odisea Nipona</span>
                 <div className="h-1 w-8 bg-rose-500 rounded-full mt-2"></div>
             </div>
             
             <button 
                onClick={() => fileInputRef.current?.click()}
                className="bg-white/20 backdrop-blur-md text-white p-2.5 rounded-full hover:bg-white/40 transition-all opacity-0 group-hover:opacity-100"
              >
                <Camera size={18} />
             </button>
             <input type="file" ref={fileInputRef} onChange={handleHeroUpload} className="hidden" accept="image/*" />
          </div>

          {/* Bottom Countdown Info */}
          <div className="glass-panel-dark border-0 p-4 rounded-2xl backdrop-blur-md bg-black/30 flex items-center justify-between">
              <div>
                  <p className="text-white/60 text-xs font-medium uppercase tracking-wider mb-1">Despegamos en</p>
                  <div className="flex items-baseline gap-1">
                      <span className="text-4xl font-bold text-white">{daysLeft}</span>
                      <span className="text-sm font-bold text-white/80">días</span>
                  </div>
              </div>
              <div className="text-right">
                  <p className="text-rose-400 font-bold text-sm">02 Abr 2026</p>
                  <p className="text-white/60 text-xs">Osaka, Japón</p>
              </div>
          </div>
        </div>
      </div>

      {/* Boarding Pass Card */}
      <div className="bg-white rounded-3xl shadow-xl overflow-hidden relative border border-slate-100 mx-1">
          {/* Decorative Dashed Line */}
          <div className="absolute top-1/2 left-0 w-full border-t-2 border-dashed border-slate-200 -mt-1"></div>
          {/* Notches */}
          <div className="absolute top-1/2 -left-3 w-6 h-6 bg-[#f2f4f6] rounded-full -mt-3"></div>
          <div className="absolute top-1/2 -right-3 w-6 h-6 bg-[#f2f4f6] rounded-full -mt-3"></div>

          <div className="p-5 pb-8 relative z-10 bg-white">
              <div className="flex justify-between items-center mb-6">
                  <div className="flex items-center gap-2">
                      <Plane size={18} className="text-rose-500" />
                      <span className="font-bold text-slate-800 text-sm">Turkish Airlines</span>
                  </div>
                  <span className="text-xs font-mono text-slate-400">TK86</span>
              </div>
              <div className="flex justify-between items-end">
                  <div>
                      <span className="text-4xl font-bold text-slate-900 block">IST</span>
                      <span className="text-xs text-slate-400 uppercase tracking-wider">Estambul</span>
                  </div>
                  <div className="flex flex-col items-center pb-1">
                       <span className="text-[10px] text-slate-400 mb-1">11h 50m</span>
                       <div className="flex items-center gap-1">
                           <div className="w-2 h-2 rounded-full border border-slate-300"></div>
                           <div className="w-16 h-[2px] bg-slate-300"></div>
                           <div className="w-2 h-2 rounded-full bg-rose-500"></div>
                       </div>
                  </div>
                  <div className="text-right">
                      <span className="text-4xl font-bold text-rose-500 block">KIX</span>
                      <span className="text-xs text-slate-400 uppercase tracking-wider">Osaka</span>
                  </div>
              </div>
          </div>
          <div className="bg-slate-50 p-3 flex justify-between items-center text-xs font-mono text-slate-500 border-t border-dashed border-slate-200">
               <span>ASIENTO: <strong className="text-slate-800">5 PAX</strong></span>
               <span>SALIDA: <strong className="text-slate-800">02:10</strong></span>
          </div>
      </div>

      {/* Zen Curiosity Card */}
      <div className="relative p-6 rounded-3xl bg-gradient-to-br from-indigo-50 to-white border border-indigo-100 shadow-sm overflow-hidden">
        <Quote size={80} className="absolute -top-4 -right-4 text-indigo-100 rotate-12" />
        <div className="relative z-10">
           <div className="flex items-center gap-2 mb-3">
              <Sparkles size={16} className="text-amber-500" />
              <h3 className="font-bold text-indigo-900 text-sm uppercase tracking-wide">Sabiduría Diaria</h3>
           </div>
           <p className="text-slate-700 text-sm leading-relaxed font-medium italic">
             "{curiosity}"
           </p>
        </div>
      </div>

      {/* Quick Actions Grid */}
      <div className="grid grid-cols-2 gap-4">
        <button 
            onClick={() => setView(ViewState.ITINERARY)}
            className="group relative h-28 rounded-3xl overflow-hidden shadow-sm hover:shadow-md transition-all"
        >
           <img src="https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?q=80&w=2070&auto=format&fit=crop" className="absolute inset-0 w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" alt="Map" />
           <div className="absolute inset-0 bg-slate-900/40 group-hover:bg-slate-900/30 transition-colors"></div>
           <div className="absolute bottom-4 left-4 text-white">
               <MapPin size={20} className="mb-1" />
               <span className="font-bold text-sm">Ver Mapa</span>
           </div>
        </button>

        <button 
            onClick={() => setView(ViewState.GAMES)}
            className="group relative h-28 rounded-3xl overflow-hidden shadow-sm hover:shadow-md transition-all"
        >
           <div className="absolute inset-0 bg-gradient-to-br from-purple-600 to-indigo-600"></div>
           <div className="absolute inset-0 flex items-center justify-center opacity-20">
              <Gamepad2 size={60} className="text-white rotate-12" />
           </div>
           <div className="absolute bottom-4 left-4 text-white">
               <div className="flex items-center gap-1 mb-1">
                 <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                 <span className="text-[10px] font-bold opacity-80">ACTIVO</span>
               </div>
               <span className="font-bold text-sm">Jugar</span>
           </div>
        </button>
      </div>
    </div>
  );
};

export default Home;