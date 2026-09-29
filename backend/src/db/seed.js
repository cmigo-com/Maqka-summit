require('dotenv').config();
const { v4: uuid } = require('uuid');
const bcrypt = require('bcryptjs');
const db = require('./index');

function upsertAdmin() {
  const email = process.env.ADMIN_EMAIL || 'bryanwanjohi75@gmail.com';
  const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(email);
  if (existing) {
    console.log('Admin already exists:', email);
    return;
  }
  const password = process.env.ADMIN_PASSWORD || 'Admin@1234';
  const hash = bcrypt.hashSync(password, 10);
  db.prepare(
    `INSERT INTO users (id, name, email, phone, password_hash, role) VALUES (?, ?, ?, ?, ?, 'admin')`
  ).run(uuid(), 'Maqka Summit Admin', email, '0745788313', hash);
  console.log('Created admin user:', email, '/ password:', password);
}

function seedMountainsAndAdventures() {
  const mountainCount = db.prepare('SELECT COUNT(*) c FROM mountains').get().c;
  if (mountainCount > 0) {
    console.log('Mountains/adventures already seeded.');
    return;
  }

  const mountains = [
    { name: 'Mount Kenya', slug: 'mount-kenya', region: 'Central Kenya', description: "Africa's second-highest peak, with several classic multi-day routes to Point Lenana.", image_url: '/images/mountains/mount-kenya/hero.jpg', highlights: ['Summit Point Lenana at 4,985m', 'Three classic route options (Sirimon, Chogoria, Naro Moru)', 'Afro-alpine flora: giant groundsels and lobelias'] },
    { name: 'Mount Longonot', slug: 'mount-longonot', region: 'Great Rift Valley, Naivasha', description: 'A dormant volcano with a dramatic crater rim walk, easily done in a day.', image_url: '/images/mountains/mount-longonot/hero.jpg', highlights: ['Full crater rim circuit', 'Sweeping Great Rift Valley views', 'Achievable as a single-day hike'] },
    { name: 'Ngong Hills', slug: 'ngong-hills', region: 'Kajiado', description: 'A ridge of seven rolling hills just outside Nairobi, popular for day hikes.', image_url: '/images/mountains/ngong-hills/hero.jpg', highlights: ['The "Seven Sisters" ridge walk', 'Closest hikeable hills to Nairobi', 'Great for beginners and families'] },
    { name: "Hell's Gate", slug: 'hells-gate', region: 'Naivasha', description: 'A park you can explore on foot among wildlife, with a dramatic gorge.', image_url: '/images/mountains/hells-gate/hero.jpg', highlights: ['Walk on foot among zebra and giraffe', 'The dramatic Ol Njorowa Gorge', 'Optional rock climbing and cycling'] },
    { name: 'Aberdare Range', slug: 'aberdare-range', region: 'Central Kenya Highlands', description: 'Moorland highlands with afro-alpine vegetation and resident wildlife.', image_url: '/images/mountains/aberdare-range/hero.jpg', highlights: ['Kinangop Peak trek', 'Bamboo forest and open moorland', 'Chances to spot Aberdare wildlife'] },
    { name: 'Kereita Forest', slug: 'kereita-forest', region: 'Kikuyu Escarpment', description: 'Indigenous forest on the Rift Valley escarpment, home to a hidden waterfall.', image_url: '/images/mountains/kereita-forest/hero.jpg', highlights: ['A forest waterfall walk', 'Gentle terrain suited to beginners', 'Optional zip-line add-on'] },
    { name: 'Mount Mtelo', slug: 'mount-mtelo', region: 'West Pokot, Sekerr Range', description: "Kenya's 4th highest peak, in a remote, low-traffic trekking region.", image_url: '/images/mountains/mount-mtelo/hero.jpg', highlights: ["Kenya's 4th highest summit", 'A remote, low-traffic trekking region', 'Cultural encounters with local Pokot communities'] },
    { name: 'Loita Hills', slug: 'loita-hills', region: 'Narok', description: 'Home to the Naimina Enkiyio forest and Maasai community-guided treks.', image_url: '/images/mountains/loita-hills/hero.jpg', highlights: ['The Naimina Enkiyio ("Forest of the Lost Child")', 'Guided by the local Maasai community', 'Remote camping away from crowds'] },
    { name: 'Menengai Crater', slug: 'menengai-crater', region: 'Nakuru', description: "One of the world's largest volcanic calderas, with an easy rim walk.", image_url: '/images/mountains/menengai-crater/hero.jpg', highlights: ['One of the largest calderas in the world', 'Views over Lake Nakuru', 'An easy, family-friendly rim walk'] },
  ];

  const insertMountain = db.prepare(`
    INSERT INTO mountains (id, name, slug, region, description, highlights, image_url)
    VALUES (@id, @name, @slug, @region, @description, @highlights, @image_url)
  `);
  const mountainIds = {};
  for (const m of mountains) {
    const id = uuid();
    mountainIds[m.slug] = id;
    insertMountain.run({ ...m, id, highlights: JSON.stringify(m.highlights || []) });
  }

  const adventures = [
    {
      mountain: 'mount-kenya',
      title: 'Point Lenana via Sirimon\u2013Chogoria',
      slug: 'point-lenana-sirimon-chogoria',
      category: 'Mountain',
      county: 'Meru / Laikipia',
      is_featured: true,
      route: 'Sirimon In / Chogoria Out',
      location: 'Mount Kenya National Park',
      duration_days: 5,
      difficulty: 'Challenging',
      max_altitude_m: 4985,
      price_adult: 45000,
      price_child: 35000,
      max_guests: 12,
      description: 'A classic traverse of Mount Kenya climbing up through Sirimon and descending via the dramatic Chogoria route, summiting Point Lenana at 4,985m. Features giant lobelias, groundsels, and stunning views of Batian and Nelion peaks.',
      highlights: ['Summit Point Lenana (4,985m)', 'Traverse two scenic routes', 'Afro-alpine flora: giant groundsels & lobelias', 'Experienced guides, porters & cook', 'Acclimatization-first itinerary'],
      inclusions: ['Park entry fees', 'Professional guide, porters & cook', 'All camping/hut fees', 'Meals on the mountain', 'Group camping equipment'],
      exclusions: ['Personal trekking gear', 'Sleeping bag (available for hire)', 'Tips for guides/porters', 'Transport to/from the trailhead'],
      itinerary: [
        { day: 1, title: 'Sirimon Gate to Old Moses Camp', description: 'Drive to Sirimon Gate, trek through forest and moorland to Old Moses Camp (3,300m).' },
        { day: 2, title: 'Old Moses to Shipton\u2019s Camp', description: 'Cross open moorland with views of the peaks, arrive at Shipton\u2019s Camp (4,200m).' },
        { day: 3, title: 'Summit Point Lenana, descend to Chogoria', description: 'Early summit push for sunrise, then descend the Chogoria side to Mintos Camp.' },
        { day: 4, title: 'Mintos Camp to Chogoria Gate', description: 'Descend through the Gorges Valley and forest zone to the gate.' },
        { day: 5, title: 'Buffer / transfer day', description: 'Contingency day for weather, or transfer back to Nairobi.' },
      ],
      meeting_point: 'Nairobi CBD or Sirimon Gate (transport can be arranged)',
      image_url: '/images/mountains/mount-kenya/hero.jpg',
    },
    {
      mountain: 'mount-kenya',
      title: 'Naro Moru Route Summit',
      slug: 'naro-moru-route-summit',
      category: 'Mountain',
      county: 'Nyeri',
      is_featured: true,
      route: 'Naromoru Gate',
      location: 'Mount Kenya National Park',
      duration_days: 4,
      difficulty: 'Moderate',
      max_altitude_m: 4985,
      price_adult: 38000,
      price_child: 28000,
      max_guests: 15,
      description: 'The most direct route up Mount Kenya via Naromoru Gate, passing the Met Station and the famous "vertical bog" before reaching Point Lenana. A faster option for trekkers on a tighter schedule.',
      highlights: ['Shortest route to Point Lenana', 'Pass Met Station and Mackinders Camp', 'Great for trekkers with limited time', 'Full camping gear provided'],
      inclusions: ['Park entry fees', 'Professional guide, porters & cook', 'All camping/hut fees', 'Meals on the mountain'],
      exclusions: ['Personal trekking gear', 'Tips for guides/porters', 'Transport to/from the trailhead'],
      itinerary: [
        { day: 1, title: 'Naromoru Gate to Met Station', description: 'Drive/hike through forest to the Met Station (3,000m).' },
        { day: 2, title: 'Met Station to Mackinders Camp', description: 'Cross the vertical bog into the Teleki Valley to Mackinders Camp (4,200m).' },
        { day: 3, title: 'Summit Point Lenana, descend', description: 'Early summit push, then descend back to Met Station.' },
        { day: 4, title: 'Descend to Naromoru Gate', description: 'Final descent through forest zone and transfer back.' },
      ],
      meeting_point: 'Naromoru town or Nairobi CBD (transport can be arranged)',
      image_url: '/images/mountains/mount-kenya/naromoru-trail.jpg',
    },
    {
      mountain: 'mount-kenya',
      title: 'Chogoria Scenic Trek',
      slug: 'chogoria-scenic-trek',
      category: 'Mountain',
      county: 'Meru',
      route: 'Chogoria In / Chogoria Out',
      location: 'Mount Kenya National Park',
      duration_days: 4,
      difficulty: 'Moderate',
      max_altitude_m: 4985,
      price_adult: 36000,
      price_child: 27000,
      max_guests: 15,
      description: 'Widely regarded as the most scenic route on Mount Kenya, passing the Gorges Valley, Lake Michaelson, and dramatic cliffs before reaching Point Lenana.',
      highlights: ['Considered the most scenic route on the mountain', 'Passes Lake Michaelson', 'Camp beneath dramatic valley cliffs'],
      inclusions: ['Park entry fees', 'Professional guide, porters & cook', 'All camping/hut fees', 'Meals on the mountain'],
      exclusions: ['Personal trekking gear', 'Tips for guides/porters', 'Transport to/from the trailhead'],
      itinerary: [
        { day: 1, title: 'Chogoria Gate to Mintos Camp', description: 'Trek through forest and moorland into the Gorges Valley.' },
        { day: 2, title: 'Mintos Camp to Shipton\u2019s Camp (via Lake Michaelson)', description: 'Detour past Lake Michaelson en route to Shipton\u2019s Camp.' },
        { day: 3, title: 'Summit Point Lenana, descend', description: 'Early summit push, then descend back towards Chogoria.' },
        { day: 4, title: 'Descend to Chogoria Gate', description: 'Final descent through forest zone and transfer back.' },
      ],
      meeting_point: 'Chogoria town or Nairobi CBD (transport can be arranged)',
      image_url: '/images/mountains/mount-kenya/camp-shiptons.jpg',
    },
    {
      mountain: 'mount-longonot',
      title: 'Mount Longonot Crater Hike',
      slug: 'mount-longonot-crater-hike',
      category: 'Mountain',
      county: 'Nakuru',
      route: 'Crater Rim Circuit',
      location: 'Mount Longonot National Park',
      duration_days: 1,
      difficulty: 'Easy',
      max_altitude_m: 2776,
      price_adult: 4500,
      price_child: 3500,
      max_guests: 30,
      description: 'A perfect day trip for beginners - hike to the crater rim of this dormant volcano with panoramic views of the Great Rift Valley.',
      highlights: ['Great Rift Valley views', 'Half-day option available', 'No prior trekking experience needed'],
      inclusions: ['Park entry fees', 'Guide', 'Bottled water'],
      exclusions: ['Lunch', 'Transport to/from Naivasha'],
      itinerary: [{ day: 1, title: 'Crater rim circuit', description: 'Ascend to the rim, circle the crater, descend the same way.' }],
      meeting_point: 'Longonot National Park main gate',
      image_url: '/images/mountains/mount-longonot/hero.jpg',
    },
    {
      mountain: 'ngong-hills',
      title: 'Ngong Hills Ridge Walk',
      slug: 'ngong-hills-ridge-walk',
      category: 'Hill Range',
      county: 'Kajiado',
      route: 'Seven Sisters Ridge',
      location: 'Ngong Hills, Kajiado',
      duration_days: 1,
      difficulty: 'Easy',
      max_altitude_m: 2460,
      price_adult: 3500,
      price_child: 2500,
      max_guests: 30,
      description: 'An easy, scenic ridge walk just outside Nairobi over the "Seven Sisters" peaks, with wind turbines, wide Rift Valley views, and Ngong Forest below.',
      highlights: ['Closest hikeable hills to Nairobi', 'Sweeping Rift Valley viewpoints', 'Suitable for beginners and families'],
      inclusions: ['Park/conservancy entry fees', 'Guide'],
      exclusions: ['Lunch', 'Transport'],
      itinerary: [{ day: 1, title: 'Ridge walk', description: 'Walk the ridge over the Seven Sisters peaks and back.' }],
      meeting_point: 'Ngong Hills main gate',
      image_url: '/images/mountains/ngong-hills/hero.jpg',
    },
    {
      mountain: 'hells-gate',
      title: "Hell's Gate Trek & Gorge Walk",
      slug: 'hells-gate-trek',
      category: 'National Park',
      county: 'Nakuru',
      route: 'Central Tower & Ol Njorowa Gorge',
      location: "Hell's Gate National Park, Naivasha",
      duration_days: 1,
      difficulty: 'Easy',
      max_altitude_m: 2200,
      price_adult: 5500,
      price_child: 4000,
      max_guests: 25,
      description: 'Walk beneath towering cliffs among zebra, giraffe and warthog, then descend into the dramatic Ol Njorowa Gorge.',
      highlights: ['Walk freely among wildlife on foot', 'Dramatic gorge scrambling section', 'Optional rock climbing add-on'],
      inclusions: ['Park entry fees', 'Guide'],
      exclusions: ['Bicycle hire', 'Lunch', 'Transport'],
      itinerary: [{ day: 1, title: 'Central Tower + gorge walk', description: 'Walk past the Central Tower, then descend into the gorge.' }],
      meeting_point: "Hell's Gate main gate, Naivasha",
      image_url: '/images/mountains/hells-gate/hero.jpg',
    },
    {
      mountain: 'aberdare-range',
      title: 'Aberdare Ranges \u2013 Kinangop Peak Trek',
      slug: 'aberdare-kinangop-trek',
      category: 'Mountain Range',
      county: 'Nyandarua',
      route: 'Kinangop Peak',
      location: 'Aberdare National Park',
      duration_days: 2,
      difficulty: 'Moderate',
      max_altitude_m: 3906,
      price_adult: 22000,
      price_child: 17000,
      max_guests: 12,
      description: 'A two-day moorland trek through the Aberdare highlands to Kinangop Peak, home to unique afro-alpine vegetation, waterfalls, and resident wildlife.',
      highlights: ['Rolling moorland and bamboo forest', 'Chances to spot Aberdare wildlife', 'Camping under clear highland skies'],
      inclusions: ['Park entry fees', 'Guide & porter', 'Camping equipment', 'Meals on the trek'],
      exclusions: ['Personal trekking gear', 'Transport to the park'],
      itinerary: [
        { day: 1, title: 'Gate to moorland camp', description: 'Ascend through bamboo forest into the moorland zone.' },
        { day: 2, title: 'Kinangop Peak and descend', description: 'Summit push at dawn, then descend back to the gate.' },
      ],
      meeting_point: 'Aberdare National Park main gate',
      image_url: '/images/mountains/aberdare-range/hero.jpg',
    },
    {
      mountain: 'kereita-forest',
      title: 'Kereita Forest & Waterfall Hike',
      slug: 'kereita-forest-hike',
      category: 'Forest',
      county: 'Kiambu',
      route: 'Forest Waterfall Trail',
      location: 'Kereita Forest, Kikuyu Escarpment',
      duration_days: 1,
      difficulty: 'Easy',
      max_altitude_m: 2400,
      price_adult: 3000,
      price_child: 2200,
      max_guests: 30,
      description: 'A relaxed forest walk through indigenous and plantation forest to a hidden waterfall on the edge of the Great Rift Valley escarpment.',
      highlights: ['Waterfall viewpoint', 'Optional zip-line add-on', 'Gentle terrain, good for beginners'],
      inclusions: ['Forest entry fees', 'Guide'],
      exclusions: ['Zip-line fee', 'Lunch', 'Transport'],
      itinerary: [{ day: 1, title: 'Forest & waterfall walk', description: 'Walk through the forest to the waterfall viewpoint and back.' }],
      meeting_point: 'Kereita Forest main entrance',
      image_url: '/images/mountains/kereita-forest/hero.jpg',
    },
    {
      mountain: 'mount-mtelo',
      title: 'Mount Mtelo (Sekerr Range) Expedition',
      slug: 'mount-mtelo-sekerr-range',
      category: 'Mountain',
      county: 'West Pokot',
      route: 'Sekerr Ridge',
      location: 'Sekerr Range, West Pokot',
      duration_days: 4,
      difficulty: 'Challenging',
      max_altitude_m: 3340,
      price_adult: 42000,
      price_child: null,
      max_guests: 12,
      description: "A remote, off-the-beaten-path expedition into West Pokot to summit Mount Mtelo, Kenya's fourth highest peak.",
      highlights: ["Kenya's 4th highest summit", 'Remote, low-traffic trekking region', 'Cultural encounters with local Pokot communities'],
      inclusions: ['Local guide fees', 'Camping equipment', 'Meals on the trek'],
      exclusions: ['Transport to West Pokot', 'Personal trekking gear'],
      itinerary: [
        { day: 1, title: 'Arrival & trailhead approach', description: 'Travel to the trailhead village and begin the ascent.' },
        { day: 2, title: 'Ridge camp', description: 'Trek along the Sekerr ridge to a high camp.' },
        { day: 3, title: 'Summit and descend', description: 'Summit push, then descend partway.' },
        { day: 4, title: 'Descend to trailhead', description: 'Final descent and transfer.' },
      ],
      meeting_point: 'Kapenguria town, West Pokot',
      image_url: '/images/mountains/mount-mtelo/hero.jpg',
    },
    {
      mountain: 'loita-hills',
      title: 'Loita Hills Hike & Cultural Camp',
      slug: 'loita-hills-hike-camp',
      category: 'Hill Range',
      county: 'Narok',
      route: 'Naimina Enkiyio Forest',
      location: 'Loita Hills, Narok',
      duration_days: 4,
      difficulty: 'Challenging',
      max_altitude_m: 2600,
      price_adult: 40000,
      price_child: null,
      max_guests: 10,
      description: 'A multi-day hike-and-camp through the Loita Hills and the "Forest of the Lost Child," combining trekking with a Maasai cultural experience.',
      highlights: ['Ancient indigenous forest', 'Guided by local Maasai community members', 'Remote camping away from crowds'],
      inclusions: ['Community/conservancy fees', 'Local guide', 'Camping equipment', 'Meals on the trek'],
      exclusions: ['Transport to Narok/Loita', 'Personal trekking gear'],
      itinerary: [
        { day: 1, title: 'Arrival & forest entry', description: 'Travel to Loita and begin the forest trek.' },
        { day: 2, title: 'Deep forest trekking', description: 'Trek deeper into Naimina Enkiyio forest.' },
        { day: 3, title: 'Cultural visit & camp', description: 'Visit a local Maasai community, camp in the hills.' },
        { day: 4, title: 'Return trek', description: 'Trek back out and transfer.' },
      ],
      meeting_point: 'Narok town',
      image_url: '/images/mountains/loita-hills/hero.jpg',
    },
    {
      mountain: 'menengai-crater',
      title: 'Menengai Crater Rim Walk',
      slug: 'menengai-crater-walk',
      category: 'Crater',
      county: 'Nakuru',
      route: 'Crater Rim Trail',
      location: 'Menengai Crater, Nakuru',
      duration_days: 1,
      difficulty: 'Easy',
      max_altitude_m: 2278,
      price_adult: 3000,
      price_child: 2000,
      max_guests: 30,
      description: "A gentle walk along the rim of one of the world's largest volcanic calderas, overlooking Lake Nakuru and the Rift Valley floor.",
      highlights: ['One of the largest calderas in the world', 'Views over Lake Nakuru and the Rift Valley', 'Easy half-day option'],
      inclusions: ['Site entry fees', 'Guide'],
      exclusions: ['Lunch', 'Transport'],
      itinerary: [{ day: 1, title: 'Crater rim walk', description: 'Walk the rim trail with viewpoints over Nakuru.' }],
      meeting_point: 'Menengai Crater main gate, Nakuru',
      image_url: '/images/mountains/menengai-crater/hero.jpg',
    },
  ];

  const insertAdventure = db.prepare(`
    INSERT INTO adventures (id, mountain_id, title, slug, category, county, route, location, duration_days, difficulty, max_altitude_m, price_adult, price_child, max_guests, description, highlights, inclusions, exclusions, itinerary, meeting_point, image_url, is_featured)
    VALUES (@id, @mountain_id, @title, @slug, @category, @county, @route, @location, @duration_days, @difficulty, @max_altitude_m, @price_adult, @price_child, @max_guests, @description, @highlights, @inclusions, @exclusions, @itinerary, @meeting_point, @image_url, @is_featured)
  `);
  const insertTripDate = db.prepare(`
    INSERT INTO trip_dates (id, adventure_id, start_date, end_date, slots_available)
    VALUES (?, ?, ?, ?, ?)
  `);

  for (const a of adventures) {
    const id = uuid();
    insertAdventure.run({
      id,
      mountain_id: mountainIds[a.mountain],
      title: a.title,
      slug: a.slug,
      category: a.category || null,
      county: a.county || null,
      route: a.route,
      location: a.location,
      duration_days: a.duration_days,
      difficulty: a.difficulty,
      max_altitude_m: a.max_altitude_m,
      price_adult: a.price_adult,
      price_child: a.price_child,
      max_guests: a.max_guests,
      description: a.description,
      highlights: JSON.stringify(a.highlights || []),
      inclusions: JSON.stringify(a.inclusions || []),
      exclusions: JSON.stringify(a.exclusions || []),
      itinerary: JSON.stringify(a.itinerary || []),
      meeting_point: a.meeting_point || null,
      image_url: a.image_url || null,
      is_featured: a.is_featured ? 1 : 0,
    });

    const today = new Date();
    for (let i = 1; i <= 2; i++) {
      const start = new Date(today);
      start.setDate(start.getDate() + i * 21);
      const end = new Date(start);
      end.setDate(end.getDate() + a.duration_days - 1);
      insertTripDate.run(
        uuid(),
        id,
        start.toISOString().slice(0, 10),
        end.toISOString().slice(0, 10),
        a.max_guests
      );
    }
  }

  console.log(`Seeded ${mountains.length} mountains and ${adventures.length} adventures with sample trip dates.`);
}

