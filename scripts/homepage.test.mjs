import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { JSDOM, VirtualConsole } from 'jsdom';
import { transform } from 'lightningcss';
const html = readFileSync('dist/index.html', 'utf8');
const bundle = readFileSync('dist/app.js', 'utf8');

function page(reduced = true) {
  const errors = [];
  const vc = new VirtualConsole();
  vc.on('jsdomError', error => errors.push(error));
  const dom = new JSDOM(html, { url: 'https://example.test/', runScripts: 'outside-only', pretendToBeVisual: true, virtualConsole: vc });
  const { window } = dom;
  const browserDefaults = window.document.createElement('style');
  browserDefaults.textContent = 'button, .customer-photo, .review-card { margin: 0; }';
  window.document.head.append(browserDefaults);
  const observers = [];
  window.matchMedia = query => ({ matches: query.includes('prefers-reduced-motion') && reduced, media: query, addListener() {}, removeListener() {}, addEventListener() {}, removeEventListener() {} });
  window.IntersectionObserver = class {
    constructor(callback, options) { this.callback = callback; this.options = options; this.targets = []; observers.push(this); }
    observe(target) { this.targets.push(target); }
    unobserve() {} disconnect() {}
  };
  window.ResizeObserver = class { observe() {} unobserve() {} disconnect() {} };
  window.HTMLElement.prototype.setPointerCapture = function () {};
  window.HTMLElement.prototype.scrollBy = function ({ left = 0 }) { this.scrollLeft += left; };
  window.HTMLElement.prototype.scrollTo = function ({ left = 0 }) { this.scrollLeft = left; };
  window.HTMLDialogElement.prototype.showModal = function () { this.open = true; };
  window.HTMLDialogElement.prototype.close = function () { this.open = false; this.dispatchEvent(new window.Event('close')); };
  Object.defineProperty(window.HTMLElement.prototype, 'offsetWidth', { get() {
    if (this.matches('[data-vehicle]')) return 85;
    if (this.matches('#photo-reel')) return 390;
    if (this.matches('.photo-reel')) return 390;
    if (this.matches('.customer-photo, .review-card')) return 320;
    return 390;
  }});
  Object.defineProperty(window.HTMLElement.prototype, 'offsetHeight', { get() { return 260; } });
  Object.defineProperty(window.HTMLElement.prototype, 'offsetTop', { get() { return 0; } });
  Object.defineProperty(window.HTMLElement.prototype, 'offsetLeft', { get() {
    if (this.matches('[data-vehicle]')) return [...this.parentElement.querySelectorAll('[data-vehicle]')].indexOf(this) * 85;
    if (this.matches('.customer-photo, .review-card')) return [...this.parentElement.children].indexOf(this) * 338;
    return 0;
  }});
  window.HTMLElement.prototype.getBoundingClientRect = function () { return { x: this.offsetLeft, y: 0, left: this.offsetLeft, top: 0, width: this.offsetWidth, height: 260, right: this.offsetLeft + this.offsetWidth, bottom: 260 }; };
  window.eval(bundle);
  return { dom, window, document: window.document, errors, observers };
}

test('compiled homepage has valid links, loaded assets and no visible credits', () => {
  const dom = new JSDOM(html);
  const document = dom.window.document;
  const ids = [...document.querySelectorAll('[id]')].map(el => el.id);
  assert.equal(new Set(ids).size, ids.length);
  assert.equal(document.querySelector('.photo-credits'), null);
  assert.doesNotMatch(html, /Lethbridge|(?:Photo|Review) \d+ of \d+/i);
  assert.equal(document.querySelector('#photo-number, #gallery-position, #reviews-position'), null);
  assert.doesNotMatch(document.body.textContent, /Photography credits|Unsplash|Your next chapter|Great handovers/);
  assert.match(document.querySelector('.hero-reassurance').textContent, /Good, bad or no credit/);
  assert.doesNotMatch(document.body.textContent, /\bElm\b(?! Auto)|\bELM\b/);
  for (const el of document.querySelectorAll('[src]')) {
    const src = el.getAttribute('src');
    if (src && !src.startsWith('http')) assert.ok(existsSync(`dist/${src.split('?')[0]}`), src);
  }
  for (const link of document.querySelectorAll('a[href^="#"]')) {
    if (link.hash) assert.ok(document.getElementById(link.hash.slice(1)), link.hash);
  }
  for (const el of document.querySelectorAll('[aria-controls]')) assert.ok(document.getElementById(el.getAttribute('aria-controls')));
  for (const link of document.querySelectorAll('a[href*="get-approved"]')) assert.equal(link.href, 'https://www.elmautocredit.ca/get-approved/');
  transform({ filename: 'style.css', code: readFileSync('dist/style.css'), errorRecovery: false });
  dom.window.close();
});

