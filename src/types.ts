export type RegionType = 'ward' | 'village';

export interface Region {
  id: string;
  name: string;
  type: RegionType;
  population: number;
  populationIsEstimated: boolean;
  households: number;
  areaSqKm: number;
  scStPercentage: number;
  // Infrastructure gap scores (0 = perfect, 1 = major deficiency)
  gapRoad: number;
  gapWater: number;
  gapPower: number;
  gapSanitation: number;
  gapSafety: number;
  // Dynamic coordinates for the interactive map SVG paths (using a standardized grid)
  pathData: string;
  centerCoords: [number, number]; // [x, y] on SVG grid
}

export type GrievanceCategory = 'Roads' | 'Water' | 'Power' | 'Sanitation' | 'Safety';
export type UrgencyLevel = 'Low' | 'Medium' | 'High' | 'Critical';
export type GrievanceStatus = 'Pending' | 'Under Review' | 'Work Ordered' | 'Completed';

export interface Grievance {
  id: string;
  citizenName: string;
  citizenPhone: string;
  regionId: string;
  title: string;
  description: string;
  originalDescription?: string;
  language: string; // e.g., 'English', 'Hindi', 'Tamil', 'Telugu'
  category: GrievanceCategory;
  urgency: UrgencyLevel;
  status: GrievanceStatus;
  createdAt: string;
  photoUrl?: string; // base64 or custom mock assets
  voiceUrl?: string; // base64 or audio file
  latitude: number;
  longitude: number;
  mpComment?: string;
  mpCommentedAt?: string;
  priorityScore: number;
}

export interface PriorityWeights {
  demographic: number;     // Weight for population density & SC/ST (0 - 100)
  infrastructure: number;  // Weight for existing infrastructure gaps (0 - 100)
  urgency: number;         // Weight for AI/Citizen-identified urgency (0 - 100)
  volume: number;          // Weight for volume of complaints in that region (0 - 100)
}

export interface ThemeCluster {
  id: string;
  title: string;
  category: GrievanceCategory;
  summary: string;
  grievanceIds: string[];
  priorityScore: number;
  status: 'Open' | 'Action Taken' | 'Resolved';
}

export interface SystemStats {
  totalSubmissions: number;
  pendingCount: number;
  underReviewCount: number;
  workOrderedCount: number;
  completedCount: number;
  averagePriorityScore: number;
}

export interface ProposedProject {
  id: string;
  title: string;
  regionId: string;
  category: GrievanceCategory;
  estimatedCost: number; // in Lakhs (100,000s) INR
  description: string;
  demographicContext: {
    label1: string;
    value1: string;
    label2: string;
    value2: string;
  };
  baseMetrics: {
    demographicImpact: number; // 0-100 base score
    infrastructureGap: number; // 0-100 base score
    urgencyHazard: number;     // 0-100 base score
    demandVolume: number;      // 0-100 base score
  };
  status: 'Draft' | 'Approved' | 'Rejected';
  fundedAmount?: number;
}

