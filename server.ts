import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { INITIAL_REGIONS, INITIAL_GRIEVANCES, INITIAL_CLUSTERS, INITIAL_WEIGHTS, INITIAL_PROPOSALS, calculateRegionScore, calculateGrievanceScore, calculateProposalScore } from "./src/data/mockData.ts";
import { analyzeGrievanceWithAI, generateAIThemeSummary } from "./src/lib/gemini.ts";
import { Grievance, PriorityWeights, Region, ThemeCluster, ProposedProject } from "./src/types.ts";

const app = express();
const PORT = 3000;

// Body parsing middlewares - support large payloads for photos and audio base64 files
app.use(express.json({ limit: '20mb' }));
app.use(express.urlencoded({ limit: '20mb', extended: true }));

// Server State (in-memory persistent store)
let serverGrievances: Grievance[] = [...INITIAL_GRIEVANCES];
let serverRegions: Region[] = [...INITIAL_REGIONS];
let serverWeights: PriorityWeights = { ...INITIAL_WEIGHTS };
let serverClusters: ThemeCluster[] = [...INITIAL_CLUSTERS];
let serverProposals: ProposedProject[] = [...INITIAL_PROPOSALS];

// Helper to calculate closest region based on latitude & longitude (Spatial coordinate pick resolving)
function findClosestRegion(lat: number, lng: number): string {
  // Approximate centers of our mock regions in Delhi coordinates (around 28.6, 77.2)
  const regionCenters: Record<string, { lat: number; lng: number }> = {
    'ward-1': { lat: 28.6160, lng: 77.2010 },
    'ward-2': { lat: 28.6120, lng: 77.2050 },
    'ward-3': { lat: 28.6150, lng: 77.1950 },
    'ward-4': { lat: 28.6139, lng: 77.2090 },
    'village-1': { lat: 28.6210, lng: 77.2340 },
    'village-2': { lat: 28.6300, lng: 77.2500 },
    'village-3': { lat: 28.6180, lng: 77.2180 },
    'village-4': { lat: 28.6050, lng: 77.1980 },
  };

  let closestRegionId = 'ward-4'; // default
  let minDistance = Infinity;

  for (const [id, center] of Object.entries(regionCenters)) {
    const dLat = lat - center.lat;
    const dLng = lng - center.lng;
    const dist = Math.sqrt(dLat * dLat + dLng * dLng);
    if (dist < minDistance) {
      minDistance = dist;
      closestRegionId = id;
    }
  }

  return closestRegionId;
}

// Ensure all grievances have initial priority score calculated
function recalculateAllScores() {
  serverGrievances = serverGrievances.map(g => {
    const region = serverRegions.find(r => r.id === g.regionId) || serverRegions[0];
    return {
      ...g,
      priorityScore: calculateGrievanceScore(g, region, serverWeights)
    };
  });

  // Recompute clusters priority scores (average of grievances in them)
  serverClusters = serverClusters.map(c => {
    const related = serverGrievances.filter(g => c.grievanceIds.includes(g.id) && g.status !== 'Completed');
    if (related.length === 0) {
      return { ...c, priorityScore: 0, status: 'Resolved' };
    }
    const avgScore = related.reduce((sum, g) => sum + g.priorityScore, 0) / related.length;
    return {
      ...c,
      priorityScore: Math.round(avgScore),
      status: related.every(g => g.status === 'Completed') ? 'Resolved' : 'Open'
    };
  });
}

// Run initial calculation
recalculateAllScores();

// --- API ROUTES ---

// 1. Get stats
app.get("/api/stats", (req, res) => {
  recalculateAllScores();
  const total = serverGrievances.length;
  const pending = serverGrievances.filter(g => g.status === 'Pending').length;
  const underReview = serverGrievances.filter(g => g.status === 'Under Review').length;
  const workOrdered = serverGrievances.filter(g => g.status === 'Work Ordered').length;
  const completed = serverGrievances.filter(g => g.status === 'Completed').length;
  
  const activeGrievances = serverGrievances.filter(g => g.status !== 'Completed');
  const avgPriority = activeGrievances.length > 0 
    ? Math.round(activeGrievances.reduce((sum, g) => sum + g.priorityScore, 0) / activeGrievances.length)
    : 0;

  res.json({
    totalSubmissions: total,
    pendingCount: pending,
    underReviewCount: underReview,
    workOrderedCount: workOrdered,
    completedCount: completed,
    averagePriorityScore: avgPriority
  });
});

// 2. Get weights
app.get("/api/weights", (req, res) => {
  res.json(serverWeights);
});

// 3. Update weights
app.post("/api/weights", (req, res) => {
  const { demographic, infrastructure, urgency, volume } = req.body;
  
  serverWeights = {
    demographic: Number(demographic) || 0,
    infrastructure: Number(infrastructure) || 0,
    urgency: Number(urgency) || 0,
    volume: Number(volume) || 0
  };
  
  recalculateAllScores();
  res.json({ success: true, weights: serverWeights });
});

