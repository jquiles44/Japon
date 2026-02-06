import React, { useEffect, useState } from 'react';
import { BedDouble, Bus, Train, Plane, Plus, Check, Ticket, MapPin, Database, Loader2, Trash2, Pencil, X, Filter, ShoppingBag, Shirt, Truck, Info, Users, ExternalLink, Save } from 'lucide-react';
import { getHotels, getBookedTransport, initializeDatabase, updateHotels, updateTransportList, getShoppingList, updateShoppingList, getUserTasks, updateUserTasks } from '../services/dataService';
import { Hotel, TransportTicket, ShoppingItem, PreTripTask } from '../types';

const Logistics: React.FC = () => {
  const [hotels, setHotels] = useState<Hotel[]>([]);
  const [bookedTickets, setBookedTickets] = useState<TransportTicket[]>([]);
  const [activeTab, setActiveTab] = useState<'hotels' | 'transport' | 'guide' | 'shopping' | 'tasks'>('hotels');
  
  // Loading States
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [isInitializing, setIsInitializing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Lists connected to Backend
  const [shoppingList, setShoppingList] = useState<ShoppingItem[]>([]);
  const [userTasks, setUserTasks] = useState<PreTripTask[]>([]);
  
  // Filter State
  const [transportFilter, setTransportFilter] = useState<'ALL' | 'Train' | 'Bus' | 'Plane'>('ALL');

  // Edit/Add State
  const [editingHotel, setEditingHotel] = useState<Hotel | null>(null);
  const [showHotelForm, setShowHotelForm] = useState(false);
  const [editingTicket, setEditingTicket] = useState<TransportTicket | null>(null);

  // Form State (Hotels)
  const [hName, setHName] = useState('');
  const [hAddress, setHAddress] = useState('');
  const [hCheckIn, setHCheckIn] = useState('');
  const [hCheckOut, setHCheckOut] = useState('');
  const [hPrice, setHPrice] = useState('');
  const [hLink, setHLink] = useState('');

  // Form State (Transport)
  const [ticketType, setTicketType] = useState<'Train' | 'Bus'>('Train');
  const [fromLoc, setFromLoc] = useState('');
  const [toLoc, setToLoc] = useState('');
  const [time, setTime] = useState('');
  const [refNum, setRefNum] = useState('');

  // Form State (Shopping)
  const [newShopItem, setNewShopItem] = useState('');
  const [newShopCat, setNewShopCat] = useState('Ocio');
  const [newShopNote, setNewShopNote] = useState('');

  // Form State (Tasks)
  const [newTaskUser, setNewTaskUser] = useState('Josep');
  const [newTaskName, setNewTaskName] = useState('');
  const [newTaskLink, setNewTaskLink] = useState('');

  useEffect(() => {
    loadAllData();
  }, []);

  const loadAllData = async () => {
      setIsLoadingData(true);
      try {
          const [h, t, s, u] = await Promise.all([
              getHotels(),
              getBookedTransport(),
              getShoppingList(),
              getUserTasks()
          ]);
          setHotels(h);
          setBookedTickets(t);
          setShoppingList(s);
          setUserTasks(u);
      } catch (error) {
          console.error("Error loading logistics", error);
      } finally {
          setIsLoadingData(false);
      }
  };

  // Helper for nice dates
  const formatDate = (dateString: string) => {
    if (!dateString) return '';
    try {
      if (dateString.length === 10 && dateString.includes('-')) return dateString; 
      const date = new Date(dateString);
      return date.toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' });
    } catch (e) {
      return dateString;
    }
  };

  // --- DELETE HANDLERS (UPDATED LOGIC) ---
  
  const handleDeleteHotel = async (id: string, e?: React.MouseEvent) => {
      if (e) { e.stopPropagation(); e.preventDefault(); }
      if (!confirm("¿Seguro que quieres borrar este hotel?")) return;
      
      setIsSaving(true);
      
      // 1. Filtrar usando String comparison para evitar errores de tipo
      const newList = hotels.filter(h => String(h.id) !== String(id));
      
      // 2. Actualizar UI inmediatamente
      setHotels(newList);
      
      // 3. Enviar al Backend
      const success = await updateHotels(newList);
      if (!success) alert("Hubo un error guardando en la nube, pero se ha borrado localmente.");
      
      setIsSaving(false);
  }

  const handleDeleteTicket = async (id: string, e?: React.MouseEvent) => {
      if (e) { e.stopPropagation(); e.preventDefault(); }
      if (!confirm("¿Seguro que quieres borrar este billete?")) return;
      
      setIsSaving(true);
      
      const newList = bookedTickets.filter(t => String(t.id) !== String(id));
      setBookedTickets(newList);
      
      const success = await updateTransportList(newList);
      if (!success) alert("Hubo un error guardando en la nube.");
      
      setIsSaving(false);
  };

  const handleDeleteShopItem = async (id: string, e?: React.MouseEvent) => {
      if (e) { e.stopPropagation(); e.preventDefault(); }
      setIsSaving(true);
      const newList = shoppingList.filter(item => String(item.id) !== String(id));
      setShoppingList(newList); 
      await updateShoppingList(newList);
      setIsSaving(false);
  }

  const handleDeleteTask = async (id: string, e?: React.MouseEvent) => {
      if (e) { e.stopPropagation(); e.preventDefault(); }
      setIsSaving(true);
      const newList = userTasks.filter(t => String(t.id) !== String(id));
      setUserTasks([...newList]);
      await updateUserTasks(newList);
      setIsSaving(false);
  }

  // --- SAVE HANDLERS ---

  const handleSaveHotel = async (e: React.FormEvent) => {
      e.preventDefault();
      setIsSaving(true);
      
      let updatedList;
      if (editingHotel) {
          updatedList = hotels.map(h => h.id === editingHotel.id ? {
              ...h, 
              name: hName, address: hAddress, checkIn: hCheckIn, checkOut: hCheckOut, priceInfo: hPrice, mapLink: hLink
          } : h);
      } else {
          const newHotel: Hotel = {
              id: `h_${Date.now()}`,
              name: hName,
              address: hAddress,
              checkIn: hCheckIn,
              checkOut: hCheckOut,
              priceInfo: hPrice,
              mapLink: hLink,
              coordinates: [35.6895, 139.6917] 
          };
          updatedList = [...hotels, newHotel];
      }

      setHotels(updatedList);
      setShowHotelForm(false);
      setEditingHotel(null);
      await updateHotels(updatedList);
      setIsSaving(false);
  }

  const handleSaveTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    let updatedList;
    if (editingTicket) {
        updatedList = bookedTickets.map(t => 
            t.id === editingTicket.id 
            ? { ...t, type: ticketType, from: fromLoc, to: toLoc, departureTime: time, referenceNumber: refNum }
            : t
        );
        setEditingTicket(null);
    } else {
        const newTicket: TransportTicket = {
            id: `ticket_${Date.now()}`,
            type: ticketType,
            name: `Viaje en ${ticketType}`,
            from: fromLoc,
            to: toLoc,
            departureTime: time,
            referenceNumber: refNum
        };
        updatedList = [...bookedTickets, newTicket];
    }
    
    setBookedTickets(updatedList);
    setFromLoc(''); setToLoc(''); setTime(''); setRefNum('');
    await updateTransportList(updatedList);
    setIsSaving(false);
  };

  const handleAddShopItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newShopItem.trim()) return;
    setIsSaving(true);
    
    const newItem: ShoppingItem = {
      id: `shop_${Date.now()}`,
      item: newShopItem,
      category: newShopCat,
      note: newShopNote,
      done: false
    };

    const updatedList = [...shoppingList, newItem];
    setShoppingList(updatedList);
    setNewShopItem(''); setNewShopNote('');
    await updateShoppingList(updatedList);
    setIsSaving(false);
  };

  const handleAddTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskName.trim()) return;
    setIsSaving(true);

    const newTask: PreTripTask = {
      id: `task_${Date.now()}`,
      user: newTaskUser,
      task: newTaskName as any,
      link: newTaskLink,
      done: false
    };

    const updatedList = [...userTasks, newTask];
    setUserTasks(updatedList);
    setNewTaskName(''); setNewTaskLink('');
    await updateUserTasks(updatedList);
    setIsSaving(false);
  };

  // --- UI HELPERS ---

  const prepareHotelForm = (hotel?: Hotel) => {
      if (hotel) {
          setEditingHotel(hotel);
          setHName(hotel.name);
          setHAddress(hotel.address);
          setHCheckIn(hotel.checkIn);
          setHCheckOut(hotel.checkOut);
          setHPrice(hotel.priceInfo || '');
          setHLink(hotel.mapLink);
      } else {
          setEditingHotel(null);
          setHName(''); setHAddress(''); setHCheckIn(''); setHCheckOut(''); setHPrice(''); setHLink('');
      }
      setShowHotelForm(true);
  };

  const handleEditTicket = (ticket: TransportTicket) => {
    setEditingTicket(ticket);
    setTicketType(ticket.type);
    setFromLoc(ticket.from);
    setToLoc(ticket.to);
    setTime(ticket.departureTime);
    setRefNum(ticket.referenceNumber || '');
    document.getElementById('ticket-form')?.scrollIntoView({ behavior: 'smooth' });
  };

  const toggleShopItem = async (id: string) => {
      const newList = shoppingList.map(item => item.id === id ? { ...item, done: !item.done } : item);
      setShoppingList(newList);
      setIsSaving(true);
      await updateShoppingList(newList);
      setIsSaving(false);
  };

  const toggleUserTask = async (id: string) => {
      const newList = userTasks.map(t => t.id === id ? { ...t, done: !t.done } : t);
      setUserTasks(newList);
      setIsSaving(true);
      await updateUserTasks(newList);
      setIsSaving(false);
  }

  const handleInitialize = async () => {
    if (!confirm("⚠️ ¡ATENCIÓN! ⚠️\n\nEsto borrará todos los datos. ¿Continuar?")) return;
    setIsInitializing(true);
    await initializeDatabase();
    window.location.reload();
  };

  const getTransportIcon = (type: string) => {
      switch(type) {
          case 'Plane': return <Plane size={20} />;
          case 'Bus': return <Bus size={20} />;
          default: return <Train size={20} />;
      }
  }

  const TabButton = ({ id, label, icon: Icon }: { id: typeof activeTab, label: string, icon: any }) => (
    <button 
      onClick={() => setActiveTab(id)}
      className={`flex-1 py-3 text-[10px] sm:text-xs font-bold rounded-xl transition-all flex flex-col items-center justify-center gap-1 ${activeTab === id ? 'bg-white shadow-sm text-rose-600' : 'text-slate-400 hover:text-slate-600'}`}
    >
      <Icon size={16} />
      <span className="truncate w-full text-center px-1">{label}</span>
    </button>
  );

  const availableUsers = ['Josep', 'Clara', 'Oscar', 'Mara', 'Sergio'];

  const groupedTasks = userTasks.reduce((acc, task) => {
    const u = task.user || 'General';
    if (!acc[u]) acc[u] = [];
    acc[u].push(task);
    return acc;
  }, {} as Record<string, PreTripTask[]>);

  return (
    <div className="pb-24 relative">
      {/* Saving Indicator */}
      {isSaving && (
        <div className="fixed top-20 right-4 z-50 bg-slate-900 text-white px-3 py-1.5 rounded-full text-xs font-bold flex items-center gap-2 shadow-lg animate-in fade-in slide-in-from-top-2">
            <Loader2 size={12} className="animate-spin" /> Guardando...
        </div>
      )}

      {/* Tabs */}
      <div className="flex p-1 bg-slate-200/80 backdrop-blur-md rounded-2xl mb-6 sticky top-0 z-30 shadow-sm overflow-x-auto scrollbar-hide">
        <TabButton id="hotels" label="Hoteles" icon={BedDouble} />
        <TabButton id="transport" label="Billetes" icon={Ticket} />
        <TabButton id="guide" label="Guía" icon={Info} />
        <TabButton id="shopping" label="Compras" icon={ShoppingBag} />
        <TabButton id="tasks" label="Tareas" icon={Users} />
      </div>

      {/* --- CONTENT: HOTELS --- */}
      {activeTab === 'hotels' && (
        <div className="space-y-4 animate-in fade-in duration-300">
           <div className="flex justify-between items-center px-2">
              <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider">Alojamientos</h3>
              <button onClick={() => prepareHotelForm()} className="p-2 bg-rose-500 text-white rounded-full shadow-lg hover:bg-rose-600">
                  <Plus size={16} />
              </button>
           </div>

          {isLoadingData ? (
             <div className="text-center py-10 text-slate-400 text-sm flex flex-col items-center">
                 <Loader2 className="animate-spin mb-2 text-rose-400" size={32} />
                 Cargando hoteles...
             </div>
          ) : hotels.length === 0 ? (
             <div className="text-center py-10 text-slate-400 text-sm">
                 No hay hoteles registrados.
             </div>
          ) : (
            hotels.map(hotel => (
                <div key={hotel.id} className="glass-panel p-5 rounded-3xl relative group">
                    <div className="absolute top-4 right-4 flex gap-2 z-10">
                        <button onClick={() => prepareHotelForm(hotel)} className="p-2 bg-slate-100 rounded-full text-slate-600 hover:text-blue-600"><Pencil size={14}/></button>
                        <button onClick={(e) => handleDeleteHotel(hotel.id, e)} className="p-2 bg-slate-100 rounded-full text-slate-600 hover:text-red-600 cursor-pointer"><Trash2 size={14}/></button>
                    </div>

                    <div className="flex items-center gap-3 mb-3">
                        <div className="bg-rose-100 p-2 rounded-full text-rose-600">
                        <BedDouble size={20} />
                        </div>
                        <div>
                            <h3 className="font-bold text-slate-800 leading-tight pr-12">{hotel.name}</h3>
                            <p className="text-xs text-rose-500 font-medium">{hotel.priceInfo}</p>
                        </div>
                    </div>
                    <p className="text-sm text-slate-500 mb-2 flex items-start gap-1">
                        <MapPin size={14} className="mt-0.5 shrink-0" />
                        {hotel.address}
                    </p>
                    <div className="flex justify-between text-xs text-slate-400 mt-3 pt-3 border-t border-slate-100">
                        <span className="bg-slate-100 px-2 py-1 rounded">Entrada: {formatDate(hotel.checkIn)}</span>
                        <span className="bg-slate-100 px-2 py-1 rounded">Salida: {formatDate(hotel.checkOut)}</span>
                    </div>
                    {hotel.mapLink && (
                        <a href={hotel.mapLink} target="_blank" rel="noreferrer" className="mt-4 block w-full py-2 bg-slate-900 text-white text-center rounded-xl text-sm font-medium hover:bg-slate-800 transition-colors">
                            Ver Mapa
                        </a>
                    )}
                </div>
            ))
          )}
        </div>
      )}

      {/* --- CONTENT: TRANSPORT --- */}
      {activeTab === 'transport' && (
        <div className="space-y-6 animate-in fade-in duration-300">
            <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
              {(['ALL', 'Train', 'Bus', 'Plane'] as const).map(type => (
                  <button
                      key={type}
                      onClick={() => setTransportFilter(type)}
                      className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap border transition-all flex items-center gap-2 ${
                          transportFilter === type 
                          ? 'bg-slate-800 text-white border-slate-800 shadow-md' 
                          : 'bg-white text-slate-500 border-slate-200 hover:border-slate-300'
                      }`}
                  >
                      {type === 'ALL' && <Filter size={12} />}
                      {type === 'Train' && <Train size={12} />}
                      {type === 'Bus' && <Bus size={12} />}
                      {type === 'Plane' && <Plane size={12} />}
                      {type === 'ALL' ? 'Todos' : type === 'Train' ? 'Tren' : type === 'Bus' ? 'Bus' : 'Avión'}
                  </button>
              ))}
            </div>

            <div className="space-y-3">
                <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider ml-2">
                    Tu Cartera {transportFilter !== 'ALL' && `(${transportFilter})`}
                </h3>
                
                {isLoadingData && <Loader2 className="animate-spin mx-auto text-rose-400" />}

                {!isLoadingData && bookedTickets.length === 0 && (
                    <div className="text-center py-8 text-slate-400 text-sm">No hay billetes.</div>
                )}

                {bookedTickets.filter(t => transportFilter === 'ALL' ? true : t.type === transportFilter).map(ticket => (
                    <div key={ticket.id} className="glass-panel p-4 rounded-2xl flex items-center justify-between group">
                        <div className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-600">
                                {getTransportIcon(ticket.type)}
                            </div>
                            <div>
                                <h4 className="font-bold text-slate-800 text-sm">{ticket.name}</h4>
                                <div className="flex items-center gap-1 text-xs text-slate-500">
                                    <span>{ticket.from}</span>
                                    <span>→</span>
                                    <span>{ticket.to}</span>
                                </div>
                                <p className="text-[10px] text-slate-400 mt-1">{ticket.departureTime}</p>
                            </div>
                        </div>
                        <div className="flex flex-col items-end gap-2">
                             {ticket.referenceNumber && (
                                <span className="font-mono text-xs font-bold text-rose-500">{ticket.referenceNumber}</span>
                             )}
                             <div className="flex gap-2">
                                <button onClick={() => handleEditTicket(ticket)} className="text-slate-400 hover:text-blue-500"><Pencil size={14}/></button>
                                <button onClick={(e) => handleDeleteTicket(ticket.id, e)} className="text-slate-400 hover:text-red-500 cursor-pointer"><Trash2 size={14}/></button>
                             </div>
                        </div>
                    </div>
                ))}
            </div>

            <div id="ticket-form" className="glass-panel p-6 rounded-3xl border-t-4 border-rose-400">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="font-bold text-slate-800 flex items-center gap-2">
                    {editingTicket ? <Pencil size={18}/> : <Plus size={18} />} 
                    {editingTicket ? "Editar Billete" : "Añadir Manualmente"}
                    </h3>
                    {editingTicket && (
                        <button onClick={() => { setEditingTicket(null); setFromLoc(''); setToLoc(''); setTime(''); setRefNum(''); }} className="text-slate-400"><X size={18}/></button>
                    )}
                </div>
                <form onSubmit={handleSaveTicket} className="space-y-4">
                  {/* ... Inputs remain the same, just keeping logic concise for XML ... */}
                  <div className="flex gap-2">
                      <button type="button" onClick={() => setTicketType('Train')} className={`flex-1 py-2 rounded-xl border text-xs ${ticketType === 'Train' ? 'bg-rose-50 border-rose-200 text-rose-700' : 'bg-white'}`}>Tren</button>
                      <button type="button" onClick={() => setTicketType('Bus')} className={`flex-1 py-2 rounded-xl border text-xs ${ticketType === 'Bus' ? 'bg-rose-50 border-rose-200 text-rose-700' : 'bg-white'}`}>Bus</button>
                      <button type="button" onClick={() => setTicketType('Plane')} className={`flex-1 py-2 rounded-xl border text-xs ${ticketType === 'Plane' ? 'bg-rose-50 border-rose-200 text-rose-700' : 'bg-white'}`}>Avión</button>
                  </div>
                  <input value={fromLoc} onChange={e => setFromLoc(e.target.value)} placeholder="De" className="w-full p-3 bg-white border rounded-xl" required />
                  <input value={toLoc} onChange={e => setToLoc(e.target.value)} placeholder="A" className="w-full p-3 bg-white border rounded-xl" required />
                  <div className="flex gap-2">
                      <input value={time} onChange={e => setTime(e.target.value)} placeholder="Hora" className="flex-[2] p-3 bg-white border rounded-xl" required />
                      <input value={refNum} onChange={e => setRefNum(e.target.value)} placeholder="Ref" className="flex-1 p-3 bg-white border rounded-xl" />
                  </div>
                  <button type="submit" className="w-full py-3 bg-rose-500 text-white font-bold rounded-xl flex justify-center items-center gap-2"><Check size={18} /> Guardar</button>
                </form>
            </div>

            <div className="mt-8 pt-8 border-t border-slate-200">
                <button onClick={handleInitialize} disabled={isInitializing} className="w-full py-3 bg-red-100 text-red-600 font-bold rounded-xl flex items-center justify-center gap-2">
                    {isInitializing ? <Loader2 size={16} className="animate-spin" /> : <Database size={16} />} Reiniciar BD
                </button>
            </div>
        </div>
      )}

      {/* --- CONTENT: GUIDE --- */}
      {activeTab === 'guide' && (
          <div className="space-y-6 animate-in fade-in duration-300">
              <div className="glass-panel p-6 rounded-3xl border-l-4 border-amber-500 relative overflow-hidden">
                   <div className="absolute top-0 right-0 p-4 opacity-10"><Truck size={100} /></div>
                   <div className="flex items-center gap-3 mb-4 relative z-10">
                      <div className="w-10 h-10 bg-amber-100 rounded-full flex items-center justify-center text-amber-600"><Truck size={20} /></div>
                      <h3 className="font-bold text-slate-800">Takkyubin</h3>
                   </div>
                   <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm relative z-10 mb-4">
                      <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-2"><Info size={12}/> Datos de Envío</h4>
                      <p className="text-xs text-slate-500 italic">Muestra esto en el 7-Eleven.</p>
                   </div>
              </div>
          </div>
      )}

      {/* --- CONTENT: SHOPPING --- */}
      {activeTab === 'shopping' && (
          <div className="space-y-4 animate-in fade-in duration-300">
              <div className="glass-panel p-4 rounded-2xl border-l-4 border-rose-400">
                 <form onSubmit={handleAddShopItem} className="flex flex-col gap-3">
                    <input type="text" placeholder="¿Qué falta comprar?" className="w-full p-2 bg-white/50 border rounded-lg" value={newShopItem} onChange={e => setNewShopItem(e.target.value)} />
                    <button type="submit" disabled={!newShopItem} className="w-full py-2 bg-rose-500 text-white rounded-lg text-sm font-bold flex justify-center items-center gap-2"><Plus size={16} /> Añadir</button>
                 </form>
              </div>
              <div className="glass-panel p-6 rounded-3xl">
                  <h3 className="text-lg font-bold text-slate-800 mb-2">Checklist</h3>
                  <div className="space-y-3">
                      {shoppingList.map(item => (
                          <div key={item.id} className="p-4 rounded-xl border bg-white flex items-center justify-between">
                              <div className="flex items-center gap-4 flex-1 cursor-pointer" onClick={() => toggleShopItem(item.id)}>
                                <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${item.done ? 'bg-emerald-500 border-emerald-500 text-white' : 'border-slate-300'}`}>
                                    <Check size={14} />
                                </div>
                                <span className={`font-bold text-sm ${item.done ? 'text-slate-500 line-through' : 'text-slate-800'}`}>{item.item}</span>
                              </div>
                              <button onClick={(e) => handleDeleteShopItem(item.id, e)} className="p-3 text-slate-300 hover:text-red-500"><Trash2 size={18} /></button>
                          </div>
                      ))}
                  </div>
              </div>
          </div>
      )}

      {/* --- CONTENT: TASKS --- */}
      {activeTab === 'tasks' && (
          <div className="space-y-4 animate-in fade-in duration-300">
               <div className="glass-panel p-4 rounded-2xl border-l-4 border-indigo-500">
                 <form onSubmit={handleAddTask} className="flex flex-col gap-3">
                    <input type="text" placeholder="Nueva tarea" className="w-full p-2 bg-white/50 border rounded-lg" value={newTaskName} onChange={e => setNewTaskName(e.target.value)} />
                    <div className="flex gap-2">
                       <select value={newTaskUser} onChange={e => setNewTaskUser(e.target.value)} className="p-2 bg-white/50 border rounded-lg text-sm">
                           {availableUsers.map(u => <option key={u} value={u}>{u}</option>)}
                       </select>
                       <button type="submit" disabled={!newTaskName} className="flex-1 py-2 bg-indigo-500 text-white rounded-lg text-sm font-bold flex justify-center items-center gap-2"><Save size={16} /> Asignar</button>
                    </div>
                 </form>
              </div>
               {Object.entries(groupedTasks).map(([user, tasks]) => (
                   <div key={user} className="glass-panel p-5 rounded-3xl">
                       <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2"><div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-sm border">{user.charAt(0)}</div>{user}</h3>
                       <div className="space-y-2">
                           {(tasks as PreTripTask[]).map(task => (
                               <div key={task.id} className="flex items-center justify-between p-3 rounded-xl border bg-white/50">
                                   <div className="flex items-center gap-3 flex-1 cursor-pointer" onClick={() => toggleUserTask(task.id)}>
                                        <div className={`w-5 h-5 rounded flex items-center justify-center border ${task.done ? 'bg-emerald-500 border-emerald-500 text-white' : 'bg-white border-slate-300'}`}>{task.done && <Check size={12} />}</div>
                                        <span className={`text-sm font-medium ${task.done ? 'text-slate-500 line-through' : 'text-slate-700'}`}>{task.task}</span>
                                   </div>
                                   <div className="flex gap-2">
                                     {task.link && <a href={task.link} target="_blank" rel="noreferrer" className="text-indigo-500"><ExternalLink size={16} /></a>}
                                     <button onClick={(e) => handleDeleteTask(task.id, e)} className="text-slate-300 hover:text-red-500"><Trash2 size={16} /></button>
                                   </div>
                               </div>
                           ))}
                       </div>
                   </div>
               ))}
          </div>
      )}

      {/* Edit/Add Hotel Modal */}
      {showHotelForm && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
              <div className="bg-white w-full max-w-sm rounded-3xl p-6 shadow-2xl">
                  <h3 className="font-bold text-slate-800 mb-4">{editingHotel ? "Editar Hotel" : "Añadir Hotel"}</h3>
                  <form onSubmit={handleSaveHotel} className="space-y-4">
                      <input className="w-full p-2 border rounded-lg" value={hName} onChange={e => setHName(e.target.value)} placeholder="Nombre del Hotel" required />
                      <input className="w-full p-2 border rounded-lg" value={hAddress} onChange={e => setHAddress(e.target.value)} placeholder="Dirección" required />
                      <div className="flex gap-2">
                          <input className="w-full p-2 border rounded-lg" value={hCheckIn} onChange={e => setHCheckIn(e.target.value)} placeholder="Check-in" />
                          <input className="w-full p-2 border rounded-lg" value={hCheckOut} onChange={e => setHCheckOut(e.target.value)} placeholder="Check-out" />
                      </div>
                      <input className="w-full p-2 border rounded-lg" value={hPrice} onChange={e => setHPrice(e.target.value)} placeholder="Info Pago" />
                      <input className="w-full p-2 border rounded-lg" value={hLink} onChange={e => setHLink(e.target.value)} placeholder="Link Google Maps" />
                      <button type="submit" className="w-full bg-slate-900 text-white p-3 rounded-xl font-bold">Guardar</button>
                      <button type="button" onClick={() => setShowHotelForm(false)} className="w-full text-slate-400 text-sm mt-2">Cancelar</button>
                  </form>
              </div>
          </div>
      )}
    </div>
  );
};

export default Logistics;