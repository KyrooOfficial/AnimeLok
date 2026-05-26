// ==================== KONFIGURASI API ====================
const API_BASE = 'api/stream/anime';

// State
let currentPage = 'home';
let currentAnimeId = null;
let currentEpisode = null;
let isLoading = false;
let ongoingData = null;
let completeData = null;
let scheduleData = null;
let ongoingPage = 1;
let completePage = 1;

// DOM Elements
const mainContent = document.getElementById('main-content');
const contentArea = document.getElementById('content-area');
const loadingEl = document.getElementById('loading');
const searchInput = document.getElementById('search-input');
const userLevelBtn = document.getElementById('user-level-btn');
const userPanel = document.getElementById('user-panel');
const notificationBtn = document.getElementById('notification-btn');
const notificationPanel = document.getElementById('notification-panel');
const premiumBtn = document.getElementById('premium-btn');
const premiumModal = document.getElementById('premium-modal');
const logoLink = document.getElementById('logo-link');
const miniPlayer = document.getElementById('mini-player');
const miniVideo = document.getElementById('mini-video');
const miniTitle = document.getElementById('mini-title');
const miniPlayPause = document.getElementById('mini-play-pause');
const miniClose = document.getElementById('mini-close');

// ==================== HELPER FUNCTIONS ====================
function showLoading(show) {
    loadingEl.style.display = show ? 'flex' : 'none';
    contentArea.style.display = show ? 'none' : 'block';
}

function closeAllDropdowns() {
    userPanel?.classList.remove('show');
    notificationPanel?.classList.remove('show');
}

// ==================== API CALLS ====================
async function fetchAPI(url) {
    try {
        const response = await fetch(url);
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        return await response.json();
    } catch (error) {
        console.error('Fetch error:', error);
        return null;
    }
}

async function loadOngoing(page = 1) {
    const data = await fetchAPI(`${API_BASE}/ongoing/?page=${page}`);
    if (data?.status === 'success' && data.data?.animeList) {
        if (page === 1) ongoingData = data.data.animeList;
        else ongoingData = [...ongoingData, ...data.data.animeList];
        return { list: data.data.animeList, pagination: data.pagination };
    }
    return { list: [], pagination: null };
}

async function loadComplete(page = 1) {
    const data = await fetchAPI(`${API_BASE}/complete/?page=${page}`);
    if (data?.status === 'success' && data.data?.animeList) {
        if (page === 1) completeData = data.data.animeList;
        else completeData = [...completeData, ...data.data.animeList];
        return { list: data.data.animeList, pagination: data.pagination };
    }
    return { list: [], pagination: null };
}

async function loadSchedule() {
    const data = await fetchAPI(`${API_BASE}/schedule/`);
    if (data?.status === 'success') {
        scheduleData = data.data;
        return scheduleData;
    }
    return null;
}

async function searchAnime(query) {
    const data = await fetchAPI(`${API_BASE}/search/?query=${encodeURIComponent(query)}`);
    if (data?.status === 'success' && data.data?.animeList) {
        return data.data.animeList;
    }
    return [];
}

// ==================== RENDER FUNCTIONS ====================

