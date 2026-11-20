import { closePool, withTransaction } from '../config/db';

interface SeedUser {
  id: string;
  email: string;
  fullName: string;
  role: 'Incoming Junior' | 'Graduating Senior';
  department: string;
  academicYear: string;
  phoneNumber: string;
  avatarUrl: string;
}

const SEED_USERS: SeedUser[] = [
  {
    id: '11111111-1111-4111-8111-111111111101',
    email: 'rohan.s22@mit.edu',
    fullName: 'Rohan Sharma',
    role: 'Graduating Senior',
    department: 'Computer Science',
    academicYear: 'Final Year Senior',
    phoneNumber: '+91 98765 43210',
    avatarUrl: '/images/mentors/mentor-1.jpg',
  },
  {
    id: '11111111-1111-4111-8111-111111111102',
    email: 'ananya.v22@mit.edu',
    fullName: 'Ananya Verma',
    role: 'Graduating Senior',
    department: 'Electrical Engineering',
    academicYear: 'Final Year Senior',
    phoneNumber: '+91 98223 55411',
    avatarUrl: '/images/mentors/mentor-2.jpg',
  },
  {
    id: '11111111-1111-4111-8111-111111111103',
    email: 'aditya.m22@mit.edu',
    fullName: 'Aditya Mehta',
    role: 'Graduating Senior',
    department: 'Mechanical Engineering',
    academicYear: 'Final Year Senior',
    phoneNumber: '+91 97654 22190',
    avatarUrl: '/images/mentors/mentor-4.jpg',
  },
  {
    id: '11111111-1111-4111-8111-111111111104',
    email: 'pooja.i22@mit.edu',
    fullName: 'Pooja Iyer',
    role: 'Graduating Senior',
    department: 'Data Science & AI',
    academicYear: 'Final Year Senior',
    phoneNumber: '+91 98112 77834',
    avatarUrl: '/images/mentors/mentor-3.jpg',
  },
  {
    id: '11111111-1111-4111-8111-111111111105',
    email: 'tanvi.s22@mit.edu',
    fullName: 'Tanvi Sen',
    role: 'Graduating Senior',
    department: 'Biotechnology',
    academicYear: 'Final Year Senior',
    phoneNumber: '+91 98451 66712',
    avatarUrl: '/images/mentors/mentor-5.jpg',
  },
  {
    id: '11111111-1111-4111-8111-111111111106',
    email: 'kunal.d22@mit.edu',
    fullName: 'Kunal Deshmukh',
    role: 'Graduating Senior',
    department: 'Civil Engineering',
    academicYear: 'Final Year Senior',
    phoneNumber: '+91 97334 89021',
    avatarUrl: '/images/mentors/mentor-6.jpg',
  },
  {
    id: '11111111-1111-4111-8111-111111111199',
    email: 'aarav.g26@mit.edu',
    fullName: 'Aarav Gupta',
    role: 'Incoming Junior',
    department: 'First Year Common / Tech',
    academicYear: '1st Year (Junior)',
    phoneNumber: '+91 99001 33445',
    avatarUrl: '/images/mentors/mentor-4.jpg',
  },
];

const SEED_DEPARTURES = [
  {
    id: '22222222-2222-4222-8222-222222222201',
    seniorId: '11111111-1111-4111-8111-111111111101',
    vacatingDate: '2026-05-15',
    nextDestination: 'Joining Microsoft as Software Engineer',
    handoffQuote:
      'When seniors leave, their room, their books, and their experience should not vanish into thin air.',
  },
  {
    id: '22222222-2222-4222-8222-222222222202',
    seniorId: '11111111-1111-4111-8111-111111111102',
    vacatingDate: '2026-06-01',
    nextDestination: 'Joining Texas Instruments, Bangalore',
    handoffQuote:
      'Passing down my cozy shared flat and core engineering tools so a junior does not waste weeks searching.',
  },
  {
    id: '22222222-2222-4222-8222-222222222203',
    seniorId: '11111111-1111-4111-8111-111111111103',
    vacatingDate: '2026-05-20',
    nextDestination: 'Joining Tata Motors R&D',
    handoffQuote: 'Passing on my 1st-year engineering graphics kit in pristine condition.',
  },
  {
    id: '22222222-2222-4222-8222-222222222204',
    seniorId: '11111111-1111-4111-8111-111111111104',
    vacatingDate: '2026-06-15',
    nextDestination: 'Masters at Technical University of Munich (TUM)',
    handoffQuote:
      'Giving away my research notes, Bishop textbook, and quiet 1BHK apartment directly to an incoming AI student.',
  },
  {
    id: '22222222-2222-4222-8222-222222222205',
    seniorId: '11111111-1111-4111-8111-111111111105',
    vacatingDate: '2026-05-28',
    nextDestination: 'Research Fellow at NCBS',
    handoffQuote: 'Leaving behind my fully annotated Lehninger Biochemistry copy with exam pathway tabs.',
  },
  {
    id: '22222222-2222-4222-8222-222222222206',
    seniorId: '11111111-1111-4111-8111-111111111106',
    vacatingDate: '2026-05-10',
    nextDestination: 'M.Tech via GATE 2026',
    handoffQuote: 'Passing on hostel essentials to keep late-night exam prep comfortable.',
  },
];

