const API = 'http://localhost:5000/api';

let selectedFile = null;
let selectedFormat = 'JPEG';
let compressedData = null;
let compressedMime = null;

// File Handling
function handleFileSelect(e) {
    processFile(e.target.files[0]);
}

function handleDrop(e) {
    e.preventDefault();
    document.getElementById('dropZone').classList.remove('drag-over');
    processFile(e.dataTransfer.files[0]);
}

function handleDragOver(e) {
    e.preventDefault();
    document.getElementById('dropZone').classList.add('drag-over');
}

function handleDragLeave() {
    document.getElementById('dropZone').classList.remove('drag-over');
}

function processFile(file) {
    if (!file) return;

    const allowed = ['image/png','image/jpeg','image/jpg','image/webp','image/bmp'];
    if (!allowed.includes(file.type)) {
        showError('Invalid file type. Use PNG, JPG, JPEG, WEBP or BMP.');
        return;
    }
    if (file.size > 10 * 1024 * 1024) {
        showError('File too large. Max size is 10MB.');
        return;
    }

    selectedFile = file;

    // Show original preview
    const reader = new FileReader();
    reader.onload = (e) => {
        document.getElementById('originalImg').src = e.target.result;
    };
    reader.readAsDataURL(file);

    // Update drop zone text
    document.getElementById('dropTitle').textContent = `✅ ${file.name}`;
    document.getElementById('dropSubtitle').textContent = `Size: ${formatSize(file.size)}`;

    // Show settings
    document.getElementById('settingsSection').style.display = 'block';
    document.getElementById('resultsSection').style.display = 'none';

    setTimeout(() => {
        document.getElementById('settingsSection').scrollIntoView({ behavior: 'smooth' });
    }, 100);
}

// Quality Slider
function updateQuality(val) {
    document.getElementById('qualityBadge').textContent = `${val}%`;
    const slider = document.getElementById('qualitySlider');
    slider.style.background = `linear-gradient(to right, #6366f1 ${val}%, #334155 ${val}%)`;
}

// Format Selection
function setFormat(fmt, btn) {
    selectedFormat = fmt;
    document.querySelectorAll('.fmt-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
}

// Compress
async function compressImage() {
    if (!selectedFile) { showError('Please select an image first.'); return; }

    const quality = document.getElementById('qualitySlider').value;
    const maxWidth = document.getElementById('maxWidth').value;
    const maxHeight = document.getElementById('maxHeight').value;

    // Show loading
    document.getElementById('loadingSection').style.display = 'block';
    document.getElementById('resultsSection').style.display = 'none';
    const btn = document.getElementById('compressBtn');
    btn.disabled = true;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Compressing...';

    const formData = new FormData();
    formData.append('image', selectedFile);
    formData.append('quality', quality);
    formData.append('format', selectedFormat);
    if (maxWidth) formData.append('maxWidth', maxWidth);
    if (maxHeight) formData.append('maxHeight', maxHeight);

    try {
        const res = await fetch(`${API}/compress`, {
            method: 'POST',
            body: formData
        });

        const data = await res.json();

        if (!res.ok) throw new Error(data.error || 'Compression failed');

        // Store compressed data
        compressedData = data.image_data;
        compressedMime = data.mime_type || 'image/jpeg';

        // Calculate sizes
        const originalSize = selectedFile.size;
        const base64Length = data.image_data.length - data.image_data.indexOf(',') - 1;
        const compressedSize = Math.round((base64Length * 3) / 4);
        const saved = ((originalSize - compressedSize) / originalSize * 100).toFixed(1);

        // Update stats
        document.getElementById('statOriginal').textContent = formatSize(originalSize);
        document.getElementById('statCompressed').textContent = formatSize(compressedSize);
        const savedEl = document.getElementById('statSaved');
        if (saved > 0) {
            savedEl.textContent = `${saved}% smaller`;
            savedEl.style.color = '#10b981';
        } else {
            savedEl.textContent = `${Math.abs(saved)}% larger`;
            savedEl.style.color = '#ef4444';
        }

        // Update meta info
        document.getElementById('originalMeta').textContent =
            `${selectedFile.name} • ${formatSize(originalSize)}`;
        document.getElementById('compressedMeta').textContent =
            `Format: ${selectedFormat} • Quality: ${quality}%`;

        // Show compressed image
        document.getElementById('compressedImg').src = data.image_data;

        // Show results
        document.getElementById('resultsSection').style.display = 'block';
        setTimeout(() => {
            document.getElementById('resultsSection').scrollIntoView({ behavior: 'smooth' });
        }, 100);

    } catch (err) {
        showError(err.message || 'Something went wrong. Is the server running?');
    } finally {
        document.getElementById('loadingSection').style.display = 'none';
        btn.disabled = false;
        btn.innerHTML = '<i class="fas fa-compress-alt"></i> Compress Image';
    }
}

// Download
function downloadImage() {
    if (!compressedData) { showError('No compressed image available.'); return; }
    const a = document.createElement('a');
    a.href = compressedData;
    a.download = `compressed.${selectedFormat.toLowerCase()}`;
    a.click();
}

// Reset
function resetTool() {
    selectedFile = null;
    compressedData = null;

    document.getElementById('fileInput').value = '';
    document.getElementById('settingsSection').style.display = 'none';
    document.getElementById('resultsSection').style.display = 'none';
    document.getElementById('loadingSection').style.display = 'none';
    document.getElementById('qualitySlider').value = 80;
    document.getElementById('maxWidth').value = '';
    document.getElementById('maxHeight').value = '';
    document.getElementById('dropTitle').textContent = 'Drop your image here';
    document.getElementById('dropSubtitle').textContent = 'or click to browse files';
    document.getElementById('originalImg').src = '';
    document.getElementById('compressedImg').src = '';

    updateQuality(80);
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

// Error Toast
function showError(msg) {
    document.getElementById('errorMsg').textContent = msg;
    document.getElementById('errorToast').style.display = 'flex';
    setTimeout(hideError, 5000);
}

function hideError() {
    document.getElementById('errorToast').style.display = 'none';
}

// Format file size
function formatSize(bytes) {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

// Check server on load
window.addEventListener('load', async () => {
    try {
        const res = await fetch(`${API}/health`);
        if (!res.ok) throw new Error();
        console.log('✅ Backend connected!');
    } catch {
        showError('⚠️ Cannot connect to server. Make sure Flask is running on port 5000.');
    }
});
