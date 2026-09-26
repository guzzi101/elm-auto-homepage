import EmblaCarousel from 'embla-carousel';
import { animate, inView, stagger } from 'motion';

const $ = selector => document.querySelector(selector);
const $$ = selector => [...document.querySelectorAll(selector)];
const motionPreference = window.matchMedia('(prefers-reduced-motion: reduce)');
const reduced = () => motionPreference.matches;
const ease = [0.22, 1, 0.36, 1];
const running = new Set();
function motion(target, frames, options = {}) {
  const animation = animate(target, frames, { duration: .48, ease, ...options });
  running.add(animation);
  animation.then(() => running.delete(animation));
  return animation;
}
function stopMotion(animation) {
  animation?.stop();
  running.delete(animation);
}

const vehicles = {
  family: { label: 'Space for the whole family.', summary: 'Family vehicle' },
  work: { label: 'A truck that works as hard as you.', summary: 'Work vehicle' },
  commute: { label: 'Find your everyday upgrade.', summary: 'Daily commuter' },
  adventure: { label: 'Room for your weekend plans.', summary: 'Weekend vehicle' },
};
const vehicleKeys = Object.keys(vehicles);
let currentVehicle = 'family';
let photoTransition;
let indicatorTransition;
let captionTransition;
let photoRevision = 0;
const indicator = $('.tab-indicator');
function positionIndicator(animateChange = true) {
  const button = $(`[data-vehicle="${currentVehicle}"]`);
  const x = button.offsetLeft + button.offsetWidth * .15;
  stopMotion(indicatorTransition);
  indicator.style.width = `${button.offsetWidth * .7}px`;
  if (!animateChange || reduced()) indicator.style.transform = `translateX(${x}px)`;
  else indicatorTransition = motion(indicator, { x }, { type: 'spring', stiffness: 340, damping: 34 });
}
function chooseVehicle(key, focus = false) {
  if (!vehicles[key]) return;
  const changed = key !== currentVehicle;
  const previous = $(`[data-photo="${currentVehicle}"]`);
  const next = $(`[data-photo="${key}"]`);
  currentVehicle = key;
  const revision = ++photoRevision;
  stopMotion(photoTransition);
  stopMotion(captionTransition);
  $$('.vehicle-photo').forEach(photo => {
    const active = photo === next;
    photo.classList.toggle('active', active);
    photo.classList.remove('outgoing');
    photo.style.clipPath = '';
    photo.setAttribute('aria-hidden', String(!active));
  });
  $$('[data-vehicle]').forEach(button => {
    const active = button.dataset.vehicle === key;
    button.classList.toggle('selected', active);
    button.setAttribute('aria-selected', String(active));
    button.tabIndex = active ? 0 : -1;
    if (active && focus) button.focus();
  });
  $('#vehicle-stage').setAttribute('aria-labelledby', `tab-${key}`);
  $('#vehicle-label').textContent = vehicles[key].label;
  $('#photo-number').textContent = String(vehicleKeys.indexOf(key) + 1).padStart(2, '0');
  $('#mobile-vehicle').textContent = vehicles[key].summary;
  positionIndicator(changed);
  if (changed && !reduced()) {
    previous.classList.add('outgoing');
    photoTransition = motion(next, { clipPath: ['inset(0 0 0 100%)', 'inset(0 0 0 0%)'] }, { duration: .5 });
    photoTransition.then(() => {
      if (revision !== photoRevision) return;
      previous.classList.remove('outgoing');
      next.style.clipPath = '';
    });
    captionTransition = motion($('#vehicle-label'), { opacity: [.35, 1], y: [6, 0] }, { duration: .32 });
  }
}
$$('[data-vehicle]').forEach((button, index) => {
  button.addEventListener('click', () => chooseVehicle(button.dataset.vehicle));
  button.addEventListener('keydown', event => {
    if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
    event.preventDefault();
    const next = event.key === 'Home' ? 0 : event.key === 'End' ? 3 : (index + (event.key === 'ArrowRight' ? 1 : 3)) % 4;
    chooseVehicle(vehicleKeys[next], true);
  });
});
const stage = $('#vehicle-stage');
let gesture;
stage.addEventListener('pointerdown', event => {
  if (event.pointerType !== 'touch') return;
  gesture = { x: event.clientX, y: event.clientY };
  stage.setPointerCapture(event.pointerId);
});
stage.addEventListener('pointerup', event => {
  if (!gesture) return;
  const dx = event.clientX - gesture.x;
  const dy = event.clientY - gesture.y;
  gesture = null;
  if (Math.abs(dx) > 45 && Math.abs(dx) > Math.abs(dy) * 1.4) {
    chooseVehicle(vehicleKeys[(vehicleKeys.indexOf(currentVehicle) + (dx < 0 ? 1 : 3)) % 4]);
  }
});
stage.addEventListener('pointercancel', () => { gesture = null; });
window.addEventListener('resize', () => positionIndicator(false), { passive: true });
document.fonts?.ready.then(() => positionIndicator(false));
positionIndicator(false);
document.documentElement.classList.add('motion-ready');

