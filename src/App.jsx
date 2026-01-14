import React, { useState, useEffect, useRef } from 'react';
import { CheckCircle2, ChevronRight, Baby, Heart, ChevronUp, ChevronDown, HelpCircle } from 'lucide-react';

// 遊戲配置
const CONFIG = {
  ITEM_SPEED: 1.5,      // 物品移動速度
  DECO_SPEED: 1.2,      // 裝飾物移動速度
  ROAD_COLOR: '#CBD5E1',// 道路顏色
  CAR_EMOJI: '🚗',      // 車子圖標
  LANES: [0.3, 0.5, 0.7], // 三個賽道的高度比例
  TARGET_ITEMS: [
    { id: 'pacifier', emoji: '🧸', label: '小奶嘴', time: 3000 },
    { id: 'socks', emoji: '🧦', label: '小襪子', time: 10000 },
    {  id: 'bottle', emoji: '🍼', label: '奶瓶', time: 17000 },
  ],
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
    // 加快揭曉節奏
    setTimeout(() => setRevealStep(1), 600);
    setTimeout(() => setRevealStep(2), 1200);
    setTimeout(() => setRevealStep(3), 2500); // 增加最後一小步顯示感謝語
  };

  return (
    <div className="fixed inset-0 bg-[#FDF6E3] font-sans text-slate-800 overflow-hidden flex flex-col items-center justify-center p-2 sm:p-4">
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
      
      <div className="absolute top-4 left-10 animate-pulse opacity-20 select-none text-2xl sm:text-4xl">☁️</div>
      <div className="absolute bottom-10 right-10 animate-bounce opacity-10 select-none text-2xl sm:text-4xl" style={{ animationDuration: '5s' }}>☁️</div>
    </div>
  );
};

const TitleScreen = ({ onStart }) => (
  <div className="text-center z-10 p-4 animate-in fade-in zoom-in duration-700 max-w-lg">
    <div className="text-6xl sm:text-7xl mb-4 sm:mb-6 transform scale-x-[-1] inline-block drop-shadow-sm">🚗</div>
    <h1 className="text-2xl sm:text-3xl font-bold text-slate-700 mb-2 tracking-tight">準備好出發了嗎？</h1>
    <p className="text-sm sm:text-base text-slate-500 mb-6 sm:mb-8 font-medium leading-relaxed">
      建議旋轉手機至 <span className="text-sky-500 font-bold">橫向模式</span><br/>
      <strong className='font-bold text-red-600'>收集</strong>路上神祕的東西！
    </p>
    <button 
      onClick={onStart}
      className="bg-sky-500 hover:bg-sky-600 text-white px-8 py-3 sm:px-12 sm:py-4 rounded-full text-lg sm:text-xl font-bold shadow-xl shadow-sky-100 transition-all transform hover:scale-105 active:scale-95 flex items-center gap-2 mx-auto"
    >
      出發！ <ChevronRight size={20} />
    </button>
  </div>
);

