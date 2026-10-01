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


const works_swiper = new Swiper('#works_inner', {
  wrapperClass:"list", //슬라이드를 감싸는 영역의 클래스
  slideClass:"item", //각 슬라이드영역의 클래스
  slidesPerView: "auto",
  spaceBetween: 43,
  speed: 900,
  nested:true, //내부 swiper에게 설정

  // [3] 마우스 휠 최적화
  mousewheel: {
    enabled: true,
    //forceToAxis: true,    // 가로 휠과 상하 풀페이지 스크롤 간섭 방지
    sensitivity: 0.8,     // 휠 한 번에 훅 넘어가지 않도록 감도 조절 (기본값 1보다 약간 낮게)
    releaseOnEdges: true, // 첫 슬라이드나 끝 슬라이드 도달 시 상/하 풀페이지로 휠 전달
  },

});




Fancybox.bind("[data-fancybox]", {
  // 옵션 (필요 시)
});

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
  works_swiper.update();
}
fitDesign(); window.addEventListener('resize', fitDesign);
document.querySelectorAll('[data-section]').forEach(button => button.addEventListener('click', () => {
  const sections = [...document.querySelectorAll('#wrap > .container > .section')];
  wrap_swiper.slideTo(sections.findIndex(section => section.id === button.dataset.section));
}));
