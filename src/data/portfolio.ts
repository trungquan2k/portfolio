export type HotspotKind =
  | 'about'
  | 'experience'
  | 'skill'
  | 'project'
  | 'contact'

export interface Hotspot {
  id: string
  kind: HotspotKind
  label: string
  title: string
  subtitle: string
  /** Short lead paragraph */
  body: string
  /** Full bullet details from source portfolio */
  bullets?: string[]
  tags: string[]
  link?: string
  linkLabel?: string
  /** Spherical position: theta (around Y), phi (from equator), radius */
  theta: number
  phi: number
  radius: number
  accent: string
}

export const identity = {
  brand: 'IAMQUAN',
  name: 'Hoang Trung Quan',
  role: 'Mobile Developer',
  tagline:
    'Passionate about creating beautiful and functional digital experiences with 4+ years of expertise in mobile application.',
  location: 'Ho Chi Minh City · Vietnam',
  email: 'qhoang.devvietnam@gmail.com',
  phone: '(+84) 355 739 816',
  phoneHref: 'tel:+84355739816',
  github: 'https://github.com/trungquan2k',
  linkedin: 'https://www.linkedin.com/in/hoang-trung-quan-434a002b5/',
  zalo: 'https://zalo.me/0355739816',
  cv: '/assets/pdf/[Mobile Engineering]_HoangTrungQuan.pdf',
  stats: [
    { key: 'Years of experience', value: '4+' },
    { key: 'Projects completed', value: '5+' },
    { key: 'Technologies mastered', value: '5+' },
  ],
}

/**
 * Fibonacci sphere → even spacing so labels/nodes don’t cluster.
 * Slight radius bands keep depth without overlapping.
 */
function pos(i: number, total: number, radius = 4.65): Pick<Hotspot, 'theta' | 'phi' | 'radius'> {
  const t = i + 0.5
  const y = 1 - (t / total) * 2 // -1..1
  const phi = Math.asin(THREE_CLAMP(y, -0.92, 0.92))
  const theta = Math.PI * (1 + Math.sqrt(5)) * t
  const band = 4.35 + (i % 4) * 0.22
  return { theta, phi, radius: Math.max(radius, band) }
}

function THREE_CLAMP(v: number, min: number, max: number) {
  return Math.min(max, Math.max(min, v))
}

const N = 20

