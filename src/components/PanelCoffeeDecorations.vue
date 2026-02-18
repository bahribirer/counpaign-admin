<template>
  <div class="panel-decos">

    <!-- Top-right: 3D spinning cup -->
    <div class="deco-cup cup-topright">
      <div class="cup-3d">
        <svg viewBox="0 0 60 80" xmlns="http://www.w3.org/2000/svg">
          <path d="M10 15 L14 65 Q14 70 22 70 L38 70 Q46 70 46 65 L50 15 Z" 
                fill="#FFFFFF" stroke="#8D6E63" stroke-width="2"/>
          <path d="M46 25 Q55 25 55 37 Q55 49 46 49" fill="none" stroke="#8D6E63" stroke-width="2.5" stroke-linecap="round"/>
          <clipPath id="pc1"><path d="M12 16 L15 64 Q15 68 22 68 L38 68 Q45 68 45 64 L48 16 Z"/></clipPath>
          <g clip-path="url(#pc1)">
            <rect class="p-liquid" x="10" y="68" width="40" height="55" fill="url(#pcGrad)"/>
          </g>
          <ellipse cx="30" cy="16" rx="20" ry="4" fill="none" stroke="#8D6E63" stroke-width="1.5"/>
          <g class="p-steam">
            <path d="M22 12 C20 5 24 0 22 -6" class="ps ps1"/>
            <path d="M30 10 C28 3 32 -2 30 -8" class="ps ps2"/>
            <path d="M38 12 C36 5 40 0 38 -6" class="ps ps3"/>
          </g>
          <defs>
            <linearGradient id="pcGrad" x1="0" x2="0" y1="0" y2="1">
              <stop offset="0%" stop-color="#A1887F"/>
              <stop offset="100%" stop-color="#4E342E"/>
            </linearGradient>
          </defs>
        </svg>
      </div>
    </div>

    <!-- Bottom-left: latte with saucer -->
    <div class="deco-cup cup-bottomleft">
      <div class="cup-3d cup-3d-slow">
        <svg viewBox="0 0 65 55" xmlns="http://www.w3.org/2000/svg">
          <ellipse cx="28" cy="48" rx="28" ry="5" fill="#F5F0EB" stroke="#D7CCC8" stroke-width="1"/>
          <path d="M6 14 L10 44 Q10 47 18 47 L38 47 Q46 47 46 44 L50 14 Z" 
                fill="#FFFFFF" stroke="#8D6E63" stroke-width="2"/>
          <path d="M50 22 Q60 22 60 32 Q60 42 50 42" fill="none" stroke="#8D6E63" stroke-width="2" stroke-linecap="round"/>
          <clipPath id="pc2"><path d="M8 15 L11 43 Q11 45 18 45 L38 45 Q45 45 45 43 L48 15 Z"/></clipPath>
          <g clip-path="url(#pc2)">
            <rect class="p-liquid p-liquid-2" x="6" y="46" width="44" height="35" fill="url(#pcLatte)"/>
            <ellipse class="latte-art" cx="28" cy="22" rx="16" ry="3" fill="rgba(255,248,225,0.6)"/>
          </g>
          <g class="p-steam">
            <path d="M20 10 C18 4 22 0 20 -5" class="ps ps4"/>
            <path d="M36 10 C34 4 38 0 36 -5" class="ps ps5"/>
          </g>
          <defs>
            <linearGradient id="pcLatte" x1="0" x2="0" y1="0" y2="1">
              <stop offset="0%" stop-color="#EFEBE9"/>
              <stop offset="100%" stop-color="#8D6E63"/>
            </linearGradient>
          </defs>
        </svg>
      </div>
    </div>

    <!-- Top-left: floating bean cluster -->
    <div class="deco-beans beans-topleft">
      <svg class="d-bean b1" viewBox="0 0 24 16"><ellipse cx="12" cy="8" rx="11" ry="7" fill="#6D4C41"/><path d="M12 1 Q9 8 12 15" fill="none" stroke="#4E342E" stroke-width="1.2"/></svg>
      <svg class="d-bean b2" viewBox="0 0 24 16"><ellipse cx="12" cy="8" rx="11" ry="7" fill="#795548"/><path d="M12 1 Q15 8 12 15" fill="none" stroke="#5D4037" stroke-width="1.2"/></svg>
      <svg class="d-bean b3" viewBox="0 0 24 16"><ellipse cx="12" cy="8" rx="11" ry="7" fill="#8D6E63"/><path d="M12 1 Q9 8 12 15" fill="none" stroke="#6D4C41" stroke-width="1.2"/></svg>
    </div>

    <!-- Bottom-right: small takeaway cup -->
    <div class="deco-cup cup-bottomright">
      <div class="cup-3d cup-3d-reverse">
        <svg viewBox="0 0 45 70" xmlns="http://www.w3.org/2000/svg">
          <path d="M8 18 L12 58 Q12 62 18 62 L27 62 Q33 62 33 58 L37 18 Z" 
                fill="#FFF8E1" stroke="#A1887F" stroke-width="1.5"/>
          <rect x="5" y="12" width="35" height="8" rx="3" fill="#1b4d3e"/>
          <path d="M25 12 L27 6 Q33 3 35 6 L37 12" fill="#1b4d3e"/>
          <path d="M13 32 L32 32" stroke="#D7CCC8" stroke-width="0.8" stroke-dasharray="2 2"/>
          <path d="M12 45 L33 45" stroke="#D7CCC8" stroke-width="0.8" stroke-dasharray="2 2"/>
          <clipPath id="pc3"><path d="M9 19 L13 57 Q13 60 18 60 L27 60 Q32 60 32 57 L36 19 Z"/></clipPath>
          <g clip-path="url(#pc3)">
            <rect class="p-liquid p-liquid-3" x="7" y="60" width="30" height="45" fill="url(#pcMocha)"/>
          </g>
          <circle cx="22" cy="42" r="6" fill="none" stroke="rgba(255,255,255,0.4)" stroke-width="1"/>
          <g class="p-steam p-steam-sm">
            <path d="M19 10 C17 5 21 1 19 -4" class="ps ps6"/>
            <path d="M28 10 C26 5 30 1 28 -4" class="ps ps7"/>
          </g>
          <defs>
            <linearGradient id="pcMocha" x1="0" x2="0" y1="0" y2="1">
              <stop offset="0%" stop-color="#D7CCC8"/>
              <stop offset="50%" stop-color="#A1887F"/>
              <stop offset="100%" stop-color="#5D4037"/>
            </linearGradient>
          </defs>
        </svg>
      </div>
    </div>

    <!-- Gold sparkle particles -->
    <div class="p-sparkle ps1-k" style="top:12%;right:18%">✦</div>
    <div class="p-sparkle ps2-k" style="bottom:25%;left:5%">✧</div>
    <div class="p-sparkle ps3-k" style="top:50%;right:6%">✦</div>
    <div class="p-sparkle ps4-k" style="bottom:10%;right:30%">✧</div>
  </div>
