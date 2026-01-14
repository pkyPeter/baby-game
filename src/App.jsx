import React, { useState, useEffect, useRef } from 'react';
import { CheckCircle2, ChevronRight, Baby, Heart, ChevronUp, ChevronDown, HelpCircle } from 'lucide-react';

// 遊戲配置
const CONFIG = {
  ITEM_SPEED: 3,        // 物品移動速度
  DECO_SPEED: 2.5,      // 裝飾物移動速度
  ROAD_COLOR: '#CBD5E1',// 道路顏色
  CAR_EMOJI: '🚗',      // 車子圖標
  LANES: [0.3, 0.5, 0.7], // 三個賽道的高度比例
  TARGET_ITEMS: [
    { id: 'bottle', emoji: '🍼', label: '奶瓶', time: 3000 },
    { id: 'socks', emoji: '🧦', label: '小襪子', time: 10000 },
    { id: 'pacifier', emoji: '🧸', label: '小奶嘴', time: 17000 },
  ],
  // 增加路上會出現的裝飾/干擾物品
  DECO_EMOJIS: ['🌳', '🍦', '🎈', '🍭', '⭐', '🌻', '🐶', '🐱', '☁️', '🍄', '🍎']
};

const App = () => {
  const [stage, setStage] = useState('START'); // START, PLAYING, REVEAL
  const [collected, setCollected] = useState({ bottle: false, socks: false, pacifier: false });
  const [revealStep, setRevealStep] = useState(0); 
  
  const startGame = () => {
    setStage('PLAYING');
    setCollected({ bottle: false, socks: false, pacifier: false });
    setRevealStep(0);
  };

  const handleAllCollected = () => {
    setStage('REVEAL');
    setTimeout(() => setRevealStep(1), 1200);
    setTimeout(() => setRevealStep(2), 3200);
    setTimeout(() => setRevealStep(3), 5200);
  };

  return (
    <div className="min-h-screen bg-[#FDF6E3] font-sans text-slate-800 overflow-hidden flex flex-col items-center justify-center p-4 relative">
      {stage === 'START' && <TitleScreen onStart={startGame} />}
      
      {stage === 'PLAYING' && (
        <GamePlay 
          collected={collected} 
          setCollected={setCollected} 
          onComplete={handleAllCollected} 
        />
      )}
      
      {stage === 'REVEAL' && (
        <RevealScreen revealStep={revealStep} collected={collected} />
      )}
      
      {/* 裝飾背景 */}
      <div className="absolute top-10 left-10 animate-pulse opacity-40 select-none text-4xl">☁️</div>
      <div className="absolute top-40 right-20 animate-bounce opacity-30 select-none text-4xl" style={{ animationDuration: '4s' }}>☁️</div>
    </div>
  );
};

// --- 開始畫面 ---
const TitleScreen = ({ onStart }) => (
  <div className="text-center z-10 p-6 animate-in fade-in zoom-in duration-700 max-w-sm">
    <div className="text-7xl mb-8 transform scale-x-[-1] inline-block">🚗</div>
    <h1 className="text-3xl font-bold text-slate-700 mb-4 tracking-tight">準備好出發了嗎？</h1>
    <p className="text-slate-500 mb-10 font-medium leading-relaxed">路上會出現神祕的東西，<br/>試著把它們都收集齊全吧！</p>
    <button 
      onClick={onStart}
      className="bg-sky-500 hover:bg-sky-600 text-white px-12 py-4 rounded-full text-xl font-bold shadow-xl shadow-sky-100 transition-all transform hover:scale-105 active:scale-95 flex items-center gap-2 mx-auto"
    >
      出發！ <ChevronRight size={24} />
    </button>
  </div>
);