test('vehicle tabs support clicking, keyboard traversal, touch swiping and ARIA state', () => {
  const { window, document, dom, errors } = page();
  document.querySelector('#tab-work').click();
  assert.equal(document.querySelector('.vehicle-photo.active').dataset.photo, 'work');
  assert.equal(document.querySelector('#tab-work').getAttribute('aria-selected'), 'true');
  assert.equal(document.querySelector('#vehicle-stage').getAttribute('aria-labelledby'), 'tab-work');
  assert.equal(document.querySelector('#vehicle-label').textContent, 'A truck that works as hard as you.');
  document.querySelector('#tab-work').dispatchEvent(new window.KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }));
  assert.equal(document.activeElement.id, 'tab-commute');
  assert.equal(document.querySelectorAll('[role=tab][tabindex="0"]').length, 1);
  const stage = document.querySelector('#vehicle-stage');
  for (const [type, x] of [['pointerdown', 250], ['pointerup', 150]]) {
    const event = new window.Event(type); Object.assign(event, { pointerType: 'touch', pointerId: 1, clientX: x, clientY: 50 }); stage.dispatchEvent(event);
  }
  assert.equal(document.querySelector('.vehicle-photo.active').dataset.photo, 'adventure');
  assert.equal(document.querySelectorAll('.vehicle-photo[aria-hidden=false]').length, 1);
  assert.equal(errors.length, 0);
  dom.window.close();
});

test('customer slider navigates without photo buttons or popups', () => {
  const { window, document, dom, errors } = page();
  const cards = document.querySelectorAll('.customer-photo');
  assert.ok(cards.length > 5);
  assert.equal(document.querySelector('dialog'), null);
  assert.equal(document.querySelector('.customer-photo button, button.customer-photo'), null);
  assert.doesNotMatch(document.body.textContent, /View photo/);
  assert.ok(document.querySelector('#photo-reel').classList.contains('is-enhanced'));
  assert.equal(document.querySelector('#gallery-back').disabled, true);
  assert.equal(document.querySelector('#gallery-forward').disabled, false);
  document.querySelector('#gallery-forward').click();
  assert.equal(document.querySelector('#gallery-back').disabled, false);
  document.querySelector('#photo-reel').dispatchEvent(new window.KeyboardEvent('keydown', { key: 'Home', bubbles: true }));
  assert.equal(document.querySelector('#gallery-back').disabled, true);
  assert.equal(errors.length, 0);
  dom.window.close();
});

test('Google review slider moves independently with buttons and keyboard', () => {
  const { window, document, dom, errors } = page();
  const viewport = document.querySelector('#reviews-reel');
  assert.ok(viewport.classList.contains('is-enhanced'));
  assert.equal(document.querySelectorAll('.review-card').length, 3);
  assert.equal(document.querySelector('#reviews-back').disabled, true);
  document.querySelector('#reviews-forward').click();
  assert.equal(document.querySelector('#reviews-back').disabled, false);
  assert.equal(document.querySelector('#gallery-back').disabled, true);
  viewport.dispatchEvent(new window.KeyboardEvent('keydown', { key: 'End', bubbles: true }));
  assert.equal(document.querySelector('#reviews-forward').disabled, true);
  viewport.dispatchEvent(new window.KeyboardEvent('keydown', { key: 'Home', bubbles: true }));
  assert.equal(document.querySelector('#reviews-back').disabled, true);
  assert.equal(document.querySelector('#reviews-forward').disabled, false);
  assert.equal(document.querySelectorAll('.review-card blockquote[cite="https://www.elmautocredit.ca/"]').length, 3);
  assert.equal(errors.length, 0);
  dom.window.close();
});

test('mobile menu closes on Escape and sticky CTA follows section visibility', () => {
  const { window, document, dom, observers, errors } = page();
  const menu = document.querySelector('.menu-toggle');
  menu.click();
  assert.equal(menu.getAttribute('aria-expanded'), 'true');
  document.dispatchEvent(new window.KeyboardEvent('keydown', { key: 'Escape' }));
  assert.equal(menu.getAttribute('aria-expanded'), 'false');
  assert.equal(document.activeElement, menu);
  const hero = observers.find(observer => observer.targets.includes(document.querySelector('.hero')));
  const end = observers.find(observer => observer.targets.includes(document.querySelector('.application-panel')));
  hero.callback([{ isIntersecting: false }]);
  assert.ok(document.querySelector('.mobile-apply').classList.contains('show'));
  assert.equal(document.querySelector('.mobile-apply').inert, false);
  end.callback([{ isIntersecting: true }]);
  assert.equal(document.querySelector('.mobile-apply').inert, true);
  const stepObserver = observers.find(observer => observer.targets.includes(document.querySelector('.step')));
  stepObserver.callback([{ target: document.querySelectorAll('.step')[2], isIntersecting: true }]);
  assert.equal(document.querySelector('#process-index').textContent, '03');
  assert.equal(errors.length, 0);
  dom.window.close();
});

test('default motion path initializes and tolerates rapid category changes', async () => {
  const { document, dom, errors } = page(false);
  for (const name of ['work', 'commute', 'adventure', 'family', 'work']) document.querySelector(`#tab-${name}`).click();
  await new Promise(resolve => setTimeout(resolve, 650));
  assert.equal(document.querySelector('.vehicle-photo.active').dataset.photo, 'work');
  assert.equal(document.querySelectorAll('.vehicle-photo.active').length, 1);
  assert.equal(document.querySelectorAll('.vehicle-photo.outgoing').length, 0);
  assert.equal(errors.length, 0, errors.map(error => error.message).join('\n'));
  dom.window.close();
});
