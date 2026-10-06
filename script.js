/* ==========================================================================
   Ember & Oak — fictional restaurant concept
   Vanilla JavaScript, no dependencies.
   Sections: helpers · hero intro · header & mobile menu · scroll reveals ·
   parallax · menu · modal · reservation demo · directions · cursor · misc
   ========================================================================== */
(function () {
  'use strict';

  var root = document.documentElement;
  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function $(sel, ctx) { return (ctx || document).querySelector(sel); }
  function $$(sel, ctx) { return Array.prototype.slice.call((ctx || document).querySelectorAll(sel)); }

  /* ---------- Hero intro (sequence is handled by CSS once .is-loaded is set) ---------- */
  function startIntro() {
    requestAnimationFrame(function () {
      requestAnimationFrame(function () { root.classList.add('is-loaded'); });
    });
  }
  var heroImg = $('.hero__media img');
  if (heroImg && !heroImg.complete) {
    var started = false;
    var go = function () { if (!started) { started = true; startIntro(); } };
    heroImg.addEventListener('load', go);
    heroImg.addEventListener('error', go);
    setTimeout(go, 1200); // never block the intro on a slow image
  } else {
    startIntro();
  }

  /* ---------- Header: darker + blurred once scrolled ---------- */
  var header = $('.site-header');
  var scrollTicking = false;
  function updateHeader() {
    header.classList.toggle('is-scrolled', window.scrollY > 40);
    scrollTicking = false;
  }
  window.addEventListener('scroll', function () {
    if (!scrollTicking) { scrollTicking = true; requestAnimationFrame(updateHeader); }
  }, { passive: true });
  updateHeader();

  /* ---------- Mobile menu ---------- */
  var toggle = $('.menu-toggle');
  var mobileMenu = $('#mobile-menu');
  var toggleLabel = $('.menu-toggle__label');

  function setMenu(open) {
    toggle.setAttribute('aria-expanded', String(open));
    mobileMenu.classList.toggle('is-open', open);
    mobileMenu.setAttribute('aria-hidden', String(!open));
    document.body.classList.toggle('is-locked', open);
    toggleLabel.textContent = open ? 'Close' : 'Menu';
    if (open) {
      var first = $('a', mobileMenu);
      if (first) setTimeout(function () { first.focus({ preventScroll: true }); }, 350);
    }
  }
  toggle.addEventListener('click', function () {
    setMenu(toggle.getAttribute('aria-expanded') !== 'true');
  });
  $$('a', mobileMenu).forEach(function (a) {
    a.addEventListener('click', function () { setMenu(false); });
  });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && mobileMenu.classList.contains('is-open')) { setMenu(false); toggle.focus(); }
  });
  // If the viewport grows past the mobile breakpoint, make sure the overlay is closed.
  window.matchMedia('(min-width: 961px)').addEventListener('change', function (e) {
    if (e.matches && mobileMenu.classList.contains('is-open')) setMenu(false);
  });

  /* ---------- Scroll-triggered reveals (IntersectionObserver) ---------- */
  var revealTargets = $$('[data-reveal], [data-reveal-img], [data-fire]');
  if ('IntersectionObserver' in window && !reduceMotion) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-in');
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.15, rootMargin: '0px 0px -8% 0px' });
    revealTargets.forEach(function (el) { io.observe(el); });
  } else {
    revealTargets.forEach(function (el) { el.classList.add('is-in'); });
  }

  /* ---------- Parallax (transform only, only for elements near the viewport) ---------- */
  var parallaxEls = $$('[data-parallax]').map(function (el) {
    return { el: el, speed: parseFloat(el.getAttribute('data-parallax')) || 0.1, visible: false, parent: el.parentElement };
  });
  if (!reduceMotion && parallaxEls.length && 'IntersectionObserver' in window) {
    var pio = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        parallaxEls.forEach(function (p) { if (p.parent === entry.target) p.visible = entry.isIntersecting; });
      });
      requestParallax();
    }, { rootMargin: '15% 0px 15% 0px' });
    parallaxEls.forEach(function (p) { pio.observe(p.parent); });

    var pTicking = false;
    var requestParallax = function () {
      if (!pTicking) { pTicking = true; requestAnimationFrame(runParallax); }
    };
    var runParallax = function () {
      var vh = window.innerHeight;
      parallaxEls.forEach(function (p) {
        if (!p.visible) return;
        var r = p.parent.getBoundingClientRect();
        var offset = (r.top + r.height / 2 - vh / 2) * p.speed;
        var limit = r.height * 0.08; // stay inside the overscan area of each wrapper
        offset = Math.max(-limit, Math.min(limit, offset));
        p.el.style.transform = 'translate3d(0,' + offset.toFixed(1) + 'px,0)';
      });
      pTicking = false;
    };
    window.addEventListener('scroll', requestParallax, { passive: true });
    window.addEventListener('resize', requestParallax);
  }

  /* ---------- Active nav link on scroll ---------- */
  var navLinks = $$('.nav__list a');
  var sectionMap = {};
  navLinks.forEach(function (a) { sectionMap[a.getAttribute('href').slice(1)] = a; });
  if ('IntersectionObserver' in window) {
    var nio = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        var link = sectionMap[entry.target.id];
        if (link && entry.isIntersecting) {
          navLinks.forEach(function (l) { l.classList.remove('is-active'); });
          link.classList.add('is-active');
        }
      });
    }, { rootMargin: '-45% 0px -50% 0px' });
    Object.keys(sectionMap).forEach(function (id) { var s = document.getElementById(id); if (s) nio.observe(s); });
  }

  /* ---------- Interactive menu (all items and prices are fictional) ---------- */
  var MENU = {
    small: {
      title: 'Small plates', img: 'assets/hover-small.svg',
      items: [
        ['Charred octopus', 'Coal-roasted · citrus · smoked paprika', '19'],
        ['Ember beetroot', 'Whipped goat curd · hazelnut · burnt honey', '14'],
        ['Hearth bread', 'Cultured butter · ash salt', '9'],
        ['Oak-smoked scallop', 'Brown butter · sweet corn · chive', '18'],
        ['Steak tartare', 'Smoked yolk · capers · rye crisp', '17']
      ]
    },
    fire: {
      title: 'From the fire', img: 'assets/hover-fire.svg',
      items: [
        ['Ember-cured ribeye', 'Charred crust · smoked shallot · ember jus', '58'],
        ['Fire-roasted roots', 'Seasonal vegetables · brown butter · herbs', '26'],
        ['Hearth chicken', 'Herb butter · charred lemon · pan juices', '34'],
        ['Oak-grilled lamb', 'Rack · smoked aubergine · mint salsa', '52'],
        ['Whole fish for two', 'Coal-roasted · fennel · salsa verde', '78']
      ]
    },
    sides: {
      title: 'Sides', img: 'assets/hover-sides.svg',
      items: [
        ['Smoked potato purée', 'Cultured butter · chive oil', '10'],
        ['Charred greens', 'Garlic · lemon · toasted seeds', '11'],
        ['Fire-roasted mushrooms', 'Thyme · shallot · sherry', '12'],
        ['Oak fries', 'Twice-cooked · ash salt', '9']
      ]
    },
    dessert: {
      title: 'Dessert', img: 'assets/hover-dessert.svg',
      items: [
        ['Oak-smoked pear', 'Vanilla · toasted oat · warm caramel', '14'],
        ['Burnt honey cream', 'Brown sugar crust · fig leaf oil', '13'],
        ['Ember chocolate tart', 'Dark chocolate · sea salt · cream', '15'],
        ['Toasted oat ice cream', 'Brown butter crumb', '9']
      ]
    },
    drinks: {
      title: 'Drinks', img: 'assets/hover-drinks.svg',
      items: [
        ['Ember old fashioned', 'Bourbon · brown sugar · smoked orange', '16'],
        ['Oak & cider', 'Dry cider · pear · warm spice', '14'],
        ['Burgundy pour', 'A rotating red, by the glass', '15'],
        ['Smoked tonic', 'Zero-proof · rosemary · citrus', '11'],
        ['Espresso', 'Single origin', '5']
      ]
    }
  };

  var menuList = $('#menu-list');
  var menuTitle = $('#menu-cat-title');
  var menuPanel = $('#menu-panel');
  var tabs = $$('.menu__tabs [role="tab"]');
  var preview = $('.menu__preview');
  var previewImg = $('#menu-preview-img');
  var currentCat = 'small';
  var menuBusy = false;

  function buildItems(cat) {
    var frag = document.createDocumentFragment();
    MENU[cat].items.forEach(function (it, i) {
      var li = document.createElement('li');
      li.className = 'menu__item';
      li.style.setProperty('--i', i);
      li.setAttribute('data-img', MENU[cat].img);

      var row = document.createElement('div');
      row.className = 'menu__row';
      var name = document.createElement('span'); name.className = 'menu__name'; name.textContent = it[0];
      var dots = document.createElement('span'); dots.className = 'menu__dots'; dots.setAttribute('aria-hidden', 'true');
      var price = document.createElement('span'); price.className = 'menu__price'; price.textContent = it[2];
      row.appendChild(name); row.appendChild(dots); row.appendChild(price);

      var desc = document.createElement('p'); desc.className = 'menu__desc'; desc.textContent = it[1];
      li.appendChild(row); li.appendChild(desc);
      frag.appendChild(li);
    });
    return frag;
  }

  function renderMenu(cat, animate) {
    menuList.textContent = '';
    menuList.appendChild(buildItems(cat));
    menuTitle.textContent = MENU[cat].title;
    menuPanel.setAttribute('aria-labelledby', 'tab-' + cat);
    if (previewImg) previewImg.src = MENU[cat].img;
    if (animate) {
      menuList.classList.add('is-entering');
      setTimeout(function () { menuList.classList.remove('is-entering'); }, 1000);
    }
  }

  function switchCat(cat) {
    if (cat === currentCat || menuBusy) return;
    currentCat = cat;
    tabs.forEach(function (t) {
      var on = t.getAttribute('data-cat') === cat;
      t.setAttribute('aria-selected', String(on));
      t.tabIndex = on ? 0 : -1;
    });
    if (reduceMotion) { renderMenu(cat, false); return; }
    menuBusy = true;
    menuList.classList.add('is-leaving');
    setTimeout(function () {
      renderMenu(cat, true);
      menuList.classList.remove('is-leaving');
      menuBusy = false;
    }, 300);
  }

  if (menuList) {
    renderMenu('small', false);
    tabs.forEach(function (tab, i) {
      tab.addEventListener('click', function () { switchCat(tab.getAttribute('data-cat')); });
      tab.addEventListener('keydown', function (e) {
        var next = null;
        if (e.key === 'ArrowRight') next = tabs[(i + 1) % tabs.length];
        else if (e.key === 'ArrowLeft') next = tabs[(i - 1 + tabs.length) % tabs.length];
        else if (e.key === 'Home') next = tabs[0];
        else if (e.key === 'End') next = tabs[tabs.length - 1];
        if (next) { e.preventDefault(); next.focus(); next.scrollIntoView({ block: 'nearest', inline: 'nearest' }); switchCat(next.getAttribute('data-cat')); }
      });
    });

    // Hover preview (desktop pointers only; the preview panel is hidden by CSS on touch)
    var canHover = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
    if (canHover && preview) {
      menuList.addEventListener('mouseover', function (e) {
        var item = e.target.closest('.menu__item');
        if (item) preview.classList.add('is-active');
      });
      menuList.addEventListener('mouseleave', function () { preview.classList.remove('is-active'); });
      menuList.addEventListener('focusin', function () { preview.classList.add('is-active'); });
      menuList.addEventListener('focusout', function () { preview.classList.remove('is-active'); });
    }
  }

  /* ---------- Private dining modal ---------- */
  var modal = $('#enquiry-modal');
  var lastTrigger = null;
  function openModal(trigger) {
    lastTrigger = trigger || null;
    if (typeof modal.showModal === 'function') modal.showModal(); else modal.setAttribute('open', '');
    document.body.classList.add('is-locked');
    requestAnimationFrame(function () { requestAnimationFrame(function () { modal.classList.add('is-open'); }); });
  }
  function closeModal() {
    modal.classList.remove('is-open');
    setTimeout(function () {
      if (typeof modal.close === 'function') modal.close(); else modal.removeAttribute('open');
      document.body.classList.remove('is-locked');
      var res = $('#enquiry-result'); if (res) res.hidden = true;
      if (lastTrigger) lastTrigger.focus();
    }, reduceMotion ? 0 : 450);
  }
  if (modal) {
    $$('[data-open-modal]').forEach(function (b) { b.addEventListener('click', function () { openModal(b); }); });
    $$('[data-close-modal]').forEach(function (b) { b.addEventListener('click', closeModal); });
    modal.addEventListener('cancel', function (e) { e.preventDefault(); closeModal(); });
    modal.addEventListener('click', function (e) { if (e.target === modal) closeModal(); }); // click on backdrop area
    $('#enquiry-form').addEventListener('submit', function (e) {
      e.preventDefault(); // nothing is ever sent
      $('#enquiry-result').hidden = false;
    });
  }

  /* ---------- Reservation demo (visual only, never claims a booking) ---------- */
  var form = $('#reserve-form');
  if (form) {
    var dateInput = $('#res-date');
    var timeSelect = $('#res-time');
    var guestsOut = $('#res-guests');
    var errorEl = $('#res-error');
    var resultEl = $('#res-result');
    var summaryEl = $('#res-summary');
    var slotsEl = $('#res-slots');
    var guests = 2;
    var MIN_G = 1, MAX_G = 12;

    var times = ['5:30 PM', '6:00 PM', '6:30 PM', '7:00 PM', '7:30 PM', '8:00 PM', '8:30 PM', '9:00 PM', '9:30 PM', '10:00 PM', '10:30 PM'];
    times.forEach(function (t, i) {
      var o = document.createElement('option'); o.value = t; o.textContent = t; if (t === '7:30 PM') o.selected = true;
      timeSelect.appendChild(o);
    });

    function pad(n) { return (n < 10 ? '0' : '') + n; }
    var today = new Date();
    dateInput.min = today.getFullYear() + '-' + pad(today.getMonth() + 1) + '-' + pad(today.getDate());

    $$('.stepper__btn', form).forEach(function (b) {
      b.addEventListener('click', function () {
        guests = Math.max(MIN_G, Math.min(MAX_G, guests + parseInt(b.getAttribute('data-step'), 10)));
        guestsOut.textContent = guests;
      });
    });

    function showResult(html, slots, openDay) {
      summaryEl.textContent = html;
      slotsEl.textContent = '';
      (slots || []).forEach(function (t) {
        var s = document.createElement('button');
        s.type = 'button'; s.className = 'slot'; s.textContent = t; s.setAttribute('aria-pressed', 'false');
        s.addEventListener('click', function () {
          $$('.slot', slotsEl).forEach(function (o) { o.setAttribute('aria-pressed', 'false'); });
          s.setAttribute('aria-pressed', 'true');
          timeSelect.value = t;
          summaryEl.textContent = 'Sample time previewed: ' + t + ' for ' + guests + (guests === 1 ? ' guest.' : ' guests.');
        });
        slotsEl.appendChild(s);
      });
      resultEl.hidden = false;
      resultEl.classList.remove('is-shown'); void resultEl.offsetWidth; resultEl.classList.add('is-shown');
    }

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      if (!dateInput.value) {
        errorEl.hidden = false; resultEl.hidden = true; dateInput.focus(); return;
      }
      errorEl.hidden = true;
      var parts = dateInput.value.split('-');
      var d = new Date(+parts[0], +parts[1] - 1, +parts[2]);
      var label = d.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' });
      var dow = d.getDay(); // 0 Sun … 6 Sat
      var g = guests + (guests === 1 ? ' guest' : ' guests');

      if (dow === 0 || dow === 1) {
        showResult('In this concept, Ember & Oak is open Tuesday — Saturday. ' + label + ' falls outside those days — try another date.', []);
        return;
      }
      var idx = times.indexOf(timeSelect.value);
      var near = times.filter(function (t, i) { return Math.abs(i - idx) <= 2 && i !== idx; });
      showResult(label + ' · ' + g + ' · ' + timeSelect.value + '. Illustrative sample times are shown below.', near);
    });
  }

  /* ---------- Concept "Get directions" button ---------- */
  var dirBtn = $('#directions-btn');
  if (dirBtn) {
    dirBtn.addEventListener('click', function () { $('#directions-note').hidden = false; });
  }

  /* ---------- Custom cursor (fine pointers only, never on touch) ---------- */
  var finePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  var cursor = $('.cursor');
  if (finePointer && cursor && !reduceMotion) {
    root.classList.add('has-cursor');
    var dot = $('.cursor__dot', cursor);
    var ring = $('.cursor__ring', cursor);
    var mx = -100, my = -100, rx = -100, ry = -100, running = false;
    cursor.classList.add('is-hidden');

    var loop = function () {
      rx += (mx - rx) * 0.18; ry += (my - ry) * 0.18;
      dot.style.transform = 'translate3d(' + mx + 'px,' + my + 'px,0)';
      ring.style.transform = 'translate3d(' + rx.toFixed(1) + 'px,' + ry.toFixed(1) + 'px,0)';
      if (Math.abs(mx - rx) > 0.1 || Math.abs(my - ry) > 0.1) requestAnimationFrame(loop); else running = false;
    };
    document.addEventListener('mousemove', function (e) {
      mx = e.clientX; my = e.clientY;
      cursor.classList.remove('is-hidden');
      if (!running) { running = true; requestAnimationFrame(loop); }
    }, { passive: true });
    document.addEventListener('mouseleave', function () { cursor.classList.add('is-hidden'); });
    document.addEventListener('mouseover', function (e) {
      var hit = e.target.closest && e.target.closest('a, button, .menu__item, .media, select, input, textarea, label');
      cursor.classList.toggle('is-hover', !!hit);
    });
  }

  /* ---------- Footer year ---------- */
  var y = $('#year');
  if (y) y.textContent = new Date().getFullYear();
})();
