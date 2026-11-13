/**
 * ============================================================================
 * WAKTU NANTI — PORTFOLIO & GOOGLE SHEETS CMS ENGINE (PER-CLIENT GALLERY)
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
    gallery: ['https://framerusercontent.com/images/4QgnUdMDiSDZJS65ZAaDyM9Wdc.png'],
    folderUrl: ''
  },
  {
    id: 'fallback-2',
    title: 'Sepenggal Cerita Berdua',
    category: 'Pre-wedding',
    image: 'https://framerusercontent.com/images/QUS52EcwCSRIpBDtsoAxEOX67wI.png',
    gallery: ['https://framerusercontent.com/images/QUS52EcwCSRIpBDtsoAxEOX67wI.png'],
    folderUrl: ''
  },
  {
    id: 'fallback-3',
    title: 'Pre-Sumpah Shoot Malang',
    category: 'Group Shoot',
    image: 'https://framerusercontent.com/images/rsVtcDYb6JoDXQt1CESvcob2dnw.png',
    gallery: ['https://framerusercontent.com/images/rsVtcDYb6JoDXQt1CESvcob2dnw.png'],
    folderUrl: ''
  }
];

const FALLBACK_VIDEOS = [
  {
    id: 'vid-1',
    title: 'Aftermovie Wisuda — Universitas Brawijaya',
    category: 'Wisuda',
    thumbnail: 'https://framerusercontent.com/images/4QgnUdMDiSDZJS65ZAaDyM9Wdc.png',
    videoUrl: 'https://assets.mixkit.co/videos/preview/mixkit-girl-in-neon-light-1232-large.mp4'
  },
  {
    id: 'vid-2',
    title: 'Pre-wedding Film — Sepenggal Cerita Berdua',
    category: 'Pre-wedding',
    thumbnail: 'https://framerusercontent.com/images/QUS52EcwCSRIpBDtsoAxEOX67wI.png',
    videoUrl: 'https://assets.mixkit.co/videos/preview/mixkit-couple-walking-in-a-field-42780-large.mp4'
  },
  {
    id: 'vid-3',
    title: 'Group Shoot & Pre-Sumpah — Malang',
    category: 'Group Shoot',
    thumbnail: 'https://framerusercontent.com/images/rsVtcDYb6JoDXQt1CESvcob2dnw.png',
    videoUrl: 'https://assets.mixkit.co/videos/preview/mixkit-friends-laughing-together-in-nature-42802-large.mp4'
  }
];

let allPhotos = [...FALLBACK_PHOTOS];
let allVideos = [...FALLBACK_VIDEOS];
let activeCategory = 'All';

// State khusus Lightbox untuk 1 sesi klien yang sedang dibuka
let currentClientSession = null;
let currentLightboxList = [];
let currentLightboxIndex = 0;

/**
 * ============================================================================
 * UTILITAS PARSER GOOGLE DRIVE (FILE, FOLDER, & MULTI-PHOTO)
 * ============================================================================
 */

// Ekstrak ID Folder dari URL Google Drive Folder
function extractDriveFolderId(url) {
  if (!url || typeof url !== 'string') return null;
  const match = url.match(/\/folders\/([a-zA-Z0-9_-]{15,})/);
  return match && match[1] ? match[1] : null;
}

// Ekstrak ID File dari URL Google Drive File
function extractDriveFileId(url) {
  if (!url || typeof url !== 'string') return null;
  if (url.includes('/folders/')) return null;

  const matchD = url.match(/\/(?:file\/)?d\/([a-zA-Z0-9_-]{15,})/);
  if (matchD && matchD[1]) return matchD[1];

  const matchId = url.match(/[?&]id=([a-zA-Z0-9_-]{15,})/);
  if (matchId && matchId[1]) return matchId[1];

  return null;
}

// Ubah 1 link gambar/Drive menjadi direct image URL
function formatDriveImageUrl(url) {
  if (!url || typeof url !== 'string') return '';
  const trimmed = url.trim();
  if (!trimmed) return '';

  const fileId = extractDriveFileId(trimmed);
  if (fileId) {
    return `https://lh3.googleusercontent.com/d/${fileId}`;
  }
  // Jika sudah berupa ID Google Drive murni (tanpa http)
  if (/^[a-zA-Z0-9_-]{25,45}$/.test(trimmed)) {
    return `https://lh3.googleusercontent.com/d/${trimmed}`;
  }
  if (trimmed.includes('/folders/')) {
    return '';
  }
  return trimmed;
}

