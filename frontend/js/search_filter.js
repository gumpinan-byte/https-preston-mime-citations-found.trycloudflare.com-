// Search, Multi-Filter & Car Catalog Manager
const SearchFilter = {
  currentFilters: {
    q: '',
    brand: 'all',
    body_type: 'all',
    fuel_type: 'all',
    transmission: 'all',
    min_price: 0,
    max_price: 10000000,
    seating: null,
    is_electric: null,
    is_new_launch: null,
    sort_by: 'popularity'
  },
  allCars: [],
  comparisonList: [],

  init() {
    this.bindEvents();
    this.fetchAndRender();
  },

  bindEvents() {
    // Search input
    const searchInput = document.getElementById('global-search-input');
    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        this.currentFilters.q = e.target.value;
        this.debounceFetch();
      });
    }

    // Price Slider
    const priceSlider = document.getElementById('price-range-slider');
    const priceDisplay = document.getElementById('price-slider-display');
    if (priceSlider && priceDisplay) {
      priceSlider.addEventListener('input', (e) => {
        const val = parseInt(e.target.value);
        this.currentFilters.max_price = val;
        priceDisplay.textContent = val >= 10000000 ? '? 1.00+ Crore' : `Up to ? ${(val / 100000).toFixed(1)} Lakh`;
        this.debounceFetch();
      });
    }

    // Sort selector
    const sortSelect = document.getElementById('sort-by-select');
    if (sortSelect) {
      sortSelect.addEventListener('change', (e) => {
        this.currentFilters.sort_by = e.target.value;
        this.fetchAndRender();
      });
    }
  },

  debounceTimer: null,
  debounceFetch() {
    clearTimeout(this.debounceTimer);
    this.debounceTimer = setTimeout(() => {
      this.fetchAndRender();
    }, 250);
  },

  setPricePreset(min, max, btnEl) {
    this.currentFilters.min_price = min;
    this.currentFilters.max_price = max;

    const slider = document.getElementById('price-range-slider');
    const priceDisplay = document.getElementById('price-slider-display');
    if (slider) slider.value = max;
    if (priceDisplay) {
      priceDisplay.textContent = max >= 10000000 ? '? 1.00+ Crore' : `Up to ? ${(max / 100000).toFixed(1)} Lakh`;
    }

    // Highlight active preset button
    document.querySelectorAll('.price-preset-btn').forEach(b => {
      b.classList.remove('bg-sky-600', 'text-white', 'border-sky-500');
      b.classList.add('bg-slate-800', 'text-slate-300', 'border-slate-700');
    });
    if (btnEl) {
      btnEl.classList.add('bg-sky-600', 'text-white', 'border-sky-500');
      btnEl.classList.remove('bg-slate-800', 'text-slate-300', 'border-slate-700');
    }

    this.fetchAndRender();
  },

  setFuelFilter(fuel, btnEl) {
    this.currentFilters.fuel_type = fuel;
    document.querySelectorAll('.fuel-filter-btn').forEach(b => {
      b.classList.remove('bg-sky-600', 'text-white', 'border-sky-500');
      b.classList.add('bg-slate-800', 'text-slate-300', 'border-slate-700');
    });
    if (btnEl) {
      btnEl.classList.add('bg-sky-600', 'text-white', 'border-sky-500');
      btnEl.classList.remove('bg-slate-800', 'text-slate-300', 'border-slate-700');
    }
    this.fetchAndRender();
  },

  setTransmissionFilter(trans, btnEl) {
    this.currentFilters.transmission = trans;
    document.querySelectorAll('.trans-filter-btn').forEach(b => {
      b.classList.remove('bg-sky-600', 'text-white', 'border-sky-500');
      b.classList.add('bg-slate-800', 'text-slate-300', 'border-slate-700');
    });
    if (btnEl) {
      btnEl.classList.add('bg-sky-600', 'text-white', 'border-sky-500');
      btnEl.classList.remove('bg-slate-800', 'text-slate-300', 'border-slate-700');
    }
    this.fetchAndRender();
  },

  setBodyTypeFilter(body, btnEl) {
    this.currentFilters.body_type = body;
    document.querySelectorAll('.body-filter-btn').forEach(b => {
      b.classList.remove('bg-sky-600', 'text-white', 'border-sky-500');
      b.classList.add('bg-slate-800', 'text-slate-300', 'border-slate-700');
    });
    if (btnEl) {
      btnEl.classList.add('bg-sky-600', 'text-white', 'border-sky-500');
      btnEl.classList.remove('bg-slate-800', 'text-slate-300', 'border-slate-700');
    }
    this.fetchAndRender();
  },

  setBrandFilter(brand) {
    this.currentFilters.brand = brand;
    this.fetchAndRender();
  },

  setQuickTag(type) {
    this.resetFilters(false);
    if (type === 'all') {
      // All cars
    } else if (type === 'electric') {
      this.currentFilters.fuel_type = 'Electric';
    } else if (type === 'suv') {
      this.currentFilters.body_type = 'SUV';
    } else if (type === 'budget10') {
      this.currentFilters.max_price = 1000000;
    } else if (type === 'luxury') {
      this.currentFilters.min_price = 4000000;
    } else if (type === '7seater') {
      this.currentFilters.seating = 7;
    } else if (type === 'new') {
      this.currentFilters.is_new_launch = 1;
    }

    // Highlight tag
    document.querySelectorAll('.quick-tag-btn').forEach(b => {
      b.classList.remove('bg-sky-600', 'text-white', 'shadow-sky-600/30');
      b.classList.add('bg-slate-800/80', 'text-slate-300');
    });
    const activeBtn = document.querySelector(`[data-tag="${type}"]`);
    if (activeBtn) {
      activeBtn.classList.add('bg-sky-600', 'text-white', 'shadow-sky-600/30');
      activeBtn.classList.remove('bg-slate-800/80', 'text-slate-300');
    }

    this.fetchAndRender();
    const catalogSection = document.getElementById('catalog-section');
    if (catalogSection) catalogSection.scrollIntoView({ behavior: 'smooth' });
  },

  resetFilters(doFetch = true) {
    this.currentFilters = {
      q: '',
      brand: 'all',
      body_type: 'all',
      fuel_type: 'all',
      transmission: 'all',
      min_price: 0,
      max_price: 10000000,
      seating: null,
      is_electric: null,
      is_new_launch: null,
      sort_by: 'popularity'
    };

    const searchInput = document.getElementById('global-search-input');
    if (searchInput) searchInput.value = '';

    const priceSlider = document.getElementById('price-range-slider');
    const priceDisplay = document.getElementById('price-slider-display');
    if (priceSlider) priceSlider.value = 10000000;
    if (priceDisplay) priceDisplay.textContent = 'Up to ? 1.00+ Crore';

    const brandSelect = document.getElementById('brand-filter-select');
    if (brandSelect) brandSelect.value = 'all';

    // Reset filter buttons
    document.querySelectorAll('.fuel-filter-btn, .trans-filter-btn, .body-filter-btn, .price-preset-btn').forEach(b => {
      b.classList.remove('bg-sky-600', 'text-white', 'border-sky-500');
      b.classList.add('bg-slate-800', 'text-slate-300', 'border-slate-700');
    });

    if (doFetch) this.fetchAndRender();
  },

  async fetchAndRender() {
    const grid = document.getElementById('car-grid');
    const countBadge = document.getElementById('cars-count-badge');
    if (!grid) return;

    grid.innerHTML = `
      <div class="col-span-full py-16 text-center">
        <div class="inline-block animate-spin w-10 h-10 border-4 border-sky-500 border-t-transparent rounded-full mb-3"></div>
        <p class="text-slate-400 text-sm">Finding cars matching your criteria...</p>
      </div>
    `;

    try {
      const res = await API.getCars(this.currentFilters);
      this.allCars = res.cars;
      if (countBadge) countBadge.textContent = `${res.total} Cars Available`;
      this.renderCarGrid(res.cars);
    } catch (err) {
      grid.innerHTML = `
        <div class="col-span-full py-12 text-center text-red-400 bg-red-950/20 border border-red-800/40 rounded-2xl p-6">
          <p class="font-semibold text-lg">Failed to load cars</p>
          <p class="text-sm mt-1 text-slate-400">${err.message}</p>
          <button onclick="SearchFilter.fetchAndRender()" class="mt-4 px-4 py-2 bg-sky-600 text-white rounded-lg text-sm">Retry</button>
        </div>
      `;
    }
  },

  renderCarGrid(cars) {
    const grid = document.getElementById('car-grid');
    if (!grid) return;

    if (!cars || cars.length === 0) {
      grid.innerHTML = `
        <div class="col-span-full py-20 text-center glass-card rounded-2xl p-8">
          <div class="w-16 h-16 bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-500">
            <i data-lucide="car" class="w-8 h-8"></i>
          </div>
          <h4 class="text-xl font-bold text-white mb-1">No Cars Found</h4>
          <p class="text-slate-400 text-sm max-w-md mx-auto mb-6">No cars matched your exact filter combination. Try expanding the price range or resetting filters.</p>
          <button onclick="SearchFilter.resetFilters()" class="px-5 py-2.5 bg-sky-600 hover:bg-sky-500 text-white rounded-xl text-sm font-semibold transition-all shadow-lg shadow-sky-600/30">
            Reset All Filters
          </button>
        </div>
      `;
      if (window.lucide) lucide.createIcons();
      return;
    }

    grid.innerHTML = cars.map(car => {
      const isFav = Auth.favorites.has(car.id);
      const isComp = this.comparisonList.includes(car.id);

      return `
        <div class="glass-card rounded-2xl overflow-hidden flex flex-col group border border-slate-800/80 hover:border-sky-500/50 transition-all duration-300">
          <!-- Car Image & Badges -->
          <div class="relative h-52 overflow-hidden bg-slate-900">
            <img src="${car.image_url}" alt="${car.brand} ${car.model}" 
              class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              loading="lazy"
              onerror="this.src='https://images.unsplash.com/photo-1542282088-72c9c27ed0cd?auto=format&fit=crop&w=1200&q=80'">
            
            <div class="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-transparent opacity-80"></div>
            
            <!-- Badges -->
            <div class="absolute top-3 left-3 flex flex-wrap gap-1.5">
              ${car.is_new_launch ? '<span class="px-2.5 py-1 rounded-md text-[11px] font-bold text-white badge-new">NEW LAUNCH</span>' : ''}
              ${car.is_electric ? '<span class="px-2.5 py-1 rounded-md text-[11px] font-bold text-white badge-electric">100% ELECTRIC</span>' : ''}
              <span class="px-2.5 py-1 rounded-md text-[11px] font-semibold text-slate-200 bg-slate-900/80 backdrop-blur-md border border-slate-700/60">${car.body_type}</span>
            </div>

            <!-- Favorite & Compare Buttons -->
            <div class="absolute top-3 right-3 flex items-center gap-1.5">
              <button onclick="SearchFilter.toggleCompare('${car.id}', event)" title="Compare"
                class="w-8 h-8 rounded-full ${isComp ? 'bg-indigo-600 text-white' : 'bg-slate-900/80 text-slate-300 hover:text-white'} backdrop-blur-md flex items-center justify-center transition-colors">
                <i data-lucide="scale" class="w-4 h-4"></i>
              </button>
              <button onclick="Auth.toggleFavorite('${car.id}')" title="Save Car"
                class="w-8 h-8 rounded-full ${isFav ? 'bg-red-500 text-white' : 'bg-slate-900/80 text-slate-300 hover:text-red-400'} backdrop-blur-md flex items-center justify-center transition-colors">
                <i data-lucide="heart" class="w-4 h-4 ${isFav ? 'fill-current' : ''}"></i>
              </button>
            </div>

            <!-- Rating Overlay -->
            <div class="absolute bottom-3 left-3 flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-900/90 backdrop-blur-md text-xs font-semibold text-amber-400">
              <i data-lucide="star" class="w-3.5 h-3.5 fill-current"></i>
              <span>${car.rating}</span>
              <span class="text-slate-400 font-normal">(${car.reviews_count})</span>
            </div>
          </div>

          <!-- Car Details -->
          <div class="p-5 flex-1 flex flex-col justify-between">
            <div>
              <div class="text-xs font-semibold text-sky-400 uppercase tracking-wider mb-1">${car.brand}</div>
              <h3 class="text-lg font-bold text-white group-hover:text-sky-300 transition-colors leading-snug">
                ${car.brand} ${car.model}
              </h3>
              <p class="text-xs text-slate-400 line-clamp-1 mt-0.5">${car.tagline || ''}</p>

              <!-- Price -->
              <div class="mt-3.5 pb-3.5 border-b border-slate-800/80">
                <div class="text-xl font-black text-white tracking-tight">${car.price_display}</div>
                <div class="text-[11px] text-slate-400 mt-0.5">Avg. Ex-Showroom Price (India)</div>
              </div>

              <!-- Key Specs Grid -->
              <div class="grid grid-cols-2 gap-2.5 my-4 text-xs">
                <div class="flex items-center gap-2 text-slate-300 bg-slate-800/50 p-2 rounded-lg border border-slate-800">
                  <i data-lucide="fuel" class="w-4 h-4 text-sky-400 shrink-0"></i>
                  <span class="truncate">${car.fuel_types.join(', ')}</span>
                </div>
                <div class="flex items-center gap-2 text-slate-300 bg-slate-800/50 p-2 rounded-lg border border-slate-800">
                  <i data-lucide="gauge" class="w-4 h-4 text-emerald-400 shrink-0"></i>
                  <span class="truncate">${car.mileage}</span>
                </div>
                <div class="flex items-center gap-2 text-slate-300 bg-slate-800/50 p-2 rounded-lg border border-slate-800">
                  <i data-lucide="cog" class="w-4 h-4 text-amber-400 shrink-0"></i>
                  <span class="truncate">${car.transmissions.slice(0, 2).join(', ')}</span>
                </div>
                <div class="flex items-center gap-2 text-slate-300 bg-slate-800/50 p-2 rounded-lg border border-slate-800">
                  <i data-lucide="shield-check" class="w-4 h-4 text-indigo-400 shrink-0"></i>
                  <span class="truncate">${car.safety_rating ? car.safety_rating.split(' ')[0] + ' Safety' : '5-Star NCAP'}</span>
                </div>
              </div>
            </div>

            <!-- Action Buttons -->
            <div class="pt-2 flex items-center gap-2">
              <button onclick="App.openCarDetail('${car.id}')" 
                class="flex-1 py-2.5 bg-sky-600 hover:bg-sky-500 text-white text-xs font-semibold rounded-xl transition-all shadow-md shadow-sky-600/20 flex items-center justify-center gap-1.5">
                <span>View Details & On-Road</span>
                <i data-lucide="arrow-right" class="w-3.5 h-3.5"></i>
              </button>
              <button onclick="App.openTestDrive('${car.id}', '${car.brand} ${car.model}')" 
                class="px-3.5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-xl transition-all border border-slate-700" title="Book Test Drive">
                <i data-lucide="calendar" class="w-4 h-4 text-sky-400"></i>
              </button>
            </div>
          </div>
        </div>
      `;
    }).join('');

    if (window.lucide) lucide.createIcons();
  },

  updateFavoriteIcons() {
    this.renderCarGrid(this.allCars);
  },

  toggleCompare(carId, e) {
    if (e) e.stopPropagation();
    const idx = this.comparisonList.indexOf(carId);
    if (idx > -1) {
      this.comparisonList.splice(idx, 1);
      showToast('Removed from comparison', 'info');
    } else {
      if (this.comparisonList.length >= 3) {
        showToast('You can compare up to 3 cars at a time', 'warning');
        return;
      }
      this.comparisonList.push(carId);
      showToast('Added to comparison!', 'success');
    }
    this.updateCompareFloatingBar();
    this.renderCarGrid(this.allCars);
  },

  updateCompareFloatingBar() {
    let bar = document.getElementById('compare-floating-bar');
    if (this.comparisonList.length === 0) {
      if (bar) bar.classList.add('hidden');
      return;
    }

    if (!bar) {
      bar = document.createElement('div');
      bar.id = 'compare-floating-bar';
      bar.className = 'fixed bottom-6 left-1/2 -translate-x-1/2 z-40 bg-slate-900/95 backdrop-blur-xl border border-sky-500/40 rounded-2xl px-6 py-3.5 shadow-2xl shadow-sky-950/80 flex items-center gap-4 animate-slideInUp';
      document.body.appendChild(bar);
    }

    bar.classList.remove('hidden');
    bar.innerHTML = `
      <div class="flex items-center gap-3">
        <span class="text-xs font-bold text-sky-400 uppercase tracking-wider">Compare (${this.comparisonList.length}/3)</span>
        <div class="flex items-center -space-x-2">
          ${this.comparisonList.map(id => {
            const car = this.allCars.find(c => c.id === id);
            return car ? `<img src="${car.image_url}" class="w-8 h-8 rounded-full border-2 border-slate-900 object-cover" title="${car.model}">` : '';
          }).join('')}
        </div>
      </div>
      <div class="flex items-center gap-2">
        <button onclick="App.openComparison(SearchFilter.comparisonList)" class="px-4 py-2 bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold rounded-xl shadow-lg shadow-sky-600/30 transition-all flex items-center gap-1.5">
          <i data-lucide="scale" class="w-3.5 h-3.5"></i> Compare Now
        </button>
        <button onclick="SearchFilter.clearComparison()" class="p-2 text-slate-400 hover:text-white rounded-lg transition-colors">
          <i data-lucide="x" class="w-4 h-4"></i>
        </button>
      </div>
    `;
    if (window.lucide) lucide.createIcons();
  },

  clearComparison() {
    this.comparisonList = [];
    this.updateCompareFloatingBar();
    this.renderCarGrid(this.allCars);
  }
};