// --- 遊戲邏輯與畫布 ---
const GamePlay = ({ collected, setCollected, onComplete }) => {
  const containerRef = useRef(null);
  const canvasRef = useRef(null);
  const requestRef = useRef();
  const startTimeRef = useRef(Date.now());
  
  const targets = useRef(CONFIG.TARGET_ITEMS.map(item => ({ 
    ...item, 
    x: 0, 
    lane: Math.floor(Math.random() * 3), 
    spawned: false, 
    hit: false 
  })));

  const decos = useRef([]);
  const lastDecoSpawn = useRef(0);

  const [lane, setLane] = useState(1);
  const laneRef = useRef(1);
  const carYPos = useRef(0.5);

  useEffect(() => {
    laneRef.current = lane;
  }, [lane]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    
    const updateCanvasSize = () => {
      if (!containerRef.current) return;
      const dpr = window.devicePixelRatio || 1;
      const rect = containerRef.current.getBoundingClientRect();
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      ctx.scale(dpr, dpr);
    };

    const resizeObserver = new ResizeObserver(() => updateCanvasSize());
    if (containerRef.current) resizeObserver.observe(containerRef.current);
    updateCanvasSize();

    const draw = () => {
      if (!canvasRef.current || !containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const { width, height } = rect;
      const elapsed = Date.now() - startTimeRef.current;

      ctx.clearRect(0, 0, width, height);

      ctx.fillStyle = CONFIG.ROAD_COLOR;
      ctx.fillRect(0, height * 0.2, width, height * 0.6);

      ctx.strokeStyle = '#FFFFFF';
      ctx.lineWidth = height * 0.01;
      ctx.setLineDash([width * 0.05, width * 0.08]);
      ctx.lineDashOffset = (elapsed / 10);
      
      [0.4, 0.6].forEach(p => {
        ctx.beginPath();
        ctx.moveTo(0, height * p);
        ctx.lineTo(width, height * p);
        ctx.stroke();
      });

      const targetY = CONFIG.LANES[laneRef.current];
      carYPos.current += (targetY - carYPos.current) * 0.15;
      
      const carX = width * 0.2;
      const carY = height * carYPos.current;
      const carSize = height * 0.15;

      ctx.save();
      ctx.translate(carX, carY);
      ctx.scale(-1, 1);
      ctx.font = `${carSize}px serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      const vibration = Math.sin(elapsed / 60) * (height * 0.005);
      ctx.fillText(CONFIG.CAR_EMOJI, vibration, 0);
      ctx.restore();

      if (elapsed - lastDecoSpawn.current > 1000) {
        decos.current.push({
          x: width + 100,
          lane: Math.floor(Math.random() * 3),
          emoji: CONFIG.DECO_EMOJIS[Math.floor(Math.random() * CONFIG.DECO_EMOJIS.length)],
          id: Date.now()
        });
        lastDecoSpawn.current = elapsed;
      }

      for (let i = decos.current.length - 1; i >= 0; i--) {
        const deco = decos.current[i];
        deco.x -= (width / 400) * CONFIG.DECO_SPEED;
        const decoY = height * CONFIG.LANES[deco.lane];
        
        ctx.font = `${carSize * 0.5}px serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(deco.emoji, deco.x, decoY);

        const dxDeco = Math.abs(deco.x - carX);
        const dyDeco = Math.abs(decoY - carY);
        if (dxDeco < carSize * 0.6 && dyDeco < carSize * 0.4) {
          decos.current.splice(i, 1);
          continue;
        }

        if (deco.x < -100) decos.current.splice(i, 1);
      }

      targets.current.forEach(item => {
        if (!item.spawned && elapsed >= item.time) {
          item.spawned = true;
          item.x = width + (carSize * 2);
        }

        if (item.spawned && !item.hit) {
          item.x -= (width / 400) * CONFIG.ITEM_SPEED;
          const itemY = height * CONFIG.LANES[item.lane];

          ctx.font = `${carSize * 0.8}px serif`;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(item.emoji, item.x, itemY);

          const dx = Math.abs(item.x - carX);
          const dy = Math.abs(itemY - carY);
          if (dx < carSize * 0.7 && dy < carSize * 0.5) {
            item.hit = true;
            setCollected(prev => ({ ...prev, [item.id]: true }));
          }
        }
      });

      const allDone = targets.current.every(i => i.hit);
      if (allDone && elapsed > CONFIG.TARGET_ITEMS[2].time + 1000) {
        onComplete();
        return;
      }

      requestRef.current = requestAnimationFrame(draw);
    };

    requestRef.current = requestAnimationFrame(draw);
    
    const handleKeyDown = (e) => {
      if (e.key === 'ArrowUp') setLane(l => Math.max(0, l - 1));
      if (e.key === 'ArrowDown') setLane(l => Math.min(2, l + 1));
    };
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      cancelAnimationFrame(requestRef.current);
      window.removeEventListener('keydown', handleKeyDown);
      resizeObserver.disconnect();
    };
  }, [onComplete, setCollected]);

  return (
    <div className="relative w-full max-w-4xl aspect-video bg-white shadow-2xl flex flex-col overflow-hidden rounded-2xl border-8 border-white" ref={containerRef}>
      <div className="absolute top-4 left-0 right-0 flex justify-center gap-6 z-20">
        {CONFIG.TARGET_ITEMS.map(item => (
          <div key={item.id} className="flex items-center gap-2 bg-white/95 backdrop-blur-md px-5 py-2 rounded-full shadow-lg border border-slate-50 transition-all">
            <div className={`w-8 h-8 flex items-center justify-center transition-all duration-500 ${collected[item.id] ? 'scale-125' : 'scale-100'}`}>
              {collected[item.id] ? (
                <span className="text-2xl">{item.emoji}</span>
              ) : (
                <HelpCircle className="text-slate-300 animate-pulse" size={24} />
              )}
            </div>
            {collected[item.id] && <CheckCircle2 className="text-emerald-500" size={18} />}
          </div>
        ))}
      </div>

      <canvas ref={canvasRef} className="w-full h-full block" />
      
      <div className="absolute top-0 bottom-0 right-8 flex flex-col justify-center gap-12 z-30 pointer-events-none">
        <button 
          onPointerDown={() => setLane(l => Math.max(0, l - 1))}
          className="w-20 h-20 rounded-full bg-sky-500/80 backdrop-blur-sm border-4 border-white flex items-center justify-center text-white pointer-events-auto active:bg-sky-600 active:scale-90 transition-all shadow-xl"
        >
          <ChevronUp size={48} strokeWidth={3} />
        </button>
        <button 
          onPointerDown={() => setLane(l => Math.min(2, l + 1))}
          className="w-20 h-20 rounded-full bg-sky-500/80 backdrop-blur-sm border-4 border-white flex items-center justify-center text-white pointer-events-auto active:bg-sky-600 active:scale-90 transition-all shadow-xl"
        >
          <ChevronDown size={48} strokeWidth={3} />
        </button>
      </div>

      <div className="absolute bottom-6 left-8 bg-black/10 backdrop-blur-sm px-4 py-1 rounded-full text-white text-[10px] font-bold tracking-widest uppercase opacity-80">
        Mystery Collecting...
      </div>
    </div>
  );
};

