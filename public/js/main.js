class CarouselManager {

    //sorry 我还没做完图片所以就没做成轮播图
    init() {
        if (this.images.length > 0) {
            this.startAutoPlay();
        }
    }

    startAutoPlay() {
        this.autoPlayInterval = setInterval(() => {
            this.nextImage();
        }, 3000);
    }

    stopAutoPlay() {
        if (this.autoPlayInterval) {
            clearInterval(this.autoPlayInterval);
            this.autoPlayInterval = null;
        }
    }
}


class PageScrollManager {
    constructor() {
        this.currentPage = 0;
        this.pages = document.querySelectorAll('.page');
        this.navItems = document.querySelectorAll('.tanghulu-item');
        this.isScrolling = false;
        this.cloudImage = document.getElementById('cloud-image');
        this.init();
    }

    init() {
        this.setupEventListeners();
    }

    setupEventListeners() {
        window.addEventListener('wheel', (e) => {
            this.handleWheel(e);
        });

        this.navItems.forEach((item, index) => {
            item.addEventListener('click', (e) => {
                e.preventDefault();
                this.scrollToPage(index);
            });
        });
        window.addEventListener('keydown', (e) => {
            if (e.key === 'ArrowDown') {
                e.preventDefault();
                this.scrollToPage(this.currentPage + 1);
            } else if (e.key === 'ArrowUp') {
                e.preventDefault();
                this.scrollToPage(this.currentPage - 1);
            }
        });
    }

    handleWheel(e) {
        if (this.isScrolling) return;
        
        this.isScrolling = true;

        if (e.deltaY > 0 && this.currentPage < this.pages.length - 1) {
            this.scrollToPage(this.currentPage + 1);
        } else if (e.deltaY < 0 && this.currentPage > 0) {
            this.scrollToPage(this.currentPage - 1);
        } else {
            this.isScrolling = false;
        }

        setTimeout(() => {
            this.isScrolling = false;
        }, 1000);
    }

    scrollToPage(index) {
        if (index < 0 || index >= this.pages.length) return;

        this.currentPage = index;
        
        this.pages[this.currentPage].scrollIntoView({ behavior: 'smooth' });
        
        if (this.cloudImage) {
            this.cloudImage.style.transform = `translateY(-${index * 100}vh)`;
        }

        this.updateNavigation();
    }

    updateNavigation() {
        this.navItems.forEach((item, index) => {
            item.classList.toggle('active', index === this.currentPage);
        });
    }
}

function searchCity() {
    const searchInput = document.querySelector('.search-bar');
    const city = searchInput.value.trim();

    if (!city) {
        if (window.authManager) {
            window.authManager.showMessage('Please enter a city name!', 'warning');
        } else {
            alert('Please enter a city name!');
        }
        return;
    }

    window.location.href = `weather.html?city=${encodeURIComponent(city)}`;
}

// feedback - not tested yet
class FeedbackManager {
    constructor() {
        this.form = document.getElementById('feedbackForm');
        this.init();
    }

    init() {
        if (this.form) {
            this.form.addEventListener('submit', (e) => {
                this.handleSubmit(e);
            });
        }
    }

    async handleSubmit(e) {
        e.preventDefault();

        const formData = new FormData(this.form);
        const feedbackData = {
            name: formData.get('feedbackName') || document.getElementById('feedbackName').value,
            email: formData.get('feedbackEmail') || document.getElementById('feedbackEmail').value,
            type: formData.get('feedbackType') || document.getElementById('feedbackType').value,
            message: formData.get('feedbackMessage') || document.getElementById('feedbackMessage').value
        };

        if (!this.validateForm(feedbackData)) {
            return;
        }

        try {
            const submitBtn = this.form.querySelector('.submit-btn');
            const originalText = submitBtn.textContent;
            submitBtn.textContent = 'Submitting...';
            submitBtn.disabled = true;

            await this.submitFeedback(feedbackData);

            if (window.authManager) {
                window.authManager.showMessage('Thank you for your feedback!', 'success');
            }

            this.form.reset();

        } catch (error) {
            console.error('Error submitting feedback:', error);
            if (window.authManager) {
                window.authManager.showMessage('Failed to submit feedback. Please try again.', 'error');
            }
        } finally {
            const submitBtn = this.form.querySelector('.submit-btn');
            submitBtn.textContent = 'Submit Feedback';
            submitBtn.disabled = false;
        }
    }

    validateForm(data) {
        if (!data.name || !data.email || !data.type || !data.message) {
            if (window.authManager) {
                window.authManager.showMessage('Please fill in all fields', 'warning');
            }
            return false;
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(data.email)) {
            if (window.authManager) {
                window.authManager.showMessage('Please enter a valid email address', 'warning');
            }
            return false;
        }

        return true;
    }

    async submitFeedback(data) {
        // 模拟
        return new Promise((resolve) => {
            setTimeout(() => {
                console.log('Feedback submitted:', data);
                resolve();
            }, 1000);
        });
    }
}

function setupSearchEnterKey() {
    const searchInput = document.querySelector('.search-bar');
    if (searchInput) {
        searchInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                searchCity();
            }
        });
    }
}


function setupVisibilityAPI() {
    document.addEventListener('visibilitychange', () => {
        if (window.carouselManager) {
            if (document.hidden) {
                window.carouselManager.stopAutoPlay();
            } else {
                window.carouselManager.startAutoPlay();
            }
        }
    });
}


function setupResponsive() {
    const handleResize = () => {
        const tanghulu = document.querySelector('.tanghulu');
        if (tanghulu) {
            if (window.innerWidth < 768) {
                tanghulu.style.left = '20px';
                tanghulu.style.transform = 'translateY(-50%) scale(0.8)';
            } else {
                tanghulu.style.left = '90px';
                tanghulu.style.transform = 'translateY(-60%)';
            }
        }

        const searchBar = document.querySelector('.search-bar');
        if (searchBar) {
            if (window.innerWidth < 768) {
                searchBar.style.width = '300px';
            } else {
                searchBar.style.width = '500px';
            }
        }
    };

    window.addEventListener('resize', handleResize);
    handleResize();
}

document.addEventListener('DOMContentLoaded', () => {


    window.carouselManager = new CarouselManager();
    window.pageScrollManager = new PageScrollManager();
    window.feedbackManager = new FeedbackManager();


    setupSearchEnterKey();
    setupVisibilityAPI();
    setupResponsive();

    const searchButton = document.querySelector('.search-button');
    if (searchButton) {
        searchButton.onclick = searchCity;
    }
});

window.searchCity = searchCity;