</template>

<style scoped>
.panel-decos {
  position: fixed;
  inset: 0;
  pointer-events: none;
  z-index: 0;
  overflow: hidden;
}

/* ===== CUP POSITIONS ===== */
.deco-cup {
  position: absolute;
  opacity: 0.1;
}

.cup-topright {
  top: 80px;
  right: 30px;
  width: 55px;
  animation: gentleFloat 6s ease-in-out infinite;
}

.cup-bottomleft {
  bottom: 40px;
  left: 30px;
  width: 60px;
  animation: gentleFloat 7s ease-in-out infinite 2s;
}

.cup-bottomright {
  bottom: 60px;
  right: 50px;
  width: 42px;
  animation: gentleFloat 8s ease-in-out infinite 1s;
}

@keyframes gentleFloat {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-10px); }
}

/* ===== 3D SPIN ===== */
.cup-3d {
  animation: spin3D 12s linear infinite;
  transform-style: preserve-3d;
}

.cup-3d-slow {
  animation: spin3D 18s linear infinite reverse;
}

.cup-3d-reverse {
  animation: spin3D 15s linear infinite;
}

@keyframes spin3D {
  0% { transform: perspective(400px) rotateY(0deg); }
  100% { transform: perspective(400px) rotateY(360deg); }
}

/* ===== LIQUID FILL ===== */
.p-liquid {
  animation: pFill 5s ease-in-out infinite;
}
.p-liquid-2 { animation-delay: 1.5s; }
.p-liquid-3 { animation-delay: 3s; }

@keyframes pFill {
  0%   { y: 70; height: 0; }
  35%  { y: 16; height: 55; }
  65%  { y: 16; height: 55; }
  100% { y: 70; height: 0; }
}

/* ===== STEAM ===== */
.ps {
  fill: none;
  stroke: #D7CCC8;
  stroke-width: 1.8;
  stroke-linecap: round;
  opacity: 0;
  animation: pSteam 3s ease-out infinite;
}
.ps1 { animation-delay: 0s; }
.ps2 { animation-delay: 0.6s; }
.ps3 { animation-delay: 1.2s; }
.ps4 { animation-delay: 0.3s; }
.ps5 { animation-delay: 0.9s; }
.ps6 { animation-delay: 0.2s; }
.ps7 { animation-delay: 0.8s; }

@keyframes pSteam {
  0%   { opacity: 0; transform: translateY(0); }
  25%  { opacity: 0.4; }
  100% { opacity: 0; transform: translateY(-18px) scaleX(1.4); }
}

/* Latte art */
.latte-art {
  animation: artPulse 4s ease-in-out infinite;
}
@keyframes artPulse {
  0%, 100% { rx: 16; opacity: 0.4; }
  50% { rx: 13; opacity: 0.7; }
}

/* ===== FLOATING BEANS ===== */
.deco-beans {
  position: absolute;
}

.beans-topleft {
  top: 100px;
  left: 40px;
}

.d-bean {
  position: absolute;
  opacity: 0;
  animation: dBeanOrbit 10s ease-in-out infinite;
}

.b1 { width: 20px; top: 0; left: 0; animation-delay: 0s; }
.b2 { width: 15px; top: 20px; left: 25px; animation-delay: 3s; }
.b3 { width: 17px; top: -10px; left: 40px; animation-delay: 6s; }

@keyframes dBeanOrbit {
  0%   { opacity: 0; transform: translateY(0) rotate(0deg) scale(0.8); }
  15%  { opacity: 0.1; }
  50%  { opacity: 0.13; transform: translateY(-25px) rotate(180deg) scale(1.1); }
  85%  { opacity: 0.08; }
  100% { opacity: 0; transform: translateY(0) rotate(360deg) scale(0.8); }
}

/* ===== SPARKLES ===== */
.p-sparkle {
  position: absolute;
  font-size: 0.65rem;
  color: #DAA520;
  opacity: 0;
  animation: pTwinkle 5s ease-in-out infinite;
}

.ps1-k { animation-delay: 0s; }
.ps2-k { animation-delay: 1.5s; }
.ps3-k { animation-delay: 3s; }
.ps4-k { animation-delay: 4s; }

@keyframes pTwinkle {
  0%, 100% { opacity: 0; transform: scale(0.5) rotate(0deg); }
  50% { opacity: 0.25; transform: scale(1.3) rotate(180deg); }
}
</style>
