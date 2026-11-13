/**
 * ============================================================================
 * WAKTU NANTI — PORTFOLIO & GOOGLE SHEETS CMS ENGINE
 * ============================================================================
 */

// 1. KONFIGURASI INTEGRASI WAJIB
const CONFIG = {
  whatsappNumber: '6287796487390',
  publishedCsvUrl:
    'https://docs.google.com/spreadsheets/d/e/2PACX-1vQi7IvaH0ii90aVrXLk5UT15xuBB20ODCbvbReExll7ZC27lCnxqUiNeq4jHG_l9BPZLSwVH-YDJrhC/pub?output=csv'
};

// 2. DATA FALLBACK PORTOFOLIO (Digunakan jika koneksi CSV offline atau untuk demo instan)
const FALLBACK_PHOTOS = [
  {
    id: 'fallback-1',
    title: 'Universitas Brawijaya',
    category: 'Wisuda',
    image: 'https://framerusercontent.com/images/4QgnUdMDiSDZJS65ZAaDyM9Wdc.png',
    driveLink: ''
  },
  {
    id: 'fallback-2',
    title: 'Sepenggal Cerita Berdua',
    category: 'Pre-wedding',
    image: 'https://framerusercontent.com/images/QUS52EcwCSRIpBDtsoAxEOX67wI.png',
    driveLink: ''
  },
  {
    id: 'fallback-3',
    title: 'Pre-Sumpah Shoot Malang',
    category: 'Group Shoot',
    image: 'https://framerusercontent.com/images/rsVtcDYb6JoDXQt1CESvcob2dnw.png',
    driveLink: ''
  },
  {
    id: 'fallback-4',
    title: 'Wisuda Outdoor — Kampus Malang',
    category: 'Wisuda',
    image: 'https://images.unsplash.com/photo-1523050854058-8df90110c9f1?auto=format&fit=crop&w=900&q=80',
    driveLink: ''
  },
  {
    id: 'fallback-5',
    title: 'Golden Hour di Bromo',
    category: 'Pre-wedding',
    image: 'https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=900&q=80',
    driveLink: ''
  },
  {
    id: 'fallback-6',
    title: 'Sahabat Seperjuangan — Fakultas Kedokteran',
    category: 'Group Shoot',
    image: 'https://images.unsplash.com/photo-1529156069898-49953e39b3ac?auto=format&fit=crop&w=900&q=80',
    driveLink: ''
  }
];

const FALLBACK_VIDEOS = [
  {
    id: 'vid-1',
    title: 'Aftermovie Wisuda — Universitas Brawijaya',
    category: 'Wisuda',
    thumbnail: 'https://framerusercontent.com/images/4QgnUdMDiSDZJS65ZAaDyM9Wdc.png',
    videoUrl: 'https://assets.mixkit.co/videos/preview/mixkit-girl-in-neon-light-1232-large.mp4',
    driveLink: ''
  },
  {
    id: 'vid-2',
    title: 'Pre-wedding Film — Sepenggal Cerita Berdua',
    category: 'Pre-wedding',
    thumbnail: 'https://framerusercontent.com/images/QUS52EcwCSRIpBDtsoAxEOX67wI.png',
    videoUrl: 'https://assets.mixkit.co/videos/preview/mixkit-couple-walking-in-a-field-42780-large.mp4',
    driveLink: ''
  },
  {
    id: 'vid-3',
    title: 'Group Shoot & Pre-Sumpah — Malang',
    category: 'Group Shoot',
    thumbnail: 'https://framerusercontent.com/images/rsVtcDYb6JoDXQt1CESvcob2dnw.png',
    videoUrl: 'https://assets.mixkit.co/videos/preview/mixkit-friends-laughing-together-in-nature-42802-large.mp4',
    driveLink: ''
  },
  {
    id: 'vid-4',
    title: 'Intimate Session — Kayutangan Heritage',
    category: 'Pre-wedding',
    thumbnail: 'https://images.unsplash.com/photo-1511285560929-80b456fea0bc?auto=format&fit=crop&w=800&q=80',
    videoUrl: 'https://assets.mixkit.co/videos/preview/mixkit-bride-and-groom-walking-on-the-beach-42652-large.mp4',
    driveLink: ''
  }
];

// State Aplikasi
let allPhotos = [...FALLBACK_PHOTOS];
let allVideos = [...FALLBACK_VIDEOS];
let activeCategory = 'All';
let currentLightboxList = [];
let currentLightboxIndex = 0;

/**
 * ============================================================================
 * 3. UTILITAS PARSER GOOGLE DRIVE (FOTO & VIDEO) DAN CSV
 * ============================================================================
 */

