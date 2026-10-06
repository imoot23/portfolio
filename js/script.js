const gnb_swiper = new Swiper('#gnb', {
  wrapperClass:"menu", //슬라이드를 감싸는 영역의 클래스
  slideClass:"btn", //각 슬라이드영역의 클래스
  slidesPerView:"auto", //버튼의 갯수만큼 설정
});

const wrap_swiper = new Swiper('#wrap', {
  wrapperClass:"container", //슬라이드를 감싸는 영역의 클래스
  slideClass:"section", //각 슬라이드영역의 클래스
  direction: "vertical",
  speed: 600,
  thumbs:{
    swiper:gnb_swiper,
    slideThumbActiveClass:"active",
  },
  navigation: {
    nextEl: ".next",
    prevEl: ".prev"
  },
  pagination: {
    el: ".pager",
    clickable: true,
    bulletActiveClass:'active',
  },
  mousewheel: true
});


// CMS가 카드를 넣은 후에도 update()로 슬라이드와 화살표를 갱신합니다.
const works_swiper = new Swiper('#works_inner', {
  init: false, // CMS 카드가 준비된 뒤 초기화
  centeredSlides: true, // 중앙 카드를 사각형의 중심에 배치
  loop: true, // 05 다음에 01로 이어지는 순환 이동
  wrapperClass: 'list',
  slideClass: 'item',
  slidesPerView: 'auto', // 기존 297px 카드 폭 유지
  spaceBetween: 43, // 카드 간격
  speed: 650, // 좌우 전환 시간(ms)
  nested: true, // 바깥 세로 Swiper와 가로 제스처 분리
  grabCursor: true,
  watchOverflow: true,
  resizeObserver: true,
  mousewheel: { enabled: true, forceToAxis: true, releaseOnEdges: true },
  navigation: { prevEl: '.works-prev', nextEl: '.works-next' },
  a11y: { prevSlideMessage: '이전 작품', nextSlideMessage: '다음 작품' },
  on: { slideChange: updateWorksPosition, update: updateWorksPosition }
});
function updateWorksPosition(swiper) {
  const counter = document.querySelector('.works-position');
  const total = swiper.slides.length;
  if (counter) counter.textContent = total
    ? `${String(swiper.realIndex + 1).padStart(2, '0')} / ${String(total).padStart(2, '0')}`
    : '00 / 00';
}
document.getElementById('works_inner').addEventListener('keydown', event => {
  if (event.key === 'ArrowRight' || event.key === 'ArrowLeft') {
    event.preventDefault();
    event.key === 'ArrowRight' ? works_swiper.slideNext() : works_swiper.slidePrev();
  }
});
let worksEntrance;
function revealWorks() {
  if (wrap_swiper.slides[wrap_swiper.activeIndex]?.id !== 'works') return;
  const cards = document.querySelectorAll('#works_inner .work-card');
  if (!cards.length || typeof gsap === 'undefined') return;
  worksEntrance?.kill();
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) {
    gsap.set(cards, { clearProps: 'opacity,transform' });
    return;
  }
  // transform으로 이동하는 바깥 Swiper의 화면 진입을 GSAP에 연결합니다.
  worksEntrance = gsap.fromTo(cards, { y: 32, opacity: 0 }, {
    y: 0, opacity: 1, duration: .6, stagger: .08, ease: 'power2.out',
    overwrite: 'auto', clearProps: 'opacity,transform'
  });
}
wrap_swiper.on('slideChangeTransitionEnd', revealWorks);
document.addEventListener('works:loaded', () => {
  if (!works_swiper.initialized) {
    works_swiper.params.loop = document.querySelectorAll('#works_inner .item').length >= 3;
    works_swiper.init();
  } else works_swiper.update();
  works_swiper.navigation.update();
  updateWorksPosition(works_swiper);
  revealWorks();
});

// 브랜딩 상세페이지는 여백이 적은 세로형 창으로 엽니다.
Fancybox.bind('[data-work-id="branding-collection"][data-fancybox]', {
  mainClass: 'branding-modal',
  groupAttr: false
});
Fancybox.bind('[data-fancybox]:not([data-work-id="branding-collection"])', {});

// About 영역에서는 내부 스크롤이 끝날 때만 풀페이지 이동을 허용합니다.
const aboutScroll = document.querySelector('#about .about-scroll');
aboutScroll.addEventListener('wheel', (event) => {
  const atTop = aboutScroll.scrollTop <= 1;
  const atBottom = aboutScroll.scrollTop + aboutScroll.clientHeight >= aboutScroll.scrollHeight - 1;
  if ((event.deltaY < 0 && !atTop) || (event.deltaY > 0 && !atBottom)) event.stopPropagation();
}, { passive: true });
aboutScroll.addEventListener('touchmove', (event) => event.stopPropagation(), { passive: true });
document.querySelectorAll('[data-about-contact]').forEach((button) => {
  button.addEventListener('click', () => {
    const sections = Array.from(document.querySelectorAll('#wrap > .container > .section'));
    wrap_swiper.slideTo(sections.findIndex((section) => section.id === 'contact'));
  });
});
document.querySelectorAll('#about .about-nav a').forEach((link) => {
  link.addEventListener('click', (event) => {
    event.preventDefault();
    const target = document.querySelector(link.getAttribute('href'));
    aboutScroll.scrollTo({ top: target.getBoundingClientRect().top - aboutScroll.getBoundingClientRect().top + aboutScroll.scrollTop - 24, behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth' });
  });
});

// 데스크톱은 Figma 1920×1080 비율을 유지하고 모바일은 CSS로 재배치합니다.
function fitDesign() {
  const scale = Math.min(innerWidth / 1920, innerHeight / 1080);
  document.documentElement.style.setProperty('--design-scale', scale);
  document.documentElement.style.setProperty('--scaled-height', `${1080 * scale}px`);
  if (works_swiper.initialized) works_swiper.update();
}
fitDesign(); window.addEventListener('resize', fitDesign);
document.querySelectorAll('[data-section]').forEach(button => button.addEventListener('click', () => {
  const sections = [...document.querySelectorAll('#wrap > .container > .section')];
  wrap_swiper.slideTo(sections.findIndex(section => section.id === button.dataset.section));
}));

// #works 링크를 열면 바로 작품 화면으로 이동합니다.
function openLinkedSection() {
  const id = location.hash.slice(1);
  const index = [...wrap_swiper.slides].findIndex(section => section.id === id);
  if (index >= 0) { wrap_swiper.slideTo(index, 0); revealWorks(); }
}
openLinkedSection();
window.addEventListener('hashchange', openLinkedSection);
