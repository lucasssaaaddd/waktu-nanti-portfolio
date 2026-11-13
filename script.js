/**
 * ============================================================================
 * WAKTU NANTI — PORTFOLIO & GOOGLE DRIVE FOLDER AUTO-SLIDER ENGINE
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
    folderId: null,
    folderLoaded: true
  },
  {
    id: 'fallback-2',
    title: 'Sepenggal Cerita Berdua',
    category: 'Pre-wedding',
    image: 'https://framerusercontent.com/images/QUS52EcwCSRIpBDtsoAxEOX67wI.png',
    gallery: ['https://framerusercontent.com/images/QUS52EcwCSRIpBDtsoAxEOX67wI.png'],
    folderId: null,
    folderLoaded: true
  },
  {
    id: 'fallback-3',
    title: 'Pre-Sumpah Shoot Malang',
    category: 'Group Shoot',
    image: 'https://framerusercontent.com/images/rsVtcDYb6JoDXQt1CESvcob2dnw.png',
    gallery: ['https://framerusercontent.com/images/rsVtcDYb6JoDXQt1CESvcob2dnw.png'],
    folderId: null,
    folderLoaded: true
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

// Cache memori untuk daftar foto dari folder Google Drive
const folderPhotoCache = new Map();

/**
 * ============================================================================
 * 1. UTILITAS PARSER GOOGLE DRIVE (FILE & AUTO-SCAN ISI FOLDER)
 * ============================================================================
 */

function extractDriveFolderId(url) {
  if (!url || typeof url !== 'string') return null;
  const match = url.match(/\/folders\/([a-zA-Z0-9_-]{15,})/);
  return match && match[1] ? match[1] : null;
}

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

// Gabungkan daftar foto tanpa duplikat berdasarkan File ID Google Drive
function mergeUniquePhotoUrls(existingList, newUrls) {
  const result = [...existingList];
  const seenKeys = new Set(
    existingList.map((u) => extractDriveFileId(u) || u.trim())
  );

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

// Ekstrak seluruh ID file gambar dari halaman Embedded Folder Google Drive
function extractImagesFromEmbeddedFolderHtml(htmlText) {
  if (!htmlText || typeof htmlText !== 'string') return [];
  const photos = [];
  const seenIds = new Set();

  try {
    const parser = new DOMParser();
    const doc = parser.parseFromString(htmlText, 'text/html');
    const entries = doc.querySelectorAll('.flip-entry');

    entries.forEach((entry) => {
      const rawId = entry.getAttribute('id') || '';
      if (!rawId.startsWith('entry-')) return;

      // Lewati jika item adalah sub-folder
      const folderLink = entry.querySelector('a[href*="/folders/"]');
      if (folderLink) return;

      // Lewati jika nama file adalah video atau dokumen non-foto
      const titleEl = entry.querySelector('.flip-entry-title');
      const fileName = (titleEl ? titleEl.textContent : '').trim().toLowerCase();
      if (/\.(mp4|mov|avi|mkv|pdf|zip|rar|doc|docx|xls|xlsx)$/i.test(fileName)) {
        return;
      }

      const fileId = rawId.replace(/^entry-/, '').trim();
      if (fileId && !seenIds.has(fileId)) {
        seenIds.add(fileId);
        photos.push(`https://lh3.googleusercontent.com/d/${fileId}`);
      }
    });
  } catch (e) {
    // Lanjut ke fallback regex jika DOMParser gagal
  }

  // Fallback Regex jika struktur class berubah
  if (photos.length === 0) {
    const regex = /id="entry-([a-zA-Z0-9_-]{15,})"/g;
    let match;
    while ((match = regex.exec(htmlText)) !== null) {
      const fileId = match[1];
      if (fileId && !seenIds.has(fileId)) {
        seenIds.add(fileId);
        photos.push(`https://lh3.googleusercontent.com/d/${fileId}`);
      }
    }
  }

  return photos;
}

// Ambil isi foto dari link Folder Google Drive publik secara otomatis
async function fetchPhotosFromGoogleDriveFolder(folderId) {
  if (!folderId) return [];

  if (folderPhotoCache.has(folderId)) {
    return folderPhotoCache.get(folderId);
  }

  try {
    const cachedSession = sessionStorage.getItem(`wn_folder_${folderId}`);
    if (cachedSession) {
      const parsed = JSON.parse(cachedSession);
      if (Array.isArray(parsed) && parsed.length > 0) {
        folderPhotoCache.set(folderId, parsed);
        return parsed;
      }
    }
  } catch (e) {}

  const targetUrl = `https://drive.google.com/embeddedfolderview?id=${folderId}#list`;

  const fetchViaProxy = async (proxyUrl, isJson = false) => {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 7000);
    try {
      const res = await fetch(proxyUrl, { signal: controller.signal });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const html = isJson ? (await res.json()).contents : await res.text();
      const imgs = extractImagesFromEmbeddedFolderHtml(html);
      if (imgs.length === 0) throw new Error('Folder kosong atau belum publik');
      return imgs;
    } finally {
      clearTimeout(timer);
    }
  };

  try {
    const photos = await Promise.any([
      fetchViaProxy(`https://api.allorigins.win/get?url=${encodeURIComponent(targetUrl)}`, true),
      fetchViaProxy(`https://api.codetabs.com/v1/proxy?quest=${encodeURIComponent(targetUrl)}`, false),
      fetchViaProxy(`https://corsproxy.io/?${encodeURIComponent(targetUrl)}`, false),
      fetchViaProxy(`https://api.allorigins.win/raw?url=${encodeURIComponent(targetUrl)}`, false)
    ]);

    if (photos && photos.length > 0) {
      folderPhotoCache.set(folderId, photos);
      try {
        sessionStorage.setItem(`wn_folder_${folderId}`, JSON.stringify(photos));
      } catch (e) {}
      return photos;
    }
  } catch (err) {
    console.warn(`Tidak dapat memuat daftar file untuk folder ${folderId}:`, err);
  }

  return [];
}