// Render Homepage (sesuai foto)
async function renderHome() {
    currentPage = 'home';
    showLoading(true);
    
    // Load data dari API
    const ongoingResult = await loadOngoing(1);
    const scheduleResult = await loadSchedule();
    const completeResult = await loadComplete(1);
    
    showLoading(false);
    
    // Get recent from localStorage
    const recentWatched = JSON.parse(localStorage.getItem('recentWatched') || '[]');
    
    const html = `
        <div>
            <!-- Daily Update Banner -->
            <div class="daily-update">
                <h3><i class="fas fa-calendar-day"></i> Daily Update</h3>
                <p>Bantu server?? beli vip aja #anibifree untuk semua 😍</p>
                <p class="views">73K views</p>
                <a href="#" class="premium-link" id="daily-premium-link">BELI PREMIUM DISINI</a>
            </div>
            
            <!-- Top Anime #1 One Piece -->
            <div class="section">
                <div class="section-header">
                    <h2>🔥 Trending</h2>
                    <a href="#" onclick="loadPage('ongoing')">Lihat semua</a>
                </div>
                <div class="top-anime-item" onclick="openDetail('one-piece', 'One Piece')">
                    <div class="rank">#1</div>
                    <img src="https://otakudesu.blog/wp-content/uploads/2021/05/One-Piece-Sub-Indo.jpg" alt="One Piece">
                    <div class="info">
                        <h4>One Piece</h4>
                        <p>Episode 1163 • Rating 8.7</p>
                    </div>
                </div>
            </div>
            
            <!-- Public Diskusi -->
            <div class="diskusi-card">
                <p><i class="fas fa-comments"></i> Public Diskusi - Masuk ruang obrolan anime realtime</p>
                <div class="diskusi-buttons">
                    <button class="diskusi-btn display" onclick="alert('Fitur chat akan segera hadir!')">Display Chat</button>
                    <button class="diskusi-btn masuk" onclick="alert('Masuk ke ruang diskusi')">Masuk</button>
                </div>
            </div>
            
            <!-- Terakhir Ditonton -->
            <div class="section">
                <div class="section-header">
                    <h2><i class="fas fa-history"></i> Terakhir Ditonton</h2>
                    <a href="#" onclick="loadPage('history')">Selengkapnya</a>
                </div>
                <div class="recent-list" id="recent-list">
                    ${renderRecentWatched(recentWatched)}
                </div>
            </div>
            
            <!-- New Anime Update -->
            <div class="section">
                <div class="section-header">
                    <h2><i class="fas fa-fire"></i> New Anime Update</h2>
                    <a href="#" onclick="loadPage('ongoing')">Lihat semua</a>
                </div>
                <div class="anime-grid" id="new-update-grid">
                    ${renderAnimeGrid(ongoingResult.list.slice(0, 8), true)}
                </div>
                ${ongoingResult.pagination?.hasNextPage ? `<button class="load-more-btn" id="load-more-new">Load More</button>` : ''}
            </div>
            
            <!-- Weekly Anime -->
            <div class="section">
                <div class="section-header">
                    <h2><i class="fas fa-calendar-week"></i> Weekly Anime</h2>
                    <a href="#" onclick="loadPage('schedule')">Lihat semua</a>
                </div>
                <div class="horiz-scroll">
                    ${renderWeeklyAnime(scheduleResult)}
                </div>
            </div>
            
            <!-- Completed Anime -->
            <div class="section">
                <div class="section-header">
                    <h2><i class="fas fa-check-circle"></i> Completed Anime</h2>
                    <a href="#" onclick="loadPage('complete')">Lihat semua</a>
                </div>
                <div class="anime-grid">
                    ${renderAnimeGrid(completeResult.list.slice(0, 8), false, true)}
                </div>
            </div>
        </div>
    `;
    
    contentArea.innerHTML = html;
    
    // Load more button
    const loadMoreBtn = document.getElementById('load-more-new');
    if (loadMoreBtn) {
        loadMoreBtn.onclick = () => loadMoreNewAnime();
    }
    
    // Premium link
    const premiumLink = document.getElementById('daily-premium-link');
    if (premiumLink) {
        premiumLink.onclick = (e) => {
            e.preventDefault();
            premiumModal.classList.add('show');
        };
    }
}

function renderAnimeGrid(animeList, showEpisode = true, showScore = false) {
    if (!animeList || animeList.length === 0) return '<p>Tidak ada anime</p>';
    
    return animeList.map(anime => `
        <div class="anime-card" onclick="openDetail('${anime.animeId || anime.slug || anime.id}', '${(anime.title || '').replace(/'/g, "\\'")}')">
            <img src="${anime.poster}" alt="${anime.title}" onerror="this.src='https://via.placeholder.com/200x300?text=No+Image'">
            <div class="info">
                <div class="title">${anime.title || 'Unknown'}</div>
                ${showEpisode && anime.episodes ? `<div class="episode">Episode ${anime.episodes}</div>` : ''}
                ${showEpisode && anime.latestReleaseDate ? `<div class="episode">${anime.latestReleaseDate}</div>` : ''}
                ${showScore && anime.score ? `<div class="score">⭐ ${anime.score}</div>` : ''}
            </div>
        </div>
    `).join('');
}

