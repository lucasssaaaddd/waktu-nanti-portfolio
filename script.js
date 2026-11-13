/**
 * ============================================================================
 * WAKTU NANTI — FULL-WIDTH MASONRY, HORIZONTAL VIDEO SLIDER & AUTO-THUMBNAIL
 * ============================================================================
 */

const CONFIG = {
  whatsappNumber: '6287796487390',
  publishedCsvUrl:
    'https://docs.google.com/spreadsheets/d/e/2PACX-1vQi7IvaH0ii90aVrXLk5UT15xuBB20ODCbvbReExll7ZC27lCnxqUiNeq4jHG_l9BPZLSwVH-YDJrhC/pub?output=csv'
};

const FALLBACK_COVERS = {
  Wedding: [
    'https://framerusercontent.com/images/QUS52EcwCSRIpBDtsoAxEOX67wI.png',
    'https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1511285560929-80b456fea0bc?auto=format&fit=crop&w=1200&q=80'
  ],
  Wisuda: [
    'https://framerusercontent.com/images/4QgnUdMDiSDZJS65ZAaDyM9Wdc.png',
    'https://images.unsplash.com/photo-1523050854058-8df90110c9f1?auto=format&fit=crop&w=1200&q=80'
  ],
  'Group Shoot': [
    'https://framerusercontent.com/images/rsVtcDYb6JoDXQt1CESvcob2dnw.png',
    'https://images.unsplash.com/photo-1529156069898-49953e39b3ac?auto=format&fit=crop&w=1200&q=80'
  ],
  Portrait: [
    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=1200&q=80'
  ],
  Dokumentasi: [
    'https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&w=1200&q=80'
  ]
};

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
    category: 'Wedding',
    image: 'https://framerusercontent.com/images/QUS52EcwCSRIpBDtsoAxEOX67wI.png',
    gallery: ['https://framerusercontent.com/images/QUS52EcwCSRIpBDtsoAxEOX67wI.png']
  },
  {
    id: 'fallback-3',
    title: 'Group Shoot Malang',
    category: 'Group Shoot',
    image: 'https://framerusercontent.com/images/rsVtcDYb6JoDXQt1CESvcob2dnw.png',
    gallery: ['https://framerusercontent.com/images/rsVtcDYb6JoDXQt1CESvcob2dnw.png']
  },
  {
    id: 'fallback-4',
    title: 'Kakang Mbakyu Malang & Duta Pariwisata Jatim',
    category: 'Portrait',
    image: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=900&q=80',
    gallery: ['https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=900&q=80']
  },
  {
    id: 'fallback-5',
    title: 'Stage & Concert Documentation',
    category: 'Dokumentasi',
    image: 'https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?auto=format&fit=crop&w=900&q=80',
    gallery: ['https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?auto=format&fit=crop&w=900&q=80']
  }
];

const FALLBACK_VIDEOS = [
  {
    id: 'vid-1',
    title: 'Wedding Film — Sepenggal Cerita Berdua',
    category: 'Wedding Film',
    thumbnail: 'https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=1200&q=80',
    videoUrl: 'https://assets.mixkit.co/videos/preview/mixkit-bride-and-groom-walking-on-the-beach-42652-large.mp4',
    orientation: 'landscape'
  },
  {
    id: 'vid-2',
    title: 'Aftermovie Wisuda — Universitas Brawijaya',
    category: 'Wisuda Film',
    thumbnail: 'https://framerusercontent.com/images/4QgnUdMDiSDZJS65ZAaDyM9Wdc.png',
    videoUrl: 'https://assets.mixkit.co/videos/preview/mixkit-girl-in-neon-light-1232-large.mp4',
    orientation: 'landscape'
  },
  {
    id: 'vid-3',
    title: 'Highlight Event & Stage Documentation',
    category: 'Dokumentasi',
    thumbnail: 'https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?auto=format&fit=crop&w=1200&q=80',
    videoUrl: 'https://assets.mixkit.co/videos/preview/mixkit-friends-laughing-together-in-nature-42802-large.mp4',
    orientation: 'landscape'
  }
];

