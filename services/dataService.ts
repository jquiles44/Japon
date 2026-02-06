import { ItineraryDay, Hotel, TransportTicket, Activity, ShoppingItem, PreTripTask, GameUser, GameMission } from '../types';

const API_URL = "https://script.google.com/macros/s/AKfycbzaqoqTAijvKl0y2PQUEizNSONg2y3j-3EQ3_0RqXuA6h35p3wn4QkwlM6tsu5d7IdH/exec";

// --- IN-MEMORY CACHE ---
let cachedItinerary: ItineraryDay[] | null = null;
let cachedHotels: Hotel[] | null = null;
let cachedBacklog: Activity[] | null = null;
let cachedTransport: TransportTicket[] | null = null;
let cachedShopping: ShoppingItem[] | null = null;
let cachedUserTasks: PreTripTask[] | null = null;
let cachedGameState: { users: GameUser[], missions: GameMission[] } | null = null;

// --- DATOS POR DEFECTO ---
export const DEFAULT_GAME_USERS: GameUser[] = [
    { id: 'u1', name: 'Josep', score: 0, avatarColor: 'bg-blue-500' },
    { id: 'u2', name: 'Clara', score: 0, avatarColor: 'bg-rose-500' },
    { id: 'u3', name: 'Oscar', score: 0, avatarColor: 'bg-green-500' },
    { id: 'u4', name: 'Mara', score: 0, avatarColor: 'bg-purple-500' },
    { id: 'u5', name: 'Sergio', score: 0, avatarColor: 'bg-amber-500' },
];

export const DEFAULT_MISSIONS: GameMission[] = [
    { id: 'm1', title: 'Encontrar un KitKat de sabor raro', points: 50, completedBy: [], icon: '🍫' },
    { id: 'm2', title: 'Selfie con un ciervo haciendo reverencia', points: 100, completedBy: [], icon: '🦌' },
    { id: 'm3', title: 'Ver un Geisha o Maiko real', points: 150, completedBy: [], icon: '👘' },
    { id: 'm4', title: 'Comprar ropa interior en un Konbini', points: 30, completedBy: [], icon: '🩲' },
    { id: 'm5', title: 'Comer algo que se mueva', points: 200, completedBy: [], icon: '🦑' },
    { id: 'm6', title: 'Conseguir un sello de estación (Eki Stamp)', points: 20, completedBy: [], icon: '💮' },
    { id: 'm7', title: 'Cantar una canción de anime en Karaoke', points: 80, completedBy: [], icon: '🎤' },
    { id: 'm8', title: 'Usar un inodoro con chorrito por primera vez', points: 10, completedBy: [], icon: '🚽' },
];

export const DEFAULT_ITINERARY: ItineraryDay[] = [
    {
      id: 'day1',
      date: '2026-04-02',
      dayTitle: 'Día 1: Aterrizaje en Osaka',
      activities: [
        { id: 'd1_1', time: '19:00', title: 'Llegada KIX (TK86)', description: 'Aterrizaje en Kansai. Vuelo Turkish.', location: 'Kansai Airport', mapLink: 'https://maps.google.com/?q=Kansai+International+Airport', type: 'transport', coordinates: [34.4320, 135.2304] },
      ]
    },
];

export const DEFAULT_HOTELS: Hotel[] = [];
export const DEFAULT_BACKLOG: Activity[] = [];
export const DEFAULT_TRANSPORT: TransportTicket[] = [];
export const DEFAULT_SHOPPING_LIST: ShoppingItem[] = [];
export const DEFAULT_USER_TASKS: PreTripTask[] = [];

// Helper para parsear coordenadas que vienen como string desde Excel
const safeParseCoords = (val: any): [number, number] | undefined => {
    if (!val) return undefined;
    if (Array.isArray(val) && val.length === 2) return val as [number, number];
    if (typeof val === 'string') {
        try {
            // Eliminar espacios y corchetes extra si los hay
            const cleaned = val.replace(/[\[\]]/g, '').split(',');
            if (cleaned.length === 2) {
                return [parseFloat(cleaned[0]), parseFloat(cleaned[1])];
            }
        } catch (e) {
            console.warn("Error parsing coords", val);
        }
    }
    return undefined;
};

// --- FUNCIONES API ---

// 1. SEND DATA (POST)
const sendData = async (payload: any) => {
    try {
        await fetch(API_URL, {
            method: 'POST',
            mode: 'no-cors', 
            headers: { 
                'Content-Type': 'text/plain' 
            },
            body: JSON.stringify(payload)
        });
        return true; 
    } catch (e) {
        console.error("API Error (Send)", e);
        return false;
    }
};

// 2. FETCH DATA (GET) 
const fetchData = async () => {
    try {
        const res = await fetch(`${API_URL}?op=getData`);
        if (res.ok) {
            return await res.json();
        }
    } catch (e) {
        console.error("API Error (Fetch)", e);
    }
    return null;
}

