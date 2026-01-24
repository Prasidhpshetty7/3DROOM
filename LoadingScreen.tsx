import React, { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";

interface LoadingScreenProps {
  onComplete: () => void;
}

const LoadingScreen: React.FC<LoadingScreenProps> = ({ onComplete }) => {
  const [progress, setProgress] = useState(0);
  const [showText, setShowText] = useState(false);
  const [loadingComplete, setLoadingComplete] = useState(false);
  const [statusText, setStatusText] = useState("");

  const statusMessages = [
    "Initializing 3D environment...",
    "Loading room model: COMPLETE",
    "Preparing book geometry: DONE",
    "Generating page textures: IN PROGRESS",
    "Optimizing lighting setup...",
    "Calibrating camera positions: OK",
    "Loading portfolio content: 45%",
    "Preparing interactive elements...",
    "Setting up page animations: COMPLETE",
    "Rendering high-quality textures...",
    "Optimizing display settings: DONE",
    "Finalizing 3D scene setup..."
  ];

  useEffect(() => {
    // Show text after initial delay
    const textTimer = setTimeout(() => {
      setShowText(true);
    }, 500);

    // Cycle through status messages
    let messageIndex = 0;
    setStatusText(statusMessages[0]);
    
    const statusTimer = setInterval(() => {
      messageIndex = (messageIndex + 1) % statusMessages.length;
      setStatusText(statusMessages[messageIndex]);
    }, 800);

    // Animate progress bar over 7 seconds (7000ms)
    const duration = 7000;
    const interval = 50;
    const increment = (100 / duration) * interval;

    const progressTimer = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(progressTimer);
          clearInterval(statusTimer);
          setStatusText("System ready. Welcome to THE ROOM.");
          setTimeout(() => setLoadingComplete(true), 500);
          return 100;
        }
        return prev + increment;
      });
    }, interval);

    return () => {
      clearTimeout(textTimer);
      clearInterval(progressTimer);
      clearInterval(statusTimer);
    };
  }, []);

  return (
    <div 
      className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-cover bg-center"
      style={{
        backgroundImage: 'url("/Header-background.webp")',
        backgroundPosition: 'center 30%'
      }}
    >
      {/* Full Screen Liquid Glass Morphism Overlay */}
      <div className="absolute inset-0 backdrop-blur-xl bg-gradient-to-br from-white/15 via-white/8 to-white/5"></div>
      <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-white/20"></div>
      <div className="absolute inset-0 bg-gradient-to-br from-orange-500/10 via-transparent to-purple-500/5"></div>
      
      {/* Enhanced Floating glass panels across entire screen */}
      <div className="absolute top-10 left-10 w-40 h-40 bg-white/8 backdrop-blur-2xl rounded-[2rem] rotate-12 animate-pulse border border-white/10"></div>
      <div className="absolute bottom-20 right-20 w-32 h-32 bg-white/5 backdrop-blur-2xl rounded-[1.5rem] -rotate-12 animate-pulse delay-500 border border-white/5"></div>
      <div className="absolute top-1/4 right-1/4 w-24 h-24 bg-white/12 backdrop-blur-2xl rounded-xl rotate-45 animate-pulse delay-1000 border border-white/15"></div>
      <div className="absolute bottom-1/3 left-1/5 w-20 h-20 bg-white/6 backdrop-blur-xl rounded-2xl -rotate-6 animate-pulse delay-1500 border border-white/8"></div>
      <div className="absolute top-1/2 left-10 w-16 h-16 bg-white/10 backdrop-blur-xl rounded-lg rotate-30 animate-pulse delay-700 border border-white/12"></div>
      
      {/* Content Container */}
      <div className="relative z-10 text-center px-8 py-16 max-w-3xl mx-4 min-h-[600px] flex flex-col justify-between">
        
        {/* Main Title at Top */}
        <h1 
          className={`font-display text-6xl md:text-8xl lg:text-9xl font-bold tracking-tight mb-8 transition-all duration-1200 ease-out ${
            showText ? 'opacity-100 scale-100' : 'opacity-0 scale-95'
          } text-black`}
        >
          THE ROOM
        </h1>

        {/* Middle Section */}
        <div className="flex-1 flex flex-col justify-center space-y-8">
          {/* Status Text */}
          <div 
            className={`transition-all duration-1000 ease-out delay-200 ${
              showText ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-8'
            }`}
          >
            <p className="font-mono text-sm text-black/60 tracking-wide uppercase">
              {statusText}
            </p>
          </div>

          {/* Branding */}
          <div className={`transition-all duration-1000 ease-out delay-400 ${showText ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-8'}`}>
            <p className="font-sans text-sm font-medium text-black/70 tracking-widest uppercase mb-2">
              Portfolio by
            </p>
            <h2 className="font-display text-2xl md:text-3xl font-bold text-black tracking-wider">
              romanfromthenorth
            </h2>
          </div>

          {/* Enhanced Progress Bar Container */}
          <div 
            className={`w-full max-w-lg mx-auto transition-all duration-1000 ease-out delay-600 ${
              showText ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
            }`}
          >
            {/* Progress Bar Background */}
            <div className="relative h-4 bg-black/10 overflow-hidden backdrop-blur-sm border border-white/20">
              {/* Progress Bar Fill */}
              <div 
                className="absolute top-0 left-0 h-full transition-all duration-100 ease-out"
                style={{
                  width: `${Math.min(progress, 100)}%`,
                  background: 'linear-gradient(90deg, rgba(249,115,22,0.9) 0%, rgba(234,88,12,1) 50%, rgba(249,115,22,1) 100%)',
                  boxShadow: '0 0 25px rgba(249,115,22,0.5), inset 0 2px 0 rgba(255,255,255,0.3)'
                }}
              />
              
              {/* Animated shine effect */}
              <div 
                className="absolute top-0 left-0 h-full w-12 bg-gradient-to-r from-transparent via-white/50 to-transparent"
                style={{
                  transform: `translateX(${(Math.min(progress, 100) / 100) * 100 - 30}%)`,
                  transition: 'transform 0.3s ease-out'
                }}
              />
            </div>
            
            {/* Progress Text */}
            <div className="mt-4 text-black/70 font-mono text-lg font-medium">
              {Math.round(Math.min(progress, 100))}%
            </div>
          </div>
        </div>

        {/* Bottom Section */}
        <div className="space-y-6">
          {/* Subtitle */}
          <p 
            className={`font-display text-2xl md:text-3xl font-light text-black/80 transition-all duration-1000 ease-out delay-800 ${
              showText ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
            }`}
          >
            2025
          </p>

          <p 
            className={`font-sans text-base text-black/60 transition-all duration-1000 ease-out delay-900 ${
              showText ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
            }`}
          >
            A 3D Portfolio Experience
          </p>

          {/* Start Button with fixed positioning */}
          <div className="h-20 flex items-center justify-center">
            {loadingComplete && (
              <Button 
                onClick={onComplete}
                className="bg-black hover:bg-black/90 text-white px-16 py-5 text-xl font-medium tracking-wider transition-all duration-500 hover:scale-110 backdrop-blur-sm animate-[scale-in_0.5s_ease-out] shadow-2xl"
              >
                START
              </Button>
            )}
          </div>
        </div>
      </div>
      
      {/* Additional floating elements */}
      <div className="absolute top-1/5 left-1/5 w-3 h-3 bg-black/20 rounded-full animate-pulse"></div>
      <div className="absolute bottom-1/4 left-1/3 w-2 h-2 bg-black/15 rounded-full animate-pulse delay-300"></div>
      <div className="absolute top-3/4 right-1/4 w-4 h-4 bg-black/25 rounded-full animate-pulse delay-700"></div>
      <div className="absolute top-1/6 right-1/6 w-1 h-1 bg-black/30 rounded-full animate-pulse delay-1200"></div>
    </div>
  );
};

export default LoadingScreen;