let allPhotos = [...FALLBACK_PHOTOS];
let allVideos = [...FALLBACK_VIDEOS];
let activeCategory = 'All';

let currentClientSession = null;
let currentLightboxList = [];
let currentLightboxIndex = 0;

let scrollRevealObserver = null;
let lastColumnCount = 0;

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
        threshold: 0.06,
        rootMargin: '0px 0px -20px 0px'
      }
    );
  }

  document.querySelectorAll('.reveal-on-scroll:not(.is-visible)').forEach((el) => {
    scrollRevealObserver.observe(el);
  });
}

/**
 * ============================================================================
 * 2. UTILITAS PARSER GOOGLE DRIVE & DETEKTOR THUMBNAIL HITAM OTOMATIS
 * ============================================================================
 */
function extractDriveFileId(url) {
  if (!url || typeof url !== 'string') return null;
  if (url.includes('/folders/')) return null;

  const matchD = url.match(/\/(?:file\/)?d\/([a-zA-Z0-9_-]{15,})/);
  if (matchD && matchD[1]) return matchD[1];

  const matchId = url.match(/[?&]id=([a-zA-Z0-9_-]{15,})/);
  if (matchId && matchId[1]) return matchId[1];

  if (/^[a-zA-Z0-9_-]{25,45}$/.test(url.trim())) {
    return url.trim();
  }

  return null;
}

