import { Region, Grievance, PriorityWeights, ThemeCluster } from '../types';

export const INITIAL_REGIONS: Region[] = [
  {
    id: 'ward-1',
    name: 'Ward 1 - Kailash Puram',
    type: 'ward',
    population: 24500,
    populationIsEstimated: true, // Show "Estimated Pop" badge because Census is estimated proportional
    households: 4900,
    areaSqKm: 2.1,
    scStPercentage: 18.5,
    gapRoad: 0.35,
    gapWater: 0.40,
    gapPower: 0.20,
    gapSanitation: 0.55,
    gapSafety: 0.30,
    pathData: 'M 50 50 L 250 50 L 250 180 L 150 250 L 50 180 Z',
    centerCoords: [150, 120]
  },
  {
    id: 'ward-2',
    name: 'Ward 2 - Subhash Nagar',
    type: 'ward',
    population: 31200,
    populationIsEstimated: false,
    households: 6240,
    areaSqKm: 1.8,
    scStPercentage: 12.2,
    gapRoad: 0.20,
    gapWater: 0.15,
    gapPower: 0.10,
    gapSanitation: 0.35,
    gapSafety: 0.45,
    pathData: 'M 250 50 L 450 50 L 400 180 L 250 180 Z',
    centerCoords: [340, 110]
  },
  {
    id: 'ward-3',
    name: 'Ward 3 - Shastri Nagar',
    type: 'ward',
    population: 18400,
    populationIsEstimated: true,
    households: 3680,
    areaSqKm: 1.5,
    scStPercentage: 8.4,
    gapRoad: 0.15,
    gapWater: 0.25,
    gapPower: 0.15,
    gapSanitation: 0.20,
    gapSafety: 0.15,
    pathData: 'M 50 180 L 150 250 L 200 450 L 50 450 Z',
    centerCoords: [120, 320]
  },
  {
    id: 'ward-4',
    name: 'Ward 4 - Dr. Ambedkar Nagar (Slum Sector)',
    type: 'ward',
    population: 42000,
    populationIsEstimated: true,
    households: 8400,
    areaSqKm: 1.2,
    scStPercentage: 46.8, // High SC/ST concentration
    gapRoad: 0.70, // Severe road issues
    gapWater: 0.85, // Extreme water gap
    gapPower: 0.45,
    gapSanitation: 0.90, // Extreme sanitation/sewer gaps
    gapSafety: 0.60,
    pathData: 'M 150 250 L 250 180 L 400 180 L 350 320 L 200 450 Z',
    centerCoords: [265, 290]
  },
  {
    id: 'village-1',
    name: 'Rampur Village',
    type: 'village',
    population: 5800,
    populationIsEstimated: false,
    households: 1160,
    areaSqKm: 8.4,
    scStPercentage: 28.2,
    gapRoad: 0.80, // Heavy rural mud road issues
    gapWater: 0.50,
    gapPower: 0.65, // Periodic blackouts
    gapSanitation: 0.40,
    gapSafety: 0.25,
    pathData: 'M 450 50 L 750 50 L 750 200 L 550 200 L 400 180 Z',
    centerCoords: [590, 110]
  },
  {
    id: 'village-2',
    name: 'Gopalpur Village',
    type: 'village',
    population: 4200,
    populationIsEstimated: false,
    households: 840,
    areaSqKm: 6.2,
    scStPercentage: 35.1,
    gapRoad: 0.55,
    gapWater: 0.60,
    gapPower: 0.85, // Severe electricity deficiency (8-hour load shedding)
    gapSanitation: 0.30,
    gapSafety: 0.35,
    pathData: 'M 550 200 L 750 200 L 750 350 L 500 350 L 480 270 Z',
    centerCoords: [630, 270]
  },
  {
    id: 'village-3',
    name: 'Bhola Khera Village',
    type: 'village',
    population: 7100,
    populationIsEstimated: false,
    households: 1420,
    areaSqKm: 9.1,
    scStPercentage: 22.4,
    gapRoad: 0.60,
    gapWater: 0.75, // Lack of piped drinking water (depends on hand pumps)
    gapPower: 0.40,
    gapSanitation: 0.50,
    gapSafety: 0.30,
    pathData: 'M 400 180 L 550 200 L 480 270 L 500 350 L 350 320 Z',
    centerCoords: [450, 260]
  },
  {
    id: 'village-4',
    name: 'Adarsh Gram (Highway Sector)',
    type: 'village',
    population: 8900,
    populationIsEstimated: false,
    households: 1780,
    areaSqKm: 11.5,
    scStPercentage: 15.6,
    gapRoad: 0.30,
    gapWater: 0.35,
    gapPower: 0.30,
    gapSanitation: 0.45,
    gapSafety: 0.75, // Highway safety & dark street issues are high
    pathData: 'M 200 450 L 350 320 L 500 350 L 750 350 L 750 450 L 200 450 Z',
    centerCoords: [480, 410]
  }
];