const GamePlay = ({ collected, setCollected, onComplete }) => {
  const containerRef = useRef(null);
  const canvasRef = useRef(null);
  const requestRef = useRef();
  const startTimeRef = useRef(Date.now());
  
  // 初始化目標物品
  const targets = useRef(CONFIG.TARGET_ITEMS.map(item => ({ 
    ...item, 
    x: 0, 
    lane: Math.floor(Math.random() * 3), 
    spawned: false, 
    hit: false,
    baseTime: item.time // 記錄原始預定時間
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
      ctx.setLineDash([width * 0.06, width * 0.06]);
      ctx.lineDashOffset = (elapsed / 10);
      
      [0.4, 0.6].forEach(p => {
        ctx.beginPath();
        ctx.moveTo(0, height * p);
        ctx.lineTo(width, height * p);
        ctx.stroke();
      });

      const targetY = CONFIG.LANES[laneRef.current];
      carYPos.current += (targetY - carYPos.current) * 0.15;
      
      const carX = width * 0.15;
      const carY = height * carYPos.current;
      const carSize = height * 0.16;

      ctx.save();
      ctx.translate(carX, carY);
      ctx.scale(-1, 1);
      ctx.font = `${carSize}px serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      const vibration = Math.sin(elapsed / 60) * (height * 0.006);
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
        deco.x -= (width / 450) * CONFIG.DECO_SPEED;
        const decoY = height * CONFIG.LANES[deco.lane];
        
        ctx.font = `${carSize * 0.55}px serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(deco.emoji, deco.x, decoY);

        const dxDeco = Math.abs(deco.x - carX);
        const dyDeco = Math.abs(decoY - carY);
        if (dxDeco < carSize * 0.65 && dyDeco < carSize * 0.45) {
          decos.current.splice(i, 1);
          continue;
        }
        if (deco.x < -100) decos.current.splice(i, 1);
      }

      // 6. 核心道具邏輯 (含循環機制)
      targets.current.forEach(item => {
        // 如果還沒生成且時間到了，就生成
        if (!item.spawned && !item.hit && elapsed >= item.time) {
          item.spawned = true;
          item.x = width + (carSize * 2);
        }

        if (item.spawned && !item.hit) {
          item.x -= (width / 450) * CONFIG.ITEM_SPEED;
          const itemY = height * CONFIG.LANES[item.lane];

          ctx.font = `${carSize * 0.85}px serif`;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(item.emoji, item.x, itemY);

          // 碰撞偵測
          const dx = Math.abs(item.x - carX);
          const dy = Math.abs(itemY - carY);
          if (dx < carSize * 0.75 && dy < carSize * 0.5) {
            item.hit = true;
            item.spawned = false; // 標記為已消失
            setCollected(prev => ({ ...prev, [item.id]: true }));
          }

          // 重要：如果飛出左側沒吃到，重置它，讓它在 3 秒後再次出現
          if (item.x < -50) {
            item.spawned = false;
            item.time = elapsed + 3000; // 3 秒後重新挑戰
            item.lane = Math.floor(Math.random() * 3); // 下次隨機換道
          }
        }
      });

      const allDone = targets.current.every(i => i.hit);
      if (allDone) {
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
    <div className="relative w-full h-full max-h-[90vh] aspect-video bg-white shadow-2xl flex flex-col overflow-hidden rounded-xl sm:rounded-3xl border-4 sm:border-8 border-white" ref={containerRef}>
      <div className="absolute top-2 sm:top-4 left-0 right-0 flex justify-center gap-3 sm:gap-6 z-20">
        {CONFIG.TARGET_ITEMS.map(item => (
          <div key={item.id} className="flex items-center gap-1 sm:gap-2 bg-white/95 backdrop-blur-md px-3 py-1 sm:px-5 sm:py-2 rounded-full shadow-md border border-slate-50">
            <div className={`w-6 h-6 sm:w-8 sm:h-8 flex items-center justify-center transition-all duration-500 ${collected[item.id] ? 'scale-110' : 'scale-100'}`}>
              {collected[item.id] ? (
                <span className="text-lg sm:text-2xl">{item.emoji}</span>
              ) : (
                <HelpCircle className="text-slate-300 animate-pulse" size={18} />
              )}
            </div>
            {collected[item.id] && <CheckCircle2 className="text-emerald-500" size={14} />}
          </div>
        ))}
      </div>

      <canvas ref={canvasRef} className="w-full h-full block" />
      
      <div className="absolute inset-0 z-30 pointer-events-none">
        <button 
          onPointerDown={() => setLane(l => Math.max(0, l - 1))}
          className="absolute bottom-6 left-6 w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-sky-500/80 backdrop-blur-sm border-2 sm:border-4 border-white flex items-center justify-center text-white pointer-events-auto active:bg-sky-600 active:scale-90 transition-all shadow-xl"
        >
          <ChevronUp size={36} strokeWidth={3} />
        </button>
        <button 
          onPointerDown={() => setLane(l => Math.min(2, l + 1))}
          className="absolute bottom-6 right-6 w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-sky-500/80 backdrop-blur-sm border-2 sm:border-4 border-white flex items-center justify-center text-white pointer-events-auto active:bg-sky-600 active:scale-90 transition-all shadow-xl"
        >
          <ChevronDown size={36} strokeWidth={3} />
        </button>
      </div>

      <div className="absolute bottom-2 left-0 right-0 text-center text-slate-400 text-[8px] font-bold tracking-widest uppercase opacity-40">
        Landscape Mode Optimized
      </div>
    </div>
  );
};

const RevealScreen = ({ revealStep }) => (
  <div className="z-30 text-center p-4 max-w-xl w-full animate-in fade-in duration-1000">
    <div className="flex justify-center gap-6 mb-4 sm:mb-6">
      {CONFIG.TARGET_ITEMS.map((item, idx) => (
        <div 
          key={item.id}
          className="text-3xl sm:text-4xl transform transition-all duration-1000"
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

    <div className="space-y-4">
      <h2 
        className="text-lg sm:text-xl font-semibold text-slate-500 transition-all duration-1000"
        style={{ opacity: revealStep >= 1 ? 1 : 0 }}
      >
        這些神祕物品原來代表著...
      </h2>

      <div 
        className="bg-white/95 px-6 py-5 sm:px-10 sm:py-8 rounded-[30px] sm:rounded-[40px] shadow-2xl shadow-rose-100 border border-rose-50 transition-all duration-1000 mx-auto max-w-xs sm:max-w-md"
        style={{ 
          opacity: revealStep >= 2 ? 1 : 0,
          transform: revealStep >= 2 ? 'scale(1)' : 'scale(0.9)'
        }}
      >
        <div className="text-rose-400 mb-2 flex justify-center animate-bounce">
          <Baby size={40} strokeWidth={1.5} />
        </div>
        <h1 className="text-xl sm:text-2xl font-bold text-slate-800 mb-2 leading-tight tracking-tight">
          我們家要加入<br />新的小隊員了 ❤️
        </h1>
        <div className="h-px w-10 bg-rose-100 mx-auto my-3" />
        <p className="text-rose-400 font-black text-lg sm:text-xl tracking-[0.2em]">
          COMING 2026
        </p>
      </div>

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
            <Heart size={12 + Math.random() * 15} fill="currentColor" />
          </div>
        ))}
      </div>
    )}
  </div>
);

export default App;