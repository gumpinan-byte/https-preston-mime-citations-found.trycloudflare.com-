// Main Application Controller
const App = {
  currentCar: null,
  selectedCity: 'Delhi',
  cityTaxRates: {
    'Delhi': 0.10,
    'Mumbai': 0.13,
    'Bengaluru': 0.15,
    'Chennai': 0.12,
    'Hyderabad': 0.14,
    'Kolkata': 0.10
  },

  async init() {
    Auth.init();
    SearchFilter.init();
    CarLens.init();
    this.loadBrands();
    this.bindGlobalEvents();
  },

  async loadBrands() {
    const brandSelect = document.getElementById('brand-filter-select');
    if (!brandSelect) return;

    try {
      const res = await API.getBrands();
      const brands = Array.isArray(res) ? res : (res.brands || []);
      brands.forEach(b => {
        const opt = document.createElement('option');
        opt.value = b.brand;
        opt.textContent = `${b.brand} (${b.count})`;
        brandSelect.appendChild(opt);
      });
    } catch (err) {
      console.error('Failed to load brands:', err);
    }
  },

  bindGlobalEvents() {
    // City selector change
    const citySelect = document.getElementById('navbar-city-select');
    if (citySelect) {
      citySelect.addEventListener('change', (e) => {
        this.selectedCity = e.target.value;
        showToast(`Location set to ${this.selectedCity} for On-Road pricing`, 'info');
        if (this.currentCar) {
          this.updateOnRoadPriceDisplay();
        }
      });
    }
  },

  async openCarDetail(carId) {
    const modal = document.getElementById('car-detail-modal');
    const container = document.getElementById('car-detail-content');
    if (!modal || !container) return;

    modal.classList.remove('hidden');
    modal.classList.add('flex');
    container.innerHTML = `
      <div class="py-24 text-center">
        <div class="inline-block animate-spin w-10 h-10 border-4 border-sky-500 border-t-transparent rounded-full mb-3"></div>
        <p class="text-slate-400">Loading car specifications & variants...</p>
      </div>
    `;

    try {
      const car = await API.getCarDetail(carId);
      this.currentCar = car;
      this.renderCarDetailModal(car);
    } catch (err) {
      container.innerHTML = `
        <div class="py-12 text-center text-red-400">
          <p>Failed to load car details: ${err.message}</p>
        </div>
      `;
    }
  },

  closeCarDetail() {
    const modal = document.getElementById('car-detail-modal');
    if (modal) {
      modal.classList.add('hidden');
      modal.classList.remove('flex');
    }
  },

  renderCarDetailModal(car) {
    const container = document.getElementById('car-detail-content');
    if (!container) return;

    const rtoTaxRate = this.cityTaxRates[this.selectedCity] || 0.12;
    const baseExShowroom = car.min_price;
    const rtoAmount = Math.round(baseExShowroom * rtoTaxRate);
    const insuranceAmount = Math.round(baseExShowroom * 0.045);
    const otherCharges = 12000;
    const onRoadPrice = baseExShowroom + rtoAmount + insuranceAmount + otherCharges;

    container.innerHTML = `
      <!-- Header -->
      <div class="flex justify-between items-start pb-6 border-b border-slate-800">
        <div>
          <div class="flex items-center gap-2">
            <span class="px-2.5 py-0.5 rounded-full text-xs font-bold text-sky-400 bg-sky-950/80 border border-sky-800">${car.brand}</span>
            ${car.is_new_launch ? '<span class="px-2.5 py-0.5 rounded-full text-xs font-bold text-white badge-new">2024 Launch</span>' : ''}
            <span class="text-xs text-slate-400">${car.safety_rating || '5-Star Safety'}</span>
          </div>
          <h2 class="text-2xl md:text-3xl font-extrabold text-white mt-1">${car.brand} ${car.model}</h2>
          <p class="text-sm text-slate-400">${car.tagline || ''}</p>
        </div>
        <button onclick="App.closeCarDetail()" class="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors">
          <i data-lucide="x" class="w-6 h-6"></i>
        </button>
      </div>

      <!-- Main Showcase Grid -->
      <div class="grid grid-cols-1 lg:grid-cols-12 gap-8 my-8">
        <!-- Left: Image & Color Switcher -->
        <div class="lg:col-span-7 space-y-4">
          <div class="relative rounded-2xl overflow-hidden bg-slate-900 border border-slate-800 h-80">
            <img id="detail-active-car-img" src="${car.image_url}" alt="${car.model}" class="w-full h-full object-cover">
            <div class="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-transparent opacity-60"></div>
            
            <div class="absolute top-4 left-4 flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-900/90 backdrop-blur-md border border-slate-700 text-xs font-bold text-amber-400">
              <i data-lucide="star" class="w-4 h-4 fill-current"></i> ${car.rating} (${car.reviews_count} Reviews)
            </div>
          </div>

          <!-- 360 Color Selector -->
          ${car.colors && car.colors.length > 0 ? `
            <div class="p-4 rounded-xl bg-slate-900/80 border border-slate-800">
              <div class="text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2 flex items-center gap-2">
                <i data-lucide="palette" class="w-4 h-4 text-sky-400"></i>
                Available Colors: <span id="active-color-name" class="text-sky-400 font-bold">${car.colors[0].name}</span>
              </div>
              <div class="flex items-center gap-3">
                ${car.colors.map((c, i) => `
                  <button type="button" onclick="App.switchCarColor('${c.name}', '${c.hex}')" title="${c.name}"
                    class="w-8 h-8 rounded-full border-2 ${i === 0 ? 'border-sky-400 scale-110' : 'border-slate-700'} hover:scale-110 transition-all shadow-md"
                    style="background-color: ${c.hex};">
                  </button>
                `).join('')}
              </div>
            </div>
          ` : ''}
        </div>

        <!-- Right: On-Road Pricing & Quick Action -->
        <div class="lg:col-span-5 flex flex-col justify-between space-y-6">
          <div class="p-6 rounded-2xl bg-gradient-to-br from-slate-900 to-sky-950/70 border border-sky-500/30 space-y-4">
            <div>
              <span class="text-xs font-bold text-sky-400 uppercase tracking-wider">Ex-Showroom Price</span>
              <div class="text-3xl font-black text-white mt-0.5">${car.price_display}</div>
            </div>

            <div class="pt-3 border-t border-slate-800/80">
              <div class="flex justify-between items-center text-xs text-slate-400 mb-1">
                <span>Estimated On-Road Price in <strong class="text-sky-300">${this.selectedCity}</strong></span>
                <span class="text-emerald-400 font-bold text-sm">? ${(onRoadPrice / 100000).toFixed(2)} Lakh*</span>
              </div>
              
              <div class="space-y-1 text-[11px] text-slate-400 bg-slate-950/60 p-2.5 rounded-lg border border-slate-800">
                <div class="flex justify-between"><span>Base Model Ex-Showroom</span><span class="text-slate-200">? ${(baseExShowroom / 100000).toFixed(2)}L</span></div>
                <div class="flex justify-between"><span>RTO Registration (${this.selectedCity})</span><span class="text-slate-200">? ${(rtoAmount / 100000).toFixed(2)}L</span></div>
                <div class="flex justify-between"><span>Comprehensive Insurance</span><span class="text-slate-200">? ${(insuranceAmount / 100000).toFixed(2)}L</span></div>
                <div class="flex justify-between"><span>TCS + Fastag + Handling</span><span class="text-slate-200">? 12,000</span></div>
              </div>
            </div>

            <div class="pt-2 flex flex-col gap-2.5">
              <button onclick="App.openTestDrive('${car.id}', '${car.brand} ${car.model}')" 
                class="w-full py-3 bg-gradient-to-r from-sky-600 to-indigo-600 hover:from-sky-500 hover:to-indigo-500 text-white font-bold rounded-xl shadow-lg shadow-sky-600/30 transition-all flex items-center justify-center gap-2">
                <i data-lucide="calendar" class="w-4 h-4"></i> Book Free Test Drive
              </button>
              <button onclick="Auth.toggleFavorite('${car.id}')"
                class="w-full py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold rounded-xl border border-slate-700 transition-all flex items-center justify-center gap-2 text-xs">
                <i data-lucide="heart" class="w-4 h-4 text-red-400"></i> Save to Favorites
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Specs Matrix Tabs -->
      <div class="space-y-6">
        <h3 class="text-xl font-bold text-white flex items-center gap-2">
          <i data-lucide="info" class="w-5 h-5 text-sky-400"></i> Technical Specifications
        </h3>
        
        <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 text-xs">
          <div class="p-3.5 rounded-xl bg-slate-900 border border-slate-800">
            <span class="text-slate-400">Engine / Motor</span>
            <div class="text-white font-bold mt-1">${car.engine || 'N/A'}</div>
          </div>
          <div class="p-3.5 rounded-xl bg-slate-900 border border-slate-800">
            <span class="text-slate-400">Power</span>
            <div class="text-sky-300 font-bold mt-1">${car.power || 'N/A'}</div>
          </div>
          <div class="p-3.5 rounded-xl bg-slate-900 border border-slate-800">
            <span class="text-slate-400">Torque</span>
            <div class="text-amber-400 font-bold mt-1">${car.torque || 'N/A'}</div>
          </div>
          <div class="p-3.5 rounded-xl bg-slate-900 border border-slate-800">
            <span class="text-slate-400">Mileage / Range</span>
            <div class="text-emerald-400 font-bold mt-1">${car.mileage || 'N/A'}</div>
          </div>
          <div class="p-3.5 rounded-xl bg-slate-900 border border-slate-800">
            <span class="text-slate-400">Seating Capacity</span>
            <div class="text-white font-bold mt-1">${car.seating} Seater</div>
          </div>
          <div class="p-3.5 rounded-xl bg-slate-900 border border-slate-800">
            <span class="text-slate-400">Safety NCAP</span>
            <div class="text-indigo-400 font-bold mt-1">${car.safety_rating || '5-Star Bharat NCAP'}</div>
          </div>
          <div class="p-3.5 rounded-xl bg-slate-900 border border-slate-800">
            <span class="text-slate-400">Boot Space</span>
            <div class="text-white font-bold mt-1">${car.boot_space || 'N/A'}</div>
          </div>
          <div class="p-3.5 rounded-xl bg-slate-900 border border-slate-800">
            <span class="text-slate-400">Ground Clearance</span>
            <div class="text-white font-bold mt-1">${car.ground_clearance || 'N/A'}</div>
          </div>
        </div>

        <!-- Key Features List -->
        <div class="p-5 rounded-2xl bg-slate-900/80 border border-slate-800">
          <h4 class="text-sm font-bold text-slate-200 uppercase tracking-wider mb-3">Key Features & Tech</h4>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs text-slate-300">
            ${car.key_features.map(f => `
              <div class="flex items-center gap-2">
                <i data-lucide="check" class="w-4 h-4 text-emerald-400 shrink-0"></i>
                <span>${f}</span>
              </div>
            `).join('')}
          </div>
        </div>

        <!-- Variants & Pricing Table in Rupees -->
        <div class="p-5 rounded-2xl bg-slate-900/80 border border-slate-800">
          <h4 class="text-sm font-bold text-slate-200 uppercase tracking-wider mb-3">Variants & Prices in India</h4>
          <div class="overflow-x-auto">
            <table class="w-full text-xs text-left">
              <thead>
                <tr class="text-slate-400 border-b border-slate-800">
                  <th class="pb-2">Variant</th>
                  <th class="pb-2">Fuel</th>
                  <th class="pb-2">Transmission</th>
                  <th class="pb-2 text-right">Ex-Showroom Price</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-800/60">
                ${car.variants.map(v => `
                  <tr class="hover:bg-slate-800/40 transition-colors">
                    <td class="py-2.5 font-bold text-white">${v.name}</td>
                    <td class="py-2.5 text-slate-300">${v.fuel}</td>
                    <td class="py-2.5 text-slate-300">${v.transmission}</td>
                    <td class="py-2.5 text-right font-bold text-emerald-400">${v.price_display}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        </div>

        <!-- Interactive EMI Calculator Section -->
        <div id="emi-calculator-container"></div>

        <!-- User Reviews Section -->
        <div class="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-4">
          <div class="flex justify-between items-center">
            <h4 class="text-sm font-bold text-slate-200 uppercase tracking-wider">User Reviews & Ratings</h4>
            <button onclick="App.toggleReviewForm()" class="px-3 py-1.5 bg-sky-600/20 text-sky-400 border border-sky-500/40 rounded-lg text-xs font-semibold hover:bg-sky-600 hover:text-white transition-all">
              Write a Review
            </button>
          </div>

          <!-- Review Form (Hidden by default) -->
          <form id="car-review-form" onsubmit="App.submitReview(event, '${car.id}')" class="hidden p-4 rounded-xl bg-slate-950/80 border border-slate-800 space-y-3">
            <div>
              <label class="block text-xs text-slate-300 mb-1">Your Name</label>
              <input type="text" id="review-user-name" required placeholder="e.g. Ankit Verma" class="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white outline-none">
            </div>
            <div class="grid grid-cols-2 gap-3">
              <div>
                <label class="block text-xs text-slate-300 mb-1">Rating (1 to 5 Stars)</label>
                <select id="review-rating" class="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white outline-none">
                  <option value="5">????? (5 - Outstanding)</option>
                  <option value="4">???? (4 - Very Good)</option>
                  <option value="3">??? (3 - Average)</option>
                  <option value="2">?? (2 - Below Average)</option>
                  <option value="1">? (1 - Poor)</option>
                </select>
              </div>
              <div>
                <label class="block text-xs text-slate-300 mb-1">Review Title</label>
                <input type="text" id="review-title" required placeholder="e.g. Excellent Mileage and Comfort" class="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white outline-none">
              </div>
            </div>
            <div>
              <label class="block text-xs text-slate-300 mb-1">Your Review</label>
              <textarea id="review-comment" required rows="3" placeholder="Share your experience regarding engine, comfort, mileage..." class="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white outline-none"></textarea>
            </div>
            <button type="submit" class="px-4 py-2 bg-sky-600 hover:bg-sky-500 text-white rounded-lg text-xs font-bold transition-all">
              Submit Review
            </button>
          </form>

          <!-- Reviews List -->
          <div class="space-y-3">
            ${car.reviews && car.reviews.length > 0 ? car.reviews.map(r => `
              <div class="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800/80">
                <div class="flex justify-between items-start">
                  <div>
                    <span class="text-xs font-bold text-white">${r.user_name}</span>
                    <h5 class="text-xs font-semibold text-sky-300 mt-0.5">${r.title}</h5>
                  </div>
                  <div class="text-amber-400 text-xs">${'?'.repeat(r.rating)}</div>
                </div>
                <p class="text-xs text-slate-400 mt-1.5">${r.comment}</p>
              </div>
            `).join('') : '<p class="text-xs text-slate-500">No user reviews yet. Be the first to review!</p>'}
          </div>
        </div>
      </div>
    `;

    if (window.lucide) lucide.createIcons();
    EMICalculator.init(car);
  },

  switchCarColor(colorName, hex) {
    const label = document.getElementById('active-color-name');
    if (label) label.textContent = colorName;
    showToast(`Color selected: ${colorName}`, 'info');
  },

  toggleReviewForm() {
    const form = document.getElementById('car-review-form');
    if (form) form.classList.toggle('hidden');
  },

  async submitReview(e, carId) {
    e.preventDefault();
    const userName = document.getElementById('review-user-name').value.trim();
    const rating = parseInt(document.getElementById('review-rating').value);
    const title = document.getElementById('review-title').value.trim();
    const comment = document.getElementById('review-comment').value.trim();

    try {
      await API.submitReview(carId, {
        car_id: carId,
        user_name: userName,
        rating: rating,
        title: title,
        comment: comment
      });
      showToast('Thank you! Your review has been published.', 'success');
      this.openCarDetail(carId); // Reload
    } catch (err) {
      showToast('Failed to submit review: ' + err.message, 'error');
    }
  },

  // Test Drive Modal
  openTestDrive(carId, carName) {
    const modal = document.getElementById('test-drive-modal');
    if (!modal) return;

    document.getElementById('td-car-id').value = carId;
    document.getElementById('td-car-name').value = carName;
    document.getElementById('td-modal-car-title').textContent = `Book Test Drive: ${carName}`;

    // Autofill user info if logged in
    if (Auth.isLoggedIn()) {
      document.getElementById('td-fullname').value = Auth.user.full_name || '';
      document.getElementById('td-email').value = Auth.user.email || '';
      document.getElementById('td-phone').value = Auth.user.phone || '';
    }

    modal.classList.remove('hidden');
    modal.classList.add('flex');
    if (window.lucide) lucide.createIcons();
  },

  closeTestDrive() {
    const modal = document.getElementById('test-drive-modal');
    if (modal) {
      modal.classList.add('hidden');
      modal.classList.remove('flex');
    }
  },

  async handleTestDriveSubmit(e) {
    e.preventDefault();
    const carId = document.getElementById('td-car-id').value;
    const carName = document.getElementById('td-car-name').value;
    const fullName = document.getElementById('td-fullname').value.trim();
    const phone = document.getElementById('td-phone').value.trim();
    const email = document.getElementById('td-email').value.trim();
    const city = document.getElementById('td-city').value;
    const date = document.getElementById('td-date').value;
    const time = document.getElementById('td-time').value;

    try {
      const res = await API.bookTestDrive({
        car_id: carId,
        car_name: carName,
        full_name: fullName,
        phone: phone,
        email: email,
        city: city,
        preferred_date: date,
        preferred_time: time
      });
      showToast(res.message, 'success');
      this.closeTestDrive();
    } catch (err) {
      showToast('Booking failed: ' + err.message, 'error');
    }
  },

  // Car Comparison Modal
  async openComparison(carIds) {
    const modal = document.getElementById('compare-modal');
    const container = document.getElementById('compare-modal-content');
    if (!modal || !container) return;

    modal.classList.remove('hidden');
    modal.classList.add('flex');

    container.innerHTML = `
      <div class="py-20 text-center">
        <div class="inline-block animate-spin w-10 h-10 border-4 border-sky-500 border-t-transparent rounded-full mb-3"></div>
        <p class="text-slate-400">Building comparison matrix...</p>
      </div>
    `;

    try {
      const res = await API.compareCars(carIds);
      const cars = res.comparison;

      if (cars.length === 0) {
        container.innerHTML = `<p class="p-8 text-center text-slate-400">Please select at least 2 cars to compare.</p>`;
        return;
      }

      container.innerHTML = `
        <div class="flex justify-between items-center pb-6 border-b border-slate-800">
          <div>
            <h3 class="text-2xl font-bold text-white flex items-center gap-2">
              <i data-lucide="scale" class="w-6 h-6 text-sky-400"></i> Side-by-Side Car Comparison
            </h3>
            <p class="text-sm text-slate-400 mt-0.5">Comparing ${cars.length} cars specification by specification</p>
          </div>
          <button onclick="App.closeComparison()" class="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors">
            <i data-lucide="x" class="w-6 h-6"></i>
          </button>
        </div>

        <div class="overflow-x-auto my-6">
          <table class="w-full text-xs text-left border-collapse">
            <thead>
              <tr class="border-b border-slate-800">
                <th class="p-3 text-slate-400 w-1/4">Parameter</th>
                ${cars.map(c => `
                  <th class="p-3 text-center w-1/3">
                    <img src="${c.image_url}" class="h-28 w-full object-cover rounded-xl mb-2">
                    <span class="text-sm font-bold text-white block">${c.brand} ${c.model}</span>
                    <span class="text-xs font-extrabold text-emerald-400 block mt-1">${c.price_display}</span>
                  </th>
                `).join('')}
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-800/80 text-slate-300">
              <tr>
                <td class="p-3 font-semibold text-slate-400">Body Type</td>
                ${cars.map(c => `<td class="p-3 text-center font-bold text-white">${c.body_type}</td>`).join('')}
              </tr>
              <tr>
                <td class="p-3 font-semibold text-slate-400">Fuel Types</td>
                ${cars.map(c => `<td class="p-3 text-center text-sky-300">${c.fuel_types.join(', ')}</td>`).join('')}
              </tr>
              <tr>
                <td class="p-3 font-semibold text-slate-400">Transmissions</td>
                ${cars.map(c => `<td class="p-3 text-center">${c.transmissions.join(', ')}</td>`).join('')}
              </tr>
              <tr>
                <td class="p-3 font-semibold text-slate-400">Engine / Powertrain</td>
                ${cars.map(c => `<td class="p-3 text-center">${c.engine || 'N/A'}</td>`).join('')}
              </tr>
              <tr>
                <td class="p-3 font-semibold text-slate-400">Power</td>
                ${cars.map(c => `<td class="p-3 text-center font-bold text-amber-400">${c.power || 'N/A'}</td>`).join('')}
              </tr>
              <tr>
                <td class="p-3 font-semibold text-slate-400">Torque</td>
                ${cars.map(c => `<td class="p-3 text-center font-bold text-amber-400">${c.torque || 'N/A'}</td>`).join('')}
              </tr>
              <tr>
                <td class="p-3 font-semibold text-slate-400">Mileage / Range</td>
                ${cars.map(c => `<td class="p-3 text-center font-bold text-emerald-400">${c.mileage || 'N/A'}</td>`).join('')}
              </tr>
              <tr>
                <td class="p-3 font-semibold text-slate-400">Safety Rating</td>
                ${cars.map(c => `<td class="p-3 text-center text-indigo-300 font-bold">${c.safety_rating || '5-Star NCAP'}</td>`).join('')}
              </tr>
              <tr>
                <td class="p-3 font-semibold text-slate-400">Boot Space</td>
                ${cars.map(c => `<td class="p-3 text-center">${c.boot_space || 'N/A'}</td>`).join('')}
              </tr>
              <tr>
                <td class="p-3 font-semibold text-slate-400">Ground Clearance</td>
                ${cars.map(c => `<td class="p-3 text-center">${c.ground_clearance || 'N/A'}</td>`).join('')}
              </tr>
            </tbody>
          </table>
        </div>
      `;
      if (window.lucide) lucide.createIcons();
    } catch (err) {
      container.innerHTML = `<p class="p-8 text-center text-red-400">Failed to compare: ${err.message}</p>`;
    }
  },

  closeComparison() {
    const modal = document.getElementById('compare-modal');
    if (modal) {
      modal.classList.add('hidden');
      modal.classList.remove('flex');
    }
  },

  showSavedCars() {
    SearchFilter.resetFilters(false);
    const savedIds = Array.from(Auth.favorites);
    if (savedIds.length === 0) {
      showToast('You have no saved cars yet. Click heart on any car to save!', 'info');
      return;
    }
    const filtered = SearchFilter.allCars.filter(c => savedIds.includes(c.id));
    SearchFilter.renderCarGrid(filtered);
    const countBadge = document.getElementById('cars-count-badge');
    if (countBadge) countBadge.textContent = `${filtered.length} Saved Cars`;
    const catalogSection = document.getElementById('catalog-section');
    if (catalogSection) catalogSection.scrollIntoView({ behavior: 'smooth' });
  },

  showScanHistory() {
    const heroLens = document.getElementById('hero-lens-section');
    if (heroLens) heroLens.scrollIntoView({ behavior: 'smooth' });
  }
};

// Global Toast Notification
function showToast(message, type = 'info') {
  let container = document.getElementById('toast-container');
  if (!container) {
    container = document.createElement('div');
    container.id = 'toast-container';
    document.body.appendChild(container);
  }

  const toast = document.createElement('div');
  toast.className = 'toast';

  if (type === 'success') {
    toast.style.background = 'rgba(6, 78, 59, 0.95)';
    toast.style.border = '1px solid #10b981';
    toast.innerHTML = `<i data-lucide="check-circle" class="w-5 h-5 text-emerald-400"></i> <span>${message}</span>`;
  } else if (type === 'error') {
    toast.style.background = 'rgba(127, 29, 29, 0.95)';
    toast.style.border = '1px solid #ef4444';
    toast.innerHTML = `<i data-lucide="alert-triangle" class="w-5 h-5 text-red-400"></i> <span>${message}</span>`;
  } else if (type === 'warning') {
    toast.style.background = 'rgba(120, 53, 15, 0.95)';
    toast.style.border = '1px solid #f59e0b';
    toast.innerHTML = `<i data-lucide="alert-circle" class="w-5 h-5 text-amber-400"></i> <span>${message}</span>`;
  } else {
    toast.style.background = 'rgba(15, 23, 42, 0.95)';
    toast.style.border = '1px solid #0284c7';
    toast.innerHTML = `<i data-lucide="info" class="w-5 h-5 text-sky-400"></i> <span>${message}</span>`;
  }

  container.appendChild(toast);
  if (window.lucide) lucide.createIcons();

  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateX(100%)';
    toast.style.transition = 'all 0.3s ease';
    setTimeout(() => toast.remove(), 300);
  }, 3500);
}

// Bootstrap on DOM ready
document.addEventListener('DOMContentLoaded', () => {
  App.init();
});
