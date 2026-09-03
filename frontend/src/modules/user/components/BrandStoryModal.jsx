import React, { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  X, Play, Pause, Volume2, VolumeX, Maximize2, 
  Leaf, ArrowRight, ChevronRight 
} from 'lucide-react';
import heroMakhanaImg from '../../../assets/user/hero_makhana.jpg';

export default function BrandStoryModal({ isOpen, onClose }) {
  const [isPlaying, setIsPlaying] = useState(true);
  const [isMuted, setIsMuted] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [showControls, setShowControls] = useState(true);
  const videoRef = useRef(null);
  const videoContainerRef = useRef(null);
  const controlsTimeoutRef = useRef(null);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        onClose();
      } else if (e.key === ' ' && isOpen) {
        e.preventDefault();
        togglePlay();
      }
    };

    if (isOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
      // Play on open
      if (videoRef.current) {
        videoRef.current.currentTime = 0;
        videoRef.current.play().then(() => setIsPlaying(true)).catch(() => setIsPlaying(false));
      }
    }

    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  const togglePlay = () => {
    if (!videoRef.current) return;
    if (videoRef.current.paused) {
      videoRef.current.play().then(() => setIsPlaying(true)).catch(() => {});
    } else {
      videoRef.current.pause();
      setIsPlaying(false);
    }
  };

  const toggleMute = (e) => {
    if (e) e.stopPropagation();
    if (!videoRef.current) return;
    videoRef.current.muted = !videoRef.current.muted;
    setIsMuted(videoRef.current.muted);
  };

  const handleTimeUpdate = () => {
    if (videoRef.current) {
      setCurrentTime(videoRef.current.currentTime);
      setDuration(videoRef.current.duration || 0);
    }
  };

  const handleSeek = (e) => {
    const seekTime = parseFloat(e.target.value);
    if (videoRef.current) {
      videoRef.current.currentTime = seekTime;
      setCurrentTime(seekTime);
    }
  };

  const toggleFullscreen = (e) => {
    if (e) e.stopPropagation();
    if (!videoContainerRef.current) return;
    if (!document.fullscreenElement) {
      videoContainerRef.current.requestFullscreen().catch(() => {});
    } else {
      document.exitFullscreen().catch(() => {});
    }
  };

  const formatTime = (timeInSec) => {
    if (isNaN(timeInSec)) return '0:00';
    const mins = Math.floor(timeInSec / 60);
    const secs = Math.floor(timeInSec % 60);
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  const handleMouseMove = () => {
    setShowControls(true);
    if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
    controlsTimeoutRef.current = setTimeout(() => {
      if (isPlaying) setShowControls(false);
    }, 2500);
  };

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/85 backdrop-blur-md animate-in fade-in duration-200 select-none overflow-y-auto"
      onClick={onClose}
    >
      <div 
        className="relative w-full max-w-3xl bg-[#0E2A1B] rounded-2xl sm:rounded-3xl border border-[#D4AF37]/50 shadow-[0_25px_60px_rgba(0,0,0,0.85)] text-white overflow-hidden my-auto animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Subtle Ambient Glow */}
        <div className="absolute top-0 right-1/4 w-72 h-72 bg-[#D4AF37]/10 rounded-full blur-3xl pointer-events-none" />

        {/* Compact Header */}
        <div className="relative z-10 px-4 sm:px-6 py-3.5 sm:py-4 border-b border-[#D4AF37]/20 flex items-center justify-between bg-[#081B11]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-[#1B3B29] border border-[#D4AF37]/40 flex items-center justify-center text-[#D4AF37]">
              <Leaf className="w-4 h-4 fill-[#D4AF37]/20" />
            </div>
            <div>
              <p className="text-[10px] font-extrabold uppercase tracking-[0.22em] text-[#D4AF37] leading-none">
                AURIVÁ BRAND STORY
              </p>
              <h3 className="font-serif text-base sm:text-lg font-bold text-white mt-1 leading-tight">
                From Mithila Lotus Waters to Your Bowl
              </h3>
            </div>
          </div>

          {/* Close Button */}
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-[#D4AF37] text-stone-300 hover:text-[#0E2A1B] border border-white/10 hover:border-[#D4AF37] flex items-center justify-center transition-all duration-200 cursor-pointer shadow-md"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Video Player Frame */}
        <div 
          ref={videoContainerRef}
          onMouseMove={handleMouseMove}
          onMouseLeave={() => isPlaying && setShowControls(false)}
          className="relative aspect-video w-full bg-black flex items-center justify-center group cursor-pointer overflow-hidden"
          onClick={togglePlay}
        >
          <video
            ref={videoRef}
            src="/SecondVideo.mp4"
            poster={heroMakhanaImg}
            playsInline
            autoPlay
            muted={isMuted}
            onTimeUpdate={handleTimeUpdate}
            onPlay={() => setIsPlaying(true)}
            onPause={() => setIsPlaying(false)}
            onEnded={() => setIsPlaying(false)}
            className="w-full h-full object-cover"
          />

          {/* Center Play Button Overlay (when paused) */}
          {!isPlaying && (
            <div className="absolute inset-0 bg-black/40 backdrop-blur-[1px] flex items-center justify-center pointer-events-none">
              <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-[#D4AF37] text-[#0E2A1B] flex items-center justify-center shadow-[0_0_30px_rgba(212,175,55,0.6)]">
                <Play className="w-7 h-7 fill-current ml-0.5 text-[#0E2A1B]" />
              </div>
            </div>
          )}

          {/* Sleek Bottom Control Bar */}
          <div 
            onClick={(e) => e.stopPropagation()}
            className={`absolute inset-x-0 bottom-0 p-3 sm:p-4 bg-gradient-to-t from-black/90 via-black/50 to-transparent transition-opacity duration-300 ${
              showControls || !isPlaying ? 'opacity-100' : 'opacity-0 pointer-events-none'
            }`}
          >
            {/* Seek Bar */}
            <input
              type="range"
              min={0}
              max={duration || 100}
              value={currentTime}
              onChange={handleSeek}
              className="w-full h-1 sm:h-1.5 bg-white/25 rounded-lg appearance-none cursor-pointer accent-[#D4AF37] mb-2 focus:outline-none"
            />

            <div className="flex items-center justify-between text-xs text-white">
              <div className="flex items-center gap-3">
                <button 
                  onClick={togglePlay}
                  className="p-1 rounded hover:bg-white/15 text-white hover:text-[#D4AF37] transition-colors cursor-pointer"
                >
                  {isPlaying ? <Pause className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 fill-current" />}
                </button>

                <button 
                  onClick={toggleMute}
                  className="p-1 rounded hover:bg-white/15 text-white hover:text-[#D4AF37] transition-colors cursor-pointer"
                >
                  {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                </button>

                <span className="text-[11px] font-mono text-stone-300">
                  {formatTime(currentTime)} / {formatTime(duration)}
                </span>
              </div>

              <button 
                onClick={toggleFullscreen}
                className="p-1 rounded hover:bg-white/15 text-white hover:text-[#D4AF37] transition-colors cursor-pointer"
                title="Fullscreen"
              >
                <Maximize2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Compact Footer Description & Action */}
        <div className="relative z-10 px-4 sm:px-6 py-3.5 sm:py-4 bg-[#081B11] border-t border-[#D4AF37]/20 flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left">
          <p className="text-xs text-[#D2DFD6] max-w-md font-normal leading-relaxed">
            Handpicked in Mithila’s freshwater ponds, naturally sun-dried, and slow-roasted for the perfect healthy crunch.
          </p>

          <div className="flex items-center gap-2 shrink-0">
            <Link
              to="/shop"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-[#D4AF37] hover:bg-[#E5C358] text-[#0E2A1B] font-extrabold text-[11px] uppercase tracking-wider transition-all flex items-center gap-1.5 shadow-sm"
            >
              <span>Shop Now</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>

            <Link
              to="/about"
              onClick={onClose}
              className="px-3 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-[#D4AF37]/30 text-stone-300 hover:text-white font-semibold text-[11px] uppercase tracking-wider transition-all"
            >
              <span>Our Story</span>
            </Link>
          </div>
        </div>

      </div>
    </div>
  );
}