export const INITIAL_WEIGHTS: PriorityWeights = {
  demographic: 30,     // 30% weight for population density & vulnerable SC/ST percentages
  infrastructure: 40,  // 40% weight for existing gap scores
  urgency: 20,         // 20% weight for complaint intensity / safety threat
  volume: 10           // 10% weight for raw count of citizen complaints
};

export const INITIAL_GRIEVANCES: Grievance[] = [
  {
    id: 'CV-1001',
    citizenName: 'Rajesh Kumar',
    citizenPhone: '+91 98765 43210',
    regionId: 'ward-4',
    title: 'Severe Sewage Overflow & Clogged Drains',
    description: 'During every light rain, the main sewer lines on Street 4 in Ambedkar Nagar overflow completely, flooding our homes with sewage water. Children are falling sick with cholera and dengue. Immediate municipal cleanup is required.',
    language: 'English',
    category: 'Sanitation',
    urgency: 'Critical',
    status: 'Pending',
    createdAt: '2026-07-02T10:15:00Z',
    latitude: 28.6139,
    longitude: 77.2090,
    priorityScore: 0
  },
  {
    id: 'CV-1002',
    citizenName: 'Sunita Devi',
    citizenPhone: '+91 91234 56789',
    regionId: 'ward-4',
    title: 'No Drinking Water Supply for 4 Days',
    description: 'मुख्य पेयजल पाइपलाइन फट गई है। आंबेडकर नगर के सेक्टर-3 में पिछले ४ दिनों से एक बूंद पानी नहीं आया है। हमें टैंकरों से महंगा पानी खरीदना पड़ रहा है। गरीब लोग तरस रहे हैं।',
    originalDescription: 'The main drinking water pipeline has burst. There has not been a drop of water in Sector-3 of Ambedkar Nagar for the last 4 days. We are having to buy expensive water from tankers. The poor are suffering.',
    language: 'Hindi',
    category: 'Water',
    urgency: 'Critical',
    status: 'Under Review',
    createdAt: '2026-07-01T08:30:00Z',
    latitude: 28.6142,
    longitude: 77.2095,
    mpComment: 'Contacted Executive Engineer of Jal Board. Checking pipeline damage.',
    mpCommentedAt: '2026-07-03T11:00:00Z',
    priorityScore: 0
  },
  {
    id: 'CV-1003',
    citizenName: 'M. Kartikeyan',
    citizenPhone: '+91 88990 12345',
    regionId: 'village-1',
    title: 'Broken Mud Road Connecting Main Highway',
    description: 'ராம்பூர் கிராமத்தை நெடுஞ்சாலையுடன் இணைக்கும் சாலை முற்றிலும் சேதமடைந்துள்ளது. மழைக்காலத்தில் சேறும் சகதியுமாக மாறி ஆம்புலன்ஸ் கூட உள்ளே வர முடிவதில்லை. கடந்த வாரம் ஒரு கர்ப்பிணி பெண் மிகுந்த சிரமப்பட்டார்.',
    originalDescription: 'The road connecting Rampur village with the highway is completely damaged. In the rainy season, it turns into mud and slush; even ambulances cannot enter. Last week a pregnant woman suffered heavily.',
    language: 'Tamil',
    category: 'Roads',
    urgency: 'High',
    status: 'Pending',
    createdAt: '2026-06-30T14:45:00Z',
    latitude: 28.6210,
    longitude: 77.2340,
    priorityScore: 0
  },
  {
    id: 'CV-1004',
    citizenName: 'Ravi Teja',
    citizenPhone: '+91 77665 54433',
    regionId: 'village-2',
    title: '12-Hour Load Shedding - Board Exam Students Suffering',
    description: 'గోపాలపూర్ గ్రామంలో రోజుకు 12 గంటల కంటే ఎక్కువ కరెంట్ కోతలు విధిస్తున్నారు. పిల్లల బోర్డు పరీక్షల సమయంలో చదువుకోవడానికి కరెంట్ లేక చాలా ఇబ్బంది పడుతున్నారు. పంట పొలాలకు బోర్ మోటార్లు నడవడం లేదు.',
    originalDescription: 'Power cuts are being imposed for more than 12 hours a day in Gopalpur village. Children are facing immense hardship studying for board exams with no electricity. Agri pump bore motors are not running.',
    language: 'Telugu',
    category: 'Power',
    urgency: 'High',
    status: 'Work Ordered',
    createdAt: '2026-06-29T11:20:00Z',
    latitude: 28.6300,
    longitude: 77.2500,
    mpComment: 'Sanctioned Transformer Upgrade for Gopalpur Village Substation. Work order given to Electricity Dept.',
    mpCommentedAt: '2026-07-02T16:00:00Z',
    priorityScore: 0
  },
  {
    id: 'CV-1005',
    citizenName: 'Priya Sharma',
    citizenPhone: '+91 99887 76655',
    regionId: 'village-4',
    title: 'Dark Highway Junction - High Accidental Zone',
    description: 'The junction near Adarsh Gram on the National Highway has zero streetlights. In the last two months, there have been 5 major accidents at night. Women feel completely unsafe boarding buses here after dark.',
    language: 'English',
    category: 'Safety',
    urgency: 'High',
    status: 'Pending',
    createdAt: '2026-07-03T19:10:00Z',
    latitude: 28.6050,
    longitude: 77.1980,
    priorityScore: 0
  },
  {
    id: 'CV-1006',
    citizenName: 'Amit Singh',
    citizenPhone: '+91 93215 45678',
    regionId: 'village-3',
    title: 'Water Contamination - Rust and Silt in Handpumps',
    description: 'भोला खेड़ा गांव में जो ३ प्रमुख हैंडपंप हैं उनसे जंग लगा पीला पानी आ रहा है। पीने के पानी का कोई अन्य साधन नहीं है। पूरे गांव में पेट दर्द की शिकायतें बढ़ रही हैं। पानी की तुरंत जांच होनी चाहिए।',
    originalDescription: 'The 3 primary handpumps in Bhola Khera village are dispensing rusty yellow water. There is no other drinking water source. Stomach pain complaints are rising. Urgent testing is required.',
    language: 'Hindi',
    category: 'Water',
    urgency: 'High',
    status: 'Under Review',
    createdAt: '2026-07-02T16:05:00Z',
    latitude: 28.6180,
    longitude: 77.2180,
    priorityScore: 0
  },
  {
    id: 'CV-1007',
    citizenName: 'Arjun Gowda',
    citizenPhone: '+91 98450 11223',
    regionId: 'ward-2',
    title: 'Garbage Dumping Ground Near Primary School',
    description: 'Municipal garbage trucks are dumping city waste right adjacent to the government primary school in Subhash Nagar. The stench is unbearable, and flies are swarming into the classrooms. School attendance has dropped by 40%.',
    language: 'English',
    category: 'Sanitation',
    urgency: 'High',
    status: 'Completed',
    createdAt: '2026-06-25T09:00:00Z',
    latitude: 28.6120,
    longitude: 77.2050,
    mpComment: 'Cleaned and fenced the site. Directed Municipal Council to move the garbage dumping yard 4km away.',
    mpCommentedAt: '2026-06-28T14:30:00Z',
    priorityScore: 0
  },
  {
    id: 'CV-1008',
    citizenName: 'Meera Deshmukh',
    citizenPhone: '+91 98231 22334',
    regionId: 'ward-1',
    title: 'Broken Streetlights and Unsafe Walking Paths',
    description: 'Streetlights on Kailash Puram main market lane are broken for over a month. After 8 PM, the road is pitch dark. Multiple instances of chain snatching and harassment have been reported recently.',
    language: 'English',
    category: 'Safety',
    urgency: 'Medium',
    status: 'Pending',
    createdAt: '2026-07-03T21:40:00Z',
    latitude: 28.6160,
    longitude: 77.2010,
    priorityScore: 0
  }
];

