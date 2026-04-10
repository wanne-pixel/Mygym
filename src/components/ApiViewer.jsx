import React, { useState } from 'react';
import { fetchExercisesByBodyPart } from '../api/exerciseApi';

const ApiViewer = () => {
  const [exercises, setExercises] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedPart, setSelectedPart] = useState('');

  const bodyParts = [
    { id: 'chest', label: 'Chest' },
    { id: 'back', label: 'Back' },
    { id: 'shoulders', label: 'Shoulders' },
    { id: 'upper arms', label: 'Arms' },
    { id: 'upper legs', label: 'Legs' },
  ];

  const handleFetch = async (part) => {
    setLoading(true);
    setError(null);
    setSelectedPart(part);
    try {
      const data = await fetchExercisesByBodyPart(part);
      setExercises(data);
    } catch (err) {
      setError('Failed to fetch data. Check your API key or network.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-8 bg-slate-950 min-h-screen text-white">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-black italic mb-8 tracking-tighter text-blue-500">EXERCISE DB VIEWER (TEMP)</h1>
        
        <div className="flex flex-wrap gap-2 mb-8">
          {bodyParts.map((part) => (
            <button
              key={part.id}
              onClick={() => handleFetch(part.id)}
              className={`px-6 py-3 rounded-xl font-bold transition-all ${
                selectedPart === part.id
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30'
                  : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
              }`}
            >
              {part.label}
            </button>
          ))}
        </div>

        {loading && (
          <div className="text-center py-20 text-2xl font-bold italic animate-pulse">
            LOADING DATA FROM API...
          </div>
        )}

        {error && (
          <div className="bg-red-500/20 border border-red-500 text-red-400 p-4 rounded-xl mb-8">
            {error}
          </div>
        )}

        {!loading && exercises.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {exercises.map((ex) => (
              <div key={ex.id} className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden hover:border-blue-500/50 transition-all group">
                <div className="aspect-square bg-slate-800 relative overflow-hidden">
                  <img
                    src={ex.gifUrl}
                    alt={ex.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    referrerPolicy="no-referrer"
                  />
                </div>
                <div className="p-5">
                  <h3 className="font-bold text-lg mb-2 line-clamp-1 group-hover:text-blue-400 transition-colors uppercase italic tracking-tight">
                    {ex.name}
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    <span className="text-[10px] font-black px-2 py-1 bg-slate-800 border border-slate-700 rounded text-slate-400 uppercase tracking-widest">
                      {ex.target}
                    </span>
                    <span className="text-[10px] font-black px-2 py-1 bg-blue-500/10 border border-blue-500/20 rounded text-blue-400 uppercase tracking-widest">
                      {ex.equipment}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {!loading && exercises.length === 0 && !error && selectedPart && (
          <div className="text-center py-20 text-slate-500 italic">
            No exercises found for this body part.
          </div>
        )}
      </div>
    </div>
  );
};

export default ApiViewer;