// --- 揭曉畫面 (調整為更小的文字與縮放) ---
const RevealScreen = ({ revealStep }) => (
  <div className="z-30 text-center p-6 max-w-md w-full animate-in fade-in duration-1000 scale-100">
    {/* Emoji 行：縮小尺寸 */}
    <div className="flex justify-center gap-6 mb-8">
      {CONFIG.TARGET_ITEMS.map((item, idx) => (
        <div 
          key={item.id}
          className="text-4xl transform transition-all duration-1000"
          style={{ 
            opacity: revealStep >= 1 ? 1 : 0,
            transform: revealStep >= 1 ? 'translateY(0)' : 'translateY(20px)',
            transitionDelay: `${idx * 200}ms`
          }}
        >
          {item.emoji}
        </div>
      ))}
    </div>

    <div className="space-y-6">
      <h2 
        className="text-xl font-semibold text-slate-500 transition-all duration-1000"
        style={{ opacity: revealStep >= 1 ? 1 : 0 }}
      >
        這些神祕物品原來代表著...
      </h2>

      {/* 公布卡片：縮小內邊距與文字大小 */}
      <div 
        className="bg-white/95 p-8 rounded-[40px] shadow-2xl shadow-rose-100 border border-rose-50 transition-all duration-1000"
        style={{ 
          opacity: revealStep >= 2 ? 1 : 0,
          transform: revealStep >= 2 ? 'scale(1) rotate(0deg)' : 'scale(0.9) rotate(-1deg)'
        }}
      >
        <div className="text-rose-400 mb-4 flex justify-center animate-bounce">
          <Baby size={48} strokeWidth={1.5} />
        </div>
        <h1 className="text-2xl font-bold text-slate-800 mb-2 leading-snug tracking-tight">
          我們家要加入<br />新的小隊員了 ❤️
        </h1>
        <div className="h-px w-12 bg-rose-100 mx-auto my-4" />
        <p className="text-rose-400 font-black text-xl tracking-[0.2em] mt-2">
          COMING 2026
        </p>
      </div>

      <p 
        className="text-slate-400 text-base font-medium transition-all duration-1000 italic"
        style={{ opacity: revealStep >= 3 ? 1 : 0 }}
      >
        「謝謝你陪我們一起走到這裡」
      </p>
      
      {revealStep >= 3 && (
         <button 
           onClick={() => window.location.reload()}
           className="mt-6 text-slate-300 hover:text-sky-500 underline text-xs transition-colors"
         >
           再玩一次
         </button>
      )}
    </div>
    
    {revealStep >= 2 && (
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        {[...Array(15)].map((_, i) => (
          <div 
            key={i}
            className="absolute text-rose-100 animate-bounce"
            style={{
              top: `${Math.random() * 100}%`,
              left: `${Math.random() * 100}%`,
              animationDuration: `${3 + Math.random() * 3}s`,
              opacity: 0.5
            }}
          >
            <Heart size={12 + Math.random() * 20} fill="currentColor" />
          </div>
        ))}
      </div>
    )}
  </div>
);

export default App;