export const INITIAL_CLUSTERS: ThemeCluster[] = [
  {
    id: 'cluster-1',
    title: 'Sewage and Sewer Clogging in Ward 4',
    category: 'Sanitation',
    summary: 'Water logging and open sewage flow due to damaged drain conduits causing massive sanitation challenges and public health threats in high density Ambedkar Nagar.',
    grievanceIds: ['CV-1001'],
    priorityScore: 82.5,
    status: 'Open'
  },
  {
    id: 'cluster-2',
    title: 'Constituency Water Access Outages',
    category: 'Water',
    summary: 'Lack of piped water systems and pipe burst damage requiring emergency Jal Board repair or tanker distribution services in Ward 4 and Bhola Khera village.',
    grievanceIds: ['CV-1002', 'CV-1006'],
    priorityScore: 78.4,
    status: 'Open'
  },
  {
    id: 'cluster-3',
    title: 'Rural Road and Connectivity Deficiencies',
    category: 'Roads',
    summary: 'Damaged mud roads and lack of asphalt linking villages to national highways, blocking ambulances and critical supply deliveries during monsoons.',
    grievanceIds: ['CV-1003'],
    priorityScore: 68.2,
    status: 'Open'
  },
  {
    id: 'cluster-4',
    title: 'Rural Electricity Outages & Transformer Gaps',
    category: 'Power',
    summary: 'Severe load shedding issues and transformer burning in Gopalpur Rural areas affecting irrigation and student board examination study schedules.',
    grievanceIds: ['CV-1004'],
    priorityScore: 59.8,
    status: 'Action Taken'
  },
  {
    id: 'cluster-5',
    title: 'Public Streetlight & Junction Security Risks',
    category: 'Safety',
    summary: 'Unlit highway junctions and market lanes triggering chain snatching, women safety hazards, and recurring vehicle collisions.',
    grievanceIds: ['CV-1005', 'CV-1008'],
    priorityScore: 52.1,
    status: 'Open'
  }
];