function renderRecentWatched(recentList) {
    if (recentList.length === 0) {
        return '<p style="padding: 20px;">Belum ada tontonan</p>';
    }
    return recentList.slice(0, 5).map(item => `
        <div class="recent-item" onclick="openPlayer('${item.id}', ${item.episode}, '${item.title.replace(/'/g, "\\'")}')">
            <img src="${item.poster}" alt="${item.title}">
            <div class="recent-info">
                <h4>${item.title.length > 15 ? item.title.substring(0, 15) + '...' : item.title}</h4>
                <p>Eps ${item.episode}</p>
            </div>
        </div>
    `).join('');
}

function renderWeeklyAnime(scheduleData) {
    if (!scheduleData || !Array.isArray(scheduleData)) return '<p>Jadwal tidak tersedia</p>';
    
    let allAnime = [];
    scheduleData.forEach(day => {
        if (day.anime_list) {
            allAnime = [...allAnime, ...day.anime_list.map(a => ({ ...a, day: day.day }))];
        }
    });
    
    return allAnime.slice(0, 15).map(anime => `
        <div class="anime-card-horiz" onclick="openDetail('${anime.slug}', '${(anime.title || '').replace(/'/g, "\\'")}')">
            <img src="${anime.poster}" alt="${anime.title}" onerror="this.src='https://via.placeholder.com/200x300?text=No+Image'">
            <div class="title">${anime.title || 'Unknown'}</div>
            <div class="episode" style="font-size:0.65rem; color:#e74c3c;">${anime.day || ''}</div>
        </div>
    `).join('');
}

// Load more New Anime
let newAnimePage = 1;
async function loadMoreNewAnime() {
    if (isLoading) return;
    isLoading = true;
    newAnimePage++;
    
    const result = await loadOngoing(newAnimePage);
    const container = document.getElementById('new-update-grid');
    
    if (container && result.list.length > 0) {
        const newGrid = document.createElement('div');
        newGrid.className = 'anime-grid';
        newGrid.innerHTML = renderAnimeGrid(result.list, true);
        container.appendChild(newGrid);
    } else {
        const btn = document.getElementById('load-more-new');
        if (btn) btn.style.display = 'none';
    }
    isLoading = false;
}

// ==================== DETAIL ANIME ====================
async function openDetail(animeId, animeTitle) {
    currentAnimeId = animeId;
    showLoading(true);
    
    // Fetch anime detail from API
    const data = await fetchAPI(`${API_BASE}/animeId/?animeId=${animeId}`);
    showLoading(false);
    
    // Gunakan data dari API atau fallback ke dummy
    let anime = data?.data || getDummyAnime(animeId, animeTitle);
    
    const html = `
        <div>
            <div class="section-header">
                <button onclick="renderHome()" style="background:none; border:none; color:#e74c3c; cursor:pointer;">
                    <i class="fas fa-arrow-left"></i> Kembali
                </button>
                <h2>${anime.title}</h2>
            </div>
            
            <div style="display: flex; gap: 20px; flex-wrap: wrap;">
                <img src="${anime.poster}" style="width: 180px; border-radius: 16px;" onerror="this.src='https://via.placeholder.com/200x300'">
                <div style="flex:1">
                    <p><strong>Status:</strong> ${anime.status || 'Ongoing'}</p>
                    <p><strong>Rating:</strong> ⭐ ${anime.rating || 'N/A'}</p>
                    <div class="synopsis" style="margin-top: 10px">
                        <p>${(anime.synopsis || 'Sinopsis tidak tersedia').substring(0, 300)}...</p>
                    </div>
                </div>
            </div>
            
            <div class="section-header" style="margin-top: 30px">
                <h2>Daftar Episode</h2>
            </div>
            <div class="episode-list" id="episode-list">
                ${renderEpisodeList(anime.episodes || getDummyEpisodes(), 1)}
            </div>
        </div>
    `;
    
    contentArea.innerHTML = html;
}

