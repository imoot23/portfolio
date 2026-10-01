(async () => {
  const status = document.getElementById('works-status');
  try {
    const response = await fetch(new URL('data/works.json', document.baseURI));
    if (!response.ok) throw new Error('works');
    const works = await response.json();
    if (!Array.isArray(works)) throw new Error('format');
    const list = document.querySelector('#works_inner .list');
    const template = document.getElementById('work-card-template');
    const published = works.filter(w => w.published === true).sort((a, b) =>
      (Number.isFinite(a.order) ? a.order : Infinity) - (Number.isFinite(b.order) ? b.order : Infinity));
    const fragment = document.createDocumentFragment();
    published.forEach((work, index) => {
      const item = template.content.cloneNode(true);
      const card = item.querySelector('.work-card');
      const img = item.querySelector('img');
      // textContent로 CMS 문장을 넣어 HTML 실행을 방지합니다.
      for (const [selector, value] of Object.entries({
        '.index-num': `No. ${String(index + 1).padStart(2, '0')}`,
        '.category-stamp': work.category, '.project-title': work.title,
        '.project-desc': work.description
      })) item.querySelector(selector).textContent = value || '';
      const imageURL = new URL(String(work.thumbnail || ''), document.baseURI);
      if (work.thumbnail && ['http:', 'https:'].includes(imageURL.protocol)) img.src = imageURL.href;
      else img.removeAttribute('src');
      img.alt = String(work.title || ''); img.loading = 'lazy';
      card.dataset.featured = String(work.featured === true);
      card.dataset.workId = String(work.id || '');
      card.removeAttribute('href'); card.removeAttribute('data-fancybox'); card.removeAttribute('data-type');
      if (typeof work.detailPage === 'string' && work.detailPage) {
        const url = new URL(work.detailPage, document.baseURI);
        if (url.origin === location.origin && /\.html$/i.test(url.pathname)) {
          card.href = url.href; card.dataset.fancybox = 'portfolio'; card.dataset.type = 'iframe';
        }
      }
      if (!card.hasAttribute('href')) card.setAttribute('aria-disabled', 'true');
      fragment.appendChild(item);
    });
    list.replaceChildren(fragment);
    const indexList = document.getElementById('index-projects');
    published.slice(0, 5).forEach((work, index) => {
      const button = document.createElement('button'); button.textContent = `w-project${index + 1}`;
      button.addEventListener('click', () => { wrap_swiper.slideTo(2); works_swiper.params.loop ? works_swiper.slideToLoop(index) : works_swiper.slideTo(index); });
      indexList.appendChild(button);
    });
    if (typeof works_swiper !== 'undefined' && works_swiper.initialized) works_swiper.update();
    document.dispatchEvent(new Event('works:loaded'));
    status.textContent = published.length ? '' : '공개된 작품이 없습니다.';
  } catch {
    status.textContent = '작품을 불러오지 못했습니다. 잠시 후 새로고침해 주세요.';
  }
})();

(async () => {
  const form = document.getElementById('guestbook-form');
  const status = document.getElementById('guestbook-status');
  const button = form.querySelector('button');
  let widget;
  try {
    const response = await fetch('/api/guestbook');
    if (!response.ok) throw new Error();
    const config = await response.json();
    if (!config.available) throw new Error();
    if (config.siteKey) {
      const script = document.createElement('script');
      script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';
      await new Promise((resolve, reject) => { script.onload = resolve; script.onerror = reject; document.head.appendChild(script); });
      widget = window.turnstile.render('#guestbook-turnstile', {
        sitekey: config.siteKey, action: 'guestbook',
        callback: () => { button.disabled = false; },
        'expired-callback': () => { button.disabled = true; },
        'error-callback': () => { button.disabled = true; status.textContent = '보안 확인을 다시 시도해 주세요.'; }
      });
    } else button.disabled = false;
    status.textContent = '메시지는 관리자에게 전달되며 이 화면에는 공개되지 않습니다.';
  } catch {
    status.textContent = '방명록은 Cloudflare 배포와 서버 설정 후 사용할 수 있습니다.';
    return;
  }
  form.addEventListener('submit', async event => {
    event.preventDefault(); if (button.disabled) return;
    button.disabled = true; status.textContent = '전송 중입니다…';
    const data = new FormData(form);
    try {
      const response = await fetch('/api/guestbook', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: data.get('name'), message: data.get('message'), website: data.get('website'),
          turnstileToken: widget === undefined ? '' : window.turnstile.getResponse(widget) })
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || '전송하지 못했습니다. 잠시 후 다시 시도해 주세요.');
      form.reset(); status.textContent = '메시지가 전달되었습니다. 감사합니다!';
    } catch (error) { status.textContent = error.message; }
    finally {
      if (widget !== undefined) window.turnstile.reset(widget);
      else button.disabled = false;
    }
  });
  const scroll = document.querySelector('.contact-scroll');
  scroll.addEventListener('wheel', event => {
    const atTop = scroll.scrollTop <= 1;
    const atBottom = scroll.scrollTop + scroll.clientHeight >= scroll.scrollHeight - 1;
    if ((event.deltaY < 0 && !atTop) || (event.deltaY > 0 && !atBottom)) event.stopPropagation();
  }, { passive: true });
  scroll.addEventListener('touchmove', event => event.stopPropagation(), { passive: true });
})();