const menu = $('.menu-toggle');
const nav = $('#main-nav');
function closeMenu() {
  nav.classList.remove('open');
  menu.setAttribute('aria-expanded', 'false');
  menu.setAttribute('aria-label', 'Open navigation');
}
menu.addEventListener('click', () => {
  const open = !nav.classList.contains('open');
  nav.classList.toggle('open', open);
  menu.setAttribute('aria-expanded', String(open));
  menu.setAttribute('aria-label', open ? 'Close navigation' : 'Open navigation');
  if (open && !reduced()) motion(nav.querySelectorAll('a'), { opacity: [.25, 1], y: [8, 0] }, { delay: stagger(.04), duration: .3 });
});
nav.addEventListener('click', event => { if (event.target.closest('a')) closeMenu(); });
document.addEventListener('keydown', event => {
  if (event.key === 'Escape' && nav.classList.contains('open')) { closeMenu(); menu.focus(); }
});
document.addEventListener('click', event => { if (!event.target.closest('.header')) closeMenu(); });

const viewport = $('#photo-reel');
const customerCards = $$('.customer-photo');
const back = $('#gallery-back');
const forward = $('#gallery-forward');
const galleryProgress = $('.gallery-progress > span');
let gallery;
try {
  gallery = EmblaCarousel(viewport, { align: 'start', containScroll: 'trimSnaps', dragFree: false, loop: false, duration: reduced() ? 0 : 28 });
  viewport.classList.add('is-enhanced');
  function updateGallery() {
    back.disabled = !gallery.canScrollPrev();
    forward.disabled = !gallery.canScrollNext();
    const progress = Math.max(0, Math.min(1, gallery.scrollProgress()));
    const base = 1 / customerCards.length;
    galleryProgress.style.transform = `scaleX(${base + progress * (1 - base)})`;
  }
  function announceGallery() {
    const snaps = gallery.internalEngine().slideRegistry;
    const index = snaps[gallery.selectedScrollSnap()]?.[0] ?? 0;
    $('#gallery-position').textContent = `Photo ${index + 1} of ${customerCards.length}`;
  }
  gallery.on('scroll', updateGallery).on('select', announceGallery).on('reInit', updateGallery)
    .on('pointerDown', () => viewport.classList.add('is-dragging'))
    .on('pointerUp', () => viewport.classList.remove('is-dragging'));
  updateGallery();
} catch {
  viewport.classList.remove('is-enhanced');
}
function moveGallery(direction) {
  if (gallery) {
    direction > 0 ? gallery.scrollNext(reduced()) : gallery.scrollPrev(reduced());
  } else {
    viewport.scrollBy({ left: direction * customerCards[0].getBoundingClientRect().width, behavior: reduced() ? 'auto' : 'smooth' });
  }
}
back.addEventListener('click', () => moveGallery(-1));
forward.addEventListener('click', () => moveGallery(1));
viewport.addEventListener('keydown', event => {
  if (!['ArrowRight', 'ArrowLeft', 'Home', 'End'].includes(event.key)) return;
  event.preventDefault();
  if (event.key === 'Home') gallery?.scrollTo(0, reduced());
  else if (event.key === 'End') gallery?.scrollTo(gallery.scrollSnapList().length - 1, reduced());
  else moveGallery(event.key === 'ArrowRight' ? 1 : -1);
});

