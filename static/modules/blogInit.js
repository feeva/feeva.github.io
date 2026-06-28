// 외부 링크는 새 창에서 열기 - https://mtm.dev/external-links-new-tab
const links = document.querySelectorAll(
  ".post-content a[href^='https://'], .post-content a[href^='http://']",
);
const host = window.location.hostname;

const isInternalLink = (link) => new URL(link).hostname === host;

links.forEach((link) => {
  if (isInternalLink(link)) return;

  link.setAttribute('target', '_blank');
  link.setAttribute('rel', 'noopener');
});

// 이미지 그리드의 경우 불필요한 p 삭제
document.querySelectorAll('.image-grid p').forEach((p) => {
  if (!p.children.length) p.remove();
});

const blogTimeZone = 'Asia/Seoul';
const dateFormatter = new Intl.DateTimeFormat(navigator.languages, {
  timeZone: blogTimeZone,
  dateStyle: 'medium',
});

document.querySelectorAll('time.local-date').forEach((time) => {
  const value = time.getAttribute('datetime');
  if (!value) return;

  const date = /^\d{4}-\d{2}-\d{2}$/.test(value)
    ? new Date(`${value}T00:00:00+09:00`)
    : new Date(value);

  if (Number.isNaN(date.getTime())) return;

  time.textContent = dateFormatter.format(date).replace(/\.$/, '');
});

// 글 목차
const postContent = document.querySelector('.post-content');
const postToc = document.querySelector('.post-toc');
const tocNav = postToc?.querySelector('nav');
const headings = postContent
  ? Array.from(postContent.querySelectorAll('h2, h3'))
  : [];

const headingIdCounts = new Map();
const slugifyHeading = (value) => {
  return (
    value
      .trim()
      .toLowerCase()
      .replace(/[^\w가-힣]+/g, '-')
      .replace(/^-+|-+$/g, '') || 'section'
  );
};
const makeUniqueHeadingId = (value) => {
  const base = value || 'section';
  const count = (headingIdCounts.get(base) || 0) + 1;

  headingIdCounts.set(base, count);
  return count === 1 ? base : `${base}-${count}`;
};

if (postToc && tocNav && headings.length >= 5) {
  const links = headings.map((heading) => {
    heading.id = makeUniqueHeadingId(
      heading.id || slugifyHeading(heading.textContent || ''),
    );

    const link = document.createElement('a');
    link.href = `#${encodeURIComponent(heading.id)}`;
    link.textContent = heading.textContent;
    link.className = `toc-link toc-${heading.tagName.toLowerCase()}`;
    tocNav.appendChild(link);

    return { heading, link };
  });

  postToc.hidden = false;
  if (window.matchMedia('(min-width: 1440px)').matches) {
    postToc.open = true;
  }

  const setActiveTocLink = (activeHeading) => {
    links.forEach(({ heading, link }) => {
      link.toggleAttribute('aria-current', heading === activeHeading);
    });
  };

  if ('IntersectionObserver' in window) {
    const visibleHeadings = new Map();
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            visibleHeadings.set(entry.target, entry.intersectionRatio);
          } else {
            visibleHeadings.delete(entry.target);
          }
        });

        const active = links.find(({ heading }) =>
          visibleHeadings.has(heading),
        )?.heading;
        if (active) {
          setActiveTocLink(active);
        }
      },
      {
        rootMargin: '-20% 0px -65% 0px',
        threshold: [0, 1],
      },
    );

    links.forEach(({ heading }) => observer.observe(heading));
  } else {
    setActiveTocLink(links[0].heading);
  }
}

// 이미지 슬라이더
const images = Array.from(document.querySelectorAll('.post-content img'));
let imageSlider;

const closeSlider = () => {
  const slider = document.querySelector('#postImageSlider');
  if (!slider || slider.style.display === 'none') return;
  slider.style.opacity = 0;
  setTimeout(() => (slider.style.display = 'none'), 250);
};

const openSlider = () => {
  const slider = document.getElementById('postImageSlider');
  slider.style.display = '';
  requestAnimationFrame(() => (slider.style.opacity = 1));
  history.pushState({ lightboxOpen: true }, '');
};

window.addEventListener('popstate', (e) => {
  if (!e.state?.lightboxOpen) closeSlider();
});

images.forEach((img, idx) => {
  img.style.cursor = 'pointer';
  img.addEventListener('click', (e) => {
    e.preventDefault();
    e.stopPropagation();

    if (imageSlider) {
      imageSlider.slideTo(idx, 0);
      openSlider();
    } else {
      const html = `
        <div
          id="postImageSlider"
          style="--swiper-navigation-color: #fff; --swiper-pagination-color: #fff; --swiper-pagination-bullet-inactive-color: #fff;"
          class="swiper"
        >
          <div class="swiper-wrapper">
            ${images
              .map(
                (img) => `
              <div class="swiper-slide">
                <div class="swiper-zoom-container">
                  <img data-src="${img.getAttribute('data-src') || img.src}" alt="${img.alt}" class="swiper-lazy">
                  <div class="swiper-lazy-preloader swiper-lazy-preloader-white"></div>
                </div>
                <figcaption>${img.alt}</figcaption>
              </div>
            `,
              )
              .join('')}
          </div>
          <div class="swiper-button-prev"></div>
          <div class="swiper-button-next"></div>
          <div class="swiper-pagination"></div>
          <div
            class="swiper-close" tabindex="0" role="button" aria-label="닫기" aria-disabled="false"
          >✕</div>
        </div>
      `;
      document.body.insertAdjacentHTML('beforeend', html);

      document.querySelector('.swiper-close').addEventListener('click', () => {
        history.back();
      });

      imageSlider = new Swiper('#postImageSlider', {
        initialSlide: idx,
        zoom: true,
        lazy: true,
        navigation: {
          nextEl: '.swiper-button-next',
          prevEl: '.swiper-button-prev',
        },
        pagination: {
          el: '.swiper-pagination',
          clickable: true,
        },
      });

      history.pushState({ lightboxOpen: true }, '');
    }
  });
});

const onEsc = (e) => {
  const slider = document.querySelector('#postImageSlider');
  if (e.key === 'Escape' && slider && slider.style.display !== 'none') {
    history.back();
  }
};
document.documentElement.addEventListener('keydown', onEsc);

// 맨 위로 버튼
const backToTopBtn = document.getElementById('back-to-top');
if (backToTopBtn) {
  const onScroll = () => {
    backToTopBtn.classList.toggle('visible', window.scrollY >= 400);
  };
  window.addEventListener('scroll', onScroll, { passive: true });
  backToTopBtn.addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });
}

// 이전에 설치된 서비스 워커 제거
navigator.serviceWorker.getRegistrations().then((registrations) => {
  for (let registration of registrations) {
    registration.unregister();
  }
});