// Ubah link share video Google Drive menjadi /preview
function formatDriveVideoPreviewUrl(url) {
  if (!url || typeof url !== 'string') return '';
  const trimmed = url.trim();
  const fileId = extractDriveFileId(trimmed);
  if (fileId) {
    return `https://drive.google.com/file/d/${fileId}/preview`;
  }
  return trimmed;
}

// Ekstrak daftar semua foto & link folder dari teks sel (mendukung banyak link dipisah koma/enter)
function parseGalleryCell(rawImageCell, rawDriveCell) {
  const combinedText = `${rawImageCell || ''}\n${rawDriveCell || ''}`;
  const tokens = combinedText
    .split(/[\n,;|\s]+/)
    .map((t) => t.trim())
    .filter(Boolean);

  const photoUrls = [];
  let folderUrl = '';

  tokens.forEach((token) => {
    const folderId = extractDriveFolderId(token);
    if (folderId) {
      if (!folderUrl) {
        folderUrl = `https://drive.google.com/drive/folders/${folderId}`;
      }
      return;
    }

    // Abaikan link homepage kosong "https://drive.google.com/"
    const cleaned = token.replace(/\/+$/, '');
    if (
      cleaned === 'https://drive.google.com' ||
      cleaned === 'http://drive.google.com' ||
      cleaned === '-'
    ) {
      return;
    }

    // Jika token adalah URL gambar valid atau File ID Google Drive
    if (token.startsWith('http') || /^[a-zA-Z0-9_-]{25,45}$/.test(token)) {
      const directImg = formatDriveImageUrl(token);
      if (directImg && !photoUrls.includes(directImg)) {
        photoUrls.push(directImg);
      }
    }
  });

  // Tentukan foto sampul depan (prioritaskan dari kolom Image, jika kosong ambil foto pertama dari daftar)
  const primaryCover = formatDriveImageUrl((rawImageCell || '').split(/[\n,;|]+/)[0]) || photoUrls[0] || '';
  if (primaryCover && !photoUrls.includes(primaryCover)) {
    photoUrls.unshift(primaryCover);
  }

  return {
    coverImage: primaryCover,
    gallery: photoUrls,
    folderUrl
  };
}

// Parser CSV tangguh
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
  if (lower.includes('group') || lower.includes('sumpah')) return 'Group Shoot';
  if (lower.includes('pre') || lower.includes('wedding') || lower.includes('couple')) return 'Pre-wedding';
  if (lower.includes('video') || lower.includes('reel') || lower.includes('motion')) return 'Video Reels';
  return rawCat.trim();
}