const reviewsViewport = $('#reviews-reel');
const reviewCards = $$('.review-card');
const reviewsBack = $('#reviews-back');
const reviewsForward = $('#reviews-forward');
let reviews;
if (reviewsViewport) {
  function updateReviews() {
    if (!reviews) return;
    reviewsBack.disabled = !reviews.canScrollPrev();
    reviewsForward.disabled = !reviews.canScrollNext();
    const index = reviews.internalEngine().slideRegistry[reviews.selectedScrollSnap()]?.[0] ?? 0;
    $('#reviews-position').textContent = `Review ${index + 1} of ${reviewCards.length}`;
  }
  try {
    reviews = EmblaCarousel(reviewsViewport, { align: 'start', containScroll: 'trimSnaps', loop: false, duration: reduced() ? 0 : 28 });
    reviewsViewport.classList.add('is-enhanced');
    reviews.on('select', updateReviews).on('reInit', updateReviews)
      .on('pointerDown', () => reviewsViewport.classList.add('is-dragging'))
      .on('pointerUp', () => reviewsViewport.classList.remove('is-dragging'));
    updateReviews();
  } catch {
    reviewsViewport.classList.remove('is-enhanced');
  }
  function moveReview(direction) {
    if (reviews) direction > 0 ? reviews.scrollNext(reduced()) : reviews.scrollPrev(reduced());
    else reviewsViewport.scrollBy({ left: direction * reviewCards[0].getBoundingClientRect().width, behavior: reduced() ? 'auto' : 'smooth' });
  }
  reviewsBack.addEventListener('click', () => moveReview(-1));
  reviewsForward.addEventListener('click', () => moveReview(1));
  reviewsViewport.addEventListener('keydown', event => {
    if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
    event.preventDefault();
    if (event.key === 'Home') reviews ? reviews.scrollTo(0, reduced()) : reviewsViewport.scrollTo({ left: 0 });
    else if (event.key === 'End') reviews ? reviews.scrollTo(reviews.scrollSnapList().length - 1, reduced()) : reviewsViewport.scrollTo({ left: reviewsViewport.scrollWidth });
    else moveReview(event.key === 'ArrowRight' ? 1 : -1);
  });
}

const steps = $$('.step');
function highlightStep(index) {
  steps.forEach((step, i) => step.classList.toggle('is-current', i === index));
  $('#process-index').textContent = String(index + 1).padStart(2, '0');
}
highlightStep(0);
const stepObserver = new IntersectionObserver(entries => {
  for (const entry of entries) if (entry.isIntersecting) highlightStep(steps.indexOf(entry.target));
}, { rootMargin: '-25% 0px -35% 0px', threshold: 0 });
steps.forEach(step => stepObserver.observe(step));
if (!reduced()) {
  inView('.section-heading, .process-intro, .step, .questions, .delivery-grid', element => {
    if (!reduced()) motion(element, { opacity: [.5, 1], y: [22, 0] }, { duration: .6 });
  }, { amount: .15 });
}

let heroVisible = true;
let applicationVisible = false;
const mobileBar = $('.mobile-apply');
function updateMobileBar() {
  const show = !heroVisible && !applicationVisible;
  mobileBar.classList.toggle('show', show);
  mobileBar.inert = !show;
}
new IntersectionObserver(entries => { heroVisible = entries[0].isIntersecting; updateMobileBar(); }).observe($('.hero'));
new IntersectionObserver(entries => { applicationVisible = entries[0].isIntersecting; updateMobileBar(); }).observe($('.application-panel'));
let scrollQueued = false;
function updateReadingProgress() {
  const max = document.documentElement.scrollHeight - window.innerHeight;
  $('#reading-fill').style.width = `${max > 0 ? Math.min(100, window.scrollY / max * 100) : 0}%`;
  scrollQueued = false;
}
window.addEventListener('scroll', () => {
  if (!scrollQueued) { scrollQueued = true; requestAnimationFrame(updateReadingProgress); }
}, { passive: true });
motionPreference.addEventListener('change', () => {
  if (reduced()) running.forEach(animation => animation.complete());
  gallery?.reInit({ duration: reduced() ? 0 : 28 });
  reviews?.reInit({ duration: reduced() ? 0 : 28 });
  positionIndicator(false);
});