function renderEpisodeList(episodes, currentEp = 1) {
    if (!episodes || episodes.length === 0) {
        return '<p>Episode tidak tersedia</p>';
    }
    
    return episodes.map(ep => `
        <div class="episode-item" onclick="openPlayer('${currentAnimeId}', ${ep.number}, '${ep.title || 'Episode ' + ep.number}')">
            <div>
                <div class="episode-name">Episode ${ep.number}</div>
                <div class="episode-date">${ep.date || 'TBA'}</div>
            </div>
            <div class="episode-views">⭐ ${ep.views || 0} views</div>
        </div>
    `).join('');
}

// ==================== PLAYER PAGE (LANGSUNG PUTAR VIDEO) ====================
async function openPlayer(animeId, episodeNum, animeTitle) {
    showLoading(true);
    
    // Fetch server dan episode
    const serverData = await fetchAPI(`${API_BASE}/server/?serverId=default`);
    const episodeData = await fetchAPI(`${API_BASE}/episode/?animeId=${animeId}&episode=${episodeNum}`);
    
    showLoading(false);
    
    // Video URL (fallback ke sample video)
    const videoUrl = episodeData?.data?.videoUrl || 
                     serverData?.data?.url || 
                     'https://sample-videos.com/video123/mp4/720/big_buck_bunny_720p_1mb.mp4';
    
    // Save to recent watched
    const poster = episodeData?.data?.poster || `https://via.placeholder.com/200x300`;
    saveRecentWatched(animeId, animeTitle, episodeNum, poster);
    
    const html = `
        <div>
            <button onclick="renderHome()" style="background:none; border:none; color:#e74c3c; cursor:pointer; margin-bottom:15px;">
                <i class="fas fa-arrow-left"></i> Kembali
            </button>
            
            <div class="player-container">
                <video id="anime-video" controls autoplay>
                    <source src="${videoUrl}" type="video/mp4">
                    Browser tidak support video tag.
                </video>
            </div>
            
            <div class="player-controls-bar">
                <div>
                    <span>${animeTitle} - Episode ${episodeNum}</span>
                </div>
                <div class="quality-selector">
                    <select id="quality-select" onchange="changeQuality()">
                        <option value="1080p">1080p</option>
                        <option value="720p" selected>720p</option>
                        <option value="480p">480p</option>
                    </select>
                    <button class="download-btn" onclick="downloadEpisode()"><i class="fas fa-download"></i> Download</button>
                    <button class="report-btn" onclick="reportEpisode()"><i class="fas fa-flag"></i> Report</button>
                </div>
            </div>
            
            <div class="tips-mini" style="background: rgba(231,76,60,0.1); padding: 10px 15px; border-radius: 8px; margin-bottom: 20px;">
                <i class="fas fa-info-circle"></i> Tips: Tarik video ke bawah untuk minimize dan tetap nonton sambil buka halaman lain.
            </div>
            
            <div class="player-info">
                <h2>${animeTitle} - Episode ${episodeNum}</h2>
                <div class="player-desc">
                    ${episodeData?.data?.description || 'Deskripsi episode tidak tersedia.'}
                </div>
            </div>
            
            <div class="comments-section">
                <h3>💬 Komentar</h3>
                <div class="comment-input">
                    <i class="fas fa-user-circle"></i>
                    <textarea placeholder="Tulis komentar..." rows="2" id="comment-text"></textarea>
                </div>
                <div class="comment-list" id="comment-list">
                    ${renderComments()}
                </div>
            </div>
        </div>
    `;
    
    contentArea.innerHTML = html;
    
    // Setup mini player drag
    const video = document.getElementById('anime-video');
    if (video) {
        let touchStartY = 0;
        video.addEventListener('touchstart', (e) => { touchStartY = e.touches[0].clientY; });
        video.addEventListener('touchmove', (e) => {
            if (e.touches[0].clientY - touchStartY > 80) {
                minimizePlayer(video, animeTitle, episodeNum, videoUrl);
            }
        });
    }
}