// Dynamically compute the priority score for a region based on active weights
export function calculateRegionScore(
  region: Region,
  grievances: Grievance[],
  weights: PriorityWeights
): number {
  // 1. Demographic Score (S_d)
  // Density: max pop is ward-4 (~42000) over 1.2 sq km = 35,000 / sq km.
  // Rampur rural is 5800 / 8.4 = 690 / sq km.
  // Density score = population / area / 10000 (cap at 1.0)
  const density = region.population / region.areaSqKm;
  const densityScore = Math.min(1.0, density / 25000);
  const scStScore = region.scStPercentage / 100;
  // Combine density (60%) and SC/ST vulnerable population percentage (40%)
  const demographicScore = (densityScore * 0.6) + (scStScore * 0.4);

  // 2. Infrastructure Gap Score (S_i)
  const infrastructureScore = (
    region.gapRoad +
    region.gapWater +
    region.gapPower +
    region.gapSanitation +
    region.gapSafety
  ) / 5;

  // 3. Urgency Score (S_u)
  // Get grievances in this region
  const regionGrievances = grievances.filter(g => g.regionId === region.id && g.status !== 'Completed');
  let urgencyScore = 0;
  if (regionGrievances.length > 0) {
    const urgencySum = regionGrievances.reduce((acc, g) => {
      if (g.urgency === 'Critical') return acc + 1.0;
      if (g.urgency === 'High') return acc + 0.75;
      if (g.urgency === 'Medium') return acc + 0.50;
      return acc + 0.25; // Low
    }, 0);
    urgencyScore = urgencySum / regionGrievances.length;
  } else {
    // If no active complaints, fallback to a low base
    urgencyScore = 0.1;
  }

  // 4. Volume Score (S_v)
  // Logarithmic-like scaling to prevent super-dense regions from dominating infinitely
  // let's use active complaints / 10 capped at 1.0
  const volumeScore = Math.min(1.0, regionGrievances.length / 5);

  // Sum of weights
  const totalWeight = weights.demographic + weights.infrastructure + weights.urgency + weights.volume;
  if (totalWeight === 0) return 0;

  // Final priority score (0 - 100)
  const weightedSum = (
    (demographicScore * weights.demographic) +
    (infrastructureScore * weights.infrastructure) +
    (urgencyScore * weights.urgency) +
    (volumeScore * weights.volume)
  );

  return Math.round((weightedSum / totalWeight) * 100);
}