export const hotspots: Hotspot[] = [
  {
    id: 'about',
    kind: 'about',
    label: 'ABOUT',
    title: 'Hoang Trung Quan',
    subtitle: 'Mobile Developer · Flutter · Android · React Native',
    body: 'I’m a passionate software developer with expertise in mobile and web development. With 4+ years of experience, I’ve worked on various projects ranging from enterprise applications to innovative startups. I specialize in creating user-centric solutions that combine beautiful design with efficient functionality.',
    bullets: [
      'My journey in technology has equipped me with a deep understanding of different platforms and frameworks, allowing me to choose the right tools for each unique project requirement.',
      'Years of experience: 4+',
      'Projects completed: 5+',
      'Technologies mastered: 5+',
      'CV: [Mobile Engineering]_HoangTrungQuan.pdf',
    ],
    tags: ['Flutter', 'Android', 'React Native', 'IAMQUAN'],
    link: '/assets/pdf/[Mobile Engineering]_HoangTrungQuan.pdf',
    linkLabel: 'Download CV',
    ...pos(0, N, 4.2),
    accent: '#2EE6A6',
  },

  // —— Experiences (full from experiences.json) ——
  {
    id: 'exp-sparkminds',
    kind: 'experience',
    label: 'SPARKMINDS',
    title: 'Software Engineer (Flutter/React Native/React/Java)',
    subtitle: 'SparkMinds Company · Full-time · Aug 2023 – Now',
    body: 'Fintech: Money transfers & banking solutions · Social: E-commerce & Social networking platforms',
    bullets: [
      'Leveraged AI-assisted tools to accelerate development, debugging, technical research, and repetitive engineering tasks across projects.',
      'Reduced third-party dependency and operational costs by 5% by implementing an internal deep-linking solution.',
      'Delivered 4+ mobile products end-to-end, from requirements analysis and development to production launch, maintenance, and continuous improvement.',
      'Managed and prioritized multiple features and development tasks in parallel, coordinating implementation, debugging, testing, and releases across Mobile, Web, and Backend.',
      'Built and maintained mobile features across Android and iOS, covering UI/UX, state management, API integration, local storage, authentication, deep linking, push notifications, and real-time communication.',
      'Diagnosed and resolved complex issues involving performance, networking, lifecycle, memory, native integrations, build configurations, APIs, and production crashes.',
      'Mentored team members through technical guidance and code reviews, promoting coding best practices and maintainable solutions.',
    ],
    tags: [
      'Flutter',
      'React Native',
      'ReactJS',
      'Java (Spring Boot)',
      'Kotlin',
      'Next.js',
    ],
    link: 'https://moneyspace.net/',
    linkLabel: 'View Live',
    ...pos(1, N, 4.7),
    accent: '#40C4FF',
  },
  {
    id: 'exp-voyager',
    kind: 'experience',
    label: 'VOYAGER',
    title: 'Flutter & Android Engineer',
    subtitle: 'Voyager Inc. · Part-time · May 2023 – Aug 2023',
    body: 'Domain: IoT solution — cross-platform control of IoT devices with native Android bridges.',
    bullets: [
      'Developed a cross-platform mobile application with Flutter for seamless interaction and control of IoT devices.',
      'Integrated native Android (Kotlin) capabilities through Flutter Platform Channels to enable real-time video communication between mobile devices and IoT hardware.',
      'Implemented offline-first data synchronization between server and local storage, ensuring reliable application functionality without an active internet connection.',
      'Built real-time occupancy monitoring and dynamic data visualization using IoT sensor data, Socket.IO, and stream-based updates, enabling users to monitor device status and occupancy in real time.',
      'Implemented NFC-based authentication using chip-enabled cards for secure and convenient user access.',
      'Integrated GraphQL for efficient device communication, data querying, and real-time application workflows.',
      'Optimized mobile-to-device communication and data handling to ensure responsive and reliable operation across varying network conditions.',
    ],
    tags: ['Flutter', 'Kotlin', 'IoT', 'NFC', 'GraphQL', 'Socket.IO'],
    link: 'https://appadvice.com/app/9dots/6468874478',
    linkLabel: 'View Live',
    ...pos(2, N, 4.5),
    accent: '#61DAFB',
  },
  {
    id: 'exp-greenagri',
    kind: 'experience',
    label: 'GREENAGRI',
    title: 'Mobile Engineer',
    subtitle: 'GreenAgri Inc. · Full-time · Aug 2022 – May 2023',
    body: 'Domains: Collection data, equipment management, farm crops · E-commerce',
    bullets: [
      'Designed and managed app state using GetX for lightweight UI interaction and Bloc/Cubit for modular business logic control.',
      'Integrated Firebase Cloud Messaging to support real-time push notifications, background handling, and platform-specific permission flows.',
      'Deployed applications to Google Play Store and Apple App Store, managing signing, CI/CD pipelines, and store submission processes.',
      'Worked closely with internal teams to develop, test, and optimize key features in a cross-platform IoT application.',
    ],
    tags: ['Flutter', 'GetX', 'Bloc/Cubit', 'Firebase', 'CI/CD'],
    link: 'https://greencheck.vn/',
    linkLabel: 'View Live',
    ...pos(3, N, 4.6),
    accent: '#F4D35E',
  },
  {
    id: 'exp-cbtw',
    kind: 'experience',
    label: 'CBTW',
    title: 'Full-stack internship',
    subtitle: 'CBTW (Collaboration Betters The World) · Full-time · Apr 2022 – Aug 2022',
    body: 'Domains: Traveling · Javascript Foundation — Viator travel web project. Formerly Positive Thinking Company, now CBTW.',
    bullets: [
      'Completed a 2-month programming internship, gaining foundational experience in software development.',
      'Participated in the Viator travel web project as a Full-stack Developer for 3 months, contributing to both frontend and backend features.',
      'Worked with modern web technologies including Redux, TypeScript (frontend), and Java (backend).',
      'Followed the Agile Scrum methodology, attending daily standups, sprint planning, and regular reviews.',
    ],
    tags: ['Javascript', 'Java', 'TypeScript', 'Redux', 'Agile'],
    link: 'https://www.viator.com/',
    linkLabel: 'View Live',
    ...pos(4, N, 4.8),
    accent: '#E8A87C',
  },
  {
    id: 'exp-atoma',
    kind: 'experience',
    label: 'ATOMA',
    title: 'Software Engineering Intern (Full-Stack & Mobile)',
    subtitle: 'Atoma Company · Full-time · Jul 2021 – Sep 2021',
    body: 'Domains: Practice personal project · HR management project',
    bullets: [
      'Completed a 2-month internship focused on building a Flutter mobile application with user authentication and CRUD operations.',
      'Designed and implemented a demo product to manage user accounts, including login, authentication, and user CRUD features.',
      'Studied and applied Vue.js to build a responsive admin dashboard for HR managers with full CRUD capabilities.',
      'Created RESTful APIs and database schema using the Laravel framework to support the frontend systems.',
    ],
    tags: ['Flutter', 'Vue.js', 'Laravel'],
    link: 'https://github.com/trungquan2k/HR-MANAGERMENT',
    linkLabel: 'Source Code',
    ...pos(5, N, 4.9),
    accent: '#FF6B9D',
  },

  // —— Technical skills (technologies.json) ——
  {
    id: 'skill-flutter',
    kind: 'skill',
    label: 'FLUTTER',
    title: 'Flutter',
    subtitle: 'Technical skill · Cross-platform mobile',
    body: 'Cross-platform mobile development framework by Google.',
    bullets: [
      'UI/UX, state management (GetX, Bloc/Cubit), API integration, local storage.',
      'Authentication, deep linking, push notifications, real-time communication.',
      'Production apps on Android and iOS — used across SparkMinds, Voyager, GreenAgri.',
    ],
    tags: ['Dart', 'Bloc', 'GetX', 'CORE TECH'],
    ...pos(6, N, 4.4),
    accent: '#40C4FF',
  },
  {
    id: 'skill-rn',
    kind: 'skill',
    label: 'REACT NATIVE',
    title: 'React Native',
    subtitle: 'Technical skill · Cross-platform mobile',
    body: 'Cross-platform mobile development framework by Facebook.',
    bullets: [
      'Typed modules, navigation, API layers alongside Flutter delivery.',
      'Shared product work with React / Next.js when web is in scope.',
    ],
    tags: ['TypeScript', 'React', 'Expo', 'CORE TECH'],
    ...pos(7, N, 4.5),
    accent: '#61DAFB',
  },
  {
    id: 'skill-kotlin',
    kind: 'skill',
    label: 'KOTLIN',
    title: 'Kotlin Compose',
    subtitle: 'Technical skill · Modern Android UI',
    body: 'Modern UI toolkit for Android development.',
    bullets: [
      'Jetpack Compose for native Android UI.',
      'Flutter Platform Channels for real-time video with IoT hardware.',
      'NFC-based authentication and deep Android integrations.',
    ],
    tags: ['Compose', 'Platform Channels', 'NFC', 'CORE TECH'],
    ...pos(8, N, 4.6),
    accent: '#E8A87C',
  },
  {
    id: 'skill-js',
    kind: 'skill',
    label: 'JAVASCRIPT',
    title: 'Javascript',
    subtitle: 'Technical skill · Web development',
    body: 'Programming language for web development.',
    bullets: [
      'React, Next.js, Redux, TypeScript on frontend projects.',
      'Used with Java (Spring Boot) backend on fintech and travel products.',
    ],
    tags: ['JavaScript', 'TypeScript', 'React', 'Next.js', 'CORE TECH'],
    ...pos(9, N, 4.7),
    accent: '#F4D35E',
  },
  {
    id: 'skill-mysql',
    kind: 'skill',
    label: 'MYSQL',
    title: 'Mysql',
    subtitle: 'Technical skill · Relational database',
    body: 'Relational database management system.',
    bullets: [
      'Schema design and data layer support for mobile/web backends.',
      'Paired with Laravel REST APIs and Spring Boot services.',
    ],
    tags: ['MySQL', 'SQL', 'CORE TECH'],
    ...pos(10, N, 4.5),
    accent: '#5CE1E6',
  },
  {
    id: 'skill-soft',
    kind: 'skill',
    label: 'SOFT SKILLS',
    title: 'Strengths',
    subtitle: 'Team · Logic · Research · Problem solving · IT English',
    body: 'Soft skills from the source portfolio — how I work with people and problems.',
    bullets: [
      'Team working — Collaborating effectively with others.',
      'Logical Thinking — Solving problems using logical reasoning.',
      'Researching — Investigating and gathering information.',
      'Problem solving — Finding solutions to complex issues.',
      'IT English — Communicating effectively in English in a tech context.',
    ],
    tags: ['Team', 'Logic', 'Research', 'Problem solving', 'IT English'],
    ...pos(11, N, 4.8),
    accent: '#FF6B9D',
  },

  // —— Projects (project.json + domain tasks) ——
  {
    id: 'proj-iot',
    kind: 'project',
    label: 'IOT',
    title: 'IOT Solution',
    subtitle: 'Smart home · Flutter + Kotlin',
    body: 'Remote control home appliance control. Check the room’s environmental information with the built-in sensor. Cooperation with Gramo products. Equipped with various functions convenient for daily life.',
    bullets: [
      'Remote control home appliance control',
      'Check the room’s environmental information with the built-in sensor',
      'Cooperation with Gramo products',
      'Various other functions convenient for daily life',
      'Real-time monitoring and status updates of connected devices',
      'Custom scheduling for automated operations and energy savings',
    ],
    tags: ['Flutter', 'Kotlin', 'IoT', 'Sensors'],
    ...pos(12, N, 5.0),
    accent: '#5CE1E6',
  },
  {
    id: 'proj-insida',
    kind: 'project',
    label: 'INSIDA',
    title: 'Social Media',
    subtitle: 'Real estate social · Insida',
    body: 'Insida is a platform that brings together real estate professionals and enthusiasts, creating a space to explore, share, and connect. It features captivating property photos, videos, and virtual tours, making it easier to showcase and discover properties.',
    bullets: [
      'Property photos, videos, and virtual tours',
      'Users can comment, like, and follow favorite listings and agents',
      'Messaging and notification system to keep users updated',
    ],
    tags: ['Social', 'Real Estate', 'Mobile'],
    ...pos(13, N, 4.9),
    accent: '#40C4FF',
  },
  {
    id: 'proj-sparkfix',
    kind: 'project',
    label: 'SPARKFIX',
    title: 'SparkFix',
    subtitle: 'Home services marketplace',
    body: 'SparkFix is a platform that connects qualified handymen with homeowners in need of repair and maintenance services. SparkFix offers multiple authentication options, Google Maps integration for location-based services, secure digital payment, and advanced filtering and sorting.',
    bullets: [
      'Multiple authentication options',
      'Google Maps integration for location-based services',
      'Secure digital payment',
      'Advanced filtering and sorting',
    ],
    tags: ['Flutter', 'Maps', 'Payments', 'Auth'],
    link: 'https://youtu.be/o_8SxoxiLJs?si=4EdgsSYJqwUOZ8t9',
    linkLabel: 'Watch Demo',
    ...pos(14, N, 5.0),
    accent: '#2EE6A6',
  },
  {
    id: 'proj-greencheck',
    kind: 'project',
    label: 'GREEN CHECK',
    title: 'Green Check App',
    subtitle: 'Farm management · Play Store',
    body: 'Farm management software. QR code for traceability. A network system connecting experts for each type of agricultural product.',
    bullets: [
      'Farm management software',
      'QR code for traceability',
      'Network connecting experts per agricultural product',
      'Farmers log planting, fertilizing, and harvesting',
      'Export reports for compliance and certification',
      'Real-time status updates and notifications for job progress',
    ],
    tags: ['Flutter', 'Firebase', 'QR', 'Agri'],
    link: 'https://play.google.com/store/apps/details?id=com.app.greencheck&hl=vi',
    linkLabel: 'Play Store',
    ...pos(15, N, 4.8),
    accent: '#F4D35E',
  },
  {
    id: 'proj-auto',
    kind: 'project',
    label: 'AUTO TRACK',
    title: 'Car Auto Tracking',
    subtitle: 'Repair shop orders & spending',
    body: 'Control orders in auto and motorbike repair shops. Helps window owners make monthly statistics on spending accounts.',
    bullets: [
      'Control orders in auto and motorbike repair shops',
      'Monthly statistics on spending accounts',
      'Track revenue and expenses through charts and summaries',
      'Manage multiple accounts and transactions securely',
    ],
    tags: ['Tracking', 'Orders', 'Analytics'],
    ...pos(16, N, 4.7),
    accent: '#E8A87C',
  },
  {
    id: 'proj-travel',
    kind: 'project',
    label: 'TRAVEL',
    title: 'Traveling',
    subtitle: 'Viator travel web / mobile',
    body: 'Web site for traveling — contributed on the Viator travel product during the CBTW (formerly Positive Thinking Company) internship.',
    bullets: [
      'Travel product features on frontend and backend',
      'Redux + TypeScript frontend, Java backend',
      'Agile Scrum delivery',
    ],
    tags: ['Travel', 'TypeScript', 'Java'],
    link: 'https://play.google.com/store/apps/details?id=com.viator.mobile.android&hl=vi',
    linkLabel: 'Play Store',
    ...pos(17, N, 4.6),
    accent: '#61DAFB',
  },
  {
    id: 'proj-ecommerce',
    kind: 'project',
    label: 'E-COMMERCE',
    title: 'E-commerce',
    subtitle: 'Store sell product · GreenAgri',
    body: 'Application for store sell product. Supports inventory management and product categorization, integrated payment gateways, and customer reviews.',
    bullets: [
      'Application for store sell product',
      'Inventory management and product categorization',
      'Integrated payment gateways for seamless checkout',
      'Customers can leave reviews and ratings for each product',
    ],
    tags: ['E-commerce', 'Payments', 'Flutter'],
    link: 'https://play.google.com/store/apps/details?id=mcom.app.greenagri&hl=vi',
    linkLabel: 'Play Store',
    ...pos(18, N, 4.9),
    accent: '#FF6B9D',
  },

  // —— Contact ——
  {
    id: 'contact',
    kind: 'contact',
    label: 'CONTACT',
    title: "Let's work together",
    subtitle: 'Available for Remote & On-site · Fast response',
    body: "I'm always open to discussing new mobile development opportunities, full-stack projects, technical leadership, or engineering collaboration.",
    bullets: [
      'Email: qhoang.devvietnam@gmail.com',
      'Phone: (+84) 355 739 816',
      'Location: Ho Chi Minh City, Vietnam',
      'LinkedIn: linkedin.com/in/hoang-trung-quan-434a002b5',
      'GitHub: github.com/trungquan2k',
      'Zalo: zalo.me/0355739816',
    ],
    tags: [
      'qhoang.devvietnam@gmail.com',
      '(+84) 355 739 816',
      'GitHub',
      'LinkedIn',
      'Zalo',
    ],
    link: 'mailto:qhoang.devvietnam@gmail.com',
    linkLabel: 'Send Mail',
    ...pos(19, N, 4.3),
    accent: '#E8A87C',
  },
]

