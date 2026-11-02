const STORAGE_KEY = 'theme';

/**
 * @returns {'dark' | 'light'}
 */
export function getTheme() {
    const saved = localStorage[STORAGE_KEY];
    if (saved === 'dark' || saved === 'light') {
        return saved;
    }
    if (typeof window !== 'undefined' && typeof window.matchMedia === 'function') {
        return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }
    return 'light';
}

/**
 * @param {'dark' | 'light'} theme
 */
export function setTheme(theme) {
    const normalized = theme === 'dark' ? 'dark' : 'light';
    localStorage[STORAGE_KEY] = normalized;
    if (typeof document !== 'undefined' && document.documentElement) {
        document.documentElement.dataset.theme = normalized;
    }
    updateToggleButton(normalized);
    return normalized;
}

/**
 * @returns {'dark' | 'light'}
 */
export function toggleTheme() {
    const next = getTheme() === 'dark' ? 'light' : 'dark';
    return setTheme(next);
}

/**
 * @param {'dark' | 'light'} theme
 */
function updateToggleButton(theme) {
    if (typeof document === 'undefined') return;
    const btn = document.getElementById('btnDarkMode');
    if (!btn) return;
    const isDark = theme === 'dark';
    btn.setAttribute('aria-pressed', String(isDark));
    btn.textContent = isDark ? '☀️ Light' : '🌙 Dark';
}

export function initTheme() {
    if (typeof document === 'undefined') return;
    const saved = localStorage[STORAGE_KEY];
    if (saved === 'dark' || saved === 'light') {
        document.documentElement.dataset.theme = saved;
    }
    const current = getTheme();
    updateToggleButton(current);

    const btn = document.getElementById('btnDarkMode');
    if (btn && !btn.dataset.themeBound) {
        btn.dataset.themeBound = 'true';
        btn.addEventListener('click', () => {
            toggleTheme();
        });
    }
}
