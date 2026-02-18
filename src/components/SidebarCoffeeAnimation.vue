<template>
  <div class="sidebar-anim-wrap">

    <!-- ☁️ Floating latte art circles (top area) -->
    <div class="latte-circles">
      <div class="latte-ring ring-1"></div>
      <div class="latte-ring ring-2"></div>
      <div class="latte-ring ring-3"></div>
    </div>

    <!-- 🫘 Floating & spinning coffee beans -->
    <svg class="float-bean fb-1" viewBox="0 0 30 20"><ellipse cx="15" cy="10" rx="13" ry="8" fill="#6D4C41"/><path d="M15 2 Q12 10 15 18" fill="none" stroke="#4E342E" stroke-width="1.5"/></svg>
    <svg class="float-bean fb-2" viewBox="0 0 30 20"><ellipse cx="15" cy="10" rx="13" ry="8" fill="#795548"/><path d="M15 2 Q18 10 15 18" fill="none" stroke="#5D4037" stroke-width="1.5"/></svg>
    <svg class="float-bean fb-3" viewBox="0 0 30 20"><ellipse cx="15" cy="10" rx="13" ry="8" fill="#8D6E63"/><path d="M15 2 Q12 10 15 18" fill="none" stroke="#6D4C41" stroke-width="1.5"/></svg>

    <!-- ☕ Main Starbucks-style cup (center-bottom) -->
    <div class="main-cup">
      <svg viewBox="0 0 80 110" xmlns="http://www.w3.org/2000/svg">
        <!-- Steam curls -->
        <g class="cup-steam">
          <path d="M25 18 C22 10, 28 5, 25 -5 C22 -12, 28 -18, 25 -25" 
                class="steam-curl sc-1"/>
          <path d="M40 15 C37 7, 43 2, 40 -8 C37 -15, 43 -20, 40 -28" 
                class="steam-curl sc-2"/>
          <path d="M55 18 C52 10, 58 5, 55 -5 C52 -12, 58 -18, 55 -25" 
                class="steam-curl sc-3"/>
        </g>

        <!-- Cup sleeve -->
        <path d="M16 45 L18 72 L62 72 L64 45 Z" fill="#8D6E63" rx="2"/>
        <path d="M18 52 L62 52" stroke="#6D4C41" stroke-width="0.8" stroke-dasharray="3 2"/>
        <path d="M17 65 L63 65" stroke="#6D4C41" stroke-width="0.8" stroke-dasharray="3 2"/>

        <!-- Cup body -->
        <path d="M12 22 L18 92 Q18 98 28 98 L52 98 Q62 98 62 92 L68 22 Z" 
              fill="#FFFFFF" stroke="#5D4037" stroke-width="2.5"/>

        <!-- Lid -->
        <rect x="8" y="16" width="64" height="10" rx="4" fill="#1b4d3e"/>
        <path d="M30 16 L32 8 Q40 4 48 8 L50 16" fill="#1b4d3e"/>
        <circle cx="40" cy="7" r="3.5" fill="#155239" stroke="#0d3d2a" stroke-width="1"/>

        <!-- Liquid filling -->
        <clipPath id="mainCup">
          <path d="M14 24 L19 91 Q19 96 28 96 L52 96 Q61 96 61 91 L66 24 Z"/>
        </clipPath>
        <g clip-path="url(#mainCup)">
          <!-- Coffee liquid rises -->
          <rect class="coffee-rise" x="10" width="60" height="80" fill="url(#coffeeFlow)"/>
          <!-- Wave surface -->
          <path class="wave-top" d="M10 40 Q25 35 40 40 Q55 45 70 40 L70 100 L10 100 Z" 
                fill="rgba(93,64,55,0.25)"/>
        </g>

        <!-- Logo on sleeve -->
        <circle cx="40" cy="58" r="8" fill="none" stroke="rgba(255,255,255,0.5)" stroke-width="1.5"/>
        <text x="40" y="62" text-anchor="middle" font-size="9" fill="rgba(255,255,255,0.6)" font-weight="bold" font-family="serif">☆</text>

        <defs>
          <linearGradient id="coffeeFlow" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stop-color="#BCAAA4"/>
            <stop offset="15%" stop-color="#A1887F"/>
            <stop offset="50%" stop-color="#6D4C41"/>
            <stop offset="100%" stop-color="#3E2723"/>
          </linearGradient>
        </defs>
      </svg>
    </div>

    <!-- 🥤 Small takeaway cup (left side) -->
    <div class="side-cup cup-left">
      <svg viewBox="0 0 50 75" xmlns="http://www.w3.org/2000/svg">
        <g class="mini-steam">
          <path d="M18 14 C16 8, 20 4, 18 -2" class="steam-curl sc-4"/>
          <path d="M32 14 C30 8, 34 4, 32 -2" class="steam-curl sc-5"/>
        </g>
        <path d="M10 18 L14 62 Q14 66 20 66 L30 66 Q36 66 36 62 L40 18 Z" 
              fill="#FFF8E1" stroke="#A1887F" stroke-width="1.5"/>
        <rect x="7" y="13" width="36" height="7" rx="3" fill="#DAA520"/>
        <clipPath id="smallCup">
          <path d="M11 19 L15 61 Q15 64 20 64 L30 64 Q35 64 35 61 L39 19 Z"/>
        </clipPath>
        <g clip-path="url(#smallCup)">
          <rect class="coffee-rise-sm" x="8" width="34" height="50" fill="url(#latteSmall)"/>
        </g>
        <defs>
          <linearGradient id="latteSmall" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stop-color="#EFEBE9"/>
            <stop offset="50%" stop-color="#D7CCC8"/>
            <stop offset="100%" stop-color="#A1887F"/>
          </linearGradient>
        </defs>
      </svg>
    </div>

    <!-- ☕ Espresso cup (right side) -->
    <div class="side-cup cup-right">
      <svg viewBox="0 0 55 50" xmlns="http://www.w3.org/2000/svg">
        <g class="mini-steam">
          <path d="M20 10 C18 4, 22 0, 20 -6" class="steam-curl sc-6"/>
        </g>
        <!-- Saucer -->
        <ellipse cx="25" cy="44" rx="22" ry="4" fill="#F5F0EB" stroke="#D7CCC8" stroke-width="1"/>
        <!-- Cup -->
        <path d="M8 14 L12 40 Q12 43 18 43 L32 43 Q38 43 38 40 L42 14 Z" 
              fill="#FFFFFF" stroke="#8D6E63" stroke-width="1.5"/>
        <!-- Handle -->
        <path d="M42 20 Q50 20 50 28 Q50 36 42 36" fill="none" stroke="#8D6E63" stroke-width="2" stroke-linecap="round"/>
        <clipPath id="espCup">
          <path d="M9 15 L13 39 Q13 41 18 41 L32 41 Q37 41 37 39 L41 15 Z"/>
        </clipPath>
        <g clip-path="url(#espCup)">
          <rect class="coffee-rise-esp" x="7" width="36" height="30" fill="#5D4037"/>
          <!-- Crema layer -->
          <rect class="crema" x="7" width="36" height="5" fill="#D2B48C"/>
        </g>
      </svg>
    </div>

    <!-- ✨ Sparkle particles -->
    <div class="sparkle sp-1">✦</div>
    <div class="sparkle sp-2">✧</div>
    <div class="sparkle sp-3">✦</div>
    <div class="sparkle sp-4">✧</div>
  </div>
