/**
 * ============================================================================
 * WAKTU NANTI — PORTFOLIO, FROSTED LIGHTBOX & LANDSCAPE/PORTRAIT VIDEO ENGINE
 * ============================================================================
 */

const CONFIG = {
  whatsappNumber: '6287796487390',
  publishedCsvUrl:
    'https://docs.google.com/spreadsheets/d/e/2PACX-1vQi7IvaH0ii90aVrXLk5UT15xuBB20ODCbvbReExll7ZC27lCnxqUiNeq4jHG_l9BPZLSwVH-YDJrhC/pub?output=csv'
};

// Data Fallback jika CSV sedang offline
const FALLBACK_PHOTOS = [
  {
    id: 'fallback-1',
    title: 'Wisuda UB - Kak Selma',
    category: 'Wisuda',
    image: 'https://framerusercontent.com/images/4QgnUdMDiSDZJS65ZAaDyM9Wdc.png',
    gallery: ['https://framerusercontent.com/images/4QgnUdMDiSDZJS65ZAaDyM9Wdc.png']
  },
  {
    id: 'fallback-2',
    title: 'Sepenggal Cerita Berdua',
    category: 'Pre-wedding',
    image: 'https://framerusercontent.com/images/QUS52EcwCSRIpBDtsoAxEOX67wI.png',
    gallery: ['https://framerusercontent.com/images/QUS52EcwCSRIpBDtsoAxEOX67wI.png']
  },
  {
    id: 'fallback-3',
    title: 'Pre-Sumpah Shoot Malang',
    category: 'Group Shoot',
    image: 'https://framerusercontent.com/images/rsVtcDYb6JoDXQt1CESvcob2dnw.png',
    gallery: ['https://framerusercontent.com/images/rsVtcDYb6JoDXQt1CESvcob2dnw.png']
  }
];

const FALLBACK_VIDEOS = [
  {
    id: 'vid-1',
    title: 'The Wedding Film — Raka & Dinda',
    category: 'Wedding Film',
    thumbnail: 'https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=1200&q=80',
    videoUrl: 'https://assets.mixkit.co/videos/preview/mixkit-bride-and-groom-walking-on-the-beach-42652-large.mp4',
    orientation: 'landscape'
  },
  {
    id: 'vid-2',
    title: 'Aftermovie Wisuda — Universitas Brawijaya',
    category: 'Wisuda',
    thumbnail: 'https://framerusercontent.com/images/4QgnUdMDiSDZJS65ZAaDyM9Wdc.png',
    videoUrl: 'https://assets.mixkit.co/videos/preview/mixkit-girl-in-neon-light-1232-large.mp4',
    orientation: 'portrait'
  },
  {
    id: 'vid-3',
    title: 'Group Shoot & Pre-Sumpah — Malang',
    category: 'Group Shoot',
    thumbnail: 'https://framerusercontent.com/images/rsVtcDYb6JoDXQt1CESvcob2dnw.png',
    videoUrl: 'https://assets.mixkit.co/videos/preview/mixkit-friends-laughing-together-in-nature-42802-large.mp4',
    orientation: 'portrait'
  }
];

let allPhotos = [...FALLBACK_PHOTOS];
let allVideos = [...FALLBACK_VIDEOS];
let activeCategory = 'All';

let currentClientSession = null;
let currentLightboxList = [];
let currentLightboxIndex = 0;

let scrollRevealObserver = null;

/**
 * ============================================================================
 * 1. SMOOTH SCROLL REVEAL ENGINE
 * ============================================================================
 */
function initScrollReveal() {
  if (!('IntersectionObserver' in window)) {
    document.querySelectorAll('.reveal-on-scroll').forEach((el) => el.classList.add('is-visible'));
    return;
  }

  if (!scrollRevealObserver) {
    scrollRevealObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible');
            scrollRevealObserver.unobserve(entry.target);
          }
        });
      },
      {
        threshold: 0.08,
        rootMargin: '0px 0px -24px 0px'
      }
    );
  }

  document.querySelectorAll('.reveal-on-scroll:not(.is-visible)').forEach((el) => {
    scrollRevealObserver.observe(el);
  });
}

/**
 * ============================================================================
 * 2. UTILITAS PARSER GOOGLE DRIVE & CSV
 * ============================================================================
 */
