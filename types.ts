export interface Activity {
  id: string;
  time: string;
  title: string;
  description: string;
  location: string;
  mapLink: string;
  type: 'visit' | 'food' | 'transport' | 'hotel' | 'info';
  coordinates?: [number, number]; // [lat, lng]
}

export interface ItineraryDay {
  id: string;
  date: string; // YYYY-MM-DD
  dayTitle: string; // e.g., "Arrival in Tokyo"
  activities: Activity[];
}

export interface Hotel {
  id: string;
  name: string;
  address: string;
  checkIn: string;
  checkOut: string;
  mapLink: string;
  priceInfo?: string; // e.g. "Paid" or "Pay on arrival"
  coordinates?: [number, number];
}

export interface TransportTicket {
  id: string;
  type: 'Train' | 'Bus' | 'Plane' | 'Subway';
  name: string; // e.g. "Thunderbird 12"
  from: string;
  to: string;
  departureTime: string;
  referenceNumber?: string;
  seat?: string;
}

export interface ShoppingItem {
  id: string;
  item: string;
  done: boolean;
  category: string;
  note?: string;
}

export interface PreTripTask {
  id: string;
  user: string; // Josep, Clara...
  task: 'eSIM' | 'Visit Japan Web' | 'Seguro Viaje' | 'Revolut';
  done: boolean;
  link?: string;
}

export interface UserProfile {
  name: string;
  email: string;
  photoUrl: string;
  isLoggedIn: boolean;
}

export interface GameUser {
  id: string;
  name: string;
  score: number;
  avatarColor: string;
}

export interface GameMission {
  id: string;
  title: string;
  points: number;
  completedBy: string[]; // List of user IDs who completed it
  icon: string;
}

export enum ViewState {
  HOME = 'HOME',
  ITINERARY = 'ITINERARY',
  LOGISTICS = 'LOGISTICS',
  TODO = 'TODO',
  GAMES = 'GAMES',
  PHOTO_LAB = 'PHOTO_LAB',
  MAP = 'MAP',
  PROFILE = 'PROFILE'
}