</template>

<style scoped>
.sidebar-anim-wrap {
  position: absolute;
  bottom: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  overflow: hidden;
}

/* ===== LATTE ART RINGS (top) ===== */
.latte-circles {
  position: absolute;
  top: 15%;
  left: 50%;
  transform: translateX(-50%);
}

.latte-ring {
  position: absolute;
  border: 1.5px solid rgba(218, 165, 32, 0.08);
  border-radius: 50%;
  animation: latteExpand 6s ease-in-out infinite;
}

.ring-1 { width: 30px; height: 30px; top: -15px; left: -15px; animation-delay: 0s; }
.ring-2 { width: 50px; height: 50px; top: -25px; left: -25px; animation-delay: 2s; }
.ring-3 { width: 70px; height: 70px; top: -35px; left: -35px; animation-delay: 4s; }

@keyframes latteExpand {
  0% { transform: scale(0.5); opacity: 0.15; }
  50% { transform: scale(1.3); opacity: 0.04; }
  100% { transform: scale(0.5); opacity: 0.15; }
}

/* ===== FLOATING BEANS ===== */
.float-bean {
  position: absolute;
  opacity: 0;
  animation: beanFloat 10s ease-in-out infinite;
}

.fb-1 { width: 22px; top: 30%; left: 10%; animation-delay: 0s; }
.fb-2 { width: 16px; top: 55%; right: 8%; left: auto; animation-delay: 3.5s; }
.fb-3 { width: 19px; top: 42%; left: 60%; animation-delay: 7s; }