/**
 * ============================================================================
 * FETCH DATA DARI GOOGLE SHEETS CSV & KELOMPOKKAN PER KLIEN
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
        const title = (item.title || item.judul || item.lokasi || `Sesi Waktu Nanti #${index + 1}`).trim();
        const rawCategory = item.category || item.kategori || 'Wisuda';
        const category = normalizeCategory(rawCategory);

        // Gabungkan pembacaan kolom Image, Drive_Link, dan kolom tambahan (jika ada kolom ke-5 untuk daftar foto)
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

        if (category === 'Video Reels' || type === 'video') {
          parsedVideos.push({
            id: `sheet-vid-${index}`,
            title,
            category: category === 'Video Reels' ? 'Motion Story' : category,
            thumbnail: formatDriveImageUrl(rawImage) || FALLBACK_VIDEOS[0].thumbnail,
            videoUrl: rawDrive || rawImage
          });
          return;
        }

        const { coverImage, gallery, folderUrl } = parseGalleryCell(
          rawImage,
          `${rawDrive}\n${extraPhotosCol}`
        );

        if (!coverImage && gallery.length === 0) return;

        // Jika ada beberapa baris dengan Title yang sama, gabungkan ke dalam 1 kartu sesi klien yang sama
        const sessionKey = `${category.toLowerCase()}__${title.toLowerCase()}`;
        if (clientSessionsMap.has(sessionKey)) {
          const existing = clientSessionsMap.get(sessionKey);
          gallery.forEach((imgUrl) => {
            if (!existing.gallery.includes(imgUrl)) {
              existing.gallery.push(imgUrl);
            }
          });
          if (!existing.folderUrl && folderUrl) {
            existing.folderUrl = folderUrl;
          }
        } else {
          clientSessionsMap.set(sessionKey, {
            id: `sheet-session-${index}`,
            title,
            category,
            image: coverImage || gallery[0],
            gallery: gallery.length > 0 ? gallery : [coverImage],
            folderUrl
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
 * RENDER GALERI FOTO MASONRY (1 KARTU = 1 KLIEN)
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

  filtered.forEach((sessionItem) => {
    const photoCount = sessionItem.gallery ? sessionItem.gallery.length : 1;
    const figure = document.createElement('figure');
    figure.className =
      'masonry-item group relative overflow-hidden bg-neutral-200/60 cursor-pointer rounded-xs shadow-2xs hover:shadow-md transition-shadow';
    figure.setAttribute('tabindex', '0');
    figure.setAttribute('role', 'button');
    figure.setAttribute('aria-label', `${sessionItem.category} - ${sessionItem.title}`);

    figure.innerHTML = `
      <div class="relative overflow-hidden">
        <img
          src="${sessionItem.image}"
          alt="${sessionItem.title}"
          loading="lazy"
          onerror="this.onerror=null;this.src='https://framerusercontent.com/images/4QgnUdMDiSDZJS65ZAaDyM9Wdc.png';"
          class="photo-card-img w-full h-auto object-cover block"
        />
        ${
          photoCount > 1
            ? `<span class="absolute top-3 right-3 bg-black/60 backdrop-blur-xs text-white text-[10px] font-medium px-2.5 py-1 rounded-full">
                ${photoCount} Foto
              </span>`
            : ''
        }
        <div class="absolute inset-0 bg-gradient-to-t from-black/65 via-black/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-4">
          <span class="text-[10px] uppercase tracking-[0.18em] text-white/80 mb-0.5">${sessionItem.category}</span>
          <h3 class="font-serif text-lg sm:text-xl text-white leading-snug">${sessionItem.title}</h3>
        </div>
      </div>
    `;

    // PENTING: Saat diklik, buka Lightbox HANYA untuk sesi klien ini saja!
    figure.addEventListener('click', () => openClientLightbox(sessionItem));
    figure.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        openClientLightbox(sessionItem);
      }
    });

    grid.appendChild(figure);
  });
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
 * LIGHTBOX SLIDER KHUSUS PER KLIEN
 * ============================================================================
 */
function openClientLightbox(sessionItem) {
  currentClientSession = sessionItem;
  currentLightboxList =
    sessionItem.gallery && sessionItem.gallery.length > 0
      ? sessionItem.gallery
      : [sessionItem.image];
  currentLightboxIndex = 0;

  const modal = document.getElementById('lightbox-modal');
  if (!modal) return;

  modal.classList.remove('hidden');
  modal.classList.add('flex');
  document.body.style.overflow = 'hidden';

  updateLightboxView();
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
  updateLightboxView();
}

function showNextPhoto() {
  if (currentLightboxList.length <= 1) return;
  currentLightboxIndex = (currentLightboxIndex + 1) % currentLightboxList.length;
  updateLightboxView();
}

function updateLightboxView() {
  if (!currentClientSession || currentLightboxList.length === 0) return;

  const currentPhotoUrl = currentLightboxList[currentLightboxIndex];
  const mainImg = document.getElementById('lightbox-main-img');
  const metaText = document.getElementById('lightbox-meta');
  const counterText = document.getElementById('lightbox-counter');
  const thumbsContainer = document.getElementById('lightbox-thumbnails');
  const driveInfo = document.getElementById('lightbox-drive-info');
  const prevBtn = document.getElementById('lightbox-prev');
  const nextBtn = document.getElementById('lightbox-next');

  // 1. Update Gambar Utama
  mainImg.style.opacity = '0.3';
  mainImg.src = currentPhotoUrl;
  mainImg.alt = `${currentClientSession.category} — ${currentClientSession.title} (${currentLightboxIndex + 1})`;
  mainImg.onload = () => {
    mainImg.style.opacity = '1';
  };

  // Sembunyikan panah kiri/kanan jika foto klien hanya 1
  const totalCount = currentLightboxList.length;
  if (prevBtn && nextBtn) {
    prevBtn.style.display = totalCount > 1 ? 'flex' : 'none';
    nextBtn.style.display = totalCount > 1 ? 'flex' : 'none';
  }

  // 2. Metadata Kiri Atas: "[Kategori] — [Nama Klien/Sesi] — [Jumlah Foto Klien Ini]"
  metaText.textContent = `${currentClientSession.category} — ${currentClientSession.title} — ${totalCount} Foto`;
  counterText.textContent = `${currentLightboxIndex + 1} / ${totalCount}`;

  // 3. Thumbnail Kiri Bawah (Hanya foto-foto milik klien ini saja)
  thumbsContainer.innerHTML = '';
  currentLightboxList.forEach((photoUrl, idx) => {
    const thumb = document.createElement('img');
    thumb.src = photoUrl;
    thumb.alt = `${currentClientSession.title} - Foto ${idx + 1}`;
    thumb.className = `lb-thumb ${idx === currentLightboxIndex ? 'active' : ''}`;
    thumb.addEventListener('click', () => {
      currentLightboxIndex = idx;
      updateLightboxView();
    });
    thumbsContainer.appendChild(thumb);
  });

  const activeThumb = thumbsContainer.querySelector('.lb-thumb.active');
  if (activeThumb) {
    activeThumb.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
  }

  // 4. Link Folder Google Drive di Kiri Bawah
  if (currentClientSession.folderUrl) {
    driveInfo.innerHTML = `
      <a href="${currentClientSession.folderUrl}" target="_blank" rel="noopener noreferrer" class="text-neutral-300 hover:text-white underline underline-offset-4 inline-flex items-center gap-1.5 transition-colors">
        <span>Buka Folder Google Drive Lengkap (${currentClientSession.title})</span>
        <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3" />
        </svg>
      </a>
    `;
  } else {
    driveInfo.textContent = `${totalCount} foto dalam album ${currentClientSession.title}`;
  }
}