// 4. Get regions (calculated dynamically with weights)
app.get("/api/regions", (req, res) => {
  recalculateAllScores();
  const regionsWithScores = serverRegions.map(r => {
    const score = calculateRegionScore(r, serverGrievances, serverWeights);
    const activeCount = serverGrievances.filter(g => g.regionId === r.id && g.status !== 'Completed').length;
    const totalCount = serverGrievances.filter(g => g.regionId === r.id).length;
    
    return {
      ...r,
      priorityScore: score,
      activeGrievanceCount: activeCount,
      totalGrievanceCount: totalCount
    };
  });

  res.json(regionsWithScores);
});

// 5. Get submissions
app.get("/api/submissions", (req, res) => {
  recalculateAllScores();
  // Sort submissions by highest priority score
  const sorted = [...serverGrievances].sort((a, b) => b.priorityScore - a.priorityScore);
  res.json(sorted);
});

// 6. Submit a new citizen grievance (AI Pipeline Trigger)
app.post("/api/submissions", async (req, res) => {
  try {
    const { 
      citizenName, 
      citizenPhone, 
      description, 
      categoryPreference, 
      latitude, 
      longitude, 
      photoUrl, 
      voiceUrl 
    } = req.body;

    if (!description && !photoUrl) {
      return res.status(400).json({ error: "Either a description or a photo submission is required." });
    }

    const lat = Number(latitude) || 28.6139;
    const lng = Number(longitude) || 77.2090;

    // Spatial region resolution based on geo-coordinates
    const regionId = findClosestRegion(lat, lng);

    console.log(`[CitizenVoice Portal] Ingesting submission from ${citizenName}. Geolocation: [${lat}, ${lng}] resolved to Region: ${regionId}`);

    // Trigger AI OCR / Translation / Categorization
    const aiResult = await analyzeGrievanceWithAI(description || "", categoryPreference, photoUrl, voiceUrl);

    // Create new grievance record
    const newId = `CV-${Math.floor(1000 + Math.random() * 9000)}`;
    const newGrievance: Grievance = {
      id: newId,
      citizenName: citizenName || "Anonymous Citizen",
      citizenPhone: citizenPhone || "+91 99999 99999",
      regionId,
      title: aiResult.title,
      description: aiResult.translatedDescription,
      originalDescription: description || "",
      language: aiResult.detectedLanguage,
      category: aiResult.category,
      urgency: aiResult.urgency,
      status: 'Pending',
      createdAt: new Date().toISOString(),
      photoUrl,
      voiceUrl,
      latitude: lat,
      longitude: lng,
      priorityScore: 0 // Will be computed in recalculateAllScores
    };

    serverGrievances.push(newGrievance);
    
    // Attempt to automatically cluster into any matching theme cluster or create a new theme cluster
    const matchingCluster = serverClusters.find(c => c.category === newGrievance.category && c.title.toLowerCase().includes(regionId));
    if (matchingCluster) {
      matchingCluster.grievanceIds.push(newId);
    } else {
      // Create a new localized thematic group
      const targetRegionName = serverRegions.find(r => r.id === regionId)?.name || 'Local Sector';
      const newClusterId = `cluster-${Math.floor(10 + Math.random() * 90)}`;
      serverClusters.push({
        id: newClusterId,
        title: `${newGrievance.category} Concerns in ${targetRegionName.split(' - ')[0]}`,
        category: newGrievance.category,
        summary: `Group of localized citizen complaints focusing on ${newGrievance.category.toLowerCase()} reported in ${targetRegionName}.`,
        grievanceIds: [newId],
        priorityScore: 0,
        status: 'Open'
      });
    }

    recalculateAllScores();

    // Find the newly calculated score
    const savedGrievance = serverGrievances.find(g => g.id === newId);
    res.json({ success: true, grievance: savedGrievance });
  } catch (err: any) {
    console.error("[CitizenVoice API] Submission error:", err);
    res.status(500).json({ error: err.message || "Internal Server Ingestion Error" });
  }
});

// 7. Update status or add MP comments (Action Panel)
app.post("/api/submissions/resolve", (req, res) => {
  const { id, status, mpComment } = req.body;
  const grievance = serverGrievances.find(g => g.id === id);
  if (!grievance) {
    return res.status(404).json({ error: "Grievance submission not found" });
  }

  if (status) grievance.status = status;
  if (mpComment !== undefined) {
    grievance.mpComment = mpComment;
    grievance.mpCommentedAt = new Date().toISOString();
  }

  recalculateAllScores();
  res.json({ success: true, grievance });
});