// Dynamically compute the priority score for an individual grievance based on weights
export function calculateGrievanceScore(
  grievance: Grievance,
  region: Region,
  weights: PriorityWeights
): number {
  if (grievance.status === 'Completed') return 0;

  // 1. Demographic (S_d)
  const density = region.population / region.areaSqKm;
  const densityScore = Math.min(1.0, density / 25000);
  const scStScore = region.scStPercentage / 100;
  const demographicScore = (densityScore * 0.6) + (scStScore * 0.4);

  // 2. Infrastructure Gap (S_i) - pick the specific gap category
  let specificGap = 0.2;
  if (grievance.category === 'Roads') specificGap = region.gapRoad;
  else if (grievance.category === 'Water') specificGap = region.gapWater;
  else if (grievance.category === 'Power') specificGap = region.gapPower;
  else if (grievance.category === 'Sanitation') specificGap = region.gapSanitation;
  else if (grievance.category === 'Safety') specificGap = region.gapSafety;

  // 3. Urgency (S_u)
  let urgencyScore = 0.25;
  if (grievance.urgency === 'Critical') urgencyScore = 1.0;
  else if (grievance.urgency === 'High') urgencyScore = 0.75;
  else if (grievance.urgency === 'Medium') urgencyScore = 0.50;

  // 4. Volume (S_v)
  // For individual grievances, volume can represent a baseline of 1.0
  const volumeScore = 1.0;

  const totalWeight = weights.demographic + weights.infrastructure + weights.urgency + weights.volume;
  if (totalWeight === 0) return 0;

  const weightedSum = (
    (demographicScore * weights.demographic) +
    (specificGap * weights.infrastructure) +
    (urgencyScore * weights.urgency) +
    (volumeScore * weights.volume)
  );

  return Math.round((weightedSum / totalWeight) * 100);
}

