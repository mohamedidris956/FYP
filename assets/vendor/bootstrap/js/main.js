/**
 * main.js - IPY FC Web Application
 * Cleaned and simplified from BootstrapMade's Yummy template
 */

(function() {
  "use strict";

  /** ===============================
   *  Sticky header on scroll
   * =============================== */
  function toggleScrolled() {
    const body = document.querySelector('body');
    const header = document.querySelector('#header');
    if (!header) return;
    if (window.scrollY > 100) {
      body.classList.add('scrolled');
    } else {
      body.classList.remove('scrolled');
    }
  }

  document.addEventListener('scroll', toggleScrolled);
  window.addEventListener('load', toggleScrolled);

  /** ===============================
   *  Mobile navigation toggle
   * =============================== */
  const mobileNavToggleBtn = document.querySelector('.mobile-nav-toggle');

  function toggleMobileNav() {
    document.body.classList.toggle('mobile-nav-active');
    mobileNavToggleBtn.classList.toggle('bi-list');
    mobileNavToggleBtn.classList.toggle('bi-x');
  }

  if (mobileNavToggleBtn) {
    mobileNavToggleBtn.addEventListener('click', toggleMobileNav);
  }

  // Close mobile menu when clicking a nav link
  document.querySelectorAll('#navmenu a').forEach(navLink => {
    navLink.addEventListener('click', () => {
      if (document.body.classList.contains('mobile-nav-active')) {
        toggleMobileNav();
      }
    });
  });

  /** ===============================
   *  Mobile nav dropdowns
   * =============================== */
  document.querySelectorAll('.navmenu .toggle-dropdown').forEach(dropdown => {
    dropdown.addEventListener('click', function(e) {
      e.preventDefault();
      this.parentNode.classList.toggle('active');
      this.parentNode.nextElementSibling.classList.toggle('dropdown-active');
      e.stopImmediatePropagation();
    });
  });

  /** ===============================
   *  Preloader
   * =============================== */
  const preloader = document.querySelector('#preloader');
  if (preloader) {
    window.addEventListener('load', () => {
      preloader.remove();
    });
  }

  /** ===============================
   *  Scroll-to-top button
   * =============================== */
  const scrollTop = document.querySelector('#scroll-top');
  function toggleScrollTop() {
    if (!scrollTop) return;
    if (window.scrollY > 100) {
      scrollTop.classList.add('active');
    } else {
      scrollTop.classList.remove('active');
    }
  }

  if (scrollTop) {
    scrollTop.addEventListener('click', (e) => {
      e.preventDefault();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
    window.addEventListener('load', toggleScrollTop);
    document.addEventListener('scroll', toggleScrollTop);
  }

  /** ===============================
   *  Animate On Scroll (optional)
   * =============================== */
  function aosInit() {
    if (typeof AOS !== 'undefined') {
      AOS.init({
        duration: 600,
        easing: 'ease-in-out',
        once: true,
        mirror: false
      });
    }
  }
  window.addEventListener('load', aosInit);

  /** ===============================
   *  Scrollspy (active link highlight)
   * =============================== */
  const navLinks = document.querySelectorAll('.navmenu a');

  function navScrollspy() {
    navLinks.forEach(link => {
      if (!link.hash) return;
      const section = document.querySelector(link.hash);
      if (!section) return;
      const position = window.scrollY + 200;
      if (position >= section.offsetTop && position <= (section.offsetTop + section.offsetHeight)) {
        document.querySelectorAll('.navmenu a.active').forEach(i => i.classList.remove('active'));
        link.classList.add('active');
      } else {
        link.classList.remove('active');
      }
    });
  }

  window.addEventListener('load', navScrollspy);
  document.addEventListener('scroll', navScrollspy);

})();
