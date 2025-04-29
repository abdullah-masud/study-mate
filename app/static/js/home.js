document.addEventListener('DOMContentLoaded', function () {
  // Animate .feature-card when in view
  const featureCards = document.querySelectorAll('.feature-card');
  const featureObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('animate', 'fade-in-up');
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

  // Tracker Icon
  const icons = document.querySelectorAll('.tracker-icon');
  const iconObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible', 'bounce');
      }
    });
  }, { threshold: 0.2 });
  icons.forEach(icon => iconObserver.observe(icon));

  // Animated heading zoom-in on scroll
  const headings = document.querySelectorAll('.main-heading, .tracker-title');
  const headingObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('zoom-in');
      }
    });
  }, { threshold: 0.2 });
  headings.forEach(h => headingObserver.observe(h));

  // Paragraph fade and slide-up
  const paragraphs = document.querySelectorAll('p');
  const paragraphObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('fade-slide');
      }
    });
  }, { threshold: 0.1 });
  paragraphs.forEach(p => paragraphObserver.observe(p));

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

  // Mobile navbar hide on scroll
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

  // 🌙 Dark Mode Toggle Logic
  const toggleBtn = document.getElementById('toggleDarkMode');
  const body = document.body;

  // localStorage dark mode
  if (localStorage.getItem('dark-mode') === 'true') {
    body.classList.add('dark-mode');
    toggleBtn.innerHTML = '<i class="fas fa-sun"></i>';
  }

  toggleBtn.addEventListener('click', () => {
    body.classList.toggle('dark-mode');
    const isDark = body.classList.contains('dark-mode');
    toggleBtn.innerHTML = isDark ? '<i class="fas fa-sun"></i>' : '<i class="fas fa-moon"></i>';
    localStorage.setItem('dark-mode', isDark);
  });
});

// Open Modal
function openModal() {
  document.getElementById('imageModal').style.display = "block";
  showSlides(slideIndex = 1);
}

// Close Modal
function closeModal() {
  document.getElementById('imageModal').style.display = "none";
}

let slideIndex = 1;

// Change Slide by n steps
function plusSlides(n) {
  showSlides(slideIndex += n);
}

// Display the current slide
function showSlides(n) {
  let slides = document.getElementsByClassName("slide");
  if (n > slides.length) { slideIndex = 1 }
  if (n < 1) { slideIndex = slides.length }
  for (let i = 0; i < slides.length; i++) {
    slides[i].style.display = "none";
  }
  slides[slideIndex - 1].style.display = "block";
}