// Ekstrak FILE_ID dari berbagai format URL Google Drive
function extractGoogleDriveFileId(url) {
  if (!url || typeof url !== 'string') return null;
  const trimmed = url.trim();

  // Format: /file/d/FILE_ID/ atau /d/FILE_ID
  const matchD = trimmed.match(/\/(?:file\/)?d\/([a-zA-Z0-9_-]{15,})/);
  if (matchD && matchD[1]) return matchD[1];

  // Format: ?id=FILE_ID atau &id=FILE_ID
  const matchId = trimmed.match(/[?&]id=([a-zA-Z0-9_-]{15,})/);
  if (matchId && matchId[1]) return matchId[1];

  return null;
}

// Konversi otomatis link Google Drive menjadi direct image URL (lh3.googleusercontent.com/d/FILE_ID)
function formatDriveImageUrl(url) {
  if (!url || typeof url !== 'string') return '';
  const trimmed = url.trim();
  if (trimmed.includes('drive.google.com') || trimmed.includes('googleusercontent.com/d/')) {
    const fileId = extractGoogleDriveFileId(trimmed);
    if (fileId) {
      return `https://lh3.googleusercontent.com/d/${fileId}`;
    }
  }
  return trimmed;
}

// Konversi otomatis link "view/share" Google Drive menjadi "/preview" untuk iframe player
function formatDriveVideoPreviewUrl(url) {
  if (!url || typeof url !== 'string') return '';
  const trimmed = url.trim();
  if (trimmed.includes('drive.google.com')) {
    const fileId = extractGoogleDriveFileId(trimmed);
    if (fileId) {
      return `https://drive.google.com/file/d/${fileId}/preview`;
    }
  }
  return trimmed;
}

// Cek apakah tautan Google Drive merupakan tautan spesifik yang valid (bukan sekadar homepage drive.google.com/)
function isValidSpecificDriveLink(url) {
  if (!url || typeof url !== 'string') return false;
  const cleaned = url.trim().replace(/\/+$/, '');
  if (
    cleaned === '' ||
    cleaned === 'https://drive.google.com' ||
    cleaned === 'http://drive.google.com' ||
    cleaned === '-'
  ) {
    return false;
  }
  return cleaned.startsWith('http');
}

// Parser CSV tangguh (mendukung tanda kutip ganda, koma di dalam teks, dan baris baru)
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

// Normalisasi nama kategori agar cocok dengan tombol filter ("Wisuda", "Group Shoot", "Pre-wedding")
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
 * 4. FETCH DATA DARI PUBLISHED CSV GOOGLE SHEETS
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

    const response = await fetch(CONFIG.publishedCsvUrl, { cache: 'no-store' });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);

    const csvText = await response.text();
    const records = parseCSV(csvText);

    if (records.length > 0) {
      const parsedPhotos = [];
      const parsedVideos = [];

      records.forEach((item, index) => {
        const title = item.title || item.judul || item.lokasi || `Sesi Waktu Nanti #${index + 1}`;
        const rawCategory = item.category || item.kategori || 'Wisuda';
        const category = normalizeCategory(rawCategory);
        const rawImage = item.image || item.foto || item.thumbnail || '';
        const driveLink = item.drive_link || item.drivelink || item.folder || item.video_url || '';
        const type = (item.type || item.tipe || '').toLowerCase();

        // Jika baris adalah kategori Video Reels atau kolom type == video
        if (category === 'Video Reels' || type === 'video') {
          parsedVideos.push({
            id: `sheet-vid-${index}`,
            title,
            category: category === 'Video Reels' ? 'Motion Story' : category,
            thumbnail: formatDriveImageUrl(rawImage) || FALLBACK_VIDEOS[0].thumbnail,
            videoUrl: driveLink || rawImage,
            driveLink
          });
        } else if (rawImage) {
          parsedPhotos.push({
            id: `sheet-photo-${index}`,
            title,
            category,
            image: formatDriveImageUrl(rawImage),
            driveLink
          });
        }
      });

      if (parsedPhotos.length > 0) {
        allPhotos = parsedPhotos;
      }
      if (parsedVideos.length > 0) {
        allVideos = parsedVideos;
      }
    }
  } catch (err) {
    console.warn('Menggunakan data fallback karena CSV Google Sheets belum dapat diakses:', err.message);
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
 * 5. RENDER GALERI FOTO MASONRY & FUNGSI FILTER KATEGORI
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
    emptyState.classList.remove('hidden');
    return;
  }
  emptyState.classList.add('hidden');

  filtered.forEach((item, index) => {
    const figure = document.createElement('figure');
    figure.className =
      'masonry-item group relative overflow-hidden bg-neutral-200/60 cursor-pointer rounded-xs shadow-2xs hover:shadow-md transition-shadow';
    figure.setAttribute('tabindex', '0');
    figure.setAttribute('role', 'button');
    figure.setAttribute('aria-label', `${item.category} - ${item.title}`);

    figure.innerHTML = `
      <div class="relative overflow-hidden">
        <img
          src="${item.image}"
          alt="${item.title}"
          loading="lazy"
          onerror="this.onerror=null;this.src='https://framerusercontent.com/images/4QgnUdMDiSDZJS65ZAaDyM9Wdc.png';"
          class="photo-card-img w-full h-auto object-cover block"
        />
        <div class="absolute inset-0 bg-gradient-to-t from-black/65 via-black/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-4">
          <span class="text-[10px] uppercase tracking-[0.18em] text-white/80 mb-0.5">${item.category}</span>
          <h3 class="font-serif text-lg sm:text-xl text-white leading-snug">${item.title}</h3>
        </div>
      </div>
    `;

    // Buka Lightbox saat foto diklik atau ditekan Enter
    figure.addEventListener('click', () => openLightbox(filtered, index));
    figure.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        openLightbox(filtered, index);
      }
    });

    grid.appendChild(figure);
  });
}