const SEED_RESOURCES = [
  {
    id: '33333333-3333-4333-8333-333333333301',
    departureId: '22222222-2222-4222-8222-222222222201',
    sellerId: '11111111-1111-4111-8111-111111111101',
    title: 'Introduction to Algorithms (CLRS) - 4th Edition',
    category: 'Textbook',
    courseCode: 'CS201',
    courseName: 'Data Structures & Algorithms',
    department: 'Computer Science',
    editionDetails: '4th International Edition (Hardcover with sticky tabs)',
    condition: 'Annotated with Exam Notes',
    fairPrice: 450,
    originalPrice: 1400,
    notesIncluded: true,
    pickupLocation: 'Central Library Steps or Gate 2 Cafeteria',
    description:
      'The standard textbook for algorithm courses. All chapters have sticky tabs marking high-frequency semester exam questions, recurrence relation proofs, and DP templates.',
    imageUrl: '/images/resources/res-1.jpg',
    availableUntil: '2026-05-15',
  },
  {
    id: '33333333-3333-4333-8333-333333333302',
    departureId: '22222222-2222-4222-8222-222222222202',
    sellerId: '11111111-1111-4111-8111-111111111102',
    title: 'Casio Scientific Calculator FX-82MS / 991',
    category: 'Electronics',
    courseCode: 'MATH101 / EE201',
    courseName: 'Engineering Mathematics & Circuit Analysis',
    department: 'All Engineering Disciplines',
    editionDetails: 'Original Sensor Model with hard slipcase',
    condition: 'Like New',
    fairPrice: 650,
    originalPrice: 1650,
    notesIncluded: false,
    pickupLocation: 'West Campus Coffee Shop',
    description:
      'High-speed matrix solver, complex number support, and calculus integration. Approved for semester end exams. Includes protective sliding case and fresh battery.',
    imageUrl: '/images/resources/res-2.jpg',
    availableUntil: '2026-06-01',
  },
  {
    id: '33333333-3333-4333-8333-333333333303',
    departureId: '22222222-2222-4222-8222-222222222203',
    sellerId: '11111111-1111-4111-8111-111111111103',
    title: 'Mini Drafting Table + Engineering Drawing Set',
    category: 'Lab Equipment',
    courseCode: 'ME101',
    courseName: 'Engineering Graphics & Design',
    department: 'Mechanical / First Year Common',
    editionDetails: 'Professional Wooden Board Drafting Kit',
    condition: 'Gently Used',
    fairPrice: 350,
    originalPrice: 1100,
    notesIncluded: true,
    pickupLocation: 'Workshop Complex, Block C',
    description:
      'Complete mandatory 1st-year drawing set: mini drafter with steel clamp, T-scale, set-squares, roller scale, compass box, and sheet holder board. Saves 70% vs campus bookstore.',
    imageUrl: '/images/resources/res-3.jpg',
    availableUntil: '2026-05-20',
  },
  {
    id: '33333333-3333-4333-8333-333333333304',
    departureId: '22222222-2222-4222-8222-222222222204',
    sellerId: '11111111-1111-4111-8111-111111111104',
    title: 'Pattern Recognition & Machine Learning (Bishop)',
    category: 'Textbook',
    courseCode: 'AI301',
    courseName: 'Foundations of Machine Learning',
    department: 'Data Science & AI',
    editionDetails: 'Hardcover Reference Edition with handwritten derivations',
    condition: 'Annotated with Exam Notes',
    fairPrice: 520,
    originalPrice: 1800,
    notesIncluded: true,
    pickupLocation: 'Emerald Residency lobby or AI Dept Garden',
    description:
      'Standard textbook for senior AI electives. Contains handwritten margin notes clarifying Bayesian probability theorems and EM algorithm math derivations.',
    imageUrl: '/images/resources/res-4.jpg',
    availableUntil: '2026-06-15',
  },
  {
    id: '33333333-3333-4333-8333-333333333305',
    departureId: '22222222-2222-4222-8222-222222222205',
    sellerId: '11111111-1111-4111-8111-111111111105',
    title: 'Lehninger Principles of Biochemistry (7th Edition)',
    category: 'Textbook',
    courseCode: 'BT202',
    courseName: 'Biochemistry & Molecular Bio',
    department: 'Biotechnology',
    editionDetails: '7th Macmillan Edition (Color Plates intact with tabs)',
    condition: 'Annotated with Exam Notes',
    fairPrice: 480,
    originalPrice: 1550,
    notesIncluded: true,
    pickupLocation: 'Life Sciences Building, Ground Floor',
    description:
      'Crisp diagrams with highlighted pathways (Krebs, Glycolysis, ATP synthesis). Multiple color tabs indexing mid-term chapters. Includes formula review sheet.',
    imageUrl: '/images/resources/res-5.jpg',
    availableUntil: '2026-05-28',
  },
  {
    id: '33333333-3333-4333-8333-333333333306',
    departureId: '22222222-2222-4222-8222-222222222206',
    sellerId: '11111111-1111-4111-8111-111111111106',
    title: 'Adjustable LED Dorm Desk Lamp + Study Setup',
    category: 'Hostel Essentials',
    courseCode: 'GENERAL',
    courseName: 'Late-Night Study Essentials',
    department: 'Hostel Life',
    editionDetails: 'Classic Architect Swing-Arm Desk Lamp',
    condition: 'Like New',
    fairPrice: 299,
    originalPrice: 899,
    notesIncluded: false,
    pickupLocation: 'East Gate Student Mansion',
    description:
      'Warm light metal swing-arm LED lamp with clamp and heavy base. Keeps roommate asleep while you pull night-outs during exam week.',
    imageUrl: '/images/resources/res-6.jpg',
    availableUntil: '2026-05-10',
  },
];

