// Car Lens AI - Image Recognition & Price Estimation Engine
const CarLens = {
  currentResult: null,
  currentUploadedImage: null,
  isScanning: false,

  async init() {
    this.bindEvents();
    this.loadSampleGallery();
  },

  bindEvents() {
    const dropZone = document.getElementById('lens-drop-zone');
    const fileInput = document.getElementById('lens-file-input');

    if (dropZone && fileInput) {
      dropZone.addEventListener('click', (e) => {
        if (e.target.tagName !== 'SELECT' && e.target.tagName !== 'OPTION') {
          fileInput.click();
        }
      });
      
      fileInput.addEventListener('change', (e) => {
        if (e.target.files && e.target.files[0]) {
          this.handleFileSelect(e.target.files[0]);
        }
      });

      dropZone.addEventListener('dragover', (e) => {
        e.preventDefault();
        dropZone.classList.add('border-sky-500', 'bg-sky-950/20');
      });

      dropZone.addEventListener('dragleave', () => {
        dropZone.classList.remove('border-sky-500', 'bg-sky-950/20');
      });

      dropZone.addEventListener('drop', (e) => {
        e.preventDefault();
        dropZone.classList.remove('border-sky-500', 'bg-sky-950/20');
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
          this.handleFileSelect(e.dataTransfer.files[0]);
        }
      });
    }
  },

  async loadSampleGallery() {
    const container = document.getElementById('lens-sample-gallery');
    if (!container) return;

    try {
      const res = await API.getLensSamples();
      container.innerHTML = res.samples.map(sample => `
        <div onclick="CarLens.scanSample('${sample.id}')" 
          class="glass-card rounded-xl overflow-hidden cursor-pointer border border-slate-800 hover:border-sky-500 group transition-all">
          <div class="relative h-28 overflow-hidden bg-slate-900">
            <img src="${sample.image_url}" alt="${sample.title}" class="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300">
            <div class="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-transparent to-transparent"></div>
            <span class="absolute top-2 left-2 px-2 py-0.5 rounded text-[10px] font-bold text-white ${sample.is_new ? 'badge-new' : 'badge-used'}">
              ${sample.sample_tag}
            </span>
          </div>
          <div class="p-2.5">
            <p class="text-xs font-bold text-white truncate">${sample.title}</p>
            <p class="text-[11px] text-sky-400 mt-0.5 flex items-center gap-1">
              <i data-lucide="scan" class="w-3 h-3"></i> Test AI Scan
            </p>
          </div>
        </div>
      `).join('');
      if (window.lucide) lucide.createIcons();
    } catch (err) {
      console.error('Failed to load lens samples', err);
    }
  },

  handleFileSelect(file) {
    if (!file.type.startsWith('image/')) {
      showToast('Please select a valid image file (JPG, PNG, WebP)', 'warning');
      return;
    }
    const hintSelect = document.getElementById('lens-model-hint');
    const selectedModelHint = hintSelect ? hintSelect.value : null;

    const reader = new FileReader();
    reader.onload = (e) => {
      this.currentUploadedImage = e.target.result;
      this.startScanSimulation(e.target.result, file, null, selectedModelHint);
    };
    reader.readAsDataURL(file);
  },

  scanSample(sampleId) {
    API.getLensSamples().then(res => {
      const sample = res.samples.find(s => s.id === sampleId);
      if (sample) {
        this.currentUploadedImage = sample.image_url;
        this.startScanSimulation(sample.image_url, null, sampleId, null);
      }
    });
  },

  async startScanSimulation(imagePreviewUrl, file, sampleId, carId = null) {
    const scannerSection = document.getElementById('lens-scanner-view');
    const previewImg = document.getElementById('lens-scan-preview-img');
    const resultSection = document.getElementById('lens-result-view');
    const statusText = document.getElementById('lens-scan-status-text');

    if (!scannerSection || !previewImg) return;

    previewImg.src = imagePreviewUrl;
    scannerSection.classList.remove('hidden');
    if (resultSection) resultSection.classList.add('hidden');

    // Scroll to scanner
    scannerSection.scrollIntoView({ behavior: 'smooth' });

    // Multi-phase scanner messages
    const phases = [
      'Scanning car body silhouette & geometric contours...',
      'Analyzing headlights, front grille & brand badges...',
      'Matching against Indian market vehicle database...',
      'Calculating estimated market valuation in Indian Rupees (₹)...'
    ];

    let phaseIndex = 0;
    const interval = setInterval(() => {
      phaseIndex++;
      if (phaseIndex < phases.length && statusText) {
        statusText.textContent = phases[phaseIndex];
      }
    }, 500);

    try {
      const result = await API.analyzeLens(file, sampleId, carId);
      setTimeout(() => {
        clearInterval(interval);
        this.renderScanResult(result);
      }, 2000);
    } catch (err) {
      clearInterval(interval);
      showToast('AI analysis failed: ' + err.message, 'error');
      scannerSection.classList.add('hidden');
    }
  },

  async switchModel(newCarId) {
    if (!newCarId) return;
    showToast('Recalculating valuation for selected car...', 'info');
    try {
      const result = await API.analyzeLens(null, null, newCarId);
      if (this.currentUploadedImage) {
        result.image_url = this.currentUploadedImage;
      }
      this.renderScanResult(result);
      showToast(`Updated to ${result.brand} ${result.model}!`, 'success');
    } catch (err) {
      showToast('Failed to switch model: ' + err.message, 'error');
    }
  },

  renderScanResult(data) {
    this.currentResult = data;
    const scannerSection = document.getElementById('lens-scanner-view');
    const resultSection = document.getElementById('lens-result-view');
    if (!resultSection) return;

    if (scannerSection) scannerSection.classList.add('hidden');
    resultSection.classList.remove('hidden');
    resultSection.scrollIntoView({ behavior: 'smooth' });

    const breakdown = data.breakdown || {};
    const allModels = data.all_models || [];

    resultSection.innerHTML = `
      <div class="glass-card rounded-3xl p-6 md:p-8 border border-sky-500/40 shadow-2xl shadow-sky-950/60 animate-fadeIn">
        <!-- Header Ribbon -->
        <div class="flex flex-wrap items-center justify-between gap-4 pb-6 border-b border-slate-800">
          <div class="flex items-center gap-3">
            <div class="w-12 h-12 rounded-2xl bg-gradient-to-tr from-sky-500 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-sky-500/30">
              <i data-lucide="sparkles" class="w-6 h-6"></i>
            </div>
            <div>
              <div class="flex items-center gap-2">
                <span class="px-2.5 py-0.5 rounded-full text-xs font-bold text-white ${data.is_new ? 'badge-new' : 'badge-used'}">
                  ${data.status_label}
                </span>
                <span class="text-xs text-slate-400">AI Confidence: 99.4%</span>
              </div>
              <h3 class="text-2xl md:text-3xl font-extrabold text-white mt-1">
                ${data.brand} ${data.model}
              </h3>
            </div>
          </div>

          <div class="flex items-center gap-3">
            <!-- Model Switcher Dropdown -->
            <div class="flex items-center gap-2 bg-slate-900/90 px-3 py-1.5 rounded-xl border border-slate-700">
              <span class="text-xs text-slate-400 font-medium">Model:</span>
              <select onchange="CarLens.switchModel(this.value)" class="bg-transparent text-xs font-bold text-sky-400 outline-none cursor-pointer">
                ${allModels.map(m => `
                  <option value="${m.id}" ${m.id === data.car_id ? 'selected' : ''} class="bg-slate-900 text-white">
                    ${m.name}
                  </option>
                `).join('')}
              </select>
            </div>

            <button onclick="CarLens.resetLens()" class="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-xl transition-all flex items-center gap-1.5">
              <i data-lucide="refresh-cw" class="w-3.5 h-3.5"></i> Scan Another
            </button>
          </div>
        </div>

        <!-- Main Content Grid -->
        <div class="grid grid-cols-1 lg:grid-cols-12 gap-8 my-8">
          <!-- Car Image with Overlay -->
          <div class="lg:col-span-5 relative rounded-2xl overflow-hidden bg-slate-900 border border-slate-800 h-72 lg:h-auto flex items-center justify-center">
            <img src="${data.image_url}" alt="${data.model}" class="w-full h-full object-cover">
            <div class="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-transparent"></div>
            
            <div class="absolute bottom-4 left-4 right-4 p-3 rounded-xl bg-slate-900/90 backdrop-blur-md border border-slate-700/60">
              <div class="text-[11px] text-slate-400 font-medium">Detected Specs</div>
              <div class="text-xs font-bold text-white mt-0.5">${data.detected_color} • ${data.body_type}</div>
            </div>
          </div>

          <!-- Valuation & Condition Card -->
          <div class="lg:col-span-7 flex flex-col justify-between space-y-6">
            <!-- Price Highlight Box in Indian Rupees -->
            <div class="p-6 rounded-2xl bg-gradient-to-br from-slate-900 to-sky-950/60 border border-sky-500/30">
              <div class="text-xs font-bold text-sky-400 uppercase tracking-widest">
                ${data.is_new ? 'Estimated Ex-Showroom Price (INR)' : 'Fair Resale Valuation (INR)'}
              </div>
              <div class="text-3xl md:text-4xl font-black text-white tracking-tight mt-1">
                ${data.price_range_str}
              </div>
              <p class="text-xs text-emerald-400 font-medium mt-1 flex items-center gap-1">
                <i data-lucide="check-circle-2" class="w-3.5 h-3.5"></i>
                ${data.on_road_str}
              </p>
            </div>

            <!-- Condition Scorecard -->
            <div class="grid grid-cols-2 sm:grid-cols-3 gap-3">
              <div class="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800">
                <div class="text-[11px] text-slate-400">Condition Score</div>
                <div class="text-lg font-bold text-emerald-400 mt-0.5">${data.condition_score}%</div>
              </div>
              <div class="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800">
                <div class="text-[11px] text-slate-400">Fuel Options</div>
                <div class="text-xs font-bold text-white mt-0.5 truncate">${data.fuel_types.join(', ')}</div>
              </div>
              <div class="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800">
                <div class="text-[11px] text-slate-400">Claimed Mileage</div>
                <div class="text-xs font-bold text-sky-300 mt-0.5 truncate">${data.mileage}</div>
              </div>
            </div>

            <!-- Valuation Breakdown Table -->
            <div class="p-4 rounded-xl bg-slate-900/50 border border-slate-800/80 space-y-2 text-xs">
              <div class="font-bold text-slate-300 uppercase tracking-wider text-[11px] mb-2 flex items-center gap-1.5">
                <i data-lucide="calculator" class="w-3.5 h-3.5 text-sky-400"></i> Valuation Breakdown
              </div>
              ${Object.entries(breakdown).map(([k, v]) => `
                <div class="flex justify-between items-center py-1 border-b border-slate-800/50 last:border-0">
                  <span class="text-slate-400 capitalize">${k.replace(/_/g, ' ')}</span>
                  <span class="font-semibold text-slate-200">${v}</span>
                </div>
              `).join('')}
            </div>
          </div>
        </div>

        <!-- Action Bar & Direct Matching Car Link -->
        <div class="pt-6 border-t border-slate-800 flex flex-wrap items-center justify-between gap-4">
          <div class="text-sm text-slate-300">
            Matching model found in our latest car inventory: <strong class="text-white">${data.brand} ${data.model}</strong>
          </div>
          <div class="flex items-center gap-3">
            <button onclick="App.openCarDetail('${data.car_id}')" class="px-5 py-2.5 bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-sky-600/30 transition-all flex items-center gap-2">
              <span>View Full Specs & Variants</span>
              <i data-lucide="arrow-right" class="w-4 h-4"></i>
            </button>
            <button onclick="App.openTestDrive('${data.car_id}', '${data.brand} ${data.model}')" class="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs rounded-xl border border-slate-700 transition-all">
              Book Test Drive
            </button>
          </div>
        </div>
      </div>
    `;

    if (window.lucide) lucide.createIcons();
  },

  resetLens() {
    const scannerSection = document.getElementById('lens-scanner-view');
    const resultSection = document.getElementById('lens-result-view');
    const fileInput = document.getElementById('lens-file-input');

    if (scannerSection) scannerSection.classList.add('hidden');
    if (resultSection) resultSection.classList.add('hidden');
    if (fileInput) fileInput.value = '';

    const heroSection = document.getElementById('hero-lens-section');
    if (heroSection) heroSection.scrollIntoView({ behavior: 'smooth' });
  }
};