export const INITIAL_PROPOSALS: ProposedProject[] = [
  {
    id: 'PROP-101',
    title: 'Rampur Secondary School Upgrade & Mud Road Paving',
    regionId: 'village-1',
    category: 'Roads',
    estimatedCost: 45, // in Lakhs
    description: 'Upgrades the dilapidated Rampur school facility, builds 2 additional smart labs, and fully asphalts the broken mud road connecting the village to the national highway to ensure safe, year-round access for student transports and emergency vehicles.',
    demographicContext: {
      label1: 'School Enrollment',
      value1: '410 active children',
      label2: 'Travel Distance Gap',
      value2: '8.2 km average (No bus service, mud paths flood in monsoon)'
    },
    baseMetrics: {
      demographicImpact: 65,
      infrastructureGap: 80,
      urgencyHazard: 70,
      demandVolume: 50
    },
    status: 'Draft'
  },
  {
    id: 'PROP-102',
    title: 'Subhash Nagar Central Vocational Training Centre',
    regionId: 'ward-2',
    category: 'Power',
    estimatedCost: 60, // in Lakhs
    description: 'Establishes a centralized skills development center equipped with modern solar power backups and computers to train young adults in high-demand technical trades, digital literacy, and retail services to combat local youth unemployment.',
    demographicContext: {
      label1: 'Youth Unemployment',
      value1: '18.5% of age group 18-30',
      label2: 'Nearest Hub Distance',
      value2: '14.0 km away (Exorbitant travel expenses for low-income families)'
    },
    baseMetrics: {
      demographicImpact: 45,
      infrastructureGap: 35,
      urgencyHazard: 40,
      demandVolume: 60
    },
    status: 'Draft'
  },
  {
    id: 'PROP-103',
    title: 'Dr. Ambedkar Nagar Clean Water Network & Sewer Mains',
    regionId: 'ward-4',
    category: 'Water',
    estimatedCost: 55, // in Lakhs
    description: 'Installs a high-capacity solar-powered water filtration borewell system paired with heavy-duty concrete box-sewer conduits to entirely redirect street overflow and provide continuous safe, piped drinking water directly to families.',
    demographicContext: {
      label1: 'SC/ST Concentration',
      value1: '46.8% (Vulnerable demographic pocket in Slum Sector)',
      label2: 'Waterborne Infections',
      value2: '24 diagnosed cholera/typhoid cases in the neighborhood this month'
    },
    baseMetrics: {
      demographicImpact: 95,
      infrastructureGap: 90,
      urgencyHazard: 85,
      demandVolume: 90
    },
    status: 'Draft'
  },
  {
    id: 'PROP-104',
    title: 'Adarsh Gram Highway Junction Solar Streetlight Grid',
    regionId: 'village-4',
    category: 'Safety',
    estimatedCost: 15, // in Lakhs
    description: 'Constructs a smart solar-powered high-intensity streetlighting grid along a 1.8km pitch-dark rural stretch of the highway junction, safeguarding women boarding evening transit and resolving severe black-spot vehicle collisions.',
    demographicContext: {
      label1: 'Fatal Highway Collisions',
      value1: '5 major accidents recorded over past 2 months',
      label2: 'Streetlight Coverage',
      value2: '0% operational lighting at transit intersection after 7 PM'
    },
    baseMetrics: {
      demographicImpact: 50,
      infrastructureGap: 75,
      urgencyHazard: 95,
      demandVolume: 70
    },
    status: 'Draft'
  }
];

export function calculateProposalScore(
  baseMetrics: ProposedProject['baseMetrics'],
  weights: PriorityWeights
): number {
  const totalWeight = weights.demographic + weights.infrastructure + weights.urgency + weights.volume;
  if (totalWeight === 0) return 0;

  const weightedSum = (
    (baseMetrics.demographicImpact * weights.demographic) +
    (baseMetrics.infrastructureGap * weights.infrastructure) +
    (baseMetrics.urgencyHazard * weights.urgency) +
    (baseMetrics.demandVolume * weights.volume)
  );

  return Math.round(weightedSum / totalWeight);
}
import { ProposedProject } from '../types';