async function seed(): Promise<void> {
  console.log('[Seed] Seeding CampusConnect database (idempotent)...');

  await withTransaction(async (client) => {
    for (const u of SEED_USERS) {
      await client.query(
        `INSERT INTO users (id, university_email, full_name, role, department, academic_year, phone_number, avatar_url, verified_student)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, TRUE)
         ON CONFLICT (university_email) DO UPDATE SET
           full_name = EXCLUDED.full_name,
           department = EXCLUDED.department,
           phone_number = EXCLUDED.phone_number,
           avatar_url = EXCLUDED.avatar_url`,
        [u.id, u.email, u.fullName, u.role, u.department, u.academicYear, u.phoneNumber, u.avatarUrl]
      );
    }

    for (const d of SEED_DEPARTURES) {
      await client.query(
        `INSERT INTO senior_departures (id, senior_id, academic_cycle, vacating_date, next_destination, handoff_quote)
         VALUES ($1, $2, 'Academic Year 26-27', $3, $4, $5)
         ON CONFLICT (senior_id, academic_cycle) DO UPDATE SET
           vacating_date = EXCLUDED.vacating_date,
           next_destination = EXCLUDED.next_destination`,
        [d.id, d.seniorId, d.vacatingDate, d.nextDestination, d.handoffQuote]
      );
    }

    for (const r of SEED_RESOURCES) {
      await client.query(
        `INSERT INTO academic_resources (
           id, departure_id, seller_id, title, category, course_code, course_name,
           department, edition_details, condition, fair_price, original_price,
           notes_included, pickup_location, description, image_url, available_until, status
         )
         VALUES (
           $1, $2, $3, $4, $5, $6, $7,
           $8, $9, $10, $11, $12,
           $13, $14, $15, $16, $17, 'Available'
         )
         ON CONFLICT (id) DO NOTHING`,
        [
          r.id,
          r.departureId,
          r.sellerId,
          r.title,
          r.category,
          r.courseCode,
          r.courseName,
          r.department,
          r.editionDetails,
          r.condition,
          r.fairPrice,
          r.originalPrice,
          r.notesIncluded,
          r.pickupLocation,
          r.description,
          r.imageUrl,
          r.availableUntil,
        ]
      );
    }
  });

  console.log(
    `[Seed] Done! Seeded ${SEED_USERS.length} users, ${SEED_DEPARTURES.length} departures, and ${SEED_RESOURCES.length} resources.`
  );
}

seed()
  .catch((err) => {
    console.error('[Seed] Seed failed:', err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await closePool();
  });
