// script.js — UI + fondo de partículas + parallax + intro typewriter (rápida y skip on click) + contact handling
document.addEventListener('DOMContentLoaded', function(){

  // año en footer
  const y = new Date().getFullYear();
  const yearEl = document.getElementById('year');
  if(yearEl) yearEl.textContent = y;

  // menú responsive
  const navToggle = document.getElementById('navToggle');
  const nav = document.getElementById('nav');
  navToggle && navToggle.addEventListener('click', function(){
    if(!nav) return;
    const isOpen = nav.style.display === 'flex' || nav.style.display === 'block';
    nav.style.display = isOpen ? 'none' : 'flex';
  });

  // ---------- Intro typewriter (rápida, una vez, skip on click) ----------
  (function introTypewriter(){
    const overlay = document.getElementById('intro-overlay');
    const textEl = document.getElementById('type-text');
    if(!overlay || !textEl) return;

    // respeta prefers-reduced-motion
    const reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if(reduce){
      overlay.classList.add('hidden');
      setTimeout(()=> overlay.remove(), 200);
      return;
    }

    const phrase = 'ORDENAFIX';
    const typeSpeed = 60;   // ms per char typing (más rápido)
    const deleteSpeed = 40; // ms per char deleting (más rápido)
    const pauseAfterType = 650; // ms pause after full word before deleting
    const cycles = 1; // solo escribir y borrar una vez

    let i = 0;
    let deleting = false;
    let currentCycle = 0;
    let stopped = false; // si el usuario hace click para saltar

    function closeOverlayImmediate(){
      if(stopped) return;
      stopped = true;
      overlay.classList.add('hidden');
      setTimeout(()=> { if(overlay && overlay.parentNode) overlay.parentNode.removeChild(overlay); }, 300);
      textEl.textContent = '';
    }

    overlay.addEventListener('click', closeOverlayImmediate);
    window.addEventListener('keydown', function(e){
      if(e.key === 'Escape') closeOverlayImmediate();
    });

    function tick(){
      if(stopped) return;
      if(!deleting){
        textEl.textContent = phrase.slice(0, i+1);
        i++;
        if(i === phrase.length){
          setTimeout(()=> {
            if(stopped) return;
            deleting = true;
            tick();
          }, pauseAfterType);
          return;
        }
        setTimeout(tick, typeSpeed);
      } else {
        textEl.textContent = phrase.slice(0, i-1);
        i--;
        if(i === 0){
          currentCycle++;
          if(currentCycle >= cycles){
            overlay.classList.add('hidden');
            setTimeout(()=> { if(overlay && overlay.parentNode) overlay.parentNode.removeChild(overlay); }, 300);
            return;
          } else {
            deleting = false;
            setTimeout(tick, 200);
            return;
          }
        }
        setTimeout(tick, deleteSpeed);
      }
    }

    setTimeout(tick, 120);
  })();

  // ---------- Parallax simple en hero ----------
  (function heroParallax(){
    const moveables = document.querySelectorAll('[data-parallax]');
    if(!moveables.length) return;
    let rect = document.querySelector('.hero')?.getBoundingClientRect() || {top:0,left:0};
    function onMove(e){
      const x = (e.clientX || (e.touches && e.touches[0].clientX) || window.innerWidth/2);
      const y = (e.clientY || (e.touches && e.touches[0].clientY) || window.innerHeight/2);
      moveables.forEach(el=>{
        const depth = parseFloat(el.getAttribute('data-parallax')) || 0;
        const tx = (x - window.innerWidth/2) * (depth/200);
        const ty = (y - (rect.top + rect.height/2)) * (depth/300);
        el.style.transform = `translate3d(${tx}px, ${ty}px, 0)`;
      });
    }
    window.addEventListener('mousemove', onMove);
    window.addEventListener('touchmove', onMove, {passive:true});
    window.addEventListener('resize', ()=>{ rect = document.querySelector('.hero')?.getBoundingClientRect() || rect; });
  })();

  // ---------- Fondo de partículas en canvas ----------
  (function particlesBackground(){
    if(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const canvas = document.getElementById('bg-canvas');
    if(!canvas) return;
    const ctx = canvas.getContext('2d');
    let width = canvas.width = window.innerWidth;
    let height = canvas.height = window.innerHeight;
    const particleCount = Math.max(30, Math.floor((width*height)/90000)); // escala con resolución
    const particles = [];
    const mouse = { x: null, y: null, radius: Math.max(80, Math.min(220, Math.min(width,height)/6)) };

    const colors = [
      'rgba(245,158,11,0.95)',
      'rgba(245,158,11,0.45)',
      'rgba(201,198,191,0.85)',
      'rgba(255,255,255,0.10)'
    ];

    function rand(min,max){ return Math.random()*(max-min)+min; }

    function Particle(){
      this.x = rand(0, width);
      this.y = rand(0, height);
      this.vx = rand(-0.35, 0.35);
      this.vy = rand(-0.35, 0.35);
      this.size = rand(1.6, 3.8);
      this.color = colors[Math.floor(Math.random()*colors.length)];
      this.draw = function(){
        ctx.beginPath();
        ctx.fillStyle = this.color;
        ctx.arc(this.x, this.y, this.size, 0, Math.PI*2);
        ctx.fill();
      };
      this.update = function(){
        this.x += this.vx;
        this.y += this.vy;
        if(this.x < 0 || this.x > width) this.vx *= -1;
        if(this.y < 0 || this.y > height) this.vy *= -1;

        if(mouse.x !== null && mouse.y !== null){
          const dx = this.x - mouse.x;
          const dy = this.y - mouse.y;
          const dist = Math.sqrt(dx*dx + dy*dy);
          if(dist < mouse.radius){
            const angle = Math.atan2(dy, dx);
            const force = (mouse.radius - dist) / mouse.radius;
            this.vx += Math.cos(angle) * force * 0.16;
            this.vy += Math.sin(angle) * force * 0.16;
          } else {
            this.vx *= 0.995;
            this.vy *= 0.995;
          }
        }
        this.vx = Math.max(Math.min(this.vx, 1.8), -1.8);
        this.vy = Math.max(Math.min(this.vy, 1.8), -1.8);
      };
    }

    function initParticles(){
      particles.length = 0;
      for(let i=0;i<particleCount;i++){
        particles.push(new Particle());
      }
    }

    function connectParticles(){
      for(let a=0;a<particles.length;a++){
        for(let b=a+1;b<particles.length;b++){
          const pa = particles[a];
          const pb = particles[b];
          const dx = pa.x - pb.x;
          const dy = pa.y - pb.y;
          const dist = Math.sqrt(dx*dx + dy*dy);
          if(dist < 120){
            const alpha = 1 - (dist/120);
            ctx.beginPath();
            ctx.strokeStyle = `rgba(200,200,200,${alpha*0.08})`;
            ctx.lineWidth = 1;
            ctx.moveTo(pa.x, pa.y);
            ctx.lineTo(pb.x, pb.y);
            ctx.stroke();
          }
        }
      }
    }

    let rafId = null;
    function animate(){
      ctx.clearRect(0,0,width,height);
      const g = ctx.createLinearGradient(0,0,width,height);
      g.addColorStop(0,'rgba(11,11,13,0.0)');
      g.addColorStop(1,'rgba(2,6,23,0.12)');
      ctx.fillStyle = g;
      ctx.fillRect(0,0,width,height);
      particles.forEach(p=>{
        p.update();
        p.draw();
      });
      connectParticles();
      rafId = requestAnimationFrame(animate);
    }

    window.addEventListener('mousemove', function(e){
      mouse.x = e.clientX;
      mouse.y = e.clientY;
    });
    window.addEventListener('touchmove', function(e){
      if(e.touches && e.touches[0]){
        mouse.x = e.touches[0].clientX;
        mouse.y = e.touches[0].clientY;
      }
    }, {passive:true});
    window.addEventListener('touchend', function(){ mouse.x = null; mouse.y = null; });

    window.addEventListener('resize', function(){
      cancelAnimationFrame(rafId);
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
      mouse.radius = Math.max(80, Math.min(220, Math.min(width,height)/6));
      initParticles();
      animate();
    });

    initParticles();
    animate();

    window.addEventListener('beforeunload', function(){ cancelAnimationFrame(rafId); });
  })();

  // ---------- Contact form handler (client-side validation + feedback) ----------
  (function contactFormHandler(){
    const form = document.getElementById('contactForm');
    if(!form) return;
    const feedback = document.getElementById('formFeedback');
    const submitBtn = document.getElementById('submitBtn');

    function showFeedback(text, ok = true) {
      feedback.hidden = false;
      feedback.textContent = text;
      feedback.style.background = ok ? 'linear-gradient(90deg,#1f7a27,#1fbf4a)' : 'linear-gradient(90deg,#6b1f1f,#b32b2b)';
      feedback.style.color = '#fff';
      if(ok){
        setTimeout(()=> { if(feedback) feedback.hidden = true; }, 5000);
      }
    }

    form.addEventListener('submit', function(e){
      // Minimal client-side validation
      const name = form.querySelector('#name');
      const email = form.querySelector('#email');
      const message = form.querySelector('#message');

      if(!name.value.trim() || !email.value.trim() || !message.value.trim()){
        e.preventDefault();
        showFeedback('Por favor completa Nombre, Email y Mensaje antes de enviar.', false);
        (name.value || email.value || message.value) && name.focus();
        return;
      }

      // Show a quick "preparing message" feedback (mail client will open)
      showFeedback('Preparando tu mensaje… Abre tu cliente de correo para enviar.', true);

      // Small UI affordance: disable button briefly
      submitBtn.disabled = true;
      setTimeout(()=> submitBtn.disabled = false, 2000);

      // Let the form submit normally (mailto) — no preventDefault
    });
  })();

});