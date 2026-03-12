/**
 * Main JS for IPY FC Website
 * Based on Bootstrap 5 - simplified for clarity and custom functionality
 */

(function () {
  "use strict";

  /**
   * Apply .scrolled class to header when scrolling
   */
  function toggleScrolled() {
    const header = document.querySelector("#header");
    if (!header) return;
    if (window.scrollY > 50) header.classList.add("scrolled");
    else header.classList.remove("scrolled");
  }

  document.addEventListener("scroll", toggleScrolled);
  window.addEventListener("load", toggleScrolled);

  /**
   * Mobile Navigation Toggle
   */
// Mobile Navigation Toggle
const mobileNavToggleBtn = document.querySelector(".mobile-nav-toggle");
const body = document.querySelector("body");
const navMenu = document.querySelector("#navmenu");

if (mobileNavToggleBtn) {
  mobileNavToggleBtn.addEventListener("click", () => {
    body.classList.toggle("mobile-nav-active");
    mobileNavToggleBtn.classList.toggle("bi-list");
    mobileNavToggleBtn.classList.toggle("bi-x");
  });
}


  /**
   * Close mobile nav when a menu link is clicked
   */
  document.querySelectorAll("#navmenu a").forEach((navLink) => {
    navLink.addEventListener("click", () => {
      if (navMenu && navMenu.classList.contains("active")) {
        navMenu.classList.remove("active");
        mobileNavToggleBtn.classList.add("bi-list");
        mobileNavToggleBtn.classList.remove("bi-x");
      }
    });
  });

  /**
   * Scroll to top button
   */
  const scrollTopBtn = document.querySelector(".scroll-top");

  if (scrollTopBtn) {
    const toggleScrollTop = () => {
      if (window.scrollY > 200) scrollTopBtn.classList.add("active");
      else scrollTopBtn.classList.remove("active");
    };
    window.addEventListener("load", toggleScrollTop);
    document.addEventListener("scroll", toggleScrollTop);

    scrollTopBtn.addEventListener("click", (e) => {
      e.preventDefault();
      window.scrollTo({ top: 0, behavior: "smooth" });
    });
  }

  /**
   * Initialize AOS animations
   */
  if (typeof AOS !== "undefined") {
    AOS.init({
      duration: 600,
      easing: "ease-in-out",
      once: true,
      mirror: false,
    });
  }

  /**
   * Initialize Glightbox
   */
  if (typeof GLightbox !== "undefined") {
    GLightbox({ selector: ".glightbox" });
  }

  /**
   * Initialize Swiper (optional sliders)
   */
  if (typeof Swiper !== "undefined") {
    document.querySelectorAll(".init-swiper").forEach((el) => {
      const config = JSON.parse(el.querySelector(".swiper-config").innerHTML.trim());
      new Swiper(el, config);
    });
  }

})();