function extractDriveFileId(url) {
  if (!url || typeof url !== 'string') return null;
  if (url.includes('/folders/')) return null;

  const matchD = url.match(/\/(?:file\/)?d\/([a-zA-Z0-9_-]{15,})/);
  if (matchD && matchD[1]) return matchD[1];

  const matchId = url.match(/[?&]id=([a-zA-Z0-9_-]{15,})/);
  if (matchId && matchId[1]) return matchId[1];

  return null;
}

function formatDriveImageUrl(url) {
  if (!url || typeof url !== 'string') return '';
  const trimmed = url.trim();
  if (!trimmed) return '';

  const fileId = extractDriveFileId(trimmed);
  if (fileId) {
    return `https://lh3.googleusercontent.com/d/${fileId}`;
  }
  if (/^[a-zA-Z0-9_-]{25,45}$/.test(trimmed)) {
    return `https://lh3.googleusercontent.com/d/${trimmed}`;
  }
  if (trimmed.includes('/folders/')) {
    return '';
  }
  return trimmed;
}

function formatDriveVideoPreviewUrl(url) {
  if (!url || typeof url !== 'string') return '';
  const trimmed = url.trim();
  const fileId = extractDriveFileId(trimmed);
  if (fileId) {
    return `https://drive.google.com/file/d/${fileId}/preview`;
  }
  return trimmed;
}

function mergeUniquePhotoUrls(existingList, newUrls) {
  const result = [...existingList];
  const seenKeys = new Set(existingList.map((u) => extractDriveFileId(u) || u.trim()));

  newUrls.forEach((url) => {
    if (!url) return;
    const key = extractDriveFileId(url) || url.trim();
    if (!seenKeys.has(key)) {
      seenKeys.add(key);
      result.push(url);
    }
  });

  return result;
}

function parseGalleryCell(rawImageCell, rawDriveCell) {
  const combinedText = `${rawImageCell || ''}\n${rawDriveCell || ''}`;
  const tokens = combinedText
    .split(/[\n,;|\s]+/)
    .map((t) => t.trim())
    .filter(Boolean);

  const photoUrls = [];

  tokens.forEach((token) => {
    if (token.includes('/folders/')) return;
    const cleaned = token.replace(/\/+$/, '');
    if (
      cleaned === 'https://drive.google.com' ||
      cleaned === 'http://drive.google.com' ||
      cleaned === '-'
    ) {
      return;
    }

    if (token.startsWith('http') || /^[a-zA-Z0-9_-]{25,45}$/.test(token)) {
      const directImg = formatDriveImageUrl(token);
      if (directImg) {
        photoUrls.push(directImg);
      }
    }
  });

  const primaryCover =
    formatDriveImageUrl((rawImageCell || '').split(/[\n,;|]+/)[0]) || photoUrls[0] || '';
  const uniqueGallery = mergeUniquePhotoUrls(primaryCover ? [primaryCover] : [], photoUrls);

  return {
    coverImage: primaryCover || uniqueGallery[0] || '',
    gallery: uniqueGallery
  };
}

function parseCSV(csvText) {
  const rows = [];
  let currentRow = [];
  let currentVal = '';
  let inQuotes = false;

  for (let i = 0; i < csvText.length; i++) {
    const char = csvText[i];
    const nextChar = csvText[i + 1];

    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        currentVal += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      currentRow.push(currentVal.trim());
      currentVal = '';
    } else if ((char === '\r' || char === '\n') && !inQuotes) {
      if (char === '\r' && nextChar === '\n') i++;
      currentRow.push(currentVal.trim());
      if (currentRow.some((cell) => cell !== '')) {
        rows.push(currentRow);
      }
      currentRow = [];
      currentVal = '';
    } else {
      currentVal += char;
    }
  }

  if (currentVal !== '' || currentRow.length > 0) {
    currentRow.push(currentVal.trim());
    if (currentRow.some((cell) => cell !== '')) {
      rows.push(currentRow);
    }
  }

  if (rows.length < 2) return [];

  const headers = rows[0].map((h) => h.toLowerCase().replace(/[^a-z0-9_]/g, ''));
  return rows.slice(1).map((row, idx) => {
    const obj = { _rowIndex: idx };
    headers.forEach((h, colIdx) => {
      obj[h] = row[colIdx] !== undefined ? row[colIdx] : '';
    });
    return obj;
  });
}