/**
 * Semantic graph — career path, exp↔skill/project, hub links.
 * Used by ConnectionLines so the orbit reads as a connected story.
 */
export const connections: [string, string][] = [
  // Career timeline
  ['exp-atoma', 'exp-cbtw'],
  ['exp-cbtw', 'exp-greenagri'],
  ['exp-greenagri', 'exp-voyager'],
  ['exp-voyager', 'exp-sparkminds'],

  // About hub
  ['about', 'exp-sparkminds'],
  ['about', 'exp-voyager'],
  ['about', 'skill-flutter'],
  ['about', 'contact'],
  ['about', 'skill-soft'],

  // Experience ↔ skills / projects
  ['exp-sparkminds', 'skill-flutter'],
  ['exp-sparkminds', 'skill-rn'],
  ['exp-sparkminds', 'skill-js'],
  ['exp-sparkminds', 'proj-sparkfix'],
  ['exp-sparkminds', 'proj-insida'],
  ['exp-voyager', 'skill-kotlin'],
  ['exp-voyager', 'proj-iot'],
  ['exp-greenagri', 'skill-flutter'],
  ['exp-greenagri', 'proj-greencheck'],
  ['exp-greenagri', 'proj-ecommerce'],
  ['exp-cbtw', 'skill-js'],
  ['exp-cbtw', 'proj-travel'],
  ['exp-atoma', 'skill-flutter'],
  ['exp-atoma', 'skill-mysql'],

  // Skill chain
  ['skill-flutter', 'skill-rn'],
  ['skill-rn', 'skill-kotlin'],
  ['skill-kotlin', 'skill-js'],
  ['skill-js', 'skill-mysql'],

  // Projects ↔ skills
  ['proj-iot', 'skill-flutter'],
  ['proj-iot', 'skill-kotlin'],
  ['proj-greencheck', 'skill-flutter'],
  ['proj-ecommerce', 'skill-flutter'],
  ['proj-auto', 'skill-js'],
  ['proj-travel', 'skill-js'],

  // Contact
  ['contact', 'exp-sparkminds'],
  ['contact', 'skill-flutter'],
]

export function relatedIds(id: string): Set<string> {
  const related = new Set<string>()
  for (const [a, b] of connections) {
    if (a === id) related.add(b)
    if (b === id) related.add(a)
  }
  return related
}

export function sphericalToCartesian(
  theta: number,
  phi: number,
  radius: number,
): [number, number, number] {
  const x = radius * Math.cos(phi) * Math.sin(theta)
  const y = radius * Math.sin(phi)
  const z = radius * Math.cos(phi) * Math.cos(theta)
  return [x, y, z]
}
