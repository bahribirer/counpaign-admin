<template>
  <div class="coffee-loader-overlay">
    <div class="coffee-loader-content">
      <!-- Animated Coffee Cup -->
      <div class="coffee-cup-loader">
        <div class="cup-handle"></div>
        <div class="cup-body">
          <div class="coffee-liquid"></div>
        </div>
        <div class="steam steam-1"></div>
        <div class="steam steam-2"></div>
        <div class="steam steam-3"></div>
      </div>
      <span class="coffee-loader-text">Hazırlanıyor...</span>
    </div>
  </div>
</template>

<style scoped>
.coffee-loader-overlay {
  position: fixed;
  inset: 0;
  z-index: 9999;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: rgba(253, 251, 247, 0.95);
  backdrop-filter: blur(8px);
}

.coffee-loader-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1.5rem;
}

.coffee-loader-text {
  color: #3E2723;
  font-family: 'Outfit', sans-serif;
  font-weight: 700;
  font-size: 1.25rem;
  letter-spacing: 0.1em;
  animation: pulse 1.5s ease-in-out infinite;
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.4; }
}

.coffee-cup-loader {
  position: relative;
  width: 100px;
  height: 80px;
}

.cup-body {
  position: absolute;
  bottom: 0;
  left: 0;
  width: 80px;
  height: 60px;
  background-color: #FFFFFF;
  border: 4px solid #3E2723;
  border-radius: 0 0 40px 40px;
  overflow: hidden;
  box-shadow: 0 4px 10px rgba(62, 39, 35, 0.1);
}

.cup-handle {
  position: absolute;
  top: 25px;
  right: 0;
  width: 25px;
  height: 35px;
  border: 4px solid #3E2723;
  border-left: none;
  border-radius: 0 20px 20px 0;
}

.coffee-liquid {
  position: absolute;
  bottom: 0;
  left: 0;
  width: 100%;
  height: 0%;
  background: linear-gradient(to top, #5D4037, #8D6E63);
  animation: fillCup 2s ease-in-out infinite;
}

.steam {
  position: absolute;
  top: -20px;
  width: 6px;
  height: 20px;
  background-color: #D7CCC8;
  border-radius: 10px;
  opacity: 0;
  animation: risingSteam 2s infinite;
}

.steam-1 { left: 20px; animation-delay: 0.2s; }
.steam-2 { left: 40px; animation-delay: 0.6s; }
.steam-3 { left: 60px; animation-delay: 1.0s; }

@keyframes fillCup {
  0% { height: 0%; }
  50% { height: 80%; }
  70% { height: 80%; opacity: 1; }
  100% { height: 0%; opacity: 0; }
}

@keyframes risingSteam {
  0% { transform: translateY(0) scale(1); opacity: 0; }
  50% { opacity: 0.8; }
  100% { transform: translateY(-30px) scale(1.5); opacity: 0; }
}
</style>