function minimizePlayer(videoElement, title, episode, videoUrl) {
    miniVideo.src = videoUrl;
    miniTitle.innerText = `${title} - Eps ${episode}`;
    miniPlayer.style.display = 'block';
    
    const currentTime = videoElement.currentTime;
    miniVideo.currentTime = currentTime;
    videoElement.pause();
    miniVideo.play();
    
    miniClose.onclick = () => {
        miniPlayer.style.display = 'none';
        miniVideo.pause();
    };
    
    miniPlayPause.onclick = () => {
        if (miniVideo.paused) {
            miniVideo.play();
            miniPlayPause.innerHTML = '<i class="fas fa-pause"></i>';
        } else {
            miniVideo.pause();
            miniPlayPause.innerHTML = '<i class="fas fa-play"></i>';
        }
    };
}

// ==================== OTHER PAGES ====================
async function loadPage(page) {
    closeAllDropdowns();
    showLoading(true);
    
    if (page === 'home') {
        await renderHome();
    } else if (page === 'ongoing') {
        const result = await loadOngoing(1);
        showLoading(false);
        contentArea.innerHTML = `
            <div class="section-header"><h2>Anime Ongoing</h2></div>
            ${renderAnimeGrid(result.list, true)}
        `;
    } else if (page === 'complete') {
        const result = await loadComplete(1);
        showLoading(false);
        contentArea.innerHTML = `
            <div class="section-header"><h2>Completed Anime</h2></div>
            ${renderAnimeGrid(result.list, false, true)}
        `;
    } else if (page === 'schedule') {
        const schedule = await loadSchedule();
        showLoading(false);
        if (schedule) {
            let allHtml = '<div class="section-header"><h2>Jadwal Rilis Anime</h2></div>';
            schedule.forEach(day => {
                if (day.anime_list && day.anime_list.length > 0) {
                    allHtml += `<h3 style="color:#e74c3c; margin-top:20px;">${day.day}</h3>`;
                    allHtml += `<div class="horiz-scroll">`;
                    allHtml += day.anime_list.map(anime => `
                        <div class="anime-card-horiz" onclick="openDetail('${anime.slug}', '${(anime.title || '').replace(/'/g, "\\'")}')">
                            <img src="${anime.poster}" onerror="this.src='https://via.placeholder.com/200x300'">
                            <div class="title">${anime.title}</div>
                        </div>
                    `).join('');
                    allHtml += `</div>`;
                }
            });
            contentArea.innerHTML = allHtml;
        } else {
            contentArea.innerHTML = '<p>Jadwal tidak tersedia</p>';
        }
    } else if (page === 'history') {
        showLoading(false);
        const recent = JSON.parse(localStorage.getItem('recentWatched') || '[]');
        contentArea.innerHTML = `
            <div class="section-header"><h2>Riwayat Nonton</h2></div>
            ${recent.length === 0 ? '<p>Belum ada riwayat</p>' : 
                recent.map(item => `
                    <div class="recent-item" style="margin-bottom:10px;" onclick="openPlayer('${item.id}', ${item.episode}, '${item.title.replace(/'/g, "\\'")}')">
                        <img src="${item.poster}" style="width:60px; height:85px;">
                        <div class="recent-info">
                            <h4>${item.title}</h4>
                            <p>Episode ${item.episode}</p>
                            <span>${new Date(item.timestamp).toLocaleString()}</span>
                        </div>
                    </div>
                `).join('')
            }
        `;
    }
    
    // Update active bottom nav
    document.querySelectorAll('.bottom-nav-item').forEach(btn => {
        if (btn.dataset.page === page) btn.classList.add('active');
        else btn.classList.remove('active');
    });
}

function saveRecentWatched(animeId, title, episode, poster) {
    let recent = JSON.parse(localStorage.getItem('recentWatched') || '[]');
    recent = recent.filter(r => !(r.id === animeId && r.episode === episode));
    recent.unshift({ id: animeId, title, episode, poster, timestamp: Date.now() });
    recent = recent.slice(0, 20);
    localStorage.setItem('recentWatched', JSON.stringify(recent));
}