export const initializeDatabase = async (): Promise<boolean> => {
    cachedItinerary = null;
    cachedHotels = null;
    cachedBacklog = null;
    cachedTransport = null;
    cachedShopping = null;
    cachedUserTasks = null;
    cachedGameState = null;

    return sendData({
        op: 'setupDatabase',
        initialData: {
            itinerary: DEFAULT_ITINERARY,
            hotels: DEFAULT_HOTELS,
            transport: DEFAULT_TRANSPORT,
            backlog: DEFAULT_BACKLOG,
            shopping: DEFAULT_SHOPPING_LIST,
            userTasks: DEFAULT_USER_TASKS,
            game: { users: DEFAULT_GAME_USERS, missions: DEFAULT_MISSIONS }
        }
    });
}

// --- GETTERS ---

const ensureDataLoaded = async () => {
    if (cachedItinerary) return; // Data already loaded
    
    const data = await fetchData();
    if (data) {
        cachedItinerary = data.itinerary || [];
        
        // Parse Coordinates for Hotels and fix generic objects
        if (data.hotels) {
            cachedHotels = data.hotels.map((h: any) => ({
                ...h,
                coordinates: safeParseCoords(h.coordinates)
            }));
        } else {
            cachedHotels = [];
        }

        cachedBacklog = (data.backlog || []).map((b: any) => ({
            ...b,
            coordinates: safeParseCoords(b.coordinates)
        }));

        cachedTransport = data.transport || [];
        cachedShopping = data.shopping || [];
        cachedUserTasks = data.userTasks || [];
        cachedGameState = data.game && data.game.length > 0 ? data.game[0] : null;
    } else {
        // Fallback to empty defaults if fetch fails
        cachedItinerary = [];
        cachedHotels = [];
        cachedBacklog = [];
        cachedTransport = [];
        cachedShopping = [];
        cachedUserTasks = [];
    }
}

export const getItinerary = async (forceRefresh = false): Promise<ItineraryDay[]> => {
  if (forceRefresh) cachedItinerary = null;
  await ensureDataLoaded();
  return cachedItinerary || DEFAULT_ITINERARY;
};

export const getHotels = async (): Promise<Hotel[]> => {
    await ensureDataLoaded(); 
    return cachedHotels || DEFAULT_HOTELS;
};

export const getBacklogActivities = async (): Promise<Activity[]> => {
    await ensureDataLoaded();
    return cachedBacklog || DEFAULT_BACKLOG;
};

export const getBookedTransport = async (): Promise<TransportTicket[]> => {
    await ensureDataLoaded();
    return cachedTransport || DEFAULT_TRANSPORT;
};

export const getShoppingList = async (): Promise<ShoppingItem[]> => {
  await ensureDataLoaded();
  return cachedShopping || DEFAULT_SHOPPING_LIST;
};

export const getUserTasks = async (): Promise<PreTripTask[]> => {
  await ensureDataLoaded();
  return cachedUserTasks || DEFAULT_USER_TASKS;
};

export const getGameData = async (): Promise<{ users: GameUser[], missions: GameMission[] }> => {
    await ensureDataLoaded();
    return cachedGameState || { users: DEFAULT_GAME_USERS, missions: DEFAULT_MISSIONS };
}

// --- UPDATERS ---

export const updateGameData = async (users: GameUser[], missions: GameMission[]): Promise<boolean> => {
    cachedGameState = { users, missions }; 
    return sendData({ op: 'updateGame', gameState: [cachedGameState] });
}

export const saveTransportTicket = async (ticket: TransportTicket): Promise<boolean> => {
  if (!cachedTransport) await getBookedTransport();
  const newList = [...(cachedTransport || []), ticket];
  return updateTransportList(newList);
};

export const updateItinerary = async (days: ItineraryDay[], backlog: Activity[]): Promise<boolean> => {
    cachedItinerary = days;
    cachedBacklog = backlog;
    return sendData({ op: 'updateItinerary', days: days, backlog: backlog });
};

export const addBacklogItem = async (activity: Activity): Promise<Activity[]> => {
    if (!cachedBacklog) await getBacklogActivities();
    const newBacklog = [...(cachedBacklog || []), activity];
    cachedBacklog = newBacklog;
    
    sendData({ op: 'updateItinerary', days: cachedItinerary || [], backlog: newBacklog });
    return newBacklog;
};

export const updateHotels = async (hotels: Hotel[]): Promise<boolean> => {
    cachedHotels = hotels;
    return sendData({ op: 'updateHotels', hotels: hotels });
}

export const updateTransportList = async (tickets: TransportTicket[]): Promise<boolean> => {
    cachedTransport = tickets;
    return sendData({ op: 'updateTransport', transport: tickets });
}

export const updateShoppingList = async (list: ShoppingItem[]): Promise<boolean> => {
  cachedShopping = list;
  return sendData({ op: 'updateShoppingList', shopping: list });
}

export const updateUserTasks = async (list: PreTripTask[]): Promise<boolean> => {
  cachedUserTasks = list;
  return sendData({ op: 'updateUserTasks', userTasks: list });
}