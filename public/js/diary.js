class DiaryManager {
    constructor() {
        this.currentPage = 1;
        this.itemsPerPage = 10;
        this.currentView = 'grid';
        this.filters = {
            search: '',
            sortBy: 'created_at',
            sortOrder: 'DESC',
            mood: 'all'
        };
        this.diaries = [];
        this.stats = {};
        this.init();
    }

    getMoodIcon(mood) {
        const moodIcons = {
            'very_happy': '😄',
            'happy': '😊',
            'neutral': '😐',
            'sad': '😢',
            'very_sad': '😭',
            'excited': '🤩',
            'calm': '😌',
            'anxious': '😰'
        };
        return moodIcons[mood] || '😐';
    }

    async init() {
        await this.loadStats();
        await this.loadDiaries();
        this.setupEventListeners();
    }

    setupEventListeners() {
        document.querySelectorAll('.view-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const view = e.target.dataset.view || e.target.closest('.view-btn').dataset.view;
                this.switchView(view);
            });
        });

        document.getElementById('sortSelect').addEventListener('change', (e) => {
            this.filters.sortBy = e.target.value;
            this.loadDiaries();
        });

        document.getElementById('orderSelect').addEventListener('change', (e) => {
            this.filters.sortOrder = e.target.value;
            this.loadDiaries();
        });

        document.querySelectorAll('.mood-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const mood = e.target.dataset.mood || e.target.closest('.mood-btn').dataset.mood;
                this.setMoodFilter(mood);
            });
        });

        // 搜索防抖
        let searchTimeout;
        document.getElementById('searchInput').addEventListener('input', (e) => {
            clearTimeout(searchTimeout);
            searchTimeout = setTimeout(() => {
                this.filters.search = e.target.value;
                this.currentPage = 1;
                this.loadDiaries();
            }, 500);
        });
    }

    async loadStats() {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch('/api/diary/stats/overview', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (response.ok) {
                this.stats = await response.json();
                this.renderStats();
            }
        } catch (error) {
            console.error('Error loading stats:', error);
        }
    }

    renderStats() {
        document.getElementById('totalDiaries').textContent = this.stats.total || 0;
        document.getElementById('monthDiaries').textContent = this.stats.monthTotal || 0;
    }

    async loadDiaries() {
        try {
            this.showLoading();
            console.log('Loading diaries...');

            const token = localStorage.getItem('token');
            const params = new URLSearchParams({
                page: this.currentPage,
                limit: this.itemsPerPage,
                sortBy: this.filters.sortBy,
                sortOrder: this.filters.sortOrder,
                ...(this.filters.search && { search: this.filters.search }),
                ...(this.filters.mood !== 'all' && { mood: this.filters.mood })
            });

            const response = await fetch(`/api/diary?${params}`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            console.log('Response status:', response.status);

            if (response.ok) {
                const data = await response.json();
                console.log('Loaded diaries data:', data);

                this.diaries = data.diaries;
                this.pagination = data.pagination;
                this.renderDiaries();
                this.renderPagination();
            } else {
                const errorText = await response.text();
                console.error('Error response:', errorText);
                if (response.status === 401) {
                    console.warn('Unauthorized, redirecting to login...');
                    if (window.authManager) {
                        window.authManager.logout();
                    }
                    window.location.href = 'login/login.html';
                    return;
                }
                
                throw new Error('Failed to load diaries');
            }
        } catch (error) {
            console.error('Error loading diaries:', error);
            this.showError('Failed to load diaries: ' + error.message);
        } finally {
            this.hideLoading();
        }
    }

    showLoading() {
        document.getElementById('loadingState').style.display = 'flex';
        document.getElementById('diaryGrid').style.display = 'none';
        document.getElementById('diaryList').style.display = 'none';
        document.getElementById('emptyState').style.display = 'none';
        document.getElementById('pagination').style.display = 'none';
    }

    hideLoading() {
        document.getElementById('loadingState').style.display = 'none';
    }

    showError(message) {
        console.error('DiaryManager Error:', message);
        if (window.authManager) {
            window.authManager.showMessage(message, 'error');
        }
        this.showEmptyState();
    }

    showEmptyState() {
        document.getElementById('emptyState').style.display = 'block';
        document.getElementById('diaryGrid').style.display = 'none';
        document.getElementById('diaryList').style.display = 'none';
        document.getElementById('pagination').style.display = 'none';
    }

    renderDiaries() {

        if (this.diaries.length === 0) {
            this.showEmptyState();
            return;
        }

        const gridContainer = document.getElementById('diaryGrid');
        const listContainer = document.getElementById('diaryList');

        try {
            if (this.currentView === 'grid') {
                const cardsHTML = this.diaries.map(diary => this.createDiaryCard(diary)).join('');
                gridContainer.innerHTML = cardsHTML;
                gridContainer.style.display = 'grid';
                listContainer.style.display = 'none';
            } else {
                const itemsHTML = this.diaries.map(diary => this.createDiaryListItem(diary)).join('');
                listContainer.innerHTML = itemsHTML;
                listContainer.style.display = 'flex';
                gridContainer.style.display = 'none';
            }

            document.getElementById('emptyState').style.display = 'none';
        } catch (error) {
            console.error('Error rendering diaries:', error);
            this.showError('Error displaying diaries: ' + error.message);
        }
    }

    createDiaryCard(diary) {
        try {
            const moodIcon = this.getMoodIcon(diary.mood);
            const formattedDate = this.formatDate(diary.created_at);

            return `
                <div class="diary-card" onclick="viewDiary(${diary.id})">
                    <div class="diary-card-header">
                        <div class="diary-meta">
                            <span class="diary-date">${formattedDate}</span>
                            <span class="diary-mood">${moodIcon}</span>
                        </div>
                        <h3 class="diary-title">${this.escapeHtml(diary.title || 'Untitled')}</h3>
                        <p class="diary-excerpt">${this.escapeHtml(diary.excerpt || diary.content || '')}</p>
                    </div>
                    <div class="diary-actions">
                        <button class="action-icon-btn" onclick="event.stopPropagation(); editDiary(${diary.id})" title="Edit">
                            ✏️
                        </button>
                        <button class="action-icon-btn" onclick="event.stopPropagation(); deleteDiary(${diary.id})" title="Delete">
                            🗑️
                        </button>
                        ${diary.is_private ? '<button class="action-icon-btn" title="Private">🔒</button>' : ''}
                    </div>
                </div>
            `;
        } catch (error) {
            console.error('Error creating diary card for diary', diary.id, ':', error);
            return `
                <div class="diary-card">
                    <div class="diary-card-header">
                        <h3 class="diary-title">Error loading diary</h3>
                        <p class="diary-excerpt">Could not display this diary entry</p>
                    </div>
                </div>
            `;
        }
    }

    createDiaryListItem(diary) {
        try {
            const moodIcon = this.getMoodIcon(diary.mood);
            const formattedDate = this.formatDate(diary.created_at);

            return `
                <div class="diary-card" onclick="viewDiary(${diary.id})" style="display: flex; align-items: center; padding: 20px;">
                    <div style="flex: 1;">
                        <div style="display: flex; align-items: center; gap: 15px; margin-bottom: 10px;">
                            <h3 class="diary-title" style="margin: 0;">${this.escapeHtml(diary.title || 'Untitled')}</h3>
                            <span class="diary-mood">${moodIcon}</span>
                            <span class="diary-date">${formattedDate}</span>
                            ${diary.is_private ? '<span title="Private">🔒</span>' : ''}
                        </div>
                        <p class="diary-excerpt" style="margin: 0 0 10px 0;">${this.escapeHtml(diary.excerpt || diary.content || '')}</p>
                    </div>
                    <div class="diary-actions" style="flex-shrink: 0;">
                        <button class="action-icon-btn" onclick="event.stopPropagation(); editDiary(${diary.id})" title="Edit">
                            ✏️
                        </button>
                        <button class="action-icon-btn" onclick="event.stopPropagation(); deleteDiary(${diary.id})" title="Delete">
                            🗑️
                        </button>
                    </div>
                </div>
            `;
        } catch (error) {
            console.error('Error creating diary list item for diary', diary.id, ':', error);
            return `
                <div class="diary-card">
                    <div style="padding: 20px;">
                        <h3>Error loading diary</h3>
                        <p>Could not display this diary entry</p>
                    </div>
                </div>
            `;
        }
    }

    // pages
    renderPagination() {
        const paginationContainer = document.getElementById('pagination');

        if (!this.pagination || this.pagination.totalPages <= 1) {
            paginationContainer.style.display = 'none';
            return;
        }

        let paginationHtml = '';

        // last page

        paginationHtml += `
            <button class="page-btn" ${!this.pagination.hasPrev ? 'disabled' : ''} 
                    onclick="window.diaryManager.goToPage(${this.pagination.page - 1})">
                ← Previous
            </button>
        `;

        const startPage = Math.max(1, this.pagination.page - 2);
        const endPage = Math.min(this.pagination.totalPages, this.pagination.page + 2);

        if (startPage > 1) {
            paginationHtml += `<button class="page-btn" onclick="window.diaryManager.goToPage(1)">1</button>`;
            if (startPage > 2) {
                paginationHtml += `<span>...</span>`;
            }
        }

        for (let i = startPage; i <= endPage; i++) {
            paginationHtml += `
                <button class="page-btn ${i === this.pagination.page ? 'active' : ''}" 
                        onclick="window.diaryManager.goToPage(${i})">
                    ${i}
                </button>
            `;
        }

        if (endPage < this.pagination.totalPages) {
            if (endPage < this.pagination.totalPages - 1) {
                paginationHtml += `<span>...</span>`;
            }
            paginationHtml += `<button class="page-btn" onclick="window.diaryManager.goToPage(${this.pagination.totalPages})">${this.pagination.totalPages}</button>`;
        }

        // next page
        paginationHtml += `
            <button class="page-btn" ${!this.pagination.hasNext ? 'disabled' : ''} 
                    onclick="window.diaryManager.goToPage(${this.pagination.page + 1})">
                Next →
            </button>
        `;

        paginationContainer.innerHTML = paginationHtml;
        paginationContainer.style.display = 'flex';
    }

    switchView(view) {
        this.currentView = view;

        document.querySelectorAll('.view-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.view === view);
        });

        this.renderDiaries();
    }

    setMoodFilter(mood) {
        this.filters.mood = mood;
        this.currentPage = 1;

        document.querySelectorAll('.mood-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.mood === mood);
        });

        this.loadDiaries();
    }

    goToPage(page) {
        if (page >= 1 && page <= this.pagination.totalPages) {
            this.currentPage = page;
            this.loadDiaries();
        }
    }

    searchDiaries(searchTerm) {
        this.filters.search = searchTerm;
        this.currentPage = 1;
        this.loadDiaries();
    }

    async deleteDiary(diaryId) {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`/api/diary/${diaryId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (response.ok) {
                if (window.authManager) {
                    window.authManager.showMessage('Diary deleted successfully', 'success');
                }
                await this.loadStats();
                await this.loadDiaries();
            } else {
                throw new Error('Failed to delete diary');
            }
        } catch (error) {
            console.error('Error deleting diary:', error);
            if (window.authManager) {
                window.authManager.showMessage('Failed to delete diary', 'error');
            }
        }
    }

    formatDate(dateString) {
        try {
            const date = new Date(dateString);
            const now = new Date();
            const diff = now - date;
            const days = Math.floor(diff / (1000 * 60 * 60 * 24));

            if (days === 0) return 'Today';
            if (days === 1) return 'Yesterday';
            if (days < 7) return `${days} days ago`;

            return date.toLocaleDateString(undefined, {
                year: 'numeric',
                month: 'short',
                day: 'numeric'
            });
        } catch (error) {
            console.error('Error formatting date:', error);
            return 'Invalid date';
        }
    }

    escapeHtml(text) {
        if (!text) return '';
        const div = document.createElement('div');
        div.textContent = text.toString();
        return div.innerHTML;
    }
}

window.DiaryManager = DiaryManager;