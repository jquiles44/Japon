import React, { useState, useRef, useEffect } from 'react';
import { MessageCircle, Send, X, Bot, Loader2 } from 'lucide-react';
import { getChatResponse } from '../services/geminiService';
import { getItinerary, getHotels, getBookedTransport, getBacklogActivities } from '../services/dataService';

interface Message {
  id: string;
  role: 'user' | 'model';
  text: string;
}

const ChatBot: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    { id: 'welcome', role: 'model', text: '¡Konnichiwa! Soy tu guía personal. Pregúntame sobre el itinerario, horarios o dónde está vuestro próximo hotel.' }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isOpen]);

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMsg: Message = { id: Date.now().toString(), role: 'user', text: input };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    try {
      // OPTIMIZACIÓN: Estas funciones ahora retornan la caché instantáneamente
      // Ya no bloquean la UI esperando a Google
      const [itinerary, hotels, transport, backlog] = await Promise.all([
        getItinerary(),
        getHotels(),
        getBookedTransport(),
        getBacklogActivities()
      ]);

      const tripContext = { itinerary, hotels, transport, backlog };

      const history = messages.map(m => ({
        role: m.role,
        parts: [{ text: m.text }]
      }));

      const responseText = await getChatResponse(userMsg.text, history, tripContext);

      const botMsg: Message = { 
        id: (Date.now() + 1).toString(), 
        role: 'model', 
        text: responseText || "Lo siento, no he podido procesar eso." 
      };
      
      setMessages(prev => [...prev, botMsg]);
    } catch (e) {
      console.error(e);
      setMessages(prev => [...prev, { id: Date.now().toString(), role: 'model', text: "Error de conexión con el servidor neural." }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleSend();
  };

  return (
    <>
      {/* Trigger Button */}
      {!isOpen && (
        <button 
          onClick={() => setIsOpen(true)}
          className="fixed bottom-28 right-5 w-14 h-14 bg-rose-500 rounded-full shadow-2xl flex items-center justify-center text-white z-50 hover:bg-rose-600 transition-transform hover:scale-110"
        >
          <MessageCircle size={28} />
        </button>
      )}

      {/* Chat Interface */}
      {isOpen && (
        <div className="fixed inset-0 z-[60] flex items-end sm:items-end sm:justify-end sm:p-6 pointer-events-none">
          {/* Overlay for mobile close */}
          <div className="absolute inset-0 bg-black/20 pointer-events-auto sm:hidden" onClick={() => setIsOpen(false)} />
          
          <div className="pointer-events-auto bg-white/95 backdrop-blur-xl w-full h-[85vh] sm:w-96 sm:h-[600px] sm:rounded-3xl rounded-t-3xl shadow-2xl flex flex-col border border-white/50 animate-in slide-in-from-bottom duration-300">
            
            {/* Header */}
            <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-rose-50/50 sm:rounded-t-3xl">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-rose-100 rounded-full flex items-center justify-center text-rose-600">
                  <Bot size={24} />
                </div>
                <div>
                  <h3 className="font-bold text-slate-800 text-sm">Odyssey AI</h3>
                  <div className="flex items-center gap-1">
                    <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                    <span className="text-[10px] text-slate-500">Online</span>
                  </div>
                </div>
              </div>
              <button onClick={() => setIsOpen(false)} className="p-2 hover:bg-slate-100 rounded-full text-slate-400">
                <X size={20} />
              </button>
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50/50">
              {messages.map((msg) => (
                <div 
                  key={msg.id} 
                  className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div 
                    className={`max-w-[80%] p-3 rounded-2xl text-sm leading-relaxed ${
                      msg.role === 'user' 
                        ? 'bg-rose-500 text-white rounded-br-none' 
                        : 'bg-white text-slate-700 shadow-sm border border-slate-100 rounded-bl-none'
                    }`}
                  >
                    {msg.text}
                  </div>
                </div>
              ))}
              {isLoading && (
                <div className="flex justify-start">
                  <div className="bg-white p-3 rounded-2xl rounded-bl-none shadow-sm border border-slate-100 flex items-center gap-2">
                    <Loader2 size={16} className="animate-spin text-rose-400" />
                    <span className="text-xs text-slate-400">Pensando...</span>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="p-4 bg-white border-t border-slate-100 sm:rounded-b-3xl">
              <div className="flex items-center gap-2 bg-slate-100 p-1 rounded-full pl-4">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyPress}
                  placeholder="Pregunta sobre el viaje..."
                  className="flex-1 bg-transparent border-none outline-none text-sm text-slate-800 placeholder-slate-400"
                />
                <button 
                  onClick={handleSend}
                  disabled={!input.trim() || isLoading}
                  className="w-10 h-10 bg-slate-900 rounded-full flex items-center justify-center text-white disabled:opacity-50 hover:bg-slate-800 transition-colors"
                >
                  <Send size={16} />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default ChatBot;