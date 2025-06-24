class EnhancedDiaryEditor {
    constructor() {
        this.diaryId = null;
        this.mode = 'new';
        this.originalData = null;
        this.debugMode = true;
        this.currentWeather = null;
        this.init();
    }

    log(message, data = null) {
        if (this.debugMode) {
            console.log(`[DiaryEditor] ${message}`, data || '');
        }
    }

    async init() {
        this.log('Initializing diary editor...');
        this.parseUrlParams();
        await this.loadDiary();
        this.setupEventListeners();
    }

    setupEventListeners() {
        this.log('Setting up event listeners');

        document.querySelectorAll('.mood-option').forEach(option => {
            option.addEventListener('click', (e) => {
                const mood = e.target.dataset.mood || e.target.closest('.mood-option').dataset.mood;
                setMood(mood);
            });
        });

        const contentTextarea = document.getElementById('contentTextarea');
        if (contentTextarea) {
            contentTextarea.addEventListener('input', () => {
                updateWordCount();
                setModified();
            });
        }

        const titleInput = document.getElementById('titleInput');
        if (titleInput) {
            titleInput.addEventListener('input', setModified);
        }

        const locationInput = document.getElementById('locationInput');
        if (locationInput) {
            locationInput.addEventListener('input', setModified);
            locationInput.addEventListener('keydown', (e) => {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    checkWeather();
                }
            });
        }

        const privateToggle = document.getElementById('privateToggle');
        if (privateToggle) {
            privateToggle.addEventListener('change', setModified);
        }
    }

    parseUrlParams() {
        const urlParams = new URLSearchParams(window.location.search);
        this.diaryId = urlParams.get('id');
        this.mode = urlParams.get('mode') || (this.diaryId ? 'edit' : 'new');
        this.log('URL params parsed', { diaryId: this.diaryId, mode: this.mode });
        this.updatePageUI();
    }

    updatePageUI() {
        const pageTitle = document.getElementById('pageTitle');
        const clearBtn = document.getElementById('clearBtn');
        const publishBtn = document.getElementById('publishBtn');
        const deleteSection = document.getElementById('deleteSection');
        const formInputs = document.querySelectorAll('#diaryForm input, #diaryForm textarea, #diaryForm select');
        const checkWeatherBtn = document.getElementById('checkWeatherBtn');

        switch (this.mode) {
            case 'new':
                pageTitle.textContent = 'New Diary';
                if (deleteSection) deleteSection.style.display = 'none';
                break;

            case 'edit':
                pageTitle.textContent = 'Edit Diary';
                if (deleteSection) deleteSection.style.display = 'block';
                break;

            case 'view':
                pageTitle.textContent = 'View Diary';
                if (clearBtn) clearBtn.style.display = 'none';
                if (publishBtn) {
                    publishBtn.innerHTML = '✏️ <span>Edit</span>';
                    publishBtn.onclick = () => {
                        window.location.href = `diary-editor.html?id=${this.diaryId}&mode=edit`;
                    };
                }
                if (deleteSection) deleteSection.style.display = 'none';

                formInputs.forEach(input => {
                    input.disabled = true;
                    input.style.backgroundColor = '#f9fafb';
                });

                document.querySelectorAll('.mood-option').forEach(option => {
                    option.style.pointerEvents = 'none';
                    option.style.opacity = '0.7';
                });
                if (checkWeatherBtn) checkWeatherBtn.disabled = true;
                break;
        }
        this.log('Page UI updated for mode:', this.mode);
    }

    async loadDiary() {
        if (!this.diaryId) {
            this.loadDraft();
            return;
        }

        try {
            this.showLoading();
            this.log('Loading diary with ID:', this.diaryId);

            const token = localStorage.getItem('token');
            if (!token) {
                throw new Error('No authentication token found');
            }

            const response = await fetch(`/api/diary/${this.diaryId}`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Accept': 'application/json'
                }
            });

            this.log('Diary fetch response status:', response.status);

            if (response.ok) {
                const responseText = await response.text();
                this.log('Raw response text:', responseText);

                let diary;
                try {
                    diary = JSON.parse(responseText);
                    this.log('Diary loaded successfully:', diary);
                } catch (parseError) {
                    this.log('JSON parse error:', parseError);
                    throw new Error('Invalid response format from server');
                }

                this.originalData = diary;
                this.populateForm(diary);
            } else if (response.status === 404) {
                this.showError('Diary not found');
                setTimeout(() => window.location.href = 'diary.html', 2000);
            } else {
                const errorText = await response.text();
                this.log('Error response text:', errorText);

                let errorMessage = `HTTP ${response.status}`;
                try {
                    const errorData = JSON.parse(errorText);
                    errorMessage = errorData.error || errorData.message || errorMessage;
                } catch (parseError) {
                    errorMessage = errorText || errorMessage;
                }

                throw new Error(errorMessage);
            }
        } catch (error) {
            this.log('Error loading diary:', error);
            this.showError(`Failed to load diary: ${error.message}`);
        } finally {
            this.hideLoading();
        }
    }

    populateForm(diary) {
        this.log('Populating form with diary data:', diary);

        try {
            document.getElementById('titleInput').value = diary.title || '';
            document.getElementById('contentTextarea').value = diary.content || '';
            document.getElementById('locationInput').value = diary.location || '';
            document.getElementById('privateToggle').checked = diary.is_private !== false;

            // Handle weather data
            if (diary.weather) {
                const weatherDisplay = document.getElementById('weatherDisplay');
                const weatherInfo = document.getElementById('weatherInfo');
                if (weatherDisplay && weatherInfo) {
                    weatherDisplay.style.display = 'block';
                    weatherInfo.innerHTML = `🌤️ ${diary.weather}`;
                    this.currentWeather = { condition: diary.weather };
                }
            }

            if (diary.mood) {
                selectedMood = diary.mood;
                document.querySelectorAll('.mood-option').forEach(option => {
                    option.classList.toggle('selected', option.dataset.mood === diary.mood);
                });
            }

            updateWordCount();
            this.log('Form populated successfully');
        } catch (error) {
            this.log('Error populating form:', error);
            this.showError('Error loading diary data');
        }
    }

    showLoading() {
        const loadingState = document.getElementById('loadingState');
        const editorContent = document.getElementById('editorContent');
        if (loadingState) loadingState.style.display = 'flex';
        if (editorContent) editorContent.style.display = 'none';
    }

    hideLoading() {
        const loadingState = document.getElementById('loadingState');
        const editorContent = document.getElementById('editorContent');
        if (loadingState) loadingState.style.display = 'none';
        if (editorContent) editorContent.style.display = 'block';
    }

    showError(message) {
        if (window.authManager) {
            window.authManager.showMessage(message, 'error');
        } else {
            alert(message);
        }
    }

    showSuccess(message) {
        if (window.authManager) {
            window.authManager.showMessage(message, 'success');
        } else {
            alert(message);
        }
    }

    async saveDiary(diaryData, isPublish = false) {
        try {
            this.log('Saving diary data:', diaryData);
            this.log('Is publish mode:', isPublish);

            const token = localStorage.getItem('token');
            if (!token) {
                throw new Error('No authentication token found');
            }

            if (!diaryData.title?.trim()) {
                throw new Error('Title is required');
            }
            if (!diaryData.content?.trim()) {
                throw new Error('Content is required');
            }

            const url = this.diaryId ? `/api/diary/${this.diaryId}` : '/api/diary';
            const method = this.diaryId ? 'PUT' : 'POST';

            this.log('Request details:', { url, method, data: diaryData });

            this.log('Executing save request...');
            const response = await fetch(url, {
                method: method,
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                    'Accept': 'application/json'
                },
                body: JSON.stringify(diaryData)
            });

            this.log('Save response status:', response.status);

            let responseText = '';
            try {
                responseText = await response.text();
                this.log('Save response text:', responseText);
            } catch (textError) {
                this.log('Could not read response text:', textError);
                throw new Error('Could not read server response');
            }

            if (response.ok) {
                    if (!responseText.trim()) {
                        this.log('Empty response text despite success');
                        return { message: 'Empty success response' };
                    }

                    let result;
                    try {
                        result = JSON.parse(responseText);
                    } catch (parseError) {
                        this.log('Could not parse response as JSON:', parseError);
                        throw new Error('Invalid response format from server');
                    }

                if (!this.diaryId && result.diary?.id) {
                    this.diaryId = result.diary.id;
                    this.mode = 'edit';
                    const newUrl = `diary-editor.html?id=${this.diaryId}&mode=edit`;
                    window.history.replaceState(null, '', newUrl);
                    this.updatePageUI();
                    this.log('Updated diary ID:', this.diaryId);
                }

                this.clearDraft();

                if (isPublish) {
                    this.showSuccess('Diary published successfully');
                } else {
                    this.showSuccess('Draft saved successfully');
                }

                return result;
            } else {
                let errorMessage = `HTTP ${response.status}`;
                try {
                    if (responseText.trim() === '') {
                        errorMessage = `Server returned empty response with status ${response.status}`;
                    } else {
                        const errorData = JSON.parse(responseText);
                        errorMessage = errorData.error || errorData.message || errorMessage;
                    }
                } catch (parseError) {
                    errorMessage = responseText || errorMessage;
                }
                throw new Error(errorMessage);
            }
        } catch (error) {
            this.log('Save diary error:', error);

            let userMessage = 'Failed to save diary';

            if (error.message.includes('Title is required')) {
                userMessage = 'Please enter a title for your diary';
            } else if (error.message.includes('Content is required')) {
                userMessage = 'Please enter some content for your diary';
            } else if (error.message.includes('No authentication token')) {
                userMessage = 'Please log in again';
                setTimeout(() => window.location.href = 'login/login.html', 2000);
            } else {
                userMessage = `Failed to save diary: ${error.message}`;
            }

            throw new Error(userMessage);
        }
    }

    async deleteDiaryEntry() {
        if (!this.diaryId) return;

        try {
            this.log('Deleting diary with ID:', this.diaryId);

            const token = localStorage.getItem('token');
            const response = await fetch(`/api/diary/${this.diaryId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Accept': 'application/json'
                }
            });

            if (response.ok) {
                this.showSuccess('Diary deleted successfully');
                window.location.href = 'diary.html';
            } else {
                const errorText = await response.text();
                let errorMessage = `HTTP ${response.status}`;

                try {
                    const errorData = JSON.parse(errorText);
                    errorMessage = errorData.error || errorMessage;
                } catch (parseError) {
                    errorMessage = errorText || errorMessage;
                }

                throw new Error(errorMessage);
            }
        } catch (error) {
            this.log('Delete diary error:', error);
            throw error;
        }
    }

    async checkWeather() {
        const locationInput = document.getElementById('locationInput');
        const weatherDisplay = document.getElementById('weatherDisplay');
        const weatherInfo = document.getElementById('weatherInfo');
        const checkWeatherBtn = document.getElementById('checkWeatherBtn');

        const city = locationInput.value.trim();

        if (!city) {
            this.showError('Please enter a city name first');
            locationInput.focus();
            return;
        }

        try {
            checkWeatherBtn.disabled = true;
            checkWeatherBtn.innerHTML = '⏳ <span>Checking...</span>';
            weatherDisplay.style.display = 'block';
            weatherDisplay.classList.remove('weather-error');
            weatherInfo.textContent = 'Getting weather information...';

            // Call weather API
            const response = await fetch(`/api/weather?city=${encodeURIComponent(city)}`);

            if (!response.ok) {
                throw new Error('Weather service unavailable');
            }

            const weatherData = await response.json();

            // Display weather information
            this.currentWeather = {
                location: weatherData.location,
                temperature: weatherData.temperature,
                condition: weatherData.condition,
                humidity: weatherData.humidity,
                wind: weatherData.wind
            };

            const weatherText = `${this.currentWeather.condition}, ${this.currentWeather.temperature} (feels like ${weatherData.feels_like})`;
            weatherInfo.innerHTML = `🌤️ ${weatherText}`;

            setModified();

        } catch (error) {
            this.log('Weather check error:', error);
            weatherDisplay.classList.add('weather-error');
            weatherInfo.textContent = 'Unable to get weather information. Please try again.';
            this.currentWeather = null;
        } finally {
            checkWeatherBtn.disabled = false;
            checkWeatherBtn.innerHTML = '🌤️ <span>Check Weather</span>';
        }
    }

    clearDiary() {
        if (!confirm('Are you sure you want to clear all content? This action cannot be undone.')) {
            return;
        }

        document.getElementById('titleInput').value = '';
        document.getElementById('contentTextarea').value = '';
        document.getElementById('locationInput').value = '';

        const weatherDisplay = document.getElementById('weatherDisplay');
        if (weatherDisplay) weatherDisplay.style.display = 'none';
        this.currentWeather = null;

        selectedMood = 'neutral';
        document.querySelectorAll('.mood-option').forEach(option => {
            option.classList.toggle('selected', option.dataset.mood === 'neutral');
        });

        document.getElementById('privateToggle').checked = true;

        updateWordCount();

        this.clearDraft();

        isModified = false;

        document.getElementById('titleInput').focus();

        this.showSuccess('Diary content cleared');
    }

    saveDraft() {
        if (this.mode === 'view') return;

        const draftData = {
            title: document.getElementById('titleInput').value,
            content: document.getElementById('contentTextarea').value,
            mood: selectedMood,
            weather: this.currentWeather,
            location: document.getElementById('locationInput').value,
            is_private: document.getElementById('privateToggle').checked,
            timestamp: Date.now()
        };

        const draftKey = this.diaryId ? `diary_draft_${this.diaryId}` : 'diary_draft_new';
        localStorage.setItem(draftKey, JSON.stringify(draftData));
        this.log('Draft saved to localStorage');
    }

    loadDraft() {
        const draftKey = this.diaryId ? `diary_draft_${this.diaryId}` : 'diary_draft_new';
        const draftData = localStorage.getItem(draftKey);

        if (draftData) {
            try {
                const draft = JSON.parse(draftData);
                const draftAge = Date.now() - draft.timestamp;
                const sevenDays = 7 * 24 * 60 * 60 * 1000;

                if (draftAge > sevenDays) {
                    this.clearDraft();
                    return;
                }

                if (confirm('Found a saved draft. Would you like to restore it?')) {
                    this.populateForm(draft);
                    this.showSuccess('Draft restored');
                }
            } catch (error) {
                this.log('Error loading draft:', error);
                this.clearDraft();
            }
        }
    }

    clearDraft() {
        const draftKey = this.diaryId ? `diary_draft_${this.diaryId}` : 'diary_draft_new';
        localStorage.removeItem(draftKey);
        this.log('Draft cleared from localStorage');
    }
}

let selectedMood = 'neutral';
let autoSaveTimer;
let isModified = false;
let diaryEditor;


function setMood(mood) {
    selectedMood = mood;
    document.querySelectorAll('.mood-option').forEach(option => {
        option.classList.toggle('selected', option.dataset.mood === mood);
    });
    setModified();
    if (diaryEditor) diaryEditor.log('Mood set to:', mood);
}

function setModified() {
    isModified = true;
    clearTimeout(autoSaveTimer);
    autoSaveTimer = setTimeout(autoSave, 2000);
}

function updateWordCount() {
    const content = document.getElementById('contentTextarea').value || '';
    const wordCount = content.trim() ? content.trim().split(/\s+/).length : 0;
    const wordCountElement = document.getElementById('wordCount');
    if (wordCountElement) {
        wordCountElement.textContent = `${wordCount} words`;
    }
}

function getDiaryData() {
    return {
        title: document.getElementById('titleInput').value.trim(),
        content: document.getElementById('contentTextarea').value.trim(),
        mood: selectedMood,
        weather: diaryEditor.currentWeather ? `${diaryEditor.currentWeather.condition}, ${diaryEditor.currentWeather.temperature}` : '',
        location: document.getElementById('locationInput').value.trim(),
        is_private: document.getElementById('privateToggle').checked
    };
}

// Auto save
async function autoSave() {
    if (!isModified || !diaryEditor) return;

    const indicator = document.getElementById('autoSaveIndicator');
    if (indicator) {
        indicator.style.display = 'flex';
        indicator.classList.add('saving');
        const textElement = indicator.querySelector('span:last-child');
        if (textElement) textElement.textContent = 'Saving...';
    }

    try {
        diaryEditor.saveDraft();

        if (indicator) {
            indicator.classList.remove('saving');
            const textElement = indicator.querySelector('span:last-child');
            if (textElement) textElement.textContent = 'Auto saved';

            setTimeout(() => {
                indicator.style.display = 'none';
                isModified = false;
            }, 3000);
        }
    } catch (error) {
        console.error('Auto save failed:', error);
        if (indicator) {
            const textElement = indicator.querySelector('span:last-child');
            if (textElement) textElement.textContent = 'Save failed';
            indicator.classList.remove('saving');

            setTimeout(() => {
                indicator.style.display = 'none';
            }, 5000);
        }
    }
}

async function publishDiary() {
    const diaryData = getDiaryData();
    if (!diaryData.title || !diaryData.content) {
        diaryEditor.showError('Please enter both title and content');
        return;
    }

    try {
        await diaryEditor.saveDiary(diaryData, true);

        setTimeout(() => {
            window.location.href = 'diary.html';
        }, 1500);
    } catch (error) {
        diaryEditor.showError(error.message);
    }
}


async function deleteDiary() {
    if (!confirm('Are you sure you want to delete this diary entry? This action cannot be undone.')) {
        return;
    }

    try {
        await diaryEditor.deleteDiaryEntry();
    } catch (error) {
        diaryEditor.showError(error.message);
    }
}

function clearDiary() {
    if (diaryEditor) {
        diaryEditor.clearDiary();
    }
}

function checkWeather() {
    if (diaryEditor) {
        diaryEditor.checkWeather();
    }
}


document.addEventListener('DOMContentLoaded', () => {
    const token = localStorage.getItem('token');
    if (!token) {
        window.location.href = 'login/login.html';
        return;
    }

    diaryEditor = new EnhancedDiaryEditor();
});

window.EnhancedDiaryEditor = EnhancedDiaryEditor;
window.setMood = setMood;
window.clearDiary = clearDiary;
window.checkWeather = checkWeather;
window.publishDiary = publishDiary;
window.deleteDiary = deleteDiary;
window.updateWordCount = updateWordCount;
window.setModified = setModified;