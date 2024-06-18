document.addEventListener('DOMContentLoaded', function() {
  const mobileMenu = document.getElementById('mobile-menu');
  const navLinks = document.getElementById('nav-links');
  const sideMenu = document.getElementById('side-dishes-popup');

  mobileMenu.addEventListener('click', function() {
      navLinks.classList.toggle('active');
      if (window.innerWidth <= 1024) {
          sideMenu.classList.toggle('active');
      }
  });
});

