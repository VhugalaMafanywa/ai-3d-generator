import React from 'react';

export default function InputBox({ prompt, setPrompt, handleAIRequest, loading }) {
  // Logic is now gone from here—it lives in App.jsx!

  return (
    <div className="flex flex-col gap-6 mt-10">
      <div className="relative flex items-center max-w-2xl w-full">
        {/* Search Icon */}
        <span className="absolute left-5 text-purple-500 text-xl pointer-events-none">
          🔍
        </span>
        
        <input 
          className="w-full pl-14 pr-48 py-5 rounded-full border-2 border-slate-200 shadow-sm focus:border-purple-400 focus:ring-4 focus:ring-purple-100 focus:outline-none text-slate-700 font-medium transition-all text-lg"
          placeholder="Describe the asset (e.g., 'Yellow Clock')..."
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleAIRequest()}
        />

        {/* Purple "Generate" Button */}
        <button 
          onClick={handleAIRequest}
          disabled={loading || !prompt}
          className="absolute right-2 bg-[#8b5cf6] hover:bg-[#7c3aed] disabled:bg-slate-300 text-white font-bold px-8 py-3.5 rounded-full transition-all active:scale-95 whitespace-nowrap shadow-lg shadow-purple-200"
        >
          {loading ? "Analyzing..." : "Generate AI 3D Models"}
        </button>
      </div>
    </div>
  );
}