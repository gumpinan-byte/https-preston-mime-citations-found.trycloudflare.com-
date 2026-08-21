// Resilient Dual-Mode API Client for AutoWale Portal
// Automatically connects to FastAPI backend or seamlessly operates in-browser on Netlify / Static hosts

const API_BASE = '/api';

function formatINR(amount) {
  if (amount >= 10000000) {
    return 'Rs ' + (amount / 10000000).toFixed(2) + ' Crore';
  } else if (amount >= 100000) {
    return 'Rs ' + (amount / 100000).toFixed(2) + ' Lakh';
  }
  return 'Rs ' + Number(amount).toLocaleString('en-IN');
}

const API = {
  // 1. CAR INVENTORY & FILTERING
  async getCars(params = {}) {
    try {
      const query = new URLSearchParams();
      Object.keys(params).forEach(k => {
        if (params[k] !== undefined && params[k] !== null && params[k] !== '') {
          query.append(k, params[k]);
        }
      });
      const controller = new AbortController();
      const id = setTimeout(() => controller.abort(), 2000);
      const res = await fetch(`${API_BASE}/cars?${query.toString()}`, { signal: controller.signal });
      clearTimeout(id);
      if (res.ok) return await res.json();
    } catch (e) {
      // Fallback to in-browser engine
    }

    // In-browser filtering fallback
    let list = (typeof FALLBACK_CARS !== 'undefined') ? [...FALLBACK_CARS] : [];
    
    const searchTerm = (params.search || params.q || '').toLowerCase().trim();
    if (searchTerm) {
      list = list.filter(c => 
        c.brand.toLowerCase().includes(searchTerm) ||
        c.model.toLowerCase().includes(searchTerm) ||
        c.body_type.toLowerCase().includes(searchTerm) ||
        c.fuel_types.some(f => f.toLowerCase().includes(searchTerm)) ||
        c.tagline.toLowerCase().includes(searchTerm)
      );
    }
    if (params.brand && params.brand !== 'all') {
      list = list.filter(c => c.brand.toLowerCase() === params.brand.toLowerCase());
    }
    const bodyType = params.body_type || params.body;
    if (bodyType && bodyType !== 'all') {
      list = list.filter(c => c.body_type.toLowerCase() === bodyType.toLowerCase());
    }
    const fuelType = params.fuel || params.fuel_type;
    if (fuelType && fuelType !== 'all') {
      list = list.filter(c => c.fuel_types.some(f => f.toLowerCase() === fuelType.toLowerCase()));
    }
    if (params.transmission && params.transmission !== 'all') {
      list = list.filter(c => c.transmissions.some(t => t.toLowerCase().includes(params.transmission.toLowerCase())));
    }
    if (params.min_price) {
      list = list.filter(c => c.max_price >= Number(params.min_price));
    }
    if (params.max_price) {
      list = list.filter(c => c.min_price <= Number(params.max_price));
    }
    if (params.is_electric !== undefined && params.is_electric !== null && params.is_electric !== '') {
      const isElec = Number(params.is_electric);
      list = list.filter(c => c.is_electric === isElec);
    }
    if (params.is_new_launch !== undefined && params.is_new_launch !== null && params.is_new_launch !== '') {
      const isNew = Number(params.is_new_launch);
      list = list.filter(c => c.is_new_launch === isNew);
    }

    // Sorting
    if (params.sort_by === 'price_asc') {
      list.sort((a, b) => a.min_price - b.min_price);
    } else if (params.sort_by === 'price_desc') {
      list.sort((a, b) => b.min_price - a.min_price);
    } else if (params.sort_by === 'rating') {
      list.sort((a, b) => b.rating - a.rating);
    } else if (params.sort_by === 'popularity' || params.sort_by === 'popular') {
      list.sort((a, b) => b.reviews_count - a.reviews_count);
    }

    return {
      cars: list,
      total: list.length,
      page: 1,
      limit: 50
    };
  },

  async getFeaturedCars() {
    try {
      const controller = new AbortController();
      const id = setTimeout(() => controller.abort(), 2000);
      const res = await fetch(`${API_BASE}/cars/featured`, { signal: controller.signal });
      clearTimeout(id);
      if (res.ok) return await res.json();
    } catch (e) {}

    const list = (typeof FALLBACK_CARS !== 'undefined') ? FALLBACK_CARS.filter(c => c.is_featured === 1) : [];
    return { featured: list };
  },

  async getCarDetail(carId) {
    try {
      const controller = new AbortController();
      const id = setTimeout(() => controller.abort(), 2000);
      const res = await fetch(`${API_BASE}/cars/${carId}`, { signal: controller.signal });
      clearTimeout(id);
      if (res.ok) return await res.json();
    } catch (e) {}

    const car = (typeof FALLBACK_CARS !== 'undefined') ? FALLBACK_CARS.find(c => c.id === carId) : null;
    if (car) return car;
    throw new Error('Car not found');
  },

  async getBrands() {
    try {
      const controller = new AbortController();
      const id = setTimeout(() => controller.abort(), 2000);
      const res = await fetch(`${API_BASE}/cars/meta/brands`, { signal: controller.signal });
      clearTimeout(id);
      if (res.ok) {
        const data = await res.json();
        return Array.isArray(data) ? data : (data.brands || []);
      }
    } catch (e) {}

    return [
      { brand: "Tata", count: 4 },
      { brand: "Mahindra", count: 4 },
      { brand: "Maruti Suzuki", count: 3 },
      { brand: "Hyundai", count: 2 },
      { brand: "Toyota", count: 2 },
      { brand: "Kia", count: 1 },
      { brand: "MG", count: 1 },
      { brand: "BYD", count: 1 },
      { brand: "BMW", count: 1 },
      { brand: "Mercedes-Benz", count: 1 }
    ];
  },

  async compareCars(carIds) {
    try {
      const controller = new AbortController();
      const id = setTimeout(() => controller.abort(), 2000);
      const res = await fetch(`${API_BASE}/cars/compare`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(carIds),
        signal: controller.signal
      });
      clearTimeout(id);
      if (res.ok) return await res.json();
    } catch (e) {}

    const selected = (typeof FALLBACK_CARS !== 'undefined') 
      ? FALLBACK_CARS.filter(c => carIds.includes(c.id))
      : [];
    return { cars: selected };
  },

  // 2. AUTHENTICATION & SESSIONS
  async register(userData) {
    try {
      const controller = new AbortController();
      const id = setTimeout(() => controller.abort(), 2000);
      const res = await fetch(`${API_BASE}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userData),
        signal: controller.signal
      });
      clearTimeout(id);
      const data = await res.json();
      if (res.ok) return data;
      throw new Error(data.detail || 'Registration failed');
    } catch (e) {
      if (e.message && e.message !== 'Failed to fetch' && !e.name.includes('Abort')) throw e;
    }

    // Local storage fallback registration
    let users = JSON.parse(localStorage.getItem('autowale_users') || '[]');
    if (users.some(u => u.email.toLowerCase() === userData.email.toLowerCase())) {
      throw new Error('An account with this email already exists');
    }
    if (users.some(u => u.username.toLowerCase() === userData.username.toLowerCase())) {
      throw new Error('Username is already taken');
    }

    const newUser = {
      id: 'USR-' + Date.now(),
      username: userData.username,
      email: userData.email,
      full_name: userData.full_name,
      phone: userData.phone || '',
      password: userData.password,
      created_at: new Date().toISOString()
    };
    users.push(newUser);
    localStorage.setItem('autowale_users', JSON.stringify(users));

    const token = 'token_' + btoa(newUser.username + ':' + Date.now());
    return {
      message: 'Account created successfully!',
      access_token: token,
      token_type: 'bearer',
      user: {
        username: newUser.username,
        email: newUser.email,
        full_name: newUser.full_name
      }
    };
  },

  async login(loginData) {
    try {
      const controller = new AbortController();
      const id = setTimeout(() => controller.abort(), 2000);
      const res = await fetch(`${API_BASE}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(loginData),
        signal: controller.signal
      });
      clearTimeout(id);
      const data = await res.json();
      if (res.ok) return data;
      throw new Error(data.detail || 'Login failed');
    } catch (e) {
      if (e.message && e.message !== 'Failed to fetch' && !e.name.includes('Abort')) throw e;
    }

    // Local storage fallback login
    const users = JSON.parse(localStorage.getItem('autowale_users') || '[]');
    const identifier = loginData.username_or_email.toLowerCase();
    const user = users.find(u => 
      u.username.toLowerCase() === identifier || u.email.toLowerCase() === identifier
    );

    if (!user || user.password !== loginData.password) {
      // Demo account fallback
      if (identifier === 'demo' || identifier === 'demo@autowale.com') {
        const token = 'token_demo_' + Date.now();
        return {
          access_token: token,
          token_type: 'bearer',
          user: {
            username: 'demo_user',
            email: 'demo@autowale.com',
            full_name: 'Demo Automotive User'
          }
        };
      }
      throw new Error('Invalid username/email or password');
    }

    const token = 'token_' + btoa(user.username + ':' + Date.now());
    return {
      access_token: token,
      token_type: 'bearer',
      user: {
        username: user.username,
        email: user.email,
        full_name: user.full_name
      }
    };
  },

  async requestPasswordReset(email) {
    try {
      const controller = new AbortController();
      const id = setTimeout(() => controller.abort(), 2000);
      const res = await fetch(`${API_BASE}/auth/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
        signal: controller.signal
      });
      clearTimeout(id);
      const data = await res.json();
      if (res.ok) return data;
      throw new Error(data.detail || 'Password reset request failed');
    } catch (e) {
      if (e.message && e.message !== 'Failed to fetch' && !e.name.includes('Abort')) throw e;
    }

    // Local storage OTP generator
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    sessionStorage.setItem('autowale_otp_' + email.toLowerCase(), otp);

    return {
      message: `Password reset OTP generated successfully for ${email}`,
      otp_preview: otp,
      email: email,
      note: `In production an SMS/Email is sent. For instant testing, your OTP is: ${otp}`
    };
  },

  async resetPassword(resetData) {
    try {
      const controller = new AbortController();
      const id = setTimeout(() => controller.abort(), 2000);
      const res = await fetch(`${API_BASE}/auth/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(resetData),
        signal: controller.signal
      });
      clearTimeout(id);
      const data = await res.json();
      if (res.ok) return data;
      throw new Error(data.detail || 'Password reset failed');
    } catch (e) {
      if (e.message && e.message !== 'Failed to fetch' && !e.name.includes('Abort')) throw e;
    }

    const storedOtp = sessionStorage.getItem('autowale_otp_' + resetData.email.toLowerCase());
    if (storedOtp && storedOtp !== resetData.otp.trim()) {
      throw new Error('Invalid OTP. Please check the code and try again.');
    }

    let users = JSON.parse(localStorage.getItem('autowale_users') || '[]');
    const userIdx = users.findIndex(u => u.email.toLowerCase() === resetData.email.toLowerCase());
    if (userIdx !== -1) {
      users[userIdx].password = resetData.new_password;
      localStorage.setItem('autowale_users', JSON.stringify(users));
    }
    sessionStorage.removeItem('autowale_otp_' + resetData.email.toLowerCase());

    return {
      message: 'Password updated successfully! You can now log in with your new password.'
    };
  },

  // 3. CAR LENS AI ENGINE
  async getLensSamples() {
    try {
      const controller = new AbortController();
      const id = setTimeout(() => controller.abort(), 2000);
      const res = await fetch(`${API_BASE}/lens/samples`, { signal: controller.signal });
      clearTimeout(id);
      if (res.ok) return await res.json();
    } catch (e) {}

    return {
      samples: [
        {
          id: "sample-curvv-new",
          title: "Tata Curvv (2024 SUV Coupe)",
          model_match: "tata-curvv",
          car_name: "Tata Curvv 1.2 Hyperion DCA",
          brand: "Tata",
          year: 2024,
          is_new: true,
          condition_score: 98.8,
          image_url: "/images/cars/tata-curvv.jpg",
          detected_color: "Gold Essence / Sunlit Bronze",
          body_type: "SUV Coupe",
          sample_tag: "NEW CAR - SHOWROOM"
        },
        {
          id: "sample-thar-new",
          title: "Mahindra Thar Roxx 4x4 (5-Door)",
          model_match: "mahindra-thar-roxx",
          car_name: "Mahindra Thar Roxx AX7L 4x4",
          brand: "Mahindra",
          year: 2024,
          is_new: true,
          condition_score: 99.2,
          image_url: "/images/cars/mahindra-thar-roxx.jpg",
          detected_color: "Red Rage / Stealth Black",
          body_type: "Off-Road 4x4 SUV",
          sample_tag: "NEW CAR - SHOWROOM"
        },
        {
          id: "sample-swift-used",
          title: "Used Maruti Swift (Pre-Owned)",
          model_match: "maruti-suzuki-swift",
          car_name: "Maruti Suzuki Swift VXi AMT",
          brand: "Maruti Suzuki",
          year: 2020,
          is_new: false,
          condition_score: 86.4,
          odometer: "38,500 km",
          image_url: "/images/cars/maruti-suzuki-swift.jpg",
          detected_color: "Luster Blue / Metallic Grey",
          body_type: "Hatchback",
          sample_tag: "USED CAR - PRE-OWNED"
        },
        {
          id: "sample-creta-new",
          title: "Hyundai Creta (2024 Facelift)",
          model_match: "hyundai-creta",
          car_name: "Hyundai Creta SX(O) Turbo",
          brand: "Hyundai",
          year: 2024,
          is_new: true,
          condition_score: 97.8,
          image_url: "/images/cars/hyundai-creta.jpg",
          detected_color: "Emerald Pearl / Robust Emerald",
          body_type: "Mid-Size SUV",
          sample_tag: "NEW CAR - SHOWROOM"
        },
        {
          id: "sample-scorpio-used",
          title: "Used Mahindra Scorpio-N (Pre-Owned)",
          model_match: "mahindra-scorpio-n",
          car_name: "Mahindra Scorpio-N Z8L Diesel",
          brand: "Mahindra",
          year: 2022,
          is_new: false,
          condition_score: 88.7,
          odometer: "34,200 km",
          image_url: "/images/cars/mahindra-scorpio-n.jpg",
          detected_color: "Deep Forest Green / Napoli Black",
          body_type: "D-Segment SUV",
          sample_tag: "USED CAR - PRE-OWNED"
        },
        {
          id: "sample-fortuner-new",
          title: "Toyota Fortuner 4x4 Legender",
          model_match: "toyota-fortuner",
          car_name: "Toyota Fortuner Legender 4x4 AT",
          brand: "Toyota",
          year: 2024,
          is_new: true,
          condition_score: 99.4,
          image_url: "/images/cars/toyota-fortuner.jpg",
          detected_color: "Platinum Pearl White",
          body_type: "Full-Size 4x4 SUV",
          sample_tag: "NEW CAR - SHOWROOM"
        }
      ]
    };
  },

  async analyzeLens(file = null, sampleId = null, carId = null) {
    try {
      const formData = new FormData();
      if (file) formData.append('image', file);
      if (sampleId) formData.append('sample_id', sampleId);
      if (carId) formData.append('car_id', carId);

      const controller = new AbortController();
      const id = setTimeout(() => controller.abort(), 2500);
      const res = await fetch(`${API_BASE}/lens/analyze`, {
        method: 'POST',
        body: formData,
        signal: controller.signal
      });
      clearTimeout(id);
      if (res.ok) return await res.json();
    } catch (e) {}

    // Resilient fallback lens engine
    const cars = (typeof FALLBACK_CARS !== 'undefined') ? FALLBACK_CARS : [];
    let matchedCar = null;

    if (carId) {
      matchedCar = cars.find(c => c.id === carId);
    }

    if (!matchedCar && sampleId) {
      const samplesRes = await this.getLensSamples();
      const sample = samplesRes.samples.find(s => s.id === sampleId);
      if (sample) {
        matchedCar = cars.find(c => c.id === sample.model_match);
      }
    }

    if (!matchedCar && file && file.name) {
      const fn = file.name.toLowerCase();
      const aliases = [
        ['thar', 'mahindra-thar-roxx'],
        ['curvv', 'tata-curvv'],
        ['creta', 'hyundai-creta'],
        ['swift', 'maruti-suzuki-swift'],
        ['fortuner', 'toyota-fortuner'],
        ['xuv700', 'mahindra-xuv700'],
        ['scorpio', 'mahindra-scorpio-n'],
        ['innova', 'toyota-innova-hycross'],
        ['nexon', 'tata-nexon'],
        ['punch', 'tata-punch-ev'],
        ['seltos', 'kia-seltos'],
        ['vitara', 'maruti-suzuki-grand-vitara'],
        ['verna', 'hyundai-verna'],
        ['3xo', 'mahindra-xuv-3xo'],
        ['windsor', 'mg-windsor-ev'],
        ['seal', 'byd-seal'],
        ['bmw', 'bmw-3-series-gran-limousine'],
        ['mercedes', 'mercedes-benz-c-class']
      ];
      for (const [kw, targetId] of aliases) {
        if (fn.includes(kw)) {
          matchedCar = cars.find(c => c.id === targetId);
          break;
        }
      }
    }

    if (!matchedCar) {
      matchedCar = cars[0] || {
        id: 'tata-curvv',
        brand: 'Tata',
        model: 'Curvv',
        year: 2024,
        tagline: 'Indias First Mass-Market SUV Coupe',
        body_type: 'SUV Coupe',
        min_price: 999000,
        max_price: 1899000,
        price_display: 'Rs 9.99 - 18.99 Lakh',
        image_url: '/images/cars/tata-curvv.jpg',
        fuel_types: ['Petrol', 'Diesel'],
        transmissions: ['Manual', 'Automatic (DCA)'],
        mileage: '15.0 - 19.3 kmpl',
        engine: '1.2L Hyperion Turbo',
        power: '120 bhp',
        safety_rating: '5-Star',
        key_features: ['Level 2 ADAS', '12.3-inch Touchscreen', 'Panoramic Sunroof']
      };
    }

    const isNew = !(file && (file.name.includes('used') || file.name.includes('old')));
    const conditionScore = isNew ? 98.6 : 87.2;
    const minP = matchedCar.min_price;
    const maxP = matchedCar.max_price;
    const midP = (minP + maxP) / 2;

    const allModels = cars.map(c => ({ id: c.id, name: `${c.brand} ${c.model}` }));

    return {
      success: true,
      car_id: matchedCar.id,
      brand: matchedCar.brand,
      model: matchedCar.model,
      year: matchedCar.year,
      tagline: matchedCar.tagline,
      body_type: matchedCar.body_type,
      is_new: isNew,
      status_label: isNew ? 'NEW CAR - SHOWROOM CONDITION' : 'USED CAR - PRE-OWNED VEHICLE',
      status_badge: isNew ? 'New Car' : 'Used / Pre-Owned',
      condition_score: conditionScore,
      detected_color: 'Pristine Showroom Gloss',
      image_url: matchedCar.image_url,
      price_range_str: `${formatINR(minP)} - ${formatINR(maxP)}`,
      on_road_str: `Estimated On-Road (Delhi NCR): ${formatINR(minP * 1.14)} - ${formatINR(maxP * 1.16)}`,
      fuel_types: matchedCar.fuel_types,
      transmissions: matchedCar.transmissions,
      mileage: matchedCar.mileage,
      engine: matchedCar.engine,
      power: matchedCar.power,
      safety_rating: matchedCar.safety_rating,
      key_features: matchedCar.key_features ? matchedCar.key_features.slice(0, 4) : [],
      breakdown: {
        type: isNew ? 'New Car Valuation' : 'Used Car Fair Market Valuation',
        base_ex_showroom: formatINR(midP),
        estimated_rto_tax: formatINR(midP * 0.10),
        estimated_insurance: formatINR(midP * 0.045),
        condition_grade: `Grade A+ (${conditionScore}% Pristine)`,
        warranty_status: '3 Years / 100,000 km Standard Warranty'
      },
      all_models: allModels,
      matching_car: {
        id: matchedCar.id,
        brand: matchedCar.brand,
        model: matchedCar.model,
        price_display: matchedCar.price_display,
        image_url: matchedCar.image_url,
        mileage: matchedCar.mileage,
        rating: matchedCar.rating
      }
    };
  },

  // 4. TEST DRIVE BOOKING
  async bookTestDrive(bookingData) {
    try {
      const controller = new AbortController();
      const id = setTimeout(() => controller.abort(), 2000);
      const res = await fetch(`${API_BASE}/bookings/test-drive`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(bookingData),
        signal: controller.signal
      });
      clearTimeout(id);
      const data = await res.json();
      if (res.ok) return data;
      throw new Error(data.detail || 'Booking failed');
    } catch (e) {
      if (e.message && e.message !== 'Failed to fetch' && !e.name.includes('Abort')) throw e;
    }

    const bookingId = 'TD-' + Math.floor(1000 + Math.random() * 9000);
    let bookings = JSON.parse(localStorage.getItem('autowale_bookings') || '[]');
    bookings.push({
      booking_id: bookingId,
      ...bookingData,
      created_at: new Date().toISOString()
    });
    localStorage.setItem('autowale_bookings', JSON.stringify(bookings));

    return {
      message: `Test Drive confirmed successfully for ${bookingData.car_name}!`,
      booking_id: bookingId,
      scheduled_date: bookingData.preferred_date,
      city: bookingData.city
    };
  }
};
