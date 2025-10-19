// Menunggu sampai semua konten HTML dimuat
document.addEventListener("DOMContentLoaded", function() {
    
    // --- 1. Navigasi Aktif (Active Link) ---
    // Script ini akan otomatis memberi kelas 'active' pada link navbar
    // yang sesuai dengan halaman yang sedang dibuka.

    const navLinks = document.querySelectorAll('.nav-link');
    const currentPage = window.location.pathname.split('/').pop(); // Mendapat nama file, misal "scan.html"

    navLinks.forEach(link => {
        const linkPage = link.getAttribute('href').split('/').pop();

        // Jika tidak ada nama file (di halaman utama), set ke "index.html"
        const activePage = (currentPage === "") ? "index.html" : currentPage;

        if (linkPage === activePage) {
            link.classList.add('active');
        }
    });

    // --- 2. Placeholder untuk Fungsi Scan (Akan dipakai di scan.html) ---
    // // Menunggu sampai semua konten HTML dimuat
document.addEventListener("DOMContentLoaded", function() {
    
    // --- 1. Navigasi Aktif (Active Link) ---
    // Script ini akan otomatis memberi kelas 'active' pada link navbar
    // yang sesuai dengan halaman yang sedang dibuka.
    const navLinks = document.querySelectorAll('.nav-link');
    const currentPage = window.location.pathname.split('/').pop(); // Mendapat nama file, misal "scan.html"

    navLinks.forEach(link => {
        const linkPage = link.getAttribute('href').split('/').pop();
        const activePage = (currentPage === "") ? "index.html" : currentPage; // Default ke index.html

        if (linkPage === activePage) {
            link.classList.add('active');
        }
    });

    
    // --- 2. Fungsionalitas Halaman Skrining (scan.html) ---
    
    // Kita cari elemen-elemennya dulu
    const xrayInput = document.getElementById('xray-input');
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

    // Variabel untuk menyimpan file yang dipilih
    let selectedFile = null;

    // Cek jika kita berada di halaman scan (agar script ini tidak error di halaman lain)
    if (xrayInput) {
        
        // --- 2a. Saat Pengguna Memilih File ---
        xrayInput.addEventListener('change', function() {
            const file = this.files[0];
            
            if (file) {
                selectedFile = file; // Simpan file
                
                // Tampilkan preview gambar
                const reader = new FileReader();
                reader.onload = function(e) {
                    imagePreview.src = e.target.result;
                    previewContainer.style.display = 'block';
                }
                reader.readAsDataURL(file);
                
                // Aktifkan tombol scan
                scanButton.disabled = false;
                
            } else {
                // Jika pengguna batal memilih
                selectedFile = null;
                previewContainer.style.display = 'none';
                scanButton.disabled = true;
            }
        });

        // --- 2b. Saat Tombol "Analisis Gambar" Diklik ---
        scanButton.addEventListener('click', async function() {
            if (!selectedFile) {
                alert('Tolong pilih file gambar terlebih dahulu.');
                return;
            }

            // Tampilkan bagian hasil & loading spinner
            resultsSection.style.display = 'block';
            loadingSpinner.style.display = 'block';
            resultContent.style.display = 'none'; // Sembunyikan hasil lama
            heatmapContainer.style.display = 'none'; // Sembunyikan heatmap lama

            // Scroll ke bagian hasil
            resultsSection.scrollIntoView({ behavior: 'smooth' });

            // Buat FormData untuk dikirim ke API
            const formData = new FormData();
            formData.append('file', selectedFile); // 'file' adalah key yang akan dibaca API

            // =================================================================
            // === PENTING: GANTI URL INI DENGAN URL HUGGING FACE KAMU ===
            // =================================================================
            const API_URL = 'https://NAMA-SPACE-KAMU.hf.space/predict'; 
            // Contoh: 'https://nathanael-tubris-model.hf.space/predict'
            
            try {
                // Kirim data ke API menggunakan fetch
                const response = await fetch(API_URL, {
                    method: 'POST',
                    body: formData
                });

                if (!response.ok) {
                    throw new Error(`Error dari server: ${response.statusText}`);
                }

                const data = await response.json();

                // Tampilkan hasilnya
                displayResults(data);

            } catch (error) {
                // Tangani error jika API gagal
                console.error('Error saat fetch API:', error);
                loadingSpinner.style.display = 'none'; // Sembunyikan spinner
                resultFinding.textContent = 'Analisis Gagal';
                resultFinding.classList.add('result-positive'); // Kasih warna merah
                resultScore.textContent = 'Terjadi kesalahan. Silakan coba lagi.';
                resultContent.style.display = 'block';
            }
        });
    }

    // --- 2c. Fungsi untuk Menampilkan Hasil ---
    function displayResults(data) {
        // Data 'data' adalah JSON dari API kamu
        // Kita asumsikan formatnya:
        // {
        //   "hasil": "Risiko Tinggi", 
        //   "skor": 0.945,
        //   "heatmap_base64": "iVBORw0KGgoAAA..." (INI OPSIONAL, TAPI KEREN)
        // }

        // Sembunyikan spinner dan tampilkan konten hasil
        loadingSpinner.style.display = 'none';
        resultContent.style.display = 'block';

        // Set teks hasil
        resultFinding.textContent = data.hasil;
        resultScore.textContent = `Tingkat Keyakinan Model: ${(data.skor * 100).toFixed(1)}%`;

        // Hapus kelas warna lama & tambahkan yang baru
        resultFinding.classList.remove('result-positive', 'result-negative');
        if (data.hasil.toLowerCase().includes('risiko tinggi') || data.hasil.toLowerCase().includes('positive')) {
            resultFinding.classList.add('result-positive'); // Merah
        } else {
            resultFinding.classList.add('result-negative'); // Hijau
        }

        // --- Fitur Heatmap (Opsi 2) ---
        // Jika API kamu mengirimkan data heatmap:
        if (data.heatmap_base64) {
            // Set gambar heatmap
            heatmapImageResult.src = 'data:image/jpeg;base64,' + data.heatmap_base64;
            
            // Set gambar original (dari preview tadi)
            originalImageResult.src = imagePreview.src;
            
            // Tampilkan kontainer heatmap
            heatmapContainer.style.display = 'block';
        }
    }

}); // Akhir dari DOMContentLoaded

});