function normalizeCategory(rawCat) {
  if (!rawCat) return 'Wisuda';
  const lower = rawCat.toLowerCase().trim();
  if (lower.includes('wisuda') || lower.includes('grad')) return 'Wisuda';
  if (lower.includes('group') || lower.includes('sumpah') || lower.includes('grup')) return 'Group Shoot';
  if (lower.includes('pre') || lower.includes('wedding') || lower.includes('couple')) return 'Pre-wedding';
  if (lower.includes('video') || lower.includes('reel') || lower.includes('motion') || lower.includes('film')) return 'Video';
  return rawCat.trim();
}

// Deteksi awal orientasi video dari kolom Type, Category, atau Judul
function detectInitialOrientation(typeStr, titleStr, categoryStr) {
  const combined = `${typeStr} ${titleStr} ${categoryStr}`.toLowerCase();
  if (
    combined.includes('landscape') ||
    combined.includes('16:9') ||
    combined.includes('horizontal') ||
    combined.includes('cinema') ||
    combined.includes('wedding film') ||
    combined.includes('aftermovie')
  ) {
    return 'landscape';
  }
  if (combined.includes('portrait') || combined.includes('9:16') || combined.includes('reel')) {
    return 'portrait';
  }
  return 'auto'; // Akan dideteksi otomatis dari rasio asli thumbnail Google Drive saat gambar dimuat
}

/**
 * ============================================================================
 * 3. FETCH DATA DARI GOOGLE SHEETS CSV
 * ============================================================================
 */
async function loadPortfolioFromGoogleSheets() {
  const statusWrap = document.getElementById('cms-status');
  const statusText = document.getElementById('cms-status-text');

  try {
    if (statusWrap && statusText) {
      statusWrap.classList.remove('hidden');
      statusText.textContent = 'Menyinkronkan galeri dari Google Sheets...';
    }

    const response = await fetch(`${CONFIG.publishedCsvUrl}&t=${Date.now()}`, { cache: 'no-store' });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);

    const csvText = await response.text();
    const records = parseCSV(csvText);

    if (records.length > 0) {
      const clientSessionsMap = new Map();
      const parsedVideos = [];

      records.forEach((item, index) => {
        const title = (item.title || item.judul || item.lokasi || '').trim();
        if (!title) return;

        const rawCategory = item.category || item.kategori || 'Wisuda';
        const category = normalizeCategory(rawCategory);

        const rawImage = item.image || item.foto || item.thumbnail || '';
        const rawDrive =
          item.drive_link ||
          item.drivelink ||
          item.folder ||
          item.gallery ||
          item.galeri ||
          item.semua_foto ||
          '';
        const extraPhotosCol = item.photos || item.foto_lengkap || item.list_foto || '';
        const type = (item.type || item.tipe || '').toLowerCase();

        // Jika baris adalah Video (baik Video Landscape maupun Portrait)
        if (category === 'Video' || type.includes('video')) {
          if (!rawDrive && !rawImage) return;
          const videoSourceUrl = rawDrive || rawImage;
          const thumbUrl = formatDriveImageUrl(rawImage || videoSourceUrl) || FALLBACK_VIDEOS[0].thumbnail;

          parsedVideos.push({
            id: `sheet-vid-${index}`,
            title,
            category: rawCategory && rawCategory.toLowerCase() !== 'video' ? rawCategory : 'Motion Film',
            thumbnail: thumbUrl,
            videoUrl: videoSourceUrl,
            orientation: detectInitialOrientation(type, title, rawCategory)
          });
          return;
        }

        const { coverImage, gallery } = parseGalleryCell(
          rawImage,
          `${rawDrive}\n${extraPhotosCol}`
        );

        if (!coverImage && gallery.length === 0) return;

        const sessionKey = `${category.toLowerCase()}__${title.toLowerCase()}`;
        if (clientSessionsMap.has(sessionKey)) {
          const existing = clientSessionsMap.get(sessionKey);
          existing.gallery = mergeUniquePhotoUrls(existing.gallery, gallery);
        } else {
          clientSessionsMap.set(sessionKey, {
            id: `sheet-session-${index}`,
            title,
            category,
            image: coverImage || gallery[0] || '',
            gallery: gallery.length > 0 ? gallery : coverImage ? [coverImage] : []
          });
        }
      });

      const groupedSessions = Array.from(clientSessionsMap.values());
      if (groupedSessions.length > 0) {
        allPhotos = groupedSessions;
      }
      if (parsedVideos.length > 0) {
        allVideos = parsedVideos;
      }
    }
  } catch (err) {
    console.warn('Menggunakan data fallback:', err.message);
  } finally {
    if (statusWrap) {
      statusWrap.classList.add('hidden');
    }
    renderPhotoGallery();
    renderVideoReels();
  }
}

