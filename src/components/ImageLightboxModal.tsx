'use client';

import { X } from 'lucide-react';

interface ImageLightboxModalProps {
  imageUrl: string;
  title: string;
  onClose: () => void;
}

export default function ImageLightboxModal({ imageUrl, title, onClose }: ImageLightboxModalProps) {
  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div 
        className="relative max-w-2xl w-full bg-[#121215] border border-zinc-800 rounded-2xl overflow-hidden shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-800 bg-zinc-900/80">
          <div>
            <h3 className="font-bold text-sm text-white">{title}</h3>
            <span className="text-[10px] font-mono text-zinc-400 uppercase tracking-wider">Material Photo</span>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-zinc-400 hover:text-white rounded-lg hover:bg-zinc-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Image Display */}
        <div className="p-3 bg-black flex items-center justify-center max-h-[75vh] overflow-hidden">
          <img
            src={imageUrl}
            alt={title}
            className="max-h-[70vh] w-auto max-w-full rounded-lg object-contain shadow-lg"
          />
        </div>
      </div>
    </div>
  );
}