// ==================== DUMMY DATA ====================
function getDummyAnime(id, title) {
    return {
        title: title || 'Anime',
        poster: 'https://otakudesu.blog/wp-content/uploads/2026/04/Tsue-to-Tsurugi-no-Wistoria.jpg',
        status: 'Ongoing',
        rating: '8.5',
        synopsis: 'Sinopsis anime ini menceritakan petualangan seru...',
        episodes: getDummyEpisodes()
    };
}

function getDummyEpisodes() {
    return [
        { number: 1, date: '7 Apr 2026', views: 12500, title: 'Episode 1' },
        { number: 2, date: '14 Apr 2026', views: 11200, title: 'Episode 2' },
        { number: 3, date: '21 Apr 2026', views: 10800, title: 'Episode 3' },
        { number: 4, date: '28 Apr 2026', views: 10500, title: 'Episode 4' },
        { number: 5, date: '5 Mei 2026', views: 9800, title: 'Episode 5' }
    ];
}

function renderComments() {
    return [
        { author: 'AnimeLover', time: '2 jam lalu', content: 'Keren banget episode ini!', likes: 123 },
        { author: 'WeebHunter', time: '5 jam lalu', content: 'Animasi mantap', likes: 89 }
    ].map(c => `
        <div class="comment-item">
            <div class="comment-avatar" style="width:35px;height:35px;background:#e74c3c;border-radius:50%;display:flex;align-items:center;justify-content:center;">
                <i class="fas fa-user"></i>
            </div>
            <div class="comment-content">
                <p><strong>${c.author}</strong> • ${c.time}</p>
                <p>${c.content}</p>
                <span>❤️ ${c.likes} • Balas</span>
            </div>
        </div>
    `).join('');
}

// ==================== FUNGSI GLOBAL & EVENT ====================
function changeQuality() {
    alert('Fitur ganti kualitas memerlukan multiple source video');
}

function downloadEpisode() {
    alert('Fitur download tersedia untuk member Premium!');
}

function reportEpisode() {
    alert('Laporan terkirim. Terima kasih!');
}

// Search
searchInput?.addEventListener('input', async (e) => {
    const query = e.target.value.trim();
    if (query.length >= 2) {
        showLoading(true);
        const results = await searchAnime(query);
        showLoading(false);
        contentArea.innerHTML = `
            <div class="section-header"><h2>Hasil: "${query}"</h2></div>
            ${renderAnimeGrid(results, true)}
        `;
    } else if (query.length === 0) {
        renderHome();
    }
});

// Event Listeners
userLevelBtn?.addEventListener('click', (e) => {
    e.stopPropagation();
    userPanel?.classList.toggle('show');
    notificationPanel?.classList.remove('show');
});

notificationBtn?.addEventListener('click', (e) => {
    e.stopPropagation();
    notificationPanel?.classList.toggle('show');
    userPanel?.classList.remove('show');
});

premiumBtn?.addEventListener('click', () => premiumModal?.classList.add('show'));

document.querySelector('.modal-close')?.addEventListener('click', () => premiumModal?.classList.remove('show'));

premiumModal?.addEventListener('click', (e) => {
    if (e.target === premiumModal) premiumModal.classList.remove('show');
});

logoLink?.addEventListener('click', (e) => {
    e.preventDefault();
    renderHome();
});

document.addEventListener('click', () => {
    userPanel?.classList.remove('show');
    notificationPanel?.classList.remove('show');
});

// Bottom navigation
document.querySelectorAll('.bottom-nav-item').forEach(btn => {
    btn.addEventListener('click', () => loadPage(btn.dataset.page));
});

// Global functions
window.openDetail = openDetail;
window.openPlayer = openPlayer;
window.loadPage = loadPage;
window.changeQuality = changeQuality;
window.downloadEpisode = downloadEpisode;
window.reportEpisode = reportEpisode;
window.renderHome = renderHome;

// Initialize
renderHome();