// 8. Theme Clusters endpoint
app.get("/api/clusters", (req, res) => {
  recalculateAllScores();
  // Sort clusters by priority
  const sorted = [...serverClusters].sort((a, b) => b.priorityScore - a.priorityScore);
  res.json(sorted);
});

// 9. Trigger dynamic AI thematic summary consolidation for a cluster
app.post("/api/clusters/:id/summarize", async (req, res) => {
  const { id } = req.params;
  const cluster = serverClusters.find(c => c.id === id);
  if (!cluster) {
    return res.status(404).json({ error: "Thematic cluster not found" });
  }

  const relatedGrievances = serverGrievances.filter(g => cluster.grievanceIds.includes(g.id));
  const descriptions = relatedGrievances.map(g => g.description);

  try {
    const summary = await generateAIThemeSummary(cluster.category, descriptions);
    cluster.summary = summary;
    res.json({ success: true, summary });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 9.5 Get Competing Proposals with Dynamic Priority Scoring
app.get("/api/proposals", (req, res) => {
  const scoredProposals = serverProposals.map(p => {
    const score = calculateProposalScore(p.baseMetrics, serverWeights);
    return {
      ...p,
      priorityScore: score
    };
  });
  // Sort by score descending
  const sorted = [...scoredProposals].sort((a, b) => b.priorityScore - a.priorityScore);
  res.json(sorted);
});

// 9.6 Update Proposal Status (MP Decides)
app.post("/api/proposals/:id/status", (req, res) => {
  const { id } = req.params;
  const { status, fundedAmount } = req.body;
  const proposal = serverProposals.find(p => p.id === id);
  if (!proposal) {
    return res.status(404).json({ error: "Proposed project not found" });
  }

  if (status) proposal.status = status;
  if (fundedAmount !== undefined) proposal.fundedAmount = Number(fundedAmount);

  res.json({ success: true, proposal });
});

// 9.7 Import Proposals Bulk
app.post("/api/proposals/import", (req, res) => {
  const { proposals } = req.body;
  if (!Array.isArray(proposals)) {
    return res.status(400).json({ error: "Proposals must be an array" });
  }

  const addedProposals: ProposedProject[] = [];

  proposals.forEach(p => {
    const id = `PROP-${Math.floor(100 + Math.random() * 900)}`;
    const newProposal: ProposedProject = {
      id,
      title: p.title || "Untitled Proposed Project",
      regionId: p.regionId || "ward-4",
      category: p.category || "Roads",
      estimatedCost: Number(p.estimatedCost) || 50,
      description: p.description || "Project imported via Google Sheets integration.",
      demographicContext: {
        label1: p.label1 || "Target Population",
        value1: p.value1 || "N/A",
        label2: p.label2 || "Beneficiary Density",
        value2: p.value2 || "N/A"
      },
      baseMetrics: {
        demographicImpact: Number(p.demographicImpact) || 50,
        infrastructureGap: Number(p.infrastructureGap) || 50,
        urgencyHazard: Number(p.urgencyHazard) || 50,
        demandVolume: Number(p.demandVolume) || 50
      },
      status: 'Draft'
    };
    serverProposals.push(newProposal);
    addedProposals.push(newProposal);
  });

  res.json({ success: true, count: addedProposals.length, proposals: addedProposals });
});

// 10. CSV Report Export Download
app.get("/api/reports/export", (req, res) => {
  recalculateAllScores();
  
  // Create CSV Header
  let csvContent = "Region ID,Region Name,Type,Estimated Population,Household Count,Area (sq km),SC/ST Percentage,Active Grievances,Priority Score (0-100)\n";
  
  serverRegions.forEach(r => {
    const score = calculateRegionScore(r, serverGrievances, serverWeights);
    const activeCount = serverGrievances.filter(g => g.regionId === r.id && g.status !== 'Completed').length;
    
    csvContent += `"${r.id}","${r.name}","${r.type}",${r.population},${r.households},${r.areaSqKm},${r.scStPercentage}%,${activeCount},${score}\n`;
  });

  csvContent += "\n\nCitizen Grievance Export Log\n";
  csvContent += "Grievance ID,Citizen,Contact,Region,Category,Urgency,Status,Date Registered,AI Priority Score,Translated English Description\n";

  serverGrievances.forEach(g => {
    const regionName = serverRegions.find(r => r.id === g.regionId)?.name || "Unknown";
    csvContent += `"${g.id}","${g.citizenName}","${g.citizenPhone}","${regionName}","${g.category}","${g.urgency}","${g.status}","${g.createdAt}",${g.priorityScore},"${g.description.replace(/"/g, '""')}"\n`;
  });

  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', 'attachment; filename=CitizenVoice_MP_Prioritizations.csv');
  res.status(200).send(csvContent);
});


// --- VITE MIDDLEWARE SETUP ---
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[CitizenVoice Backend] Running full-stack server on http://localhost:${PORT}`);
  });
}

startServer();
