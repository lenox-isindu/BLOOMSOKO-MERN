// Scroll animations
export const initScrollAnimations = () => {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const delay = entry.target.getAttribute('data-delay') || '0s';
        entry.target.style.transitionDelay = delay;
        entry.target.classList.add('animated');
      }
    });
  }, {
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px'
  });

  document.querySelectorAll('.animate-on-scroll').forEach(el => {
    observer.observe(el);
  });
};

// Floating images animation
export const initFloatingImages = () => {
  const images = document.querySelectorAll('.floating-image');
  images.forEach((img, index) => {
    setTimeout(() => {
      img.style.animation = `float 6s ease-in-out infinite, fadeInUp 0.8s forwards`;
    }, index * 300);
  });
};

// Smooth scrolling
export const initSmoothScroll = () => {
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
      e.preventDefault();
      const target = document.querySelector(this.getAttribute('href'));
      if (target) {
        target.scrollIntoView({
          behavior: 'smooth',
          block: 'start'
        });
      }
    });
  });
};