// Preload semua folder klien di latar belakang agar saat diklik langsung muncul semua fotonya
async function prefetchAllClientFolders() {
  const sessionsWithFolder = allPhotos.filter((s) => s.folderId && !s.folderLoaded);
  await Promise.allSettled(
    sessionsWithFolder.map(async (session) => {
      const folderImgs = await fetchPhotosFromGoogleDriveFolder(session.folderId);
      if (folderImgs.length > 0) {
        session.gallery = mergeUniquePhotoUrls(session.gallery, folderImgs);
        if (!session.image && session.gallery.length > 0) {
          session.image = session.gallery[0];
        }
        session.folderLoaded = true;

        // Jika pengguna sedang membuka Lightbox klien ini, langsung perbarui tampilan thumbnail & slide
        if (currentClientSession && currentClientSession.id === session.id) {
          currentLightboxList = session.gallery;
          updateLightboxView(false);
        }
      }
    })
  );

  // Perbarui badge jumlah foto di kartu galeri depan
  renderPhotoGallery();
}

// Parse sel Image & Drive_Link dari Google Sheets
function parseGalleryCell(rawImageCell, rawDriveCell) {
  const combinedText = `${rawImageCell || ''}\n${rawDriveCell || ''}`;
  const tokens = combinedText
    .split(/[\n,;|\s]+/)
    .map((t) => t.trim())
    .filter(Boolean);

  const photoUrls = [];
  let folderId = null;

  tokens.forEach((token) => {
    const detectedFolderId = extractDriveFolderId(token);
    if (detectedFolderId) {
      if (!folderId) folderId = detectedFolderId;
      return;
    }

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
    gallery: uniqueGallery,
    folderId
  };
}

// Parser CSV
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
 * 2. FETCH DATA DARI GOOGLE SHEETS CSV
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

        const { coverImage, gallery, folderId } = parseGalleryCell(
          rawImage,
          `${rawDrive}\n${extraPhotosCol}`
        );

        if (!coverImage && gallery.length === 0 && !folderId) return;

        const sessionKey = `${category.toLowerCase()}__${title.toLowerCase()}`;
        if (clientSessionsMap.has(sessionKey)) {
          const existing = clientSessionsMap.get(sessionKey);
          existing.gallery = mergeUniquePhotoUrls(existing.gallery, gallery);
          if (!existing.folderId && folderId) {
            existing.folderId = folderId;
          }
        } else {
          clientSessionsMap.set(sessionKey, {
            id: `sheet-session-${index}`,
            title,
            category,
            image: coverImage || gallery[0] || '',
            gallery: gallery.length > 0 ? gallery : coverImage ? [coverImage] : [],
            folderId: folderId || null,
            folderLoaded: !folderId
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
    // Pindai otomatis seluruh isi folder Google Drive di latar belakang
    prefetchAllClientFolders();
  }
}

/**
 * ============================================================================
 * 3. RENDER GALERI FOTO MASONRY
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
 * 4. LIGHTBOX SLIDER KHUSUS PER KLIEN (OTOMATIS TAMPILKAN SEMUA FOTO FOLDER)
 * ============================================================================
 */
async function openClientLightbox(sessionItem) {
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

  // Jika klien memiliki folder Google Drive yang belum selesai dimuat, muat sekarang juga
  if (sessionItem.folderId && !sessionItem.folderLoaded) {
    const driveInfo = document.getElementById('lightbox-drive-info');
    if (driveInfo) {
      driveInfo.textContent = 'Memuat seluruh foto dari album klien...';
    }

    const folderPhotos = await fetchPhotosFromGoogleDriveFolder(sessionItem.folderId);
    if (folderPhotos.length > 0) {
      sessionItem.gallery = mergeUniquePhotoUrls(sessionItem.gallery, folderPhotos);
      sessionItem.folderLoaded = true;

      if (currentClientSession && currentClientSession.id === sessionItem.id) {
        currentLightboxList = [...sessionItem.gallery];
        updateLightboxView(false);
        renderPhotoGallery();
      }
    } else if (driveInfo) {
      driveInfo.textContent = '';
    }
  }
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
  const metaText = document.getElementById('lightbox-meta');
  const counterText = document.getElementById('lightbox-counter');
  const thumbsContainer = document.getElementById('lightbox-thumbnails');
  const driveInfo = document.getElementById('lightbox-drive-info');
  const prevBtn = document.getElementById('lightbox-prev');
  const nextBtn = document.getElementById('lightbox-next');

  // 1. Update Gambar Utama
  if (updateMainImage && mainImg) {
    mainImg.style.opacity = '0.35';
    mainImg.src = currentPhotoUrl;
    mainImg.alt = `${currentClientSession.category} — ${currentClientSession.title} (${currentLightboxIndex + 1})`;
    mainImg.onload = () => {
      mainImg.style.opacity = '1';
    };
  }

  // Tampilkan tombol panah Kiri/Kanan jika foto lebih dari 1
  const totalCount = currentLightboxList.length;
  if (prevBtn && nextBtn) {
    prevBtn.style.display = totalCount > 1 ? 'flex' : 'none';
    nextBtn.style.display = totalCount > 1 ? 'flex' : 'none';
  }

  // 2. Metadata Kiri Atas: "[Kategori] — [Nama Klien] — [Jumlah Foto]"
  if (metaText) {
    metaText.textContent = `${currentClientSession.category} — ${currentClientSession.title} — ${totalCount} Foto`;
  }
  if (counterText) {
    counterText.textContent = `${currentLightboxIndex + 1} / ${totalCount}`;
  }

  // 3. Deretan Display Kecil (Thumbnail Bawah) — Tampilkan Semua Foto Klien
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

  // 4. Hapus tombol Buka Google Drive (sesuai revisi)
  if (driveInfo) {
    driveInfo.textContent =
      totalCount > 1
        ? `Menampilkan foto ${currentLightboxIndex + 1} dari ${totalCount} — Klik foto kecil di atas atau geser untuk melihat lainnya`
        : '';
  }
}

/**
 * ============================================================================
 * 5. RENDER VIDEO REELS 9:16
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
 * 6. INISIALISASI EVENT LISTENERS
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

  // Dukungan scroll horizontal dengan roda mouse pada deretan thumbnail kecil bawah
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
