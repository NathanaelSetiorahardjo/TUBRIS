// Menunggu sampai semua konten HTML dimuat
document.addEventListener("DOMContentLoaded", function() {
    
    // --- 1. Jalankan Inisialisasi Navigasi ---
    initActiveNav();

    // --- 2. Jalankan Inisialisasi Halaman Scan ---
    if (document.getElementById('xray-input')) {
        initScanPage();
    }
});


/**
 * Fungsi untuk memberi kelas 'active' pada link navbar yang sesuai.
 */
function initActiveNav() {
    const navLinks = document.querySelectorAll('.nav-link');
    const currentPage = window.location.pathname.split('/').pop();
    const activePage = (currentPage === "") ? "index.html" : currentPage;

    navLinks.forEach(link => {
        const linkPage = link.getAttribute('href').split('/').pop();
        if (linkPage === activePage) {
            link.classList.add('active');
        }
    });
}


/**
 * Fungsi untuk semua logika di halaman skrining (scan.html).
 */
function initScanPage() {
    // --- 2a. Ambil semua elemen UI ---
    const xrayInput = document.getElementById('xray-input');
    const uploadLabel = document.querySelector('.upload-label'); 
    const previewContainer = document.getElementById('preview-container');
    const imagePreview = document.getElementById('image-preview');
    const scanButton = document.getElementById('scan-btn');
    
    const resultsSection = document.getElementById('results-section');
    const loadingSpinner = document.getElementById('loading-spinner');
    const resultContent = document.getElementById('result-content');
    
    const resultFinding = document.getElementById('result-finding');
    const resultScore = document.getElementById('result-score');
    
    const heatmapContainer = document.getElementById('heatmap-container');
    const originalImageResult = document.getElementById('original-image-result');
    const heatmapImageResult = document.getElementById('heatmap-image-result');

    let selectedFile = null;

    // --- 2b. Event listener untuk KLIK (pilih file) ---
    xrayInput.addEventListener('change', function() {
        const file = this.files[0];
        if (file) {
            handleFile(file);
        }
    });

    // --- 2c. Event listener untuk DRAG & DROP --- 
    if (uploadLabel) {
        // Mencegah browser membuka file saat di-drag
        uploadLabel.addEventListener('dragover', function(event) {
            event.preventDefault();
            uploadLabel.classList.add('dragging'); 
        });

        uploadLabel.addEventListener('dragleave', function() {
            uploadLabel.classList.remove('dragging');
        });

        uploadLabel.addEventListener('drop', function(event) {
            event.preventDefault(); 
            uploadLabel.classList.remove('dragging');

            const file = event.dataTransfer.files[0];
            xrayInput.files = event.dataTransfer.files; // Sync input

            if (file) {
                handleFile(file);
            }
        });
    }

    // --- 2d. Fungsi helper untuk memproses file ---
    function handleFile(file) {
        selectedFile = file; 
            
        // Validasi tipe file sederhana (optional)
        if (!file.type.match('image.*')) {
            alert("Mohon unggah file gambar (.jpg, .png)");
            return;
        }

        const reader = new FileReader();
        reader.onload = function(e) {
            imagePreview.src = e.target.result;
            previewContainer.style.display = 'block';
        }
        reader.readAsDataURL(file);
        
        // Aktifkan tombol scan
        scanButton.disabled = false;
    }


    // --- 2e. Event listener saat tombol "Analisis Gambar" diklik ---
    scanButton.addEventListener('click', async function() {
        if (!selectedFile) {
            alert('Tolong pilih file gambar terlebih dahulu.');
            return;
        }

        // Tampilkan loading & scroll
        resultsSection.style.display = 'block';
        loadingSpinner.style.display = 'block';
        resultContent.style.display = 'none';
        heatmapContainer.style.display = 'none'; // Default hidden
        resultsSection.scrollIntoView({ behavior: 'smooth' });

        const formData = new FormData();
        formData.append('file', selectedFile);

        // --- KONFIGURASI API ---
        const API_URL = 'https://huggingface.co/spaces/Blaziooon/TUBRIS/predict'; 
        
        try {
            const response = await fetch(API_URL, {
                method: 'POST',
                body: formData
            });

            if (!response.ok) {
                throw new Error(`Error dari server: ${response.statusText}`);
            }

            const data = await response.json();
            displayResults(data);

        } catch (error) {
            console.error('Error saat fetch API:', error);
            loadingSpinner.style.display = 'none';
            resultContent.style.display = 'block';
            
            resultFinding.textContent = 'Gagal Terhubung';
            // Reset style
            resultFinding.className = ''; 
            resultFinding.style.color = '#dc2626'; // Merah
            
            resultScore.textContent = 'Pastikan backend (app.py) sudah berjalan dan URL benar.';
        }
    });

    // --- 2f. Fungsi untuk Menampilkan Hasil (LOGIKA ENSEMBLE) ---
    function displayResults(data) {
        loadingSpinner.style.display = 'none';
        resultContent.style.display = 'block';

        resultFinding.textContent = data.hasil;
        resultScore.textContent = `Tingkat Keyakinan: ${data.confidence}`;

        // Reset semua kelas warna
        resultFinding.classList.remove('result-positive', 'result-negative', 'result-warning');
        
        const hasilLower = data.hasil.toLowerCase();

        // 1. Logika Warna
        if (hasilLower === 'tuberculosis') {
            resultFinding.classList.add('result-positive'); // Merah
        } else if (hasilLower === 'normal') {
            resultFinding.classList.add('result-negative'); // Hijau
        } else {
            // Indeterminate / Ragu-ragu
            resultFinding.classList.add('result-warning'); // Kuning/Oranye
            // Pesan tambahan jika indeterminate
            resultScore.innerHTML = `Tingkat Keyakinan: ${data.confidence}<br><span style="font-size:0.9rem; color:#666;">(Zona Ragu-ragu. Disarankan cek manual.)</span>`;
        }

        // 2. Logika Heatmap (Hanya tampilkan jika backend mengirim data)
        // Backend ensemble kita saat ini return heatmap_base64: None
        if (data.heatmap_base64) {
            heatmapImageResult.src = 'data:image/jpeg;base64,' + data.heatmap_base64;
            originalImageResult.src = imagePreview.src;
            heatmapContainer.style.display = 'block';
        } else {
            // Sembunyikan kontainer jika tidak ada heatmap
            heatmapContainer.style.display = 'none';
        }
    }
}