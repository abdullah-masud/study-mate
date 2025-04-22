document.addEventListener('DOMContentLoaded', function () {
  // Animate .feature-card when in view
  const featureCards = document.querySelectorAll('.feature-card');
  const featureObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('animate');
      }
    });
  }, { threshold: 0.1 });
  featureCards.forEach(card => featureObserver.observe(card));

  // Fade-in for fade-in-up elements
  const fadeUps = document.querySelectorAll('.fade-in-up');
  const fadeObserver = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
      }
    });
  }, { threshold: 0.2 });
  fadeUps.forEach(section => fadeObserver.observe(section));

  // Tracker Icon 弹入动画
  const icons = document.querySelectorAll('.tracker-icon');
  const iconObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
      }
    });
  }, { threshold: 0.2 });
  icons.forEach(icon => iconObserver.observe(icon));

  // Back to Top Button
  const backToTop = document.getElementById("backToTop");
  window.addEventListener("scroll", () => {
    backToTop.style.display = window.pageYOffset > 300 ? "block" : "none";
  });
  backToTop.addEventListener("click", () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });

  // Toast on primary button click
  function showToast() {
    const toast = document.getElementById("toast");
    toast.classList.add("show");
    setTimeout(() => toast.classList.remove("show"), 2500);
  }
  document.querySelectorAll(".btn-primary").forEach(btn => {
    btn.addEventListener("click", showToast);
  });

  // === 🆕 Mobile-friendly: Hide navbar on scroll down, show on scroll up ===
  let lastScrollTop = 0;
  const navbar = document.querySelector('.navbar');
  window.addEventListener('scroll', function () {
    const scrollTop = window.scrollY;
    if (scrollTop > lastScrollTop && scrollTop > 60) {
      navbar.classList.add('nav-hide');
    } else {
      navbar.classList.remove('nav-hide');
    }
    lastScrollTop = scrollTop;
  });
});
