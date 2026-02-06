import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import { getItinerary, getHotels, getBacklogActivities } from '../services/dataService';
import { getPlaceDetails } from '../services/geminiService';
import { ItineraryDay, Hotel, Activity } from '../types';
import { Loader2, Info, MapPin } from 'lucide-react';

const MapView: React.FC = () => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<L.Map | null>(null);
  const [loading, setLoading] = useState(true);

  // Helper to safely parse coordinates from potential string inputs
  const parseCoords = (coords: any): [number, number] | undefined => {
      if (!coords) return undefined;
      if (Array.isArray(coords) && coords.length === 2) return coords as [number, number];
      if (typeof coords === 'string') {
          try {
              const parsed = JSON.parse(coords);
              if (Array.isArray(parsed) && parsed.length === 2) return parsed as [number, number];
          } catch(e) { console.error("Bad coords", coords); }
      }
      return undefined;
  };

  useEffect(() => {
    // 1. Initialize Map Immediately
    if (mapContainer.current && !mapInstance.current) {
        const map = L.map(mapContainer.current, { zoomControl: false }).setView([35.6895, 139.6917], 6);
        L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
            attribution: '&copy; OpenStreetMap'
        }).addTo(map);
        mapInstance.current = map;
    }

    const loadMarkers = async () => {
      setLoading(true);
      const [itinerary, hotels, backlog] = await Promise.all([
          getItinerary(), 
          getHotels(), 
          getBacklogActivities()
      ]);
      
      const map = mapInstance.current;
      if (!map) return;

      // Add Hotels
      hotels.forEach(hotel => {
        const coords = parseCoords(hotel.coordinates);
        if (coords) {
          const icon = L.divIcon({
            className: 'custom-div-icon',
            html: `<div class="w-8 h-8 bg-indigo-600 rounded-full border-2 border-white shadow-lg flex items-center justify-center text-white font-bold text-xs">H</div>`,
            iconSize: [30, 30],
            iconAnchor: [15, 15]
          });
          
          const marker = L.marker(coords, { icon }).addTo(map);
          marker.bindPopup(`
            <div class="p-2">
              <h3 class="font-bold text-slate-800">${hotel.name}</h3>
              <p class="text-xs text-slate-500 mb-2">Hotel</p>
              <a href="${hotel.mapLink}" target="_blank" class="text-xs text-rose-500 font-bold">Ver en Google Maps</a>
            </div>
          `);
        }
      });

      // Helper to add marker
      const addActivityMarker = (act: Activity, dateLabel: string, colorClass: string) => {
         const coords = parseCoords(act.coordinates);
         if (coords) {
            const icon = L.divIcon({
              className: 'custom-div-icon',
              html: `<div class="w-4 h-4 ${colorClass} rounded-full border-2 border-white shadow-md"></div>`,
              iconSize: [16, 16],
              iconAnchor: [8, 8]
            });

            const marker = L.marker(coords, { icon }).addTo(map);
            
            // Custom Popup Content
            const popupContent = document.createElement('div');
            popupContent.className = 'p-2 min-w-[200px]';
            popupContent.innerHTML = `
               <h3 class="font-bold text-slate-800">${act.title}</h3>
               <p class="text-xs text-slate-500 mb-2">${dateLabel}</p>
               <div id="popup-actions-${act.id}" class="flex gap-2 mt-2">
                 <button id="btn-ask-${act.id}" class="flex-1 bg-indigo-50 text-indigo-600 px-3 py-1.5 rounded-lg text-xs font-bold flex items-center justify-center gap-1 hover:bg-indigo-100 transition-colors">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/></svg> Info IA
                 </button>
                 ${act.mapLink ? `
                 <a href="${act.mapLink}" target="_blank" class="flex-1 bg-slate-100 text-slate-600 px-3 py-1.5 rounded-lg text-xs font-bold flex items-center justify-center gap-1 hover:bg-slate-200 transition-colors">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg> Maps
                 </a>` : ''}
               </div>
               <div id="ai-result-${act.id}" class="mt-2 text-xs text-slate-600 hidden bg-slate-50 p-2 rounded-lg border border-slate-100"></div>
            `;

            marker.bindPopup(popupContent);

            // Add event listener for AI button when popup opens
            marker.on('popupopen', () => {
                const btn = document.getElementById(`btn-ask-${act.id}`);
                if (btn) {
                    btn.onclick = async () => {
                        const resultDiv = document.getElementById(`ai-result-${act.id}`);
                        if(resultDiv) {
                            resultDiv.classList.remove('hidden');
                            resultDiv.innerText = "Consultando a Gemini...";
                            const text = await getPlaceDetails(act.location || act.title);
                            resultDiv.innerText = text;
                        }
                    }
                }
            });
         }
      };

      // Add Itinerary Activities
      itinerary.forEach(day => {
        day.activities.forEach(act => {
            let colorClass = 'bg-rose-500';
            if (act.type === 'food') colorClass = 'bg-orange-500';
            if (act.type === 'visit') colorClass = 'bg-rose-500';
            if (act.type === 'transport') colorClass = 'bg-blue-500';
            
            addActivityMarker(act, day.date.substring(0, 10), colorClass); // Ensure date is short
        });
      });

      // Add Backlog (Idea) Activities
      backlog.forEach(act => {
          addActivityMarker(act, 'Idea (Sin fecha)', 'bg-emerald-500');
      });

      setLoading(false);
    };

    if (mapInstance.current) {
        loadMarkers();
    }

    return () => {
       // Cleanup if needed
    };
  }, []);

  return (
    <div className="relative w-full h-full min-h-[80vh] rounded-3xl overflow-hidden shadow-2xl border-4 border-white">
       {/* Map Container */}
       <div ref={mapContainer} className="absolute inset-0 z-0 bg-slate-100" />
       
       {/* Overlay Controls */}
       <div className="absolute top-4 right-4 z-[400] flex flex-col gap-2">
           <div className="bg-white/90 backdrop-blur-sm p-3 rounded-xl shadow-lg border border-white/50">
               <div className="flex items-center gap-2 mb-2 text-xs font-bold text-slate-400 uppercase tracking-wider">Leyenda</div>
               <div className="space-y-2">
                   <div className="flex items-center gap-2 text-xs font-bold text-slate-700"><div className="w-3 h-3 bg-indigo-600 rounded-full"></div> Hotel</div>
                   <div className="flex items-center gap-2 text-xs font-bold text-slate-700"><div className="w-3 h-3 bg-rose-500 rounded-full"></div> Visita</div>
                   <div className="flex items-center gap-2 text-xs font-bold text-slate-700"><div className="w-3 h-3 bg-orange-500 rounded-full"></div> Comida</div>
                   <div className="flex items-center gap-2 text-xs font-bold text-slate-700"><div className="w-3 h-3 bg-emerald-500 rounded-full"></div> Idea</div>
               </div>
           </div>
       </div>

       {loading && (
           <div className="absolute top-4 left-4 z-[500] bg-white/80 p-2 rounded-xl backdrop-blur-md shadow-sm">
               <Loader2 className="animate-spin text-rose-400" size={24} />
           </div>
       )}
    </div>
  );
};

export default MapView;