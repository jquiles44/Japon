import React, { useState, useRef } from 'react';
import { Camera, Wand2, ScanSearch, Upload, Download, Images, ExternalLink } from 'lucide-react';
import { analyzeTravelPhoto, editTravelPhoto } from '../services/geminiService';

const PhotoLab: React.FC = () => {
  const [mode, setMode] = useState<'analyze' | 'edit' | 'share'>('analyze');
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [resultImage, setResultImage] = useState<string | null>(null);
  const [analysisText, setAnalysisText] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [prompt, setPrompt] = useState('');
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        // Remove data URL prefix for API
        const base64Data = base64String.split(',')[1];
        setSelectedImage(base64Data);
        setResultImage(null);
        setAnalysisText('');
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAnalyze = async () => {
    if (!selectedImage) return;
    setLoading(true);
    const text = await analyzeTravelPhoto(selectedImage);
    setAnalysisText(text || "No se pudo analizar la imagen.");
    setLoading(false);
  };

  const handleEdit = async () => {
    if (!selectedImage || !prompt) return;
    setLoading(true);
    try {
      const newImage = await editTravelPhoto(selectedImage, prompt);
      setResultImage(newImage);
    } catch (e) {
      alert("Error al editar la imagen");
    }
    setLoading(false);
  };

  return (
    <div className="pb-24 space-y-6">
      <h2 className="text-2xl font-bold text-slate-800 px-2 flex items-center gap-2">
        <Camera className="text-rose-500" /> Laboratorio
      </h2>

      {/* Mode Switcher */}
      <div className="flex p-1 bg-slate-200 rounded-2xl">
        <button 
          onClick={() => { setMode('analyze'); setSelectedImage(null); setResultImage(null); }}
          className={`flex-1 py-2 text-[10px] sm:text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1 sm:gap-2 ${mode === 'analyze' ? 'bg-white shadow-sm text-slate-900' : 'text-slate-500'}`}
        >
          <ScanSearch size={14} /> Analizar
        </button>
        <button 
          onClick={() => { setMode('edit'); setSelectedImage(null); setResultImage(null); }}
          className={`flex-1 py-2 text-[10px] sm:text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1 sm:gap-2 ${mode === 'edit' ? 'bg-white shadow-sm text-slate-900' : 'text-slate-500'}`}
        >
          <Wand2 size={14} /> Editar
        </button>
        <button 
          onClick={() => { setMode('share'); setSelectedImage(null); setResultImage(null); }}
          className={`flex-1 py-2 text-[10px] sm:text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1 sm:gap-2 ${mode === 'share' ? 'bg-white shadow-sm text-slate-900' : 'text-slate-500'}`}
        >
          <Images size={14} /> Álbum
        </button>
      </div>

      <div className="glass-panel p-6 rounded-3xl min-h-[300px] flex flex-col">
        
        {/* --- SHARE MODE --- */}
        {mode === 'share' && (
            <div className="flex-1 flex flex-col items-center justify-center text-center space-y-6 animate-in fade-in duration-300">
                <div className="w-24 h-24 bg-gradient-to-tr from-yellow-400 via-red-500 to-purple-500 rounded-3xl flex items-center justify-center shadow-lg transform rotate-3">
                    <Images size={40} className="text-white" />
                </div>
                <div>
                    <h3 className="text-xl font-bold text-slate-800">Álbum Compartido</h3>
                    <p className="text-slate-500 text-sm max-w-xs mx-auto mt-2 leading-relaxed">
                        Todas las fotos del viaje en un solo lugar. Sube aquí tus mejores capturas para que todos las tengamos.
                    </p>
                </div>
                
                <a 
                    href="https://photos.app.goo.gl/GpqSJq4GJN3Tmiqh9" 
                    target="_blank" 
                    rel="noreferrer"
                    className="w-full py-4 bg-white border border-slate-200 text-slate-700 font-bold rounded-2xl shadow-sm hover:bg-slate-50 transition-all flex items-center justify-center gap-3 group"
                >
                    <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/2/2c/Google_Photos_icon_%282020%29.svg/1024px-Google_Photos_icon_%282020%29.svg.png" alt="GPhotos" className="w-6 h-6" />
                    Abrir Google Photos
                    <ExternalLink size={16} className="text-slate-400 group-hover:text-slate-600" />
                </a>
            </div>
        )}

        {/* --- ANALYZE & EDIT MODES --- */}
        {mode !== 'share' && (
            <>
                {/* Upload Area */}
                {!selectedImage && (
                <div 
                    onClick={() => fileInputRef.current?.click()}
                    className="flex-1 border-2 border-dashed border-slate-300 rounded-2xl flex flex-col items-center justify-center text-slate-400 cursor-pointer hover:bg-slate-50 transition-colors py-12"
                >
                    <Upload size={48} className="mb-2" />
                    <span className="font-bold">Sube una foto</span>
                    <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept="image/*" />
                </div>
                )}

                {/* Display Image */}
                {selectedImage && (
                <div className="space-y-4">
                    <div className="relative rounded-2xl overflow-hidden shadow-lg">
                    <img 
                        src={`data:image/jpeg;base64,${selectedImage}`} 
                        alt="Original" 
                        className="w-full h-auto object-cover"
                    />
                    <button 
                        onClick={() => { setSelectedImage(null); setResultImage(null); }}
                        className="absolute top-2 right-2 bg-black/50 text-white p-1 rounded-full backdrop-blur-md"
                    >
                        <XIcon size={16} />
                    </button>
                    </div>

                    {/* Analysis UI */}
                    {mode === 'analyze' && (
                    <div className="space-y-4">
                        <button 
                        onClick={handleAnalyze} 
                        disabled={loading}
                        className="w-full py-3 bg-indigo-600 text-white font-bold rounded-xl disabled:opacity-50 hover:bg-indigo-700 transition-colors"
                        >
                        {loading ? 'Analizando...' : 'Identificar Monumento / Comida'}
                        </button>
                        {analysisText && (
                        <div className="p-4 bg-indigo-50 rounded-xl text-indigo-900 text-sm leading-relaxed whitespace-pre-wrap border border-indigo-100">
                            {analysisText}
                        </div>
                        )}
                    </div>
                    )}

                    {/* Edit UI */}
                    {mode === 'edit' && (
                    <div className="space-y-4">
                        {!resultImage ? (
                        <>
                            <input 
                            type="text" 
                            value={prompt}
                            onChange={(e) => setPrompt(e.target.value)}
                            placeholder='ej. "Añadir cerezos", "Estilo retro"'
                            className="w-full p-3 bg-white border border-slate-200 rounded-xl text-slate-800 outline-none focus:border-rose-400"
                            />
                            <button 
                            onClick={handleEdit} 
                            disabled={loading || !prompt}
                            className="w-full py-3 bg-rose-500 text-white font-bold rounded-xl disabled:opacity-50 hover:bg-rose-600 transition-colors"
                            >
                            {loading ? 'Generando...' : 'Edición Mágica'}
                            </button>
                        </>
                        ) : (
                        <div className="space-y-4 animate-in fade-in zoom-in">
                            <h3 className="font-bold text-slate-800">Resultado:</h3>
                            <img src={resultImage} alt="Editado" className="w-full rounded-2xl shadow-lg border border-slate-100" />
                            <a href={resultImage} download="magic_edit.png" className="block w-full py-3 bg-slate-900 text-white text-center rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-slate-800 transition-colors">
                            <Download size={18} /> Guardar Imagen
                            </a>
                        </div>
                        )}
                    </div>
                    )}
                </div>
                )}
            </>
        )}
      </div>
    </div>
  );
};

const XIcon = ({size}: {size: number}) => (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
)

export default PhotoLab;