@keyframes beanFloat {
  0%   { transform: translateY(0) rotate(0deg); opacity: 0; }
  8%   { opacity: 0.12; }
  25%  { transform: translateY(-30px) rotate(90deg); opacity: 0.15; }
  50%  { transform: translateY(-15px) rotate(180deg); opacity: 0.1; }
  75%  { transform: translateY(-35px) rotate(270deg); opacity: 0.13; }
  92%  { opacity: 0.08; }
  100% { transform: translateY(0) rotate(360deg); opacity: 0; }
}

/* ===== MAIN CUP ===== */
.main-cup {
  position: absolute;
  bottom: 40px;
  left: 50%;
  transform: translateX(-50%);
  width: 75px;
  opacity: 0.16;
  animation: cupBob 5s ease-in-out infinite;
}

@keyframes cupBob {
  0%, 100% { transform: translateX(-50%) translateY(0); }
  50% { transform: translateX(-50%) translateY(-6px); }
}

/* ===== SIDE CUPS ===== */
.side-cup {
  position: absolute;
  opacity: 0.12;
}

.cup-left {
  bottom: 180px;
  left: 12px;
  width: 38px;
  animation: cupTiltLeft 7s ease-in-out infinite;
}

.cup-right {
  bottom: 160px;
  right: 12px;
  width: 42px;
  animation: cupTiltRight 8s ease-in-out infinite;
}

@keyframes cupTiltLeft {
  0%, 100% { transform: rotate(0deg) translateY(0); }
  50% { transform: rotate(-5deg) translateY(-8px); }
}

@keyframes cupTiltRight {
  0%, 100% { transform: rotate(0deg) translateY(0); }
  50% { transform: rotate(4deg) translateY(-5px); }
}

/* ===== COFFEE LIQUID RISE ===== */
.coffee-rise {
  animation: pourCoffee 5s ease-in-out infinite;
}

.coffee-rise-sm {
  animation: pourCoffee 6s ease-in-out infinite 1s;
}

.coffee-rise-esp {
  animation: pourEspresso 4s ease-in-out infinite 0.5s;
}

@keyframes pourCoffee {
  0%   { y: 100; height: 0; }
  30%  { y: 24;  height: 80; }
  70%  { y: 24;  height: 80; }
  100% { y: 100; height: 0; }
}

@keyframes pourEspresso {
  0%   { y: 42; height: 0; }
  25%  { y: 15; height: 30; }
  75%  { y: 15; height: 30; }
  100% { y: 42; height: 0; }
}

/* Crema layer slides in */
.crema {
  animation: cremaAppear 4s ease-in-out infinite 0.5s;
}

@keyframes cremaAppear {
  0%   { y: 42; opacity: 0; }
  30%  { y: 15; opacity: 1; }
  70%  { y: 15; opacity: 1; }
  100% { y: 42; opacity: 0; }
}

/* Wave surface */
.wave-top {
  animation: waveSlide 3s ease-in-out infinite;
}

@keyframes waveSlide {
  0%, 100% { transform: translateX(-4px); }
  50% { transform: translateX(4px); }
}

/* ===== STEAM CURLS ===== */
.steam-curl {
  fill: none;
  stroke: #D7CCC8;
  stroke-width: 2;
  stroke-linecap: round;
  opacity: 0;
  animation: curlUp 3s ease-out infinite;
}

.sc-1 { animation-delay: 0s; }
.sc-2 { animation-delay: 0.7s; }
.sc-3 { animation-delay: 1.4s; }
.sc-4 { animation-delay: 0.3s; stroke-width: 1.5; }
.sc-5 { animation-delay: 1.1s; stroke-width: 1.5; }
.sc-6 { animation-delay: 0.5s; stroke-width: 1.5; }

@keyframes curlUp {
  0%   { opacity: 0; transform: translateY(0) scaleY(0.7); stroke-width: 2.5; }
  20%  { opacity: 0.5; }
  60%  { opacity: 0.3; }
  100% { opacity: 0; transform: translateY(-20px) scaleY(1.3); stroke-width: 0.5; }
}

/* ===== SPARKLES ===== */
.sparkle {
  position: absolute;
  font-size: 0.6rem;
  color: #DAA520;
  opacity: 0;
  animation: twinkle 4s ease-in-out infinite;
}

.sp-1 { top: 25%; left: 20%; animation-delay: 0s; }
.sp-2 { top: 38%; right: 15%; left: auto; animation-delay: 1.5s; }
.sp-3 { top: 65%; left: 25%; animation-delay: 2.5s; }
.sp-4 { top: 50%; right: 20%; left: auto; animation-delay: 3.5s; }

@keyframes twinkle {
  0%, 100% { opacity: 0; transform: scale(0.5) rotate(0deg); }
  50% { opacity: 0.3; transform: scale(1.2) rotate(180deg); }
}
</style>
