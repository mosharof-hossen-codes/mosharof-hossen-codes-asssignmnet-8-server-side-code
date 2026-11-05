import bcrypt from 'bcryptjs';
import { getDB, connectDB, isMemoryMode } from './config/db';

export const seedData = async () => {
  try {
    const db = getDB();
    console.log('[Seed] Seeding StudioSpace creative database...');

    // 1. Seed Examiner / Demo User
    const examinerEmail = 'creator@studiospace.io';
    const hashedPassword = await bcrypt.hash('Studio@2026', 10);

    const examinerUser = {
      name: 'Alex Rivera',
      email: examinerEmail,
      photoURL: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80',
      password: hashedPassword,
      createdAt: new Date().toISOString(),
    };

    if (isMemoryMode()) {
      await db.getCollection('users').deleteMany({ email: examinerEmail });
      await db.getCollection('users').insertOne(examinerUser);
    } else {
      await db.collection('users').deleteMany({ email: examinerEmail });
      await db.collection('users').insertOne(examinerUser);
    }

    // 2. Seed Studios
    const studiosList = [
      {
        title: 'Apex Dolby Atmos Music & Mixing Suite',
        category: 'Music Suite',
        hourlyRate: 95,
        securityDeposit: 100,
        maxCapacity: 8,
        location: 'Downtown Arts District, Los Angeles, CA',
        imageUrl: 'https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?auto=format&fit=crop&w=1200&q=80',
        images: [
          'https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?auto=format&fit=crop&w=1200&q=80',
          'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=1200&q=80',
          'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&w=1200&q=80'
        ],
        amenities: ['7.1.4 Dolby Atmos Array', 'PMC Monitors', 'Neve 1073 Preamps', 'Vocal Booth', 'High-speed Fiber WiFi', 'Lounge & Espresso Bar'],
        overview: 'Tuned by world-class acousticians, Apex Suite provides an immersive spatial audio mixing and vocal recording suite featuring 7.1.4 Dolby Atmos array, PMC monitors, and top-flight analog outboard gear.',
        rating: 5.0,
        reviewCount: 18,
        ownerEmail: examinerEmail,
        ownerName: 'Alex Rivera',
        ownerPhoto: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80',
        featured: true,
        createdAt: '2026-10-15T09:00:00.000Z',
      },
      {
        title: 'Velvet Echo Analog Recording & Live Room',
        category: 'Music Suite',
        hourlyRate: 110,
        securityDeposit: 120,
        maxCapacity: 12,
        location: 'Music Row, Nashville, TN',
        imageUrl: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=1200&q=80',
        images: [
          'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=1200&q=80',
          'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&w=1200&q=80'
        ],
        amenities: ['Vintage Guitar Collection', 'Tube Mic Locker', '24-Channel Analog Console', 'Drum Room Isolation', 'Green Room', 'Tape Machine'],
        overview: 'Warm natural timber acoustics paired with legendary vintage analog outboard gear. Perfect for live band tracking, acoustic ensembles, and pristine vocal capture.',
        rating: 5.0,
        reviewCount: 24,
        ownerEmail: 'sarah.records@studiospace.io',
        ownerName: 'Sarah Jenkins',
        ownerPhoto: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=300&q=80',
        featured: true,
        createdAt: '2026-10-16T11:00:00.000Z',
      },
      {
        title: 'Neon Vault 4K Cinema Soundstage & Cyclorama',
        category: 'Sound Stage',
        hourlyRate: 135,
        securityDeposit: 150,
        maxCapacity: 30,
        location: 'Arts District, Downtown Los Angeles, CA',
        imageUrl: 'https://images.unsplash.com/photo-1492691527719-9d1e07e534b4?auto=format&fit=crop&w=1200&q=80',
        images: [
          'https://images.unsplash.com/photo-1492691527719-9d1e07e534b4?auto=format&fit=crop&w=1200&q=80',
          'https://images.unsplash.com/photo-1574717024653-61fd2cf4d44d?auto=format&fit=crop&w=1200&q=80'
        ],
        amenities: ['3,000 sq ft Floor', 'Automated RGB Lighting Grid', 'Camlock 3-Phase Power', 'Drive-in Bay Doors', 'Hair & Makeup Suite', 'Production Office'],
        overview: 'Massive 3,000 sq.ft creative soundstage with 22-foot ceilings, automated RGB lighting grid, heavy camlock 3-phase power, soundproof sound dampening walls, and drive-in bay doors.',
        rating: 5.0,
        reviewCount: 31,
        ownerEmail: examinerEmail,
        ownerName: 'Alex Rivera',
        ownerPhoto: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80',
        featured: true,
        createdAt: '2026-10-17T14:30:00.000Z',
      },
      {
        title: 'Obsidian Blackbox Cinema & VFX Stage',
        category: 'Sound Stage',
        hourlyRate: 155,
        securityDeposit: 200,
        maxCapacity: 40,
        location: 'Eastside Film Corridor, Atlanta, GA',
        imageUrl: 'https://images.unsplash.com/photo-1485846234645-a62644f84728?auto=format&fit=crop&w=1200&q=80',
        images: [
          'https://images.unsplash.com/photo-1485846234645-a62644f84728?auto=format&fit=crop&w=1200&q=80',
          'https://images.unsplash.com/photo-1492691527719-9d1e07e534b4?auto=format&fit=crop&w=1200&q=80'
        ],
        amenities: ['Full Blackbox Rig', 'Chroma Green Screen Curtains', 'Lighting Truss with DMX', 'Heavy Scissor Lift', 'Production Catering Space'],
        overview: 'A professional blackbox studio optimized for narrative films, high-concept music videos, and commercial shoots. Fully isolated acoustic treatment and turnkey grip packages included.',
        rating: 5.0,
        reviewCount: 19,
        ownerEmail: 'marcus.film@studiospace.io',
        ownerName: 'Marcus Vance',
        ownerPhoto: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=300&q=80',
        featured: true,
        createdAt: '2026-10-18T10:15:00.000Z',
      },
      {
        title: 'The Prism Cyc & Cinema Soundstage',
        category: 'Photo Studio',
        hourlyRate: 125,
        securityDeposit: 150,
        maxCapacity: 25,
        location: 'Brooklyn Navy Yard, Brooklyn, NY',
        imageUrl: 'https://images.unsplash.com/photo-1574717024653-61fd2cf4d44d?auto=format&fit=crop&w=1200&q=80',
        images: [
          'https://images.unsplash.com/photo-1574717024653-61fd2cf4d44d?auto=format&fit=crop&w=1200&q=80',
          'https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?auto=format&fit=crop&w=1200&q=80'
        ],
        amenities: ['3-Wall Cyclorama', 'Profoto Flash Kits', 'Overhead Chimera Softbox', 'Stylist Steamers & Racks', 'Freight Elevator', 'Private Green Room'],
        overview: 'A premier 2,400 sq. ft. soundstage built for high-end fashion editorials, music videos, and commercial film productions. Equipped with full 3-wall infinity curve and hair & makeup suite.',
        rating: 5.0,
        reviewCount: 27,
        ownerEmail: examinerEmail,
        ownerName: 'Alex Rivera',
        ownerPhoto: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80',
        featured: true,
        createdAt: '2026-10-19T16:00:00.000Z',
      },
      {
        title: 'Skyline Horizon Rooftop Production Studio',
        category: 'Photo Studio',
        hourlyRate: 140,
        securityDeposit: 180,
        maxCapacity: 30,
        location: 'South Loop Arts District, Chicago, IL',
        imageUrl: 'https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=1200&q=80',
        images: [
          'https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=1200&q=80',
          'https://images.unsplash.com/photo-1492691527719-9d1e07e534b4?auto=format&fit=crop&w=1200&q=80'
        ],
        amenities: ['360 Skyline Panorama', 'Retractable Weather Canopies', 'Continuous Daylight Lighting', 'VIP Prep Suite', 'High-Speed Elevators'],
        overview: 'An open-air architectural rooftop space with unobstructed views of the city skyline. Designed for golden hour fashion shoots, lookbooks, interview scenes, and music videos.',
        rating: 4.9,
        reviewCount: 42,
        ownerEmail: 'elena.photo@studiospace.io',
        ownerName: 'Elena Rostova',
        ownerPhoto: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80',
        featured: true,
        createdAt: '2026-10-20T12:00:00.000Z',
      },
      {
        title: 'EchoCast 4K Multi-Cam Podcast Lounge',
        category: 'Podcast Room',
        hourlyRate: 85,
        securityDeposit: 75,
        maxCapacity: 6,
        location: 'SoHo Creative Hub, New York, NY',
        imageUrl: 'https://images.unsplash.com/photo-1590602847861-f357a9332bbc?auto=format&fit=crop&w=1200&q=80',
        images: [
          'https://images.unsplash.com/photo-1590602847861-f357a9332bbc?auto=format&fit=crop&w=1200&q=80',
          'https://images.unsplash.com/photo-1478737270239-2f02b77fc618?auto=format&fit=crop&w=1200&q=80'
        ],
        amenities: ['4x Shure SM7B Mics', 'Sony FX3 4K Multi-Cam', 'Rodecaster Pro II Console', 'Sound-Isolated Booth', 'Live Streaming Switcher'],
        overview: 'Turnkey multi-camera podcast production suite. Includes automated broadcast switching, dynamic RGB accent backlighting, and instantaneous local SSD raw footage delivery.',
        rating: 4.9,
        reviewCount: 35,
        ownerEmail: examinerEmail,
        ownerName: 'Alex Rivera',
        ownerPhoto: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80',
        featured: false,
        createdAt: '2026-10-21T08:30:00.000Z',
      },
      {
        title: 'Artisan Clay & Ceramic Print Workshop',
        category: 'Art Workshop',
        hourlyRate: 70,
        securityDeposit: 50,
        maxCapacity: 15,
        location: 'Wynwood Arts District, Miami, FL',
        imageUrl: 'https://images.unsplash.com/photo-1565193566173-7a0ee3dbe261?auto=format&fit=crop&w=1200&q=80',
        images: [
          'https://images.unsplash.com/photo-1565193566173-7a0ee3dbe261?auto=format&fit=crop&w=1200&q=80'
        ],
        amenities: ['Shimpo Pottery Wheels', 'High-Fire Electric Kilns', 'Silk-Screening Presses', 'Raw Clay Storage', 'Natural Skylights'],
        overview: 'A sprawling sunlit artisan studio fitted with Shimpo pottery wheels, high-fire electric kilns, printmaking silk-screen presses, and durable stainless workbenches.',
        rating: 4.8,
        reviewCount: 14,
        ownerEmail: 'clara.art@studiospace.io',
        ownerName: 'Clara Gomez',
        ownerPhoto: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=300&q=80',
        featured: false,
        createdAt: '2026-10-22T13:45:00.000Z',
      }
    ];

    if (isMemoryMode()) {
      await db.getCollection('studios').deleteMany({});
      await db.getCollection('studios').insertMany(studiosList);
    } else {
      await db.collection('studios').deleteMany({});
      await db.collection('studios').insertMany(studiosList);
    }

    // 3. Seed Demo Bookings for Alex Rivera (matching Screenshot page 5)
    const bookingsList = [
      {
        studioId: 'neon-vault-soundstage',
        studioTitle: 'Neon Vault 4K Cinema Soundstage & Cyclorama',
        studioImage: 'https://images.unsplash.com/photo-1492691527719-9d1e07e534b4?auto=format&fit=crop&w=1200&q=80',
        studioLocation: 'Arts District, Downtown Los Angeles, CA',
        category: 'Sound Stage',
        userEmail: examinerEmail,
        userName: 'Alex Rivera',
        shootDate: '2026-11-20',
        startTime: '10:00',
        endTime: '14:00',
        durationHours: 4,
        hourlyRate: 135,
        securityDeposit: 150,
        subtotal: 540,
        totalCost: 690,
        crewCount: 4,
        gearNotes: 'Bringing high-output lighting, smoke machine, heavy rigging',
        status: 'Pending',
        createdAt: '2026-10-29T10:00:00.000Z',
      },
      {
        studioId: 'neon-vault-soundstage-2',
        studioTitle: 'Neon Vault 4K Cinema Soundstage & Cyclorama',
        studioImage: 'https://images.unsplash.com/photo-1492691527719-9d1e07e534b4?auto=format&fit=crop&w=1200&q=80',
        studioLocation: 'Arts District, Downtown Los Angeles, CA',
        category: 'Sound Stage',
        userEmail: examinerEmail,
        userName: 'Alex Rivera',
        shootDate: '2026-10-29',
        startTime: '10:00',
        endTime: '14:00',
        durationHours: 4,
        hourlyRate: 135,
        securityDeposit: 150,
        subtotal: 540,
        totalCost: 690,
        crewCount: 4,
        gearNotes: 'Cancelled prior reservation due to actor rescheduling',
        status: 'Cancelled',
        createdAt: '2026-10-25T14:20:00.000Z',
      },
      {
        studioId: 'prism-cyc-soundstage',
        studioTitle: 'The Prism Cyc & Cinema Soundstage',
        studioImage: 'https://images.unsplash.com/photo-1574717024653-61fd2cf4d44d?auto=format&fit=crop&w=1200&q=80',
        studioLocation: 'Brooklyn Navy Yard, Brooklyn, NY',
        category: 'Photo Studio',
        userEmail: examinerEmail,
        userName: 'Alex Rivera',
        shootDate: '2026-11-15',
        startTime: '10:00',
        endTime: '15:00',
        durationHours: 5,
        hourlyRate: 125,
        securityDeposit: 150,
        subtotal: 625,
        totalCost: 775,
        crewCount: 8,
        gearNotes: 'Commercial fashion shoot and lookbook video production',
        status: 'Confirmed',
        createdAt: '2026-10-28T16:40:00.000Z',
      }
    ];

    if (isMemoryMode()) {
      await db.getCollection('bookings').deleteMany({ userEmail: examinerEmail });
      await db.getCollection('bookings').insertMany(bookingsList);
    } else {
      await db.collection('bookings').deleteMany({ userEmail: examinerEmail });
      await db.collection('bookings').insertMany(bookingsList);
    }

    console.log('[Seed] Database seeded with 8 studios, test examiner user, and initial production bookings.');
  } catch (error) {
    console.error('[Seed] Error during seeding:', error);
  }
};