function seedGallery() {
  const count = db.prepare('SELECT COUNT(*) c FROM gallery_images').get().c;
  if (count > 0) {
    console.log('Gallery already seeded.');
    return;
  }

  function adventureId(slug) {
    const row = db.prepare('SELECT id FROM adventures WHERE slug = ?').get(slug);
    return row ? row.id : null;
  }

  const mtKenya = adventureId('point-lenana-sirimon-chogoria');
  const longonot = adventureId('mount-longonot-crater-hike');
  const hellsGate = adventureId('hells-gate-trek');

  // These are real Maqka Summit photos supplied directly by the client -- no stock,
  // no AI-generated images. A few categorizations below are best-guess based on visual
  // content and are flagged for the admin to confirm/correct in the Gallery tab.
  const photos = [
    { file: 'mount-kenya-peaks-view-01.jpg', title: 'Mount Kenya Peaks', category: 'Mount Kenya', adventure_id: mtKenya, is_featured: 1 },
    { file: 'mount-kenya-peaks-groundsels-01.jpg', title: 'Giant Groundsels Below the Peaks', category: 'Mount Kenya', adventure_id: mtKenya, is_featured: 1 },
    { file: 'mount-kenya-peaks-clouds-01.jpg', title: 'Mount Kenya Summit Ridge', category: 'Mount Kenya', adventure_id: mtKenya },
    { file: 'mount-kenya-peaks-stream-01.jpg', title: 'Alpine Stream Below the Summit', category: 'Mount Kenya', adventure_id: mtKenya },
    { file: 'mount-kenya-peaks-hut-01.jpg', title: 'Mountain Hut Beneath the Peaks', category: 'Mount Kenya', adventure_id: mtKenya },
    { file: 'mount-kenya-peaks-view-02.jpg', title: 'Mount Kenya Peaks', category: 'Mount Kenya', adventure_id: mtKenya },
    { file: 'mount-kenya-peaks-closeup-01.jpg', title: 'Batian and Nelion Close Up', category: 'Mount Kenya', adventure_id: mtKenya },
    { file: 'mount-kenya-shiptons-camp-sunset-01.jpg', title: "Sunset at Shipton's Camp", category: 'Mount Kenya', adventure_id: mtKenya, is_featured: 1 },
    { file: 'mount-kenya-campsite-hikers-01.jpg', title: 'Camp Life on the Mountain', category: 'Team & Guides', adventure_id: mtKenya },
    { file: 'mount-kenya-giant-lobelia-01.jpg', title: 'Giant Lobelia, Mount Kenya', category: 'Mount Kenya', adventure_id: mtKenya },
    { file: 'mount-kenya-park-signpost-01.jpg', title: 'Mount Kenya National Park Gate', category: 'Mount Kenya', adventure_id: mtKenya },
    { file: 'hiking-group-porters-packing-01.jpg', title: 'Guides and Porters Preparing Gear', category: 'Team & Guides', adventure_id: mtKenya, is_featured: 1 },
    { file: 'hiking-group-giant-groundsels-01.jpg', title: 'Trekking Through the Groundsel Zone', category: 'Hiking Adventures', adventure_id: mtKenya, is_featured: 1 },
    // Newly supplied photos -- category is a best guess from visual content; please
    // confirm/correct via the admin Gallery tab.
    { file: 'gallery-crater-aerial-01.jpg', title: 'Longonot Crater From Above', category: 'Mount Longonot', adventure_id: longonot, is_featured: 1 },
    { file: 'gallery-crater-rim-trail-01.jpg', title: 'Hiking the Crater Rim', category: 'Mount Longonot', adventure_id: longonot, is_featured: 1 },
    { file: 'gallery-escarpment-view-01.jpg', title: 'Rift Valley Escarpment (needs confirmation)', category: "Hell's Gate", adventure_id: hellsGate },
    { file: 'gallery-forest-waterfall-01.jpg', title: 'Forest Waterfall (needs confirmation)', category: 'Waterfalls', adventure_id: null },
  ];

  const insert = db.prepare(`
    INSERT INTO gallery_images (id, title, image_url, category, adventure_id, sort_order, is_featured)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);

  photos.forEach((p, i) => {
    insert.run(uuid(), p.title, `/uploads/gallery/${p.file}`, p.category, p.adventure_id, i, p.is_featured ? 1 : 0);
  });

  console.log(`Seeded ${photos.length} real Maqka Summit gallery photos.`);
}

upsertAdmin();
seedMountainsAndAdventures();
seedGallery();

function seedFaqs() {
  const count = db.prepare('SELECT COUNT(*) c FROM faqs').get().c;
  if (count > 0) {
    console.log('FAQs already seeded.');
    return;
  }

  const faqs = [
    { q: 'How do I book a hiking adventure?', a: 'Browse the Adventures page, open the one you\'re interested in, choose a departure date, enter how many adults and children are joining, and submit your booking request. Our team reviews and confirms it, then shares payment details.' },
    { q: 'Can I book for a group?', a: 'Yes. Enter the number of adults and children when booking — the total updates automatically. For larger groups, contact us directly and we can help arrange the details.' },
    { q: 'How many people can I book for?', a: 'This depends on the adventure\'s remaining capacity for that departure date, shown on the adventure page. If you try to book more people than there\'s room for, you\'ll be told how many spaces are actually available.' },
    { q: 'Can children participate in selected adventures?', a: 'Many of our adventures list a child price alongside the adult price, meaning children are welcome on those routes. Some multi-day, high-altitude treks are better suited to adults — check the difficulty and description on each adventure page, or contact us if you\'re unsure.' },
    { q: 'What should I bring for a hike?', a: 'This varies by adventure and altitude. Check the specific adventure page for guidance, and feel free to contact us for a packing list suited to your trek.' },
    { q: 'What happens after I make a booking?', a: 'Your booking is created as "pending" while our team reviews availability. You\'ll receive a confirmation email, and once approved, another email with payment details and next steps. You can track the status any time from your dashboard.' },
    { q: 'Can I pay in installments?', a: 'Yes. You can pay a deposit and clear the balance over time by bank transfer or cash. Your dashboard always shows how much you\'ve paid and what\'s still outstanding.' },
    { q: 'How do I know my booking is confirmed?', a: 'Your dashboard shows a live status for every booking (Pending, Confirmed, Completed, or Cancelled), and we email you when the status changes.' },
    { q: 'Can I change my booking?', a: 'Contact us as soon as possible if you need to change your departure date or group size — we\'ll do our best to accommodate changes depending on availability.' },
    { q: 'What happens if an adventure is cancelled?', a: 'We\'ll contact you directly to explain the situation and your options. (Needs verification: Maqka Summit to confirm the official refund/rescheduling policy for admin-initiated cancellations.)' },
    { q: 'How do I contact Maqka Summit?', a: 'Use the contact form on our Contact page, message us on WhatsApp, call 0713 177 186, or email waltermichael357@gmail.com.' },
    { q: 'Do you offer private/group trips?', a: 'Yes, contact us with your group size and preferred adventure and we can discuss arranging a private departure.' },
    { q: 'Do you offer safari packages?', a: 'Yes, alongside our hiking and trekking adventures, we offer safari packages — see the Safari Packages page for what\'s currently available.' },
    { q: 'Where is Maqka Summit located?', a: 'We\'re based in Nanyuki, Kenya.' },
  ];

  const insert = db.prepare('INSERT INTO faqs (id, question, answer, sort_order) VALUES (?, ?, ?, ?)');
  faqs.forEach((f, i) => insert.run(uuid(), f.q, f.a, i));
  console.log(`Seeded ${faqs.length} FAQs.`);
}

function seedMountKenyaFaqs() {
  const existing = db.prepare("SELECT COUNT(*) c FROM faqs WHERE topic = 'Mount Kenya'").get().c;
  if (existing > 0) {
    console.log('Mount Kenya FAQs already seeded.');
    return;
  }

  const faqs = [
    { q: 'Can Mount Kenya be climbed without technical rock-climbing experience?', a: 'Yes. Most guided trekkers aim for Point Lenana, which is a non-technical trekking summit. Batian and Nelion are technical climbing peaks and require specialist skills, equipment, experience, and professional support.' },
    { q: 'How many days are recommended for Mount Kenya?', a: 'Many trekkers choose a 4-day or 5-day itinerary. A 3-day trek may be possible but is generally more demanding and allows less time for acclimatization. The suitable duration depends on fitness, route, weather, and guide recommendations.' },
    { q: 'Which Mount Kenya route is generally more gradual?', a: 'The Sirimon Route is often selected for its relatively gradual approach in several sections and its suitability for acclimatization-focused itineraries. Route difficulty can still vary depending on conditions and the selected itinerary.' },
    { q: 'Which Mount Kenya route is known for scenery?', a: 'The Chogoria Route is widely appreciated for its dramatic landscapes, valleys, cliffs, lakes, and mountain views. Scenic conditions and route access should be confirmed before departure.' },
    { q: 'Is a guide required?', a: 'Travellers should confirm the latest Kenya Wildlife Service requirements and use qualified, appropriately trained mountain guides. The operator must verify current park entry and guiding regulations before confirming a trip. (Needs verification against current official KWS guidance.)' },
    { q: 'How much are Mount Kenya park fees?', a: 'Park fees can change depending on visitor category, nationality or residency status, age, applicable regulations, and the current Kenya Wildlife Service tariff. See the fee table below for the categories we track — administrators verify and update these figures, each with its effective date and source, before they are relied on for a quotation.' },
    { q: 'What is the highest peak on Mount Kenya?', a: 'Batian is the highest summit at approximately 5,199 metres. Nelion is approximately 5,188 metres, while Point Lenana is approximately 4,985 metres and is the main trekking summit.' },
    { q: 'Is Mount Kenya harder than Mount Kilimanjaro?', a: 'The difficulty depends on the route, altitude response, weather, itinerary, fitness, and experience. Point Lenana is a trekking summit, while Batian and Nelion involve technical climbing. Comparisons should not be reduced to elevation alone.' },
    { q: 'What should I pack for Mount Kenya?', a: 'Travellers should prepare warm clothing, waterproof layers, gloves, a warm hat, suitable hiking boots, a headlamp, water containers, sunscreen, personal medication, snacks, first-aid essentials, identification, and a sleeping bag where required.' },
    { q: 'Is Mount Kenya suitable for beginners?', a: 'Prepared beginners may be able to attempt Point Lenana with a suitable guided itinerary, adequate preparation, enough acclimatization time, and appropriate equipment. Beginners should avoid rushed itineraries and technical climbing routes. Final suitability should be discussed with the operator and lead guide.' },
  ];

  const insert = db.prepare("INSERT INTO faqs (id, question, answer, topic, sort_order) VALUES (?, ?, ?, 'Mount Kenya', ?)");
  faqs.forEach((f, i) => insert.run(uuid(), f.q, f.a, i));
  console.log(`Seeded ${faqs.length} Mount Kenya FAQs.`);
}

function seedOperatorChecklist() {
  const count = db.prepare('SELECT COUNT(*) c FROM operator_checklist_items').get().c;
  if (count > 0) {
    console.log('Operator checklist already seeded.');
    return;
  }

  const items = [
    { q: 'Which route will we use, and why?', why: "Helps travellers understand the route's scenery, difficulty, access point, and suitability." },
    { q: 'How many days does the trek take?', why: 'The number of days affects pacing, acclimatization, fatigue, and overall comfort.' },
    { q: 'Are park fees included in the package?', why: 'Helps prevent unexpected costs and unclear quotations.' },
    { q: 'Are the guides qualified and properly trained?', why: 'Qualified guides contribute to safety, route management, group support, and responsible trekking.' },
    { q: 'How are porters treated?', why: 'Fair treatment of porters reflects ethical and responsible mountain tourism.' },
    { q: 'What is the emergency plan?', why: 'The operator should explain how altitude-related problems, injuries, bad weather, or evacuations are handled.' },
    { q: 'What meals are included?', why: 'Travellers need to understand meal arrangements and whether the food provided supports long trekking days.' },
    { q: 'What equipment is provided?', why: 'Knowing what is included helps travellers prepare properly and avoid unexpected rental expenses.' },
    { q: 'What services and costs are excluded?', why: 'Clear exclusions prevent confusion about the final budget.' },
    { q: 'What happens if the weather changes?', why: 'A responsible operator should have realistic plans for delays, route changes, rest days, or cancellation decisions.' },
  ];

  const insert = db.prepare('INSERT INTO operator_checklist_items (id, question, why_it_matters, sort_order) VALUES (?, ?, ?, ?)');
  items.forEach((it, i) => insert.run(uuid(), it.q, it.why, i));
  console.log(`Seeded ${items.length} operator checklist items.`);
}

function seedRouteComparisonCards() {
  const count = db.prepare('SELECT COUNT(*) c FROM route_comparison_cards').get().c;
  if (count > 0) {
    console.log('Route comparison cards already seeded.');
    return;
  }

  // No prices seeded here -- Maqka Summit sets real, verified prices via the admin
  // dashboard (or links a card to an existing priced adventure).
  const cards = [
    {
      title: '3-Day Point Lenana Trek',
      duration_label: '3 days',
      difficulty: 'Demanding',
      summit_objective: 'Point Lenana (non-technical)',
      recommended_experience: 'Well-prepared, fit trekkers only',
      availability_note: 'Subject to guide assessment and route conditions',
      whatsapp_message: "Hi Maqka Summit, I'd like to ask about the 3-Day Point Lenana Trek.",
    },
    {
      title: '4-Day Point Lenana Trek',
      duration_label: '4 days',
      difficulty: 'Moderate',
      summit_objective: 'Point Lenana (non-technical)',
      recommended_experience: 'Prepared, active travellers',
      availability_note: 'Acclimatization depends on the actual itinerary',
      whatsapp_message: "Hi Maqka Summit, I'd like to ask about the 4-Day Point Lenana Trek.",
    },
    {
      title: '5-Day Point Lenana Trek',
      duration_label: '5 days',
      difficulty: 'Moderate (gradual pace)',
      summit_objective: 'Point Lenana (non-technical)',
      recommended_experience: 'Most trekkers, including first-time high-altitude hikers',
      availability_note: 'Subject to fitness, weather, and route conditions',
      whatsapp_message: "Hi Maqka Summit, I'd like to ask about the 5-Day Point Lenana Trek.",
    },
    {
      title: 'Sirimon Up \u2013 Chogoria Down',
      duration_label: 'Typically 4\u20135 days',
      route: 'Sirimon ascent, Chogoria descent',
      difficulty: 'Moderate to Challenging',
      summit_objective: 'Point Lenana (non-technical)',
      recommended_experience: 'Travellers wanting two different route experiences',
      availability_note: 'Requires transport and route coordination; availability and route conditions must be confirmed',
      whatsapp_message: "Hi Maqka Summit, I'd like to ask about the Sirimon Up \u2013 Chogoria Down route.",
    },
    {
      title: 'Batian or Nelion Technical Climb',
      duration_label: 'Varies by itinerary',
      summit_objective: 'Batian (~5,199m) or Nelion (~5,188m) \u2014 technical summits',
      difficulty: 'Technical / expert',
      recommended_experience: 'Experienced technical climbers only, with specialist equipment and skills',
      availability_note: 'Requires professional technical climbing arrangements \u2014 not an ordinary hiking package',
      whatsapp_message: "Hi Maqka Summit, I'd like to ask about a technical climb of Batian/Nelion.",
    },
  ];

  const insert = db.prepare(`
    INSERT INTO route_comparison_cards (id, title, duration_label, route, difficulty, summit_objective, recommended_experience, availability_note, inclusions, exclusions, whatsapp_message, sort_order)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  cards.forEach((c, i) => insert.run(
    uuid(), c.title, c.duration_label || null, c.route || null, c.difficulty || null,
    c.summit_objective || null, c.recommended_experience || null, c.availability_note || null,
    JSON.stringify([]), JSON.stringify([]), c.whatsapp_message || null, i
  ));
  console.log(`Seeded ${cards.length} route comparison cards (no prices -- admin to set/link real adventures).`);
}

function seedParkFeeCategories() {
  const count = db.prepare('SELECT COUNT(*) c FROM park_fee_categories').get().c;
  if (count > 0) {
    console.log('Park fee categories already seeded.');
    return;
  }

  // Labels only -- NO fee amounts seeded. Every figure must be verified against the
  // current official KWS tariff and entered by an admin with its effective date and source.
  const categories = [
    'East African Citizen', 'Kenyan Resident', 'Non-Resident', 'African Citizen', 'Child / Student',
  ];

  const insert = db.prepare('INSERT INTO park_fee_categories (id, category_label, sort_order, notes) VALUES (?, ?, ?, ?)');
  categories.forEach((label, i) => insert.run(uuid(), label, i, 'Needs verification against current KWS tariff before publishing.'));
  console.log(`Seeded ${categories.length} park fee categories (labels only -- no fees set).`);
}

seedFaqs();
seedMountKenyaFaqs();
seedOperatorChecklist();
seedRouteComparisonCards();
seedParkFeeCategories();
console.log('Seeding complete.');