/**
 * ============================================================================
 * 4. RENDER GALERI POLAROID
 * ============================================================================
 */
function renderPhotoGallery() {
  const grid = document.getElementById('photo-masonry-grid');
  const emptyState = document.getElementById('empty-gallery-state');
  if (!grid) return;

  const filtered =
    activeCategory === 'All'
      ? allPhotos
      : allPhotos.filter((item) => item.category.toLowerCase() === activeCategory.toLowerCase());

  grid.innerHTML = '';

  if (filtered.length === 0) {
    emptyState?.classList.remove('hidden');
    return;
  }
  emptyState?.classList.add('hidden');

  filtered.forEach((sessionItem, idx) => {
    const photoCount = sessionItem.gallery ? sessionItem.gallery.length : 1;
    const indexNumber = String(idx + 1).padStart(2, '0');

    const figure = document.createElement('figure');
    figure.className =
      'masonry-item reveal-on-scroll group relative bg-white/85 backdrop-blur-xs p-1.5 sm:p-2.5 border border-black/10 rounded-xs shadow-2xs hover:shadow-xl transition-all duration-500 cursor-pointer';
    figure.style.transitionDelay = `${(idx % 4) * 60}ms`;
    figure.setAttribute('tabindex', '0');
    figure.setAttribute('role', 'button');
    figure.setAttribute('aria-label', `${sessionItem.category} - ${sessionItem.title}`);

    figure.innerHTML = `
      <div class="relative overflow-hidden bg-neutral-200">
        <img
          src="${sessionItem.image}"
          alt="${sessionItem.title}"
          loading="lazy"
          onerror="this.onerror=null;this.src='https://framerusercontent.com/images/4QgnUdMDiSDZJS65ZAaDyM9Wdc.png';"
          class="photo-card-img w-full h-auto object-cover block"
        />
        <span class="absolute top-2 right-2 sm:top-2.5 sm:right-2.5 bg-black/65 backdrop-blur-md text-white text-[9px] sm:text-[10px] tracking-wider uppercase font-medium px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-full border border-white/15">
          ${photoCount} Foto
        </span>

        <div class="absolute inset-0 bg-black/25 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
          <span class="bg-white/90 backdrop-blur-md text-charcoal text-[10px] sm:text-[11px] font-medium tracking-wider uppercase px-3.5 py-1.5 rounded-full shadow-lg transform translate-y-2 group-hover:translate-y-0 transition-transform duration-300">
            Lihat Album ↗
          </span>
        </div>
      </div>

      <figcaption class="pt-2 pb-0.5 px-1">
        <div class="flex items-center justify-between gap-1 text-[8px] sm:text-[10px] uppercase tracking-[0.16em] text-warmgray mb-0.5">
          <span class="truncate">${sessionItem.category}</span>
          <span class="font-mono text-warmgray/65 shrink-0">NO.${indexNumber}</span>
        </div>
        <h3 class="font-serif text-[15px] sm:text-lg text-charcoal leading-snug line-clamp-2 group-hover:italic transition-all">
          ${sessionItem.title}
        </h3>
      </figcaption>
    `;

    figure.addEventListener('click', () => openClientLightbox(sessionItem));
    figure.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        openClientLightbox(sessionItem);
      }
    });

    grid.appendChild(figure);
  });

  initScrollReveal();
}

