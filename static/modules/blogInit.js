// 외부 링크는 새 창에서 열기 - https://mtm.dev/external-links-new-tab
const links = document.querySelectorAll(".post-content a[href^='https://'], .post-content a[href^='http://']")
const host = window.location.hostname

const isInternalLink = link => new URL(link).hostname === host

links.forEach(link => {
  if (isInternalLink(link)) return

  link.setAttribute("target", "_blank")
  link.setAttribute("rel", "noopener")
});

// 이미지 그리드의 경우 불필요한 p 삭제
document.querySelectorAll('.image-grid p').forEach(p => {
  if (!p.children.length)
    p.remove()
});

// 이미지 슬라이더
const images = Array.from(document.querySelectorAll('.post-content img'));
let imageSlider;
images.forEach((img, idx) => {
  img.style.cursor = 'pointer';
  img.addEventListener('click', (e) => {
    e.preventDefault();
    e.stopPropagation();

    if (imageSlider) {
      imageSlider.activeIndex = idx;
      document.querySelector('#postImageSlider').style.display = '';
      requestAnimationFrame(() => document.getElementById('postImageSlider').style.opacity = 1);
    } else {
      const html = `
        <div
          id="postImageSlider"
          style="--swiper-navigation-color: #fff; --swiper-pagination-color: #fff; --swiper-pagination-bullet-inactive-color: #fff;"
          class="swiper"
        >
          <div class="swiper-wrapper">
            ${images.map(img => `
              <div class="swiper-slide">
                <div class="swiper-zoom-container">
                  <img data-src="${img.getAttribute('data-src') || img.src}" alt="${img.alt}" class="swiper-lazy">
                  <div class="swiper-lazy-preloader swiper-lazy-preloader-white"></div>
                </div>
                <figcaption>${img.alt}</figcaption>
              </div>
            `).join('')}
          </div>
          <div class="swiper-button-prev"></div>
          <div class="swiper-button-next"></div>
          <div class="swiper-pagination"></div>
          <div
            class="swiper-close" tabindex="0" role="button" aria-label="닫기" aria-disabled="false"
            onclick="
              document.querySelector('#postImageSlider').style.opacity = 0;
              setTimeout(() => document.querySelector('#postImageSlider').style.display = 'none', 250);
            "
          >✕</div>
        </div>
      `;
      document.body.insertAdjacentHTML('beforeend', html);
      requestAnimationFrame(() => document.getElementById('postImageSlider').style.opacity = 1);

      imageSlider = new Swiper('#postImageSlider', {
        initialSlide: idx,
        zoom: true,
        lazy: true,
        navigation: {
          nextEl: ".swiper-button-next",
          prevEl: ".swiper-button-prev",
        },
        pagination: {
          el: ".swiper-pagination",
          clickable: true,
        },
      });
    }
  });
});
const onEsc = (e) => {
  const slider = document.querySelector('#postImageSlider');
  if (e.key === 'Escape' && slider) {
    slider.style.opacity = 0;
    setTimeout(() => slider.style.display = 'none', 250);
  }
};
document.documentElement.addEventListener('keydown', onEsc);


// 이전에 설치된 서비스 워커 제거
navigator.serviceWorker.getRegistrations().then(registrations => {
  for(let registration of registrations) {
    registration.unregister()
  } 
})