function formatDriveImageUrl(url) {
  if (!url || typeof url !== 'string') return '';
  const trimmed = url.trim();
  if (!trimmed || trimmed.includes('/folders/')) return '';

  const fileId = extractDriveFileId(trimmed);
  if (fileId) {
    return `https://lh3.googleusercontent.com/d/${fileId}`;
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

// Label kategori yang rapi untuk pojok kiri atas kartu video
function getVideoDisplayCategory(title) {
  const t = (title || '').toLowerCase();
  if (t.includes('kakang') || t.includes('mbakyu') || t.includes('duta') || t.includes('potrait') || t.includes('portrait')) {
    return 'Portrait';
  }
  if (t.includes('birthday') || t.includes('documentation') || t.includes('dokumentasi') || t.includes('konser') || t.includes('event')) {
    return 'Dokumentasi';
  }
  if (t.includes('wisuda') || t.includes('ub') || t.includes('umm') || t.includes('grad')) {
    return 'Wisuda';
  }
  if (t.includes('group') || t.includes('grup')) {
    return 'Group Shoot';
  }
  return 'Wedding Film';
}

// Pencari Foto Sampul Otomatis dari Galeri Anda (Jika Thumbnail Video Hitam/Kosong)
function getSmartFallbackCoverForVideo(videoItem, videoIndex) {
  const titleWords = (videoItem.title || '')
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter((w) => w.length >= 4 && !['video', 'film', 'reel', 'aftermovie', 'highlight', 'minute', 'documentation', 'potrait', 'portrait'].includes(w));

  for (const session of allPhotos) {
    const sTitle = session.title.toLowerCase();
    if (titleWords.some((w) => sTitle.includes(w)) && session.gallery && session.gallery.length > 0) {
      return session.gallery[videoIndex % session.gallery.length];
    }
  }

  const hint = `${videoItem.title}`.toLowerCase();
  let targetCat = 'Wedding';
  if (hint.includes('wisuda') || hint.includes('grad') || hint.includes('ub') || hint.includes('umm')) {
    targetCat = 'Wisuda';
  } else if (hint.includes('birthday') || hint.includes('documentation') || hint.includes('konser') || hint.includes('event')) {
    targetCat = 'Dokumentasi';
  } else if (hint.includes('group') || hint.includes('grup')) {
    targetCat = 'Group Shoot';
  } else if (hint.includes('portrait') || hint.includes('potrait') || hint.includes('kakang') || hint.includes('mbakyu') || hint.includes('duta')) {
    targetCat = 'Portrait';
  }

  const matchingSessions = allPhotos.filter(
    (s) => s.category.toLowerCase() === targetCat.toLowerCase()
  );
  if (matchingSessions.length > 0) {
    const allCatPhotos = [];
    matchingSessions.forEach((s) => {
      if (s.gallery && s.gallery.length > 0) {
        allCatPhotos.push(...s.gallery);
      } else if (s.image) {
        allCatPhotos.push(s.image);
      }
    });
    if (allCatPhotos.length > 0) {
      return allCatPhotos[(videoIndex * 3) % allCatPhotos.length];
    }
  }

  const allAvailablePhotos = [];
  allPhotos.forEach((s) => {
    if (s.gallery && s.gallery.length > 0) {
      allAvailablePhotos.push(...s.gallery);
    }
  });
  if (allAvailablePhotos.length > 0) {
    return allAvailablePhotos[(videoIndex * 4) % allAvailablePhotos.length];
  }

  const presetList = FALLBACK_COVERS[targetCat] || FALLBACK_COVERS.Wedding;
  return presetList[videoIndex % presetList.length];
}

// Sensor Pendeteksi Orientasi Asli Video & Pengecek Frame Hitam (00:00 Fade-In)
function verifyAndFixBlackThumbnail(cardEl, badgeEl, imgElement, primaryUrl, videoId, fallbackCoverUrl, hasExplicitPortraitTitle) {
  let triedAltDriveThumb = false;

  const applyFallback = () => {
    if (imgElement.src !== fallbackCoverUrl) {
      imgElement.src = fallbackCoverUrl;
    }
  };

  imgElement.onerror = () => {
    if (!triedAltDriveThumb && videoId) {
      triedAltDriveThumb = true;
      imgElement.src = `https://drive.google.com/thumbnail?id=${videoId}&sz=w1280`;
    } else {
      applyFallback();
    }
  };

  const probe = new Image();
  probe.crossOrigin = 'anonymous';
  probe.onload = () => {
    // 1. Cek dimensi asli thumbnail video dari Google Drive (Landscape vs Portrait)
    if (probe.naturalWidth && probe.naturalHeight && !hasExplicitPortraitTitle) {
      if (probe.naturalHeight > probe.naturalWidth * 1.15) {
        cardEl.classList.remove('is-landscape');
        cardEl.classList.add('is-portrait');
        if (badgeEl) badgeEl.textContent = '9:16 REEL';
      } else if (probe.naturalWidth >= probe.naturalHeight) {
        cardEl.classList.remove('is-portrait');
        cardEl.classList.add('is-landscape');
        if (badgeEl) badgeEl.textContent = '16:9 CINEMA';
      }
    }

    // 2. Cek apakah frame awal video berwarna hitam pekat
    try {
      const canvas = document.createElement('canvas');
      canvas.width = 16;
      canvas.height = 16;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(probe, 0, 0, 16, 16);
      const data = ctx.getImageData(0, 0, 16, 16).data;

      let totalBrightness = 0;
      const pixelCount = data.length / 4;
      for (let i = 0; i < data.length; i += 4) {
        totalBrightness += 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
      }
      const avgBrightness = totalBrightness / pixelCount;

      if (avgBrightness < 26) {
        applyFallback();
      }
    } catch (e) {}
  };
  probe.onerror = () => {
    if (!triedAltDriveThumb) {
      applyFallback();
    }
  };
  probe.src = primaryUrl;
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

function normalizeCategory(rawCat, titleHint = '') {
  const combined = `${rawCat || ''} ${titleHint || ''}`.toLowerCase().trim();
  const catOnly = (rawCat || '').toLowerCase().trim();

  if (catOnly.includes('video') || catOnly.includes('reel') || catOnly.includes('motion') || catOnly.includes('film')) {
    return 'Video';
  }
  if (
    catOnly.includes('portrait') ||
    catOnly.includes('potrait') ||
    combined.includes('kakang') ||
    combined.includes('mbakyu') ||
    combined.includes('duta')
  ) {
    return 'Portrait';
  }
  if (
    catOnly.includes('dokumentasi') ||
    catOnly.includes('konser') ||
    catOnly.includes('event') ||
    catOnly.includes('stage') ||
    combined.includes('konser') ||
    combined.includes('birthday')
  ) {
    return 'Dokumentasi';
  }
  if (
    catOnly.includes('wedding') ||
    catOnly.includes('pre') ||
    catOnly.includes('couple') ||
    catOnly.includes('akad') ||
    catOnly.includes('engagement') ||
    combined.includes('wedding')
  ) {
    return 'Wedding';
  }
  if (catOnly.includes('group') || catOnly.includes('grup') || catOnly.includes('sumpah')) {
    return 'Group Shoot';
  }
  if (catOnly.includes('wisuda') || catOnly.includes('grad')) {
    return 'Wisuda';
  }
  return rawCat ? rawCat.trim() : 'Wisuda';
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
      statusText.textContent = 'Menyinkronkan galeri terbaru...';
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
        const category = normalizeCategory(rawCategory, title);

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

        // Baris Video: Cek HANYA dari Title & Type (Bukan dari rawCategory agar tidak salah jadi Portrait semua)
        if (category === 'Video' || type.includes('video')) {
          if (!rawDrive && !rawImage) return;

          const titleAndTypeOnly = `${type} ${title}`.toLowerCase();
          const isPortraitVideo =
            titleAndTypeOnly.includes('portrait') ||
            titleAndTypeOnly.includes('potrait') ||
            titleAndTypeOnly.includes('9:16') ||
            titleAndTypeOnly.includes('916') ||
            titleAndTypeOnly.includes('vertical') ||
            titleAndTypeOnly.includes('reel');

          const videoSource = rawDrive || rawImage;
          const videoFileId = extractDriveFileId(videoSource);
          const thumbUrl = formatDriveImageUrl(rawImage || rawDrive);

          parsedVideos.push({
            id: `sheet-vid-${index}`,
            title,
            category: getVideoDisplayCategory(title),
            thumbnail: thumbUrl,
            videoFileId,
            videoUrl: videoSource,
            orientation: isPortraitVideo ? 'portrait' : 'landscape',
            hasExplicitPortraitTitle: isPortraitVideo
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
 * 4. SMART LEFT-TO-RIGHT MASONRY GALLERY (4 KOLOM PENUH DI PC, 2 KOLOM DI HP)
 * ============================================================================
 */
function getResponsiveColumnCount() {
  const w = window.innerWidth;
  if (w >= 1024) return 4;
  if (w >= 768) return 3;
  return 2;
}

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

  const colCount = getResponsiveColumnCount();
  lastColumnCount = colCount;

  const columns = [];
  for (let c = 0; c < colCount; c++) {
    const colEl = document.createElement('div');
    colEl.className = 'masonry-col';
    columns.push(colEl);
    grid.appendChild(colEl);
  }

  filtered.forEach((sessionItem, idx) => {
    const photoCount = sessionItem.gallery ? sessionItem.gallery.length : 1;
    const indexNumber = String(idx + 1).padStart(2, '0');

    const figure = document.createElement('figure');
    figure.className =
      'reveal-on-scroll group relative bg-white/90 backdrop-blur-xs p-1 sm:p-1.5 border border-black/10 rounded-xs shadow-2xs hover:shadow-xl transition-all duration-500 cursor-pointer w-full';
    figure.style.transitionDelay = `${(idx % colCount) * 55}ms`;
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
        <span class="absolute top-2 right-2 bg-black/65 backdrop-blur-md text-white text-[9px] sm:text-[10px] tracking-wider uppercase font-medium px-2 py-0.5 rounded-full border border-white/15">
          ${photoCount} Foto
        </span>

        <div class="absolute inset-0 bg-black/25 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
          <span class="bg-white/90 backdrop-blur-md text-charcoal text-[10px] sm:text-[11px] font-medium tracking-wider uppercase px-3 py-1.5 rounded-full shadow-lg transform translate-y-2 group-hover:translate-y-0 transition-transform duration-300">
            Lihat Album ↗
          </span>
        </div>
      </div>

      <figcaption class="pt-1.5 pb-0.5 px-1">
        <div class="flex items-center justify-between gap-1 text-[8px] sm:text-[9px] uppercase tracking-[0.15em] text-warmgray">
          <span class="truncate">${sessionItem.category}</span>
          <span class="font-mono text-warmgray/65 shrink-0">NO.${indexNumber}</span>
        </div>
        <h3 class="font-serif text-[14px] sm:text-[17px] text-charcoal leading-snug line-clamp-2 group-hover:italic transition-all">
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

    const targetColIndex = idx % colCount;
    columns[targetColIndex].appendChild(figure);
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
 * 5. LIGHTBOX SLIDER
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

    if (ambientBg) {
      ambientBg.src = currentPhotoUrl;
    }
  }

  const totalCount = currentLightboxList.length;
  if (prevBtn && nextBtn) {
    prevBtn.style.display = totalCount > 1 ? 'flex' : 'none';
    nextBtn.style.display = totalCount > 1 ? 'flex' : 'none';
  }

  if (metaText) {
    metaText.textContent = `${currentClientSession.category} — ${currentClientSession.title} — ${totalCount} Foto`;
  }
  if (counterText) {
    counterText.textContent = `${currentLightboxIndex + 1} / ${totalCount}`;
  }

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
        ? `Menampilkan foto ${currentLightboxIndex + 1} dari ${totalCount} — Geser atau klik foto kecil di atas`
        : '';
  }
}

/**
 * ============================================================================
 * 6. RENDER VIDEO HORIZONTAL SLIDER (PC & HP)
 * ============================================================================
 */
function renderVideoReels() {
  const container = document.getElementById('video-reels-container');
  if (!container) return;

  container.innerHTML = '';

  allVideos.forEach((vid, idx) => {
    const isPortrait = vid.orientation === 'portrait';
    const ratioClass = isPortrait ? 'is-portrait' : 'is-landscape';
    const formatBadge = isPortrait ? '9:16 REEL' : '16:9 CINEMA';

    const card = document.createElement('div');
    card.className = `video-card-item ${ratioClass} snap-start group border border-white/15 shadow-2xl`;

    const isGoogleDriveVideo =
      (vid.videoUrl && vid.videoUrl.includes('drive.google.com')) ||
      Boolean(vid.videoFileId);
    const previewUrl = formatDriveVideoPreviewUrl(vid.videoUrl);

    const smartFallbackCover = getSmartFallbackCoverForVideo(vid, idx);
    const initialThumb = vid.thumbnail || smartFallbackCover;

    card.innerHTML = `
      <div class="video-cover-layer absolute inset-0 z-10 cursor-pointer">
        <img
          src="${initialThumb}"
          alt="${vid.title}"
          loading="lazy"
          draggable="false"
          class="vid-thumb-img w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
        />
        <div class="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-black/20 flex flex-col justify-between p-3.5 sm:p-5">
          <div class="flex items-center justify-between gap-2">
            <span class="text-[9px] sm:text-[10px] uppercase tracking-[0.2em] bg-white/15 backdrop-blur-md text-white px-2.5 py-1 rounded-full border border-white/20 truncate">
              ${vid.category}
            </span>
            <span class="vid-format-badge text-[9px] sm:text-[10px] text-white/80 uppercase tracking-widest shrink-0">${formatBadge}</span>
          </div>
          <div class="self-center my-auto w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-white/20 hover:bg-white hover:text-charcoal backdrop-blur-md border border-white/40 flex items-center justify-center text-white transition-all transform group-hover:scale-110 shadow-lg">
            <svg class="w-5 h-5 sm:w-6 sm:h-6 fill-current ml-0.5" viewBox="0 0 24 24">
              <path d="M8 5v14l11-7z" />
            </svg>
          </div>
          <div>
            <h3 class="font-serif text-base sm:text-2xl text-white leading-snug line-clamp-2">${vid.title}</h3>
            <p class="text-[10px] sm:text-[11px] text-white/75 mt-0.5">Klik untuk memutar video</p>
          </div>
        </div>
      </div>
      <div class="video-player-slot w-full h-full bg-black"></div>
    `;

    const thumbImgEl = card.querySelector('.vid-thumb-img');
    const badgeEl = card.querySelector('.vid-format-badge');
    if (thumbImgEl && vid.thumbnail) {
      verifyAndFixBlackThumbnail(
        card,
        badgeEl,
        thumbImgEl,
        vid.thumbnail,
        vid.videoFileId,
        smartFallbackCover,
        Boolean(vid.hasExplicitPortraitTitle)
      );
    }

    const coverLayer = card.querySelector('.video-cover-layer');
    const playerSlot = card.querySelector('.video-player-slot');

    coverLayer?.addEventListener('click', () => {
      // Cegah klik tidak sengaja saat user sedang drag slider di PC
      if (container.dataset.isDragging === 'true') return;

      coverLayer.classList.add('hidden');
      if (isGoogleDriveVideo) {
        playerSlot.innerHTML = `
          <iframe
            src="${previewUrl}"
            class="w-full h-full border-0 bg-black"
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
 * 7. INISIALISASI EVENT LISTENERS (TERMASUK DRAG SLIDER VIDEO PC & HP)
 * ============================================================================
 */
document.addEventListener('DOMContentLoaded', () => {
  initScrollReveal();
  renderPhotoGallery();
  renderVideoReels();
  loadPortfolioFromGoogleSheets();

  window.addEventListener('resize', () => {
    const newCols = getResponsiveColumnCount();
    if (newCols !== lastColumnCount) {
      renderPhotoGallery();
    }
  });

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

  // Tombol Panah Geser Kiri/Kanan pada Slider Video (PC & HP)
  const reelsContainer = document.getElementById('video-reels-container');
  document.getElementById('reels-prev-btn')?.addEventListener('click', () => {
    const step = window.innerWidth < 640 ? 320 : 650;
    reelsContainer?.scrollBy({ left: -step, behavior: 'smooth' });
  });
  document.getElementById('reels-next-btn')?.addEventListener('click', () => {
    const step = window.innerWidth < 640 ? 320 : 650;
    reelsContainer?.scrollBy({ left: step, behavior: 'smooth' });
  });

  // Dukungan Mouse Drag ke Samping untuk Slider Video di PC
  let isDown = false;
  let startX = 0;
  let scrollLeft = 0;

  reelsContainer?.addEventListener('mousedown', (e) => {
    isDown = true;
    reelsContainer.dataset.isDragging = 'false';
    startX = e.pageX - reelsContainer.offsetLeft;
    scrollLeft = reelsContainer.scrollLeft;
  });

  reelsContainer?.addEventListener('mouseleave', () => {
    isDown = false;
  });

  reelsContainer?.addEventListener('mouseup', () => {
    isDown = false;
    setTimeout(() => {
      if (reelsContainer) reelsContainer.dataset.isDragging = 'false';
    }, 50);
  });

  reelsContainer?.addEventListener('mousemove', (e) => {
    if (!isDown) return;
    const x = e.pageX - reelsContainer.offsetLeft;
    const walk = (x - startX) * 1.4;
    if (Math.abs(walk) > 10) {
      reelsContainer.dataset.isDragging = 'true';
      e.preventDefault();
      reelsContainer.scrollLeft = scrollLeft - walk;
    }
  });

  document.getElementById('back-to-top-btn')?.addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });

  document.getElementById('lightbox-close-btn')?.addEventListener('click', closeLightbox);
  document.getElementById('lightbox-brand-close')?.addEventListener('click', closeLightbox);
  document.getElementById('lightbox-back-gallery')?.addEventListener('click', closeLightbox);
  document.getElementById('lightbox-prev')?.addEventListener('click', showPrevPhoto);
  document.getElementById('lightbox-next')?.addEventListener('click', showNextPhoto);

  document.getElementById('lightbox-modal')?.addEventListener('click', (e) => {
    if (e.target.id === 'lightbox-modal') closeLightbox();
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