// Fungsi utama pengubah filter kategori + sinkronisasi tombol Navbar & Filter Pills
function setCategoryFilter(category, shouldScroll = false) {
  activeCategory = category;

  // Update status tombol di Filter Tab Pills (Section 01)
  document.querySelectorAll('.filter-pill').forEach((btn) => {
    const btnCat = btn.getAttribute('data-filter');
    if (btnCat === category) {
      btn.classList.add('active');
    } else {
      btn.classList.remove('active');
    }
  });

  // Update status tombol di Navbar Atas (Desktop & Mobile)
  document.querySelectorAll('.nav-cat-btn').forEach((btn) => {
    const btnCat = btn.getAttribute('data-nav-filter');
    if (btnCat === category) {
      btn.classList.add('active');
    } else {
      btn.classList.remove('active');
    }
  });

  renderPhotoGallery();

  if (shouldScroll) {
    const gallerySection = document.getElementById('still-stories');
    if (gallerySection) {
      gallerySection.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }
}

/**
 * ============================================================================
 * 6. FITUR LIGHTBOX SLIDER INTERAKTIF (SESUAI SCREENSHOT 2)
 * ============================================================================
 */
function openLightbox(itemsList, startIndex) {
  currentLightboxList = itemsList;
  currentLightboxIndex = startIndex;

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
  if (currentLightboxList.length === 0) return;
  currentLightboxIndex =
    (currentLightboxIndex - 1 + currentLightboxList.length) % currentLightboxList.length;
  updateLightboxView();
}

function showNextPhoto() {
  if (currentLightboxList.length === 0) return;
  currentLightboxIndex = (currentLightboxIndex + 1) % currentLightboxList.length;
  updateLightboxView();
}

function updateLightboxView() {
  const item = currentLightboxList[currentLightboxIndex];
  if (!item) return;

  const mainImg = document.getElementById('lightbox-main-img');
  const metaText = document.getElementById('lightbox-meta');
  const counterText = document.getElementById('lightbox-counter');
  const thumbsContainer = document.getElementById('lightbox-thumbnails');
  const driveInfo = document.getElementById('lightbox-drive-info');

  // 1. Update Gambar Utama
  mainImg.style.opacity = '0.3';
  mainImg.src = item.image;
  mainImg.alt = `${item.category} — ${item.title}`;
  mainImg.onload = () => {
    mainImg.style.opacity = '1';
  };

  // 2. Update Metadata Kiri Atas: "[Kategori] — [Lokasi/Judul Sesi] — [Jumlah Foto]"
  const totalCount = currentLightboxList.length;
  metaText.textContent = `${item.category} — ${item.title} — ${totalCount} Foto`;
  counterText.textContent = `${currentLightboxIndex + 1} / ${totalCount}`;

  // 3. Update Deretan Thumbnail di Kiri Bawah
  thumbsContainer.innerHTML = '';
  currentLightboxList.forEach((thumbItem, idx) => {
    const thumb = document.createElement('img');
    thumb.src = thumbItem.image;
    thumb.alt = thumbItem.title;
    thumb.className = `lb-thumb ${idx === currentLightboxIndex ? 'active' : ''}`;
    thumb.addEventListener('click', () => {
      currentLightboxIndex = idx;
      updateLightboxView();
    });
    thumbsContainer.appendChild(thumb);
  });

  // Pastikan thumbnail aktif terlihat di dalam area scroll
  const activeThumb = thumbsContainer.querySelector('.lb-thumb.active');
  if (activeThumb) {
    activeThumb.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
  }

  // 4. Update Info Status / Link Folder Google Drive di Kiri Bawah
  if (isValidSpecificDriveLink(item.driveLink)) {
    driveInfo.innerHTML = `
      <a href="${item.driveLink}" target="_blank" rel="noopener noreferrer" class="text-neutral-300 hover:text-white underline underline-offset-4 inline-flex items-center gap-1.5 transition-colors">
        <span>Buka Folder Google Drive Sesi Ini</span>
        <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3" />
        </svg>
      </a>
    `;
  } else {
    driveInfo.textContent = 'Folder Google Drive belum ditambahkan';
  }
}

/**
 * ============================================================================
 * 7. RENDER SECTION 02 / MOTION STORIES (VIDEO REELS 9:16 + DRIVE PREVIEW)
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
      <!-- Cover Thumbnail & Play Button Overlay -->
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

          <!-- Tombol Play Tengah -->
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

      <!-- Slot Player Video (Iframe Google Drive Preview atau HTML5 Video) -->
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
 * 8. INISIALISASI EVENT LISTENERS (SEMUA TOMBOL AKTIF)
 * ============================================================================
 */
document.addEventListener('DOMContentLoaded', () => {
  // Render awal menggunakan fallback, lalu fetch data langsung dari Google Sheets CSV
  renderPhotoGallery();
  renderVideoReels();
  loadPortfolioFromGoogleSheets();

  // 1. Klik Tombol Kategori di Navbar (Desktop & Mobile) -> Smooth Scroll + Aktifkan Filter
  document.querySelectorAll('[data-nav-filter]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const category = btn.getAttribute('data-nav-filter');
      setCategoryFilter(category, true);
    });
  });

  // 2. Klik Tombol "Video Reels" di Navbar (Desktop & Mobile) -> Smooth Scroll ke Section 02
  const scrollToVideoReels = () => {
    const motionSection = document.getElementById('motion-stories');
    if (motionSection) {
      motionSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };
  document.getElementById('nav-video-btn')?.addEventListener('click', scrollToVideoReels);
  document.getElementById('nav-video-btn-mobile')?.addEventListener('click', scrollToVideoReels);

  // 3. Klik Teks Kategori di Bawah Tombol Hero ("WISUDA / GROUP SHOOT / PRE-WEDDING")
  document.querySelectorAll('[data-hero-filter]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const category = btn.getAttribute('data-hero-filter');
      setCategoryFilter(category, true);
    });
  });

  // 4. Klik Tombol Filter Tab Pills di Section 01 / Still Stories
  document.querySelectorAll('[data-filter]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const category = btn.getAttribute('data-filter');
      setCategoryFilter(category, false);
    });
  });

  // 5. Navigasi Slider Video Reels (Tombol Kiri / Kanan)
  const reelsContainer = document.getElementById('video-reels-container');
  document.getElementById('reels-prev-btn')?.addEventListener('click', () => {
    reelsContainer?.scrollBy({ left: -300, behavior: 'smooth' });
  });
  document.getElementById('reels-next-btn')?.addEventListener('click', () => {
    reelsContainer?.scrollBy({ left: 300, behavior: 'smooth' });
  });

  // 6. Tombol Back to Top di Footer & Logo Navbar
  document.getElementById('back-to-top-btn')?.addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });

  // 7. Kontrol Modal Lightbox (Klik Tombol, Keyboard Panah & Esc, serta Swipe Layar HP)
  document.getElementById('lightbox-close-btn')?.addEventListener('click', closeLightbox);
  document.getElementById('lightbox-brand-close')?.addEventListener('click', closeLightbox);
  document.getElementById('lightbox-back-gallery')?.addEventListener('click', closeLightbox);
  document.getElementById('lightbox-prev')?.addEventListener('click', showPrevPhoto);
  document.getElementById('lightbox-next')?.addEventListener('click', showNextPhoto);

  // Navigasi Keyboard (Esc, ArrowLeft, ArrowRight)
  document.addEventListener('keydown', (e) => {
    const modal = document.getElementById('lightbox-modal');
    if (!modal || modal.classList.contains('hidden')) return;

    if (e.key === 'Escape') closeLightbox();
    if (e.key === 'ArrowLeft') showPrevPhoto();
    if (e.key === 'ArrowRight') showNextPhoto();
  });

  // Dukungan Touch Swipe Kiri/Kanan pada Layar HP di dalam Lightbox
  const touchArea = document.getElementById('lightbox-touch-area');
  let touchStartX = 0;
  let touchEndX = 0;

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
      touchEndX = e.changedTouches[0].screenX;
      const diff = touchStartX - touchEndX;
      if (Math.abs(diff) > 45) {
        if (diff > 0) {
          showNextPhoto(); // Swipe kiri -> foto berikutnya
        } else {
          showPrevPhoto(); // Swipe kanan -> foto sebelumnya
        }
      }
    },
    { passive: true }
  );
});