/* Theme toggle, clock, smooth scroll and scroll animations. */

import Lenis from 'lenis';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import './flow.js';

(function () {
  const root = document.documentElement;
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const hasGsap = true;

  /* ── Theme toggle ───────────────────────────── */
  const toggle = document.querySelector('.theme-toggle');
  if (toggle) {
    toggle.addEventListener('click', () => {
      const next = root.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
      root.setAttribute('data-theme', next);
      try { localStorage.setItem('theme', next); } catch (e) {}
      if (window.flowField) window.flowField.refreshColours();
    });
  }

  /* ── Bengaluru clock ────────────────────────── */
  const clocks = document.querySelectorAll('[data-clock]');
  const timeFormat = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Asia/Kolkata',
    hour: '2-digit',
    minute: '2-digit',
  });
  function tick() {
    const now = timeFormat.format(new Date());
    clocks.forEach((el) => { el.textContent = now; });
  }
  tick();
  setInterval(tick, 20000);

  /* ── Nav: border after scrolling, active link ─ */
  const nav = document.querySelector('.nav');
  const navLinks = document.querySelectorAll('.nav__links a');
  function onScroll() {
    nav.classList.toggle('is-scrolled', window.scrollY > 20);
    // Back in the hero: no section is active.
    if (window.scrollY < window.innerHeight * 0.4) {
      navLinks.forEach((link) => link.classList.remove('is-active'));
    }
  }
  onScroll();
  window.addEventListener('scroll', onScroll, { passive: true });

  const sectionObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      navLinks.forEach((link) => {
        link.classList.toggle('is-active', link.getAttribute('href') === '#' + entry.target.id);
      });
    });
  }, { rootMargin: '-45% 0px -50% 0px' });
  document.querySelectorAll('.section[id]').forEach((s) => sectionObserver.observe(s));

  /* ── Smooth scroll (Lenis) ──────────────────── */
  let lenis = null;
  if (!reduceMotion) {
    lenis = new Lenis({ lerp: 0.09 });

    if (hasGsap) {
      lenis.on('scroll', ScrollTrigger.update);
      gsap.ticker.add((time) => lenis.raf(time * 1000));
      gsap.ticker.lagSmoothing(0);
    } else {
      const raf = (time) => { lenis.raf(time); requestAnimationFrame(raf); };
      requestAnimationFrame(raf);
    }
  }

  // In-page links glide to their section.
  document.querySelectorAll('a[href^="#"]').forEach((link) => {
    link.addEventListener('click', (e) => {
      const target = document.querySelector(link.getAttribute('href'));
      if (!target) return;
      e.preventDefault();
      if (lenis) {
        lenis.scrollTo(target, { offset: target.id === 'top' ? 0 : -40, duration: 1.4 });
      } else {
        target.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth' });
      }
    });
  });

  /* ── Animations (GSAP) ──────────────────────── */
  if (!hasGsap || reduceMotion) return;
  gsap.registerPlugin(ScrollTrigger);

  // Hero: the name rises out of its mask, then the rest fades in.
  gsap.timeline({ defaults: { ease: 'power4.out' } })
    .from('.mask__inner', { yPercent: 115, duration: 1.5, stagger: 0.14, delay: 0.15, clearProps: 'transform' })
    .from('.hero__fade', {
      autoAlpha: 0, y: 18, filter: 'blur(8px)',
      duration: 1.1, stagger: 0.09, ease: 'power3.out',
    }, '-=1.0')
    .from('.hero__canvas', { autoAlpha: 0, duration: 2, ease: 'power1.out' }, 0.2);

  // The name drifts up and softens as you scroll away from the hero.
  gsap.to('.hero__bottom', {
    yPercent: -12,
    autoAlpha: 0.25,
    ease: 'none',
    scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true },
  });

  // Scroll progress line at the top.
  gsap.to('.progress__bar', {
    scaleX: 1,
    ease: 'none',
    scrollTrigger: { start: 0, end: 'max', scrub: 0.3 },
  });

  // Everything marked .reveal comes into focus as it enters the screen.
  gsap.set('.reveal', { autoAlpha: 0, y: 30, filter: 'blur(10px)' });
  ScrollTrigger.batch('.reveal', {
    start: 'top 90%',
    once: true,
    onEnter: (batch) => gsap.to(batch, {
      autoAlpha: 1, y: 0, filter: 'blur(0px)',
      duration: 1.1, ease: 'power3.out', stagger: 0.09,
      clearProps: 'filter',
    }),
  });

  // Research title: words light up one by one with the scroll.
  document.querySelectorAll('[data-words]').forEach((el) => {
    const words = el.textContent.trim().split(/\s+/);
    el.setAttribute('aria-label', words.join(' '));
    el.innerHTML = words
      .map((w) => `<span class="word" aria-hidden="true">${w}</span>`)
      .join(' ');

    gsap.fromTo(el.querySelectorAll('.word'),
      { opacity: 0.16 },
      {
        opacity: 1,
        stagger: 0.1,
        ease: 'none',
        scrollTrigger: { trigger: el, start: 'top 85%', end: 'bottom 55%', scrub: true },
      });
  });

  // Fonts change the layout when they load, so re-measure afterwards.
  if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(() => ScrollTrigger.refresh());
  }
})();