function setCategoryFilter(category, shouldScroll = false) {
  activeCategory = category;

  document.querySelectorAll('.filter-pill').forEach((btn) => {
    btn.classList.toggle('active', btn.getAttribute('data-filter') === category);
  });

  document.querySelectorAll('.nav-cat-btn').forEach((btn) => {
    btn.classList.toggle('active', btn.getAttribute('data-nav-filter') === category);
  });

  renderPhotoGallery();

  if (shouldScroll) {
    document.getElementById('still-stories')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
}

/**
 * ============================================================================
 * 5. LIGHTBOX SLIDER (DENGAN AMBIENT GLOW DINAMIS & FROSTED GLASS)
 * ============================================================================
 */
function openClientLightbox(sessionItem) {
  currentClientSession = sessionItem;
  currentLightboxList =
    sessionItem.gallery && sessionItem.gallery.length > 0
      ? [...sessionItem.gallery]
      : [sessionItem.image];
  currentLightboxIndex = 0;

  const modal = document.getElementById('lightbox-modal');
  if (!modal) return;

  modal.classList.remove('hidden');
  modal.classList.add('flex');
  document.body.style.overflow = 'hidden';

  updateLightboxView(true);
}

function closeLightbox() {
  const modal = document.getElementById('lightbox-modal');
  if (!modal) return;

  modal.classList.add('hidden');
  modal.classList.remove('flex');
  document.body.style.overflow = '';
}

function showPrevPhoto() {
  if (currentLightboxList.length <= 1) return;
  currentLightboxIndex =
    (currentLightboxIndex - 1 + currentLightboxList.length) % currentLightboxList.length;
  updateLightboxView(true);
}

function showNextPhoto() {
  if (currentLightboxList.length <= 1) return;
  currentLightboxIndex = (currentLightboxIndex + 1) % currentLightboxList.length;
  updateLightboxView(true);
}

function updateLightboxView(updateMainImage = true) {
  if (!currentClientSession || currentLightboxList.length === 0) return;

  const currentPhotoUrl = currentLightboxList[currentLightboxIndex];
  const mainImg = document.getElementById('lightbox-main-img');
  const ambientBg = document.getElementById('lightbox-ambient-bg');
  const metaText = document.getElementById('lightbox-meta');
  const metaMobile = document.getElementById('lightbox-meta-mobile');
  const counterText = document.getElementById('lightbox-counter');
  const thumbsContainer = document.getElementById('lightbox-thumbnails');
  const driveInfo = document.getElementById('lightbox-drive-info');
  const prevBtn = document.getElementById('lightbox-prev');
  const nextBtn = document.getElementById('lightbox-next');

  if (updateMainImage && mainImg) {
    mainImg.style.opacity = '0.35';
    mainImg.src = currentPhotoUrl;
    mainImg.alt = `${currentClientSession.category} — ${currentClientSession.title} (${currentLightboxIndex + 1})`;
    mainImg.onload = () => {
      mainImg.style.opacity = '1';
    };
  }

  // Update Ambient Blur Glow di Belakang Foto
  if (ambientBg) {
    ambientBg.src = currentPhotoUrl;
  }

  const totalCount = currentLightboxList.length;
  if (prevBtn && nextBtn) {
    prevBtn.style.display = totalCount > 1 ? 'flex' : 'none';
    nextBtn.style.display = totalCount > 1 ? 'flex' : 'none';
  }

  const fullMetaLabel = `${currentClientSession.category} — ${currentClientSession.title} — ${totalCount} Foto`;
  if (metaText) metaText.textContent = fullMetaLabel;
  if (metaMobile) metaMobile.textContent = fullMetaLabel;
  if (counterText) counterText.textContent = `${currentLightboxIndex + 1} / ${totalCount}`;

  if (thumbsContainer) {
    thumbsContainer.innerHTML = '';
    currentLightboxList.forEach((photoUrl, idx) => {
      const thumb = document.createElement('img');
      thumb.src = photoUrl;
      thumb.alt = `${currentClientSession.title} - Foto ${idx + 1}`;
      thumb.loading = 'lazy';
      thumb.className = `lb-thumb ${idx === currentLightboxIndex ? 'active' : ''}`;
      thumb.addEventListener('click', () => {
        currentLightboxIndex = idx;
        updateLightboxView(true);
      });
      thumbsContainer.appendChild(thumb);
    });

    const activeThumb = thumbsContainer.querySelector('.lb-thumb.active');
    if (activeThumb) {
      activeThumb.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
    }
  }

  if (driveInfo) {
    driveInfo.textContent =
      totalCount > 1
        ? `Menampilkan foto ${currentLightboxIndex + 1} dari ${totalCount} — Geser atau klik thumbnail di atas`
        : currentClientSession.title;
  }
}

/**
 * ============================================================================
 * 6. RENDER VIDEO (MENDUKUNG LANDSCAPE 16:9 & PORTRAIT 9:16 OTOMATIS)
 * ============================================================================
 */
function renderVideoReels() {
  const container = document.getElementById('video-reels-container');
  if (!container) return;

  container.innerHTML = '';

  allVideos.forEach((vid) => {
    const card = document.createElement('div');
    const isGoogleDriveVideo = vid.videoUrl && vid.videoUrl.includes('drive.google.com');
    const previewUrl = formatDriveVideoPreviewUrl(vid.videoUrl);

    // Fungsi pengatur class kartu sesuai orientasi (Landscape 16:9 vs Portrait 9:16)
    const applyOrientationLayout = (mode) => {
      const badgeEl = card.querySelector('.video-format-badge');
      if (mode === 'landscape') {
        card.className =
          'relative w-full sm:col-span-2 lg:col-span-2 aspect-video bg-neutral-900 rounded-xs overflow-hidden group border border-white/15 shadow-2xl transition-all duration-500';
        if (badgeEl) badgeEl.textContent = '16:9 Cinema';
      } else {
        card.className =
          'relative w-full sm:col-span-1 lg:col-span-1 aspect-[9/16] bg-neutral-900 rounded-xs overflow-hidden group border border-white/15 shadow-2xl transition-all duration-500';
        if (badgeEl) badgeEl.textContent = '9:16 Reel';
      }
    };

    const initialMode = vid.orientation === 'landscape' ? 'landscape' : 'portrait';

    card.innerHTML = `
      <div class="video-cover-layer absolute inset-0 z-10 cursor-pointer">
        <img
          src="${vid.thumbnail}"
          alt="${vid.title}"
          loading="lazy"
          onerror="this.onerror=null;this.src='https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=1000&q=80';"
          class="video-thumb-img w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
        />
        <div class="absolute inset-0 bg-gradient-to-t from-black/90 via-black/25 to-black/25 flex flex-col justify-between p-4 sm:p-5">
          <div class="flex items-center justify-between gap-2">
            <span class="text-[10px] uppercase tracking-[0.2em] bg-white/15 backdrop-blur-md text-white px-3 py-1 rounded-full border border-white/20 truncate">
              ${vid.category}
            </span>
            <span class="video-format-badge text-[10px] text-white/80 uppercase tracking-widest shrink-0">
              ${initialMode === 'landscape' ? '16:9 Cinema' : '9:16 Reel'}
            </span>
          </div>
          <div class="self-center my-auto w-14 h-14 rounded-full bg-white/20 hover:bg-white hover:text-charcoal backdrop-blur-md border border-white/40 flex items-center justify-center text-white transition-all transform group-hover:scale-110 shadow-lg">
            <svg class="w-6 h-6 fill-current ml-0.5" viewBox="0 0 24 24">
              <path d="M8 5v14l11-7z" />
            </svg>
          </div>
          <div>
            <h3 class="font-serif text-xl sm:text-2xl text-white leading-snug">${vid.title}</h3>
            <p class="text-[11px] text-white/70 mt-0.5">Klik untuk memutar video</p>
          </div>
        </div>
      </div>
      <div class="video-player-slot w-full h-full bg-black"></div>
    `;

    applyOrientationLayout(initialMode);

    // Deteksi Otomatis Dimensi Asli Video/Thumbnail dari Google Drive
    const thumbImg = card.querySelector('.video-thumb-img');
    if (thumbImg) {
      thumbImg.addEventListener('load', () => {
        if (vid.orientation === 'auto' && thumbImg.naturalWidth && thumbImg.naturalHeight) {
          const detected =
            thumbImg.naturalWidth > thumbImg.naturalHeight ? 'landscape' : 'portrait';
          applyOrientationLayout(detected);
        }
      });
    }

    const coverLayer = card.querySelector('.video-cover-layer');
    const playerSlot = card.querySelector('.video-player-slot');

    coverLayer.addEventListener('click', () => {
      coverLayer.classList.add('hidden');
      if (isGoogleDriveVideo) {
        playerSlot.innerHTML = `
          <iframe
            src="${previewUrl}"
            class="w-full h-full border-0"
            allow="autoplay; encrypted-media; fullscreen"
            allowfullscreen
            title="${vid.title}"
          ></iframe>
        `;
      } else {
        playerSlot.innerHTML = `
          <video
            src="${vid.videoUrl}"
            class="w-full h-full object-contain bg-black"
            controls
            autoplay
            playsinline
          ></video>
        `;
      }
    });

    container.appendChild(card);
  });
}

/**
 * ============================================================================
 * 7. INISIALISASI EVENT LISTENERS
 * ============================================================================
 */
document.addEventListener('DOMContentLoaded', () => {
  initScrollReveal();
  renderPhotoGallery();
  renderVideoReels();
  loadPortfolioFromGoogleSheets();

  document.querySelectorAll('[data-nav-filter]').forEach((btn) => {
    btn.addEventListener('click', () => {
      setCategoryFilter(btn.getAttribute('data-nav-filter'), true);
    });
  });

  const scrollToVideoReels = () => {
    document.getElementById('motion-stories')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };
  document.getElementById('nav-video-btn')?.addEventListener('click', scrollToVideoReels);
  document.getElementById('nav-video-btn-mobile')?.addEventListener('click', scrollToVideoReels);

  document.querySelectorAll('[data-hero-filter]').forEach((btn) => {
    btn.addEventListener('click', () => {
      setCategoryFilter(btn.getAttribute('data-hero-filter'), true);
    });
  });

  document.querySelectorAll('[data-filter]').forEach((btn) => {
    btn.addEventListener('click', () => {
      setCategoryFilter(btn.getAttribute('data-filter'), false);
    });
  });

  const bwToggleBtn = document.getElementById('bw-mode-toggle');
  const bwLabel = document.getElementById('bw-mode-label');
  bwToggleBtn?.addEventListener('click', () => {
    const isBw = document.body.classList.toggle('bw-darkroom-mode');
    if (bwLabel) {
      bwLabel.textContent = isBw ? 'Mode BW: On' : 'Mode BW: Off';
    }
    bwToggleBtn.classList.toggle('bg-charcoal', isBw);
    bwToggleBtn.classList.toggle('text-white', isBw);
    bwToggleBtn.classList.toggle('bg-white/80', !isBw);
  });

  document.getElementById('back-to-top-btn')?.addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });

  document.getElementById('lightbox-close-btn')?.addEventListener('click', closeLightbox);
  document.getElementById('lightbox-brand-close')?.addEventListener('click', closeLightbox);
  document.getElementById('lightbox-back-gallery')?.addEventListener('click', closeLightbox);
  document.getElementById('lightbox-prev')?.addEventListener('click', showPrevPhoto);
  document.getElementById('lightbox-next')?.addEventListener('click', showNextPhoto);

  // Klik di ruang kosong kiri/kanan foto utama menutup Lightbox
  document.getElementById('lightbox-backdrop-click')?.addEventListener('click', (e) => {
    if (e.target.id === 'lightbox-backdrop-click') {
      closeLightbox();
    }
  });

  const thumbsStrip = document.getElementById('lightbox-thumbnails');
  thumbsStrip?.addEventListener(
    'wheel',
    (e) => {
      if (Math.abs(e.deltaY) > Math.abs(e.deltaX)) {
        e.preventDefault();
        thumbsStrip.scrollLeft += e.deltaY;
      }
    },
    { passive: false }
  );

  document.addEventListener('keydown', (e) => {
    const modal = document.getElementById('lightbox-modal');
    if (!modal || modal.classList.contains('hidden')) return;
    if (e.key === 'Escape') closeLightbox();
    if (e.key === 'ArrowLeft') showPrevPhoto();
    if (e.key === 'ArrowRight') showNextPhoto();
  });

  const touchArea = document.getElementById('lightbox-touch-area');
  let touchStartX = 0;

  touchArea?.addEventListener(
    'touchstart',
    (e) => {
      touchStartX = e.changedTouches[0].screenX;
    },
    { passive: true }
  );

  touchArea?.addEventListener(
    'touchend',
    (e) => {
      const diff = touchStartX - e.changedTouches[0].screenX;
      if (Math.abs(diff) > 45) {
        if (diff > 0) showNextPhoto();
        else showPrevPhoto();
      }
    },
    { passive: true }
  );
});