/**
 * ============================================================================
 * RENDER VIDEO REELS 9:16
 * ============================================================================
 */
function renderVideoReels() {
  const container = document.getElementById('video-reels-container');
  if (!container) return;

  container.innerHTML = '';

  allVideos.forEach((vid) => {
    const card = document.createElement('div');
    card.className =
      'relative shrink-0 w-[76vw] sm:w-[280px] lg:w-auto aspect-[9/16] bg-charcoal rounded-sm overflow-hidden snap-center group shadow-md';

    const isGoogleDriveVideo = vid.videoUrl && vid.videoUrl.includes('drive.google.com');
    const previewUrl = formatDriveVideoPreviewUrl(vid.videoUrl);

    card.innerHTML = `
      <div class="video-cover-layer absolute inset-0 z-10 cursor-pointer">
        <img
          src="${vid.thumbnail}"
          alt="${vid.title}"
          loading="lazy"
          class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
        />
        <div class="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-black/10 flex flex-col justify-between p-5">
          <div class="flex items-center justify-between">
            <span class="text-[10px] uppercase tracking-[0.2em] bg-black/50 backdrop-blur-xs text-white px-3 py-1 rounded-full">
              ${vid.category}
            </span>
            <span class="text-[10px] text-white/80 uppercase tracking-widest">9:16 Reel</span>
          </div>
          <div class="self-center my-auto w-14 h-14 rounded-full bg-white/20 hover:bg-white/35 backdrop-blur-md border border-white/40 flex items-center justify-center text-white transition-transform transform group-hover:scale-110">
            <svg class="w-6 h-6 fill-current ml-0.5" viewBox="0 0 24 24">
              <path d="M8 5v14l11-7z" />
            </svg>
          </div>
          <div>
            <h3 class="font-serif text-xl text-white leading-snug">${vid.title}</h3>
            <p class="text-[11px] text-white/70 mt-1">Klik untuk memutar video</p>
          </div>
        </div>
      </div>
      <div class="video-player-slot w-full h-full bg-black"></div>
    `;

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
            class="w-full h-full object-cover"
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
 * INISIALISASI EVENT LISTENERS
 * ============================================================================
 */
document.addEventListener('DOMContentLoaded', () => {
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

  const reelsContainer = document.getElementById('video-reels-container');
  document.getElementById('reels-prev-btn')?.addEventListener('click', () => {
    reelsContainer?.scrollBy({ left: -300, behavior: 'smooth' });
  });
  document.getElementById('reels-next-btn')?.addEventListener('click', () => {
    reelsContainer?.scrollBy({ left: 300, behavior: 'smooth' });
  });

  document.getElementById('back-to-top-btn')?.addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });

  document.getElementById('lightbox-close-btn')?.addEventListener('click', closeLightbox);
  document.getElementById('lightbox-brand-close')?.addEventListener('click', closeLightbox);
  document.getElementById('lightbox-back-gallery')?.addEventListener('click', closeLightbox);
  document.getElementById('lightbox-prev')?.addEventListener('click', showPrevPhoto);
  document.getElementById('lightbox-next')?.addEventListener('click', showNextPhoto);

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
