import React, { useState, useEffect } from 'react';
import { 
  Users, AlertCircle, Wrench, CheckSquare, Sparkles, Sliders, Map, 
  ListFilter, Download, ArrowUpRight, MessageSquare, Save, X, RefreshCw, Eye, Loader2,
  Calendar, Mail
} from 'lucide-react';
import { Region, Grievance, PriorityWeights, ThemeCluster, SystemStats, ProposedProject } from '../types';
import { initAuth, googleSignIn, logout } from '../lib/firebase';
import { createGoogleSheet, getGoogleSheetRows, createCalendarEvent, sendGmailEmail } from '../lib/workspace';

interface MPDashboardProps {
  onRefreshCounter: number; // Trigger reload when a new submission occurs
}

export default function MPDashboard({ onRefreshCounter }: MPDashboardProps) {
  // Server-fetched State
  const [regions, setRegions] = useState<Region[]>([]);
  const [grievances, setGrievances] = useState<Grievance[]>([]);
  const [weights, setWeights] = useState<PriorityWeights>({
    demographic: 30,
    infrastructure: 40,
    urgency: 20,
    volume: 10
  });
  const [clusters, setClusters] = useState<ThemeCluster[]>([]);
  const [proposals, setProposals] = useState<ProposedProject[]>([]);
  const [stats, setStats] = useState<SystemStats>({
    totalSubmissions: 0,
    pendingCount: 0,
    underReviewCount: 0,
    workOrderedCount: 0,
    completedCount: 0,
    averagePriorityScore: 0
  });

  // UI state
  const [isLoading, setIsLoading] = useState(true);
  const [selectedRegionId, setSelectedRegionId] = useState<string | null>(null);
  const [hoveredRegion, setHoveredRegion] = useState<any | null>(null);
  const [activeTab, setActiveTab] = useState<'grievances' | 'clusters' | 'proposals'>('proposals'); // Default to proposals tab to focus on the problem statement!
  const [filterCategory, setFilterCategory] = useState<string>('All');
  
  // Status Update modal state
  const [selectedGrievance, setSelectedGrievance] = useState<Grievance | null>(null);
  const [modalStatus, setModalStatus] = useState<string>('');
  const [modalComment, setModalComment] = useState<string>('');
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [isSummarizingClusterId, setIsSummarizingClusterId] = useState<string | null>(null);

  // Google Workspace integration state
  const [isGoogleConnected, setIsGoogleConnected] = useState(false);
  const [googleUser, setGoogleUser] = useState<any | null>(null);
  const [googleToken, setGoogleToken] = useState<string | null>(null);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);

  // Sheets exporting & importing states
  const [exportingSheets, setExportingSheets] = useState(false);
  const [exportResult, setExportResult] = useState<{ spreadsheetId: string; spreadsheetUrl: string } | null>(null);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [importSheetId, setImportSheetId] = useState('');
  const [importRange, setImportRange] = useState('Sheet1!A1:I20');
  const [importingSheets, setImportingSheets] = useState(false);
  const [importSuccessCount, setImportSuccessCount] = useState<number | null>(null);
  const [importError, setImportError] = useState<string | null>(null);

  // Calendar visit scheduling states
  const [selectedCalendarGrievance, setSelectedCalendarGrievance] = useState<Grievance | null>(null);
  const [inspectionTitle, setInspectionTitle] = useState('');
  const [inspectionDesc, setInspectionDesc] = useState('');
  const [inspectionDate, setInspectionDate] = useState('2026-07-04');
  const [inspectionStartTime, setInspectionStartTime] = useState('10:00');
  const [inspectionEndTime, setInspectionEndTime] = useState('11:00');
  const [isSchedulingCalendar, setIsSchedulingCalendar] = useState(false);
  const [calendarSuccess, setCalendarSuccess] = useState<any | null>(null);

  // Gmail notification dispatcher states
  const [sendGmailNotification, setSendGmailNotification] = useState(false);
  const [citizenEmail, setCitizenEmail] = useState('');

  // Weekly/Monthly priority brief report email states
  const [isEmailModalOpen, setIsEmailModalOpen] = useState(false);
  const [reportRecipient, setReportRecipient] = useState('');
  const [reportSubject, setReportSubject] = useState('CitizenVoice - Executive Constituency Prioritization Summary');
  const [sendingReport, setSendingReport] = useState(false);
  const [reportSuccess, setReportSuccess] = useState(false);

  // Fetch all state from full-stack server
  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [resStats, resWeights, resRegions, resGrievances, resClusters, resProposals] = await Promise.all([
        fetch('/api/stats'),
        fetch('/api/weights'),
        fetch('/api/regions'),
        fetch('/api/submissions'),
        fetch('/api/clusters'),
        fetch('/api/proposals')
      ]);

      if (resStats.ok) setStats(await resStats.json());
      if (resWeights.ok) setWeights(await resWeights.json());
      if (resRegions.ok) setRegions(await resRegions.json());
      if (resGrievances.ok) setGrievances(await resGrievances.json());
      if (resClusters.ok) setClusters(await resClusters.json());
      if (resProposals.ok) setProposals(await resProposals.json());
    } catch (err) {
      console.error("Failed to fetch administrative data:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [onRefreshCounter]);

  // Connect Google Auth on mount
  useEffect(() => {
    const unsubscribe = initAuth(
      (user, token) => {
        setIsGoogleConnected(true);
        setGoogleUser(user);
        setGoogleToken(token);
      },
      () => {
        setIsGoogleConnected(false);
        setGoogleUser(null);
        setGoogleToken(null);
      }
    );
    return () => {
      if (typeof unsubscribe === 'function') unsubscribe();
    };
  }, []);

  const handleGoogleConnect = async () => {
    setIsGoogleLoading(true);
    try {
      const result = await googleSignIn();
      if (result) {
        setIsGoogleConnected(true);
        setGoogleUser(result.user);
        setGoogleToken(result.accessToken);
      }
    } catch (err) {
      console.error('Google Workspace authentication failed:', err);
    } finally {
      setIsGoogleLoading(false);
    }
  };

  const handleGoogleDisconnect = async () => {
    setIsGoogleLoading(true);
    try {
      await logout();
      setIsGoogleConnected(false);
      setGoogleUser(null);
      setGoogleToken(null);
    } catch (err) {
      console.error('Logout failed:', err);
    } finally {
      setIsGoogleLoading(false);
    }
  };

  const handleExportProposalsToSheets = async () => {
    setExportingSheets(true);
    setExportResult(null);
    try {
      const headers = [
        "Project ID",
        "Project Title",
        "Target Region",
        "Category",
        "Dynamic Score",
        "Budget (Lakhs INR)",
        "Current Status",
        "Description"
      ];
      
      const dataRows = proposals.map(p => {
        const regName = regions.find(r => r.id === p.regionId)?.name.split(' - ')[0] || "Constituency";
        return [
          p.id,
          p.title,
          regName,
          p.category,
          p.priorityScore,
          p.estimatedCost,
          p.status,
          p.description
        ];
      });

      const title = `CitizenVoice Competing Proposals Ledger - ${new Date().toLocaleDateString()}`;
      const result = await createGoogleSheet(title, headers, dataRows);
      setExportResult(result);
    } catch (err: any) {
      console.error(err);
    } finally {
      setExportingSheets(false);
    }
  };

  const handleImportProposals = async () => {
    setImportingSheets(true);
    setImportError(null);
    setImportSuccessCount(null);
    try {
      let sheetId = importSheetId.trim();
      if (sheetId.includes('docs.google.com/spreadsheets')) {
        const matches = sheetId.match(/\/d\/([a-zA-Z0-9-_]+)/);
        if (matches && matches[1]) {
          sheetId = matches[1];
        }
      }

      if (!sheetId) {
        throw new Error('Please enter a valid Google Spreadsheet ID or full Google Sheet URL.');
      }

      const rows = await getGoogleSheetRows(sheetId, importRange);
      if (rows.length <= 1) {
        throw new Error('The spreadsheet appears to be empty or contains only a header row.');
      }

      const headerRow = rows[0].map(h => h.trim().toLowerCase());
      
      const titleIdx = headerRow.findIndex(h => h.includes('title'));
      const catIdx = headerRow.findIndex(h => h.includes('cat'));
      const regionIdx = headerRow.findIndex(h => h.includes('region') || h.includes('ward') || h.includes('village'));
      const costIdx = headerRow.findIndex(h => h.includes('cost') || h.includes('budget'));
      const descIdx = headerRow.findIndex(h => h.includes('desc') || h.includes('details'));
      
      const demogIdx = headerRow.findIndex(h => h.includes('demog') || h.includes('impact'));
      const infraIdx = headerRow.findIndex(h => h.includes('infra') || h.includes('gap'));
      const urgencyIdx = headerRow.findIndex(h => h.includes('urgency') || h.includes('hazard'));
      const demandIdx = headerRow.findIndex(h => h.includes('demand') || h.includes('volume'));

      const importedProposals: any[] = [];

      for (let i = 1; i < rows.length; i++) {
        const row = rows[i];
        if (!row || row.length === 0) continue;
        
        const titleVal = titleIdx !== -1 ? row[titleIdx] : row[0];
        if (!titleVal) continue; // skip blank rows

        const parsedRow = {
          title: titleVal,
          category: (catIdx !== -1 ? row[catIdx] : row[1] || "Roads") as any,
          regionId: regionIdx !== -1 ? row[regionIdx] : "ward-1",
          estimatedCost: Number(costIdx !== -1 ? row[costIdx] : 50) || 50,
          description: descIdx !== -1 ? row[descIdx] : "Project imported via Google Sheets.",
          demographicImpact: Number(demogIdx !== -1 ? row[demogIdx] : 60) || 60,
          infrastructureGap: Number(infraIdx !== -1 ? row[infraIdx] : 50) || 50,
          urgencyHazard: Number(urgencyIdx !== -1 ? row[urgencyIdx] : 40) || 40,
          demandVolume: Number(demandIdx !== -1 ? row[demandIdx] : 50) || 50,
        };

        const validCategories = ['Roads', 'Water', 'Power', 'Sanitation', 'Safety'];
        if (!validCategories.includes(parsedRow.category)) {
          parsedRow.category = 'Roads';
        }

        importedProposals.push(parsedRow);
      }

      if (importedProposals.length === 0) {
        throw new Error('No valid proposals could be parsed from the sheet data rows.');
      }

      const response = await fetch('/api/proposals/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ proposals: importedProposals })
      });

      if (!response.ok) {
        throw new Error('Server rejected the imported proposals bulk insert.');
      }

      const resData = await response.json();
      setImportSuccessCount(resData.count);
      
      const res = await fetch('/api/proposals');
      if (res.ok) setProposals(await res.json());

      setTimeout(() => {
        setIsImportModalOpen(false);
        setImportSuccessCount(null);
        setImportSheetId('');
      }, 3000);

    } catch (err: any) {
      console.error(err);
      setImportError(err.message || 'Failed to import. Verify spreadsheet access and format.');
    } finally {
      setImportingSheets(false);
    }
  };

  const handleScheduleInspection = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCalendarGrievance) return;
    setIsSchedulingCalendar(true);
    setCalendarSuccess(null);

    try {
      const startDateTime = `${inspectionDate}T${inspectionStartTime}:00`;
      const endDateTime = `${inspectionDate}T${inspectionEndTime}:00`;

      const result = await createCalendarEvent({
        summary: inspectionTitle,
        description: inspectionDesc,
        startDateTime,
        endDateTime
      });

      setCalendarSuccess(result);
    } catch (err: any) {
      console.error(err);
    } finally {
      setIsSchedulingCalendar(false);
    }
  };

  const handleSendGmailReport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reportRecipient) return;
    setSendingReport(true);
    setReportSuccess(false);

    try {
      const activeGrievances = grievances.filter(g => g.status !== 'Completed').slice(0, 5);
      const approvedProposals = proposals.filter(p => p.status === 'Approved');

      const approvedRowsHtml = approvedProposals.length > 0 
        ? approvedProposals.map(p => `
            <tr>
              <td style="padding: 10px; border-bottom: 1px solid #e2e8f0; font-family: monospace; font-size: 12px;">${p.id}</td>
              <td style="padding: 10px; border-bottom: 1px solid #e2e8f0;"><strong>${p.title}</strong><br/><span style="font-size: 11px; color: #64748b;">${p.description}</span></td>
              <td style="padding: 10px; border-bottom: 1px solid #e2e8f0; font-size: 12px;">${p.category}</td>
              <td style="padding: 10px; border-bottom: 1px solid #e2e8f0; font-family: monospace; font-weight: bold; text-align: right;">${p.estimatedCost} L</td>
            </tr>
          `).join('')
        : '<tr><td colspan="4" style="padding: 15px; text-align: center; color: #64748b; font-size: 12px;">No approved projects in this cycle.</td></tr>';

      const grievanceRowsHtml = activeGrievances.length > 0
        ? activeGrievances.map(g => `
            <tr>
              <td style="padding: 10px; border-bottom: 1px solid #e2e8f0; font-family: monospace; font-size: 12px;">${g.id}</td>
              <td style="padding: 10px; border-bottom: 1px solid #e2e8f0;"><strong>${g.title}</strong><br/><span style="font-size: 11px; color: #64748b;">"${g.description}"</span></td>
              <td style="padding: 10px; border-bottom: 1px solid #e2e8f0; font-size: 12px;">${g.category}</td>
              <td style="padding: 10px; border-bottom: 1px solid #e2e8f0; font-family: monospace; font-weight: bold; text-align: right; color: #b91c1c;">${g.priorityScore} Pts</td>
            </tr>
          `).join('')
        : '<tr><td colspan="4" style="padding: 15px; text-align: center; color: #64748b; font-size: 12px;">All active grievances resolved.</td></tr>';

      const emailHtml = `
        <div style="font-family: sans-serif; max-width: 800px; margin: 0 auto; padding: 25px; border: 1px solid #e2e8f0; border-radius: 16px; background-color: #ffffff;">
          <div style="background-color: #0f172a; color: #ffffff; padding: 20px; border-radius: 12px; margin-bottom: 25px;">
            <span style="font-family: monospace; font-size: 11px; color: #10b981; font-weight: bold; text-transform: uppercase;">CONSTITUENCY DYNAMIC DECISION SUMMARY</span>
            <h1 style="margin: 5px 0 0 0; font-size: 20px; font-weight: 800;">Executive Prioritization Brief</h1>
            <p style="margin: 5px 0 0 0; font-size: 12px; color: #94a3b8;">Generated from Member of Parliament's CitizenVoice Admin Deck.</p>
          </div>

          <p style="font-size: 14px; line-height: 1.6; color: #334155;">
            This report represents the latest constituency prioritization intelligence, processed dynamically based on census demographics, localized infrastructure gaps, and urgency markers.
          </p>

          <h3 style="color: #047857; border-bottom: 2px solid #047857; padding-bottom: 6px; margin-top: 30px;">1. Approved & Funded Projects Matrix</h3>
          <table style="width: 100%; border-collapse: collapse; margin-top: 10px; font-size: 13px; text-align: left;">
            <thead>
              <tr style="background-color: #f8fafc; color: #475569; font-weight: bold;">
                <th style="padding: 10px; border-bottom: 2px solid #cbd5e1; width: 80px;">ID</th>
                <th style="padding: 10px; border-bottom: 2px solid #cbd5e1;">Project Description</th>
                <th style="padding: 10px; border-bottom: 2px solid #cbd5e1; width: 100px;">Category</th>
                <th style="padding: 10px; border-bottom: 2px solid #cbd5e1; text-align: right; width: 100px;">Est. Cost</th>
              </tr>
            </thead>
            <tbody>
              ${approvedRowsHtml}
            </tbody>
          </table>

          <h3 style="color: #b91c1c; border-bottom: 2px solid #b91c1c; padding-bottom: 6px; margin-top: 40px;">2. Top 5 Prioritized Active Grievances</h3>
          <table style="width: 100%; border-collapse: collapse; margin-top: 10px; font-size: 13px; text-align: left;">
            <thead>
              <tr style="background-color: #f8fafc; color: #475569; font-weight: bold;">
                <th style="padding: 10px; border-bottom: 2px solid #cbd5e1; width: 80px;">ID</th>
                <th style="padding: 10px; border-bottom: 2px solid #cbd5e1;">Grievance Title</th>
                <th style="padding: 10px; border-bottom: 2px solid #cbd5e1; width: 100px;">Category</th>
                <th style="padding: 10px; border-bottom: 2px solid #cbd5e1; text-align: right; width: 100px;">Priority Score</th>
              </tr>
            </thead>
            <tbody>
              ${grievanceRowsHtml}
            </tbody>
          </table>

          <div style="margin-top: 40px; padding: 15px; border-radius: 8px; background-color: #f8fafc; font-size: 12px; color: #64748b; text-align: center; border: 1px dashed #cbd5e1;">
            <strong>Secretariat Analytics:</strong> Current active prioritization sliders are weighted at <strong>Demographic Profile (${weights.demographic}%)</strong>, <strong>Infrastructure Deficiency (${weights.infrastructure}%)</strong>, <strong>Urgency Level (${weights.urgency}%)</strong>, and <strong>Submission Density (${weights.volume}%)</strong>.
          </div>
        </div>
      `;

      await sendGmailEmail(reportRecipient, reportSubject, emailHtml);
      setReportSuccess(true);
      
      setTimeout(() => {
        setIsEmailModalOpen(false);
        setReportSuccess(false);
        setReportRecipient('');
      }, 3000);

    } catch (err: any) {
      console.error(err);
    } finally {
      setSendingReport(false);
    }
  };

  // Handle Weight Sliders Changes (Dynamic Prioritization Recalculation)
  const handleWeightChange = async (key: keyof PriorityWeights, value: number) => {
    const updatedWeights = { ...weights, [key]: value };
    setWeights(updatedWeights);

    // Send weights to server to update scores
    try {
      const response = await fetch('/api/weights', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedWeights)
      });
      if (response.ok) {
        // Fetch updated scores from server
        const [resRegions, resGrievances, resClusters, resStats, resProposals] = await Promise.all([
          fetch('/api/regions'),
          fetch('/api/submissions'),
          fetch('/api/clusters'),
          fetch('/api/stats'),
          fetch('/api/proposals')
        ]);
        
        if (resRegions.ok) setRegions(await resRegions.json());
        if (resGrievances.ok) setGrievances(await resGrievances.json());
        if (resClusters.ok) setClusters(await resClusters.json());
        if (resStats.ok) setStats(await resStats.json());
        if (resProposals.ok) setProposals(await resProposals.json());
      }
    } catch (err) {
      console.error("Failed to update weights on server:", err);
    }
  };

  // Change Grievance Action Status or MP comment
  const handleSaveAction = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedGrievance) return;

    setIsUpdatingStatus(true);
    try {
      const response = await fetch('/api/submissions/resolve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: selectedGrievance.id,
          status: modalStatus,
          mpComment: modalComment
        })
      });

      if (response.ok) {
        // Send Gmail Notification if checked
        if (sendGmailNotification && citizenEmail) {
          try {
            const subject = `[CitizenVoice Update] Action taken regarding Grievance ID: ${selectedGrievance.id}`;
            const emailHtml = `
              <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 25px; border: 1px solid #e2e8f0; border-radius: 16px; background-color: #ffffff;">
                <div style="background-color: #047857; color: #ffffff; padding: 15px; border-radius: 10px; margin-bottom: 20px;">
                  <span style="font-family: monospace; font-size: 11px; text-transform: uppercase; font-weight: bold;">CitizenVoice Secretariat Dispatch</span>
                  <h2 style="margin: 5px 0 0 0; font-size: 18px; font-weight: 700;">Grievance Status Update Notification</h2>
                </div>
                
                <p style="font-size: 14px; color: #334155;">Dear <strong>${selectedGrievance.citizenName}</strong>,</p>
                <p style="font-size: 14px; color: #334155; line-height: 1.5;">
                  The Member of Parliament (MP) Secretariat has officially reviewed and updated your registered grievance:
                </p>

                <div style="background-color: #f8fafc; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #047857; font-size: 13px;">
                  <p style="margin: 0 0 8px 0; color: #475569;"><strong>Grievance ID:</strong> ${selectedGrievance.id}</p>
                  <p style="margin: 0 0 8px 0; color: #475569;"><strong>Issue Title:</strong> ${selectedGrievance.title}</p>
                  <p style="margin: 0 0 8px 0; color: #475569;"><strong>Category:</strong> ${selectedGrievance.category}</p>
                  <p style="margin: 0 0 8px 0; color: #475569;">
                    <strong>New Status:</strong> 
                    <span style="background-color: #d1fae5; color: #065f46; padding: 3px 8px; border-radius: 9999px; font-weight: bold; font-size: 11px; text-transform: uppercase; border: 1px solid #a7f3d0;">
                      ${modalStatus}
                    </span>
                  </p>
                </div>

                <p style="font-size: 14px; color: #334155; font-weight: bold; margin-top: 25px; margin-bottom: 8px;">
                  Official MP Secretariat Action Statement:
                </p>
                <blockquote style="font-style: italic; color: #475569; background-color: #f1f5f9; padding: 15px; border-radius: 8px; margin: 0 0 25px 0; line-height: 1.6; border-left: 3px solid #cbd5e1;">
                  "${modalComment}"
                </blockquote>

                <p style="font-size: 14px; color: #334155; line-height: 1.5;">
                  Our priority scores adjust dynamically to keep constituency infrastructure allocations aligned with community demands. We appreciate your partnership in building a better ward.
                </p>

                <div style="font-size: 11px; color: #64748b; margin-top: 35px; border-top: 1px solid #e2e8f0; padding-top: 15px; text-align: center;">
                  This is an official dispatch from the CitizenVoice administrative portal. Please do not reply directly to this mail.
                </div>
              </div>
            `;
            await sendGmailEmail(citizenEmail, subject, emailHtml);
          } catch (gmailErr) {
            console.error("Failed to send status update email via Gmail API:", gmailErr);
          }
        }
        
        setSelectedGrievance(null);
        await fetchData();
      }
    } catch (err) {
      console.error("Failed to save action status:", err);
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  // Approve or reject a proposed project
  const handleProposalAction = async (proposalId: string, status: 'Approved' | 'Rejected' | 'Draft') => {
    try {
      const response = await fetch(`/api/proposals/${proposalId}/status`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      });
      if (response.ok) {
        // reload proposals
        const res = await fetch('/api/proposals');
        if (res.ok) setProposals(await res.json());
      }
    } catch (err) {
      console.error("Failed to update proposal status:", err);
    }
  };

  // Re-Summarize a Thematic Cluster with Gemini AI
  const handleSummarizeTheme = async (clusterId: string) => {
    setIsSummarizingClusterId(clusterId);
    try {
      const response = await fetch(`/api/clusters/${clusterId}/summarize`, {
        method: 'POST'
      });
      if (response.ok) {
        const data = await response.json();
        // Update in place
        setClusters(prev => prev.map(c => c.id === clusterId ? { ...c, summary: data.summary } : c));
      }
    } catch (err) {
      console.error("Failed to summarize cluster:", err);
    } finally {
      setIsSummarizingClusterId(null);
    }
  };

  // Heatmap fill helper based on dynamically computed priority score
  const getHeatmapColor = (score: number) => {
    // Return tailwind colors or custom rgb values
    if (score >= 70) return '#ef4444'; // Red
    if (score >= 50) return '#f59e0b'; // Amber
    return '#10b981'; // Emerald Green
  };

  const getHeatmapClass = (score: number, rId: string) => {
    const isSelected = selectedRegionId === rId;
    let base = "transition-all duration-200 stroke-2 cursor-pointer ";
    
    if (isSelected) {
      base += "stroke-slate-900 stroke-[3px] fill-opacity-90 scale-101 shadow-lg";
    } else {
      base += "stroke-white hover:fill-opacity-80 hover:stroke-slate-400";
    }

    return base;
  };

  // Filtering grievances
  const filteredGrievances = grievances.filter(g => {
    const matchesRegion = selectedRegionId ? g.regionId === selectedRegionId : true;
    const matchesCategory = filterCategory === 'All' ? true : g.category === filterCategory;
    return matchesRegion && matchesCategory;
  });

  // Calculate coordinates for mouse tooltip positioning
  const handleMapMouseMove = (e: React.MouseEvent<SVGSVGElement>, r: Region) => {
    const svgRect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - svgRect.left;
    const y = e.clientY - svgRect.top;
    
    // Calculate dynamically recalculated parameters
    const activeCount = grievances.filter(g => g.regionId === r.id && g.status !== 'Completed').length;
    const computedRegion = regions.find(reg => reg.id === r.id) || r;

    setHoveredRegion({
      name: r.name,
      population: r.population,
      populationIsEstimated: r.populationIsEstimated,
      households: r.households,
      areaSqKm: r.areaSqKm,
      scStPercentage: r.scStPercentage,
      activeGrievances: activeCount,
      priorityScore: computedRegion.priorityScore,
      x: e.clientX,
      y: e.clientY
    });
  };

  return (
    <div className="py-6 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto" id="mp-dashboard">
      
      {/* 4 KPI Cards Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-xs flex items-center space-x-3.5">
          <div className="bg-emerald-50 text-emerald-700 p-3 rounded-xl">
            <Users className="h-5 w-5" />
          </div>
          <div>
            <span className="text-[10px] text-slate-400 uppercase font-mono font-bold tracking-wider">
              Total Ingested
            </span>
            <span className="block font-display font-extrabold text-slate-800 text-lg sm:text-2xl mt-0.5">
              {stats.totalSubmissions}
            </span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-xs flex items-center space-x-3.5">
          <div className="bg-amber-50 text-amber-700 p-3 rounded-xl">
            <AlertCircle className="h-5 w-5" />
          </div>
          <div>
            <span className="text-[10px] text-slate-400 uppercase font-mono font-bold tracking-wider">
              Reviewing / Pending
            </span>
            <span className="block font-display font-extrabold text-slate-800 text-lg sm:text-2xl mt-0.5">
              {stats.pendingCount + stats.underReviewCount}
            </span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-xs flex items-center space-x-3.5">
          <div className="bg-blue-50 text-blue-700 p-3 rounded-xl">
            <Wrench className="h-5 w-5" />
          </div>
          <div>
            <span className="text-[10px] text-slate-400 uppercase font-mono font-bold tracking-wider">
              Work Ordered
            </span>
            <span className="block font-display font-extrabold text-slate-800 text-lg sm:text-2xl mt-0.5">
              {stats.workOrderedCount}
            </span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-xs flex items-center space-x-3.5">
          <div className="bg-slate-100 text-slate-700 p-3 rounded-xl">
            <CheckSquare className="h-5 w-5" />
          </div>
          <div>
            <span className="text-[10px] text-slate-400 uppercase font-mono font-bold tracking-wider">
              Resolved Gaps
            </span>
            <span className="block font-display font-extrabold text-slate-800 text-lg sm:text-2xl mt-0.5">
              {stats.completedCount}
            </span>
          </div>
        </div>
      </div>

      {/* Main Layout: Left Map & Sliders, Right Theme Analysis */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mb-8">
        
        {/* Left Grid: SVG Map and Sliders */}
        <div className="lg:col-span-7 space-y-6">
          
          {/* Heatmap Visualizer */}
          <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-xs relative">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-display font-semibold text-sm text-slate-800 flex items-center space-x-2">
                <Map className="h-4 w-4 text-emerald-600" />
                <span>Constituency Priority Heatmap (SVG Map)</span>
              </h3>
              <div className="flex items-center space-x-2 text-[10px] font-mono">
                <span className="flex items-center space-x-1">
                  <span className="h-2.5 w-2.5 rounded-xs bg-[#10b981]"></span>
                  <span className="text-slate-500">Low Gap</span>
                </span>
                <span className="flex items-center space-x-1">
                  <span className="h-2.5 w-2.5 rounded-xs bg-[#f59e0b]"></span>
                  <span className="text-slate-500">Moderate</span>
                </span>
                <span className="flex items-center space-x-1">
                  <span className="h-2.5 w-2.5 rounded-xs bg-[#ef4444]"></span>
                  <span className="text-slate-500">Severe Priority</span>
                </span>
              </div>
            </div>

            <p className="text-xs text-slate-500 mb-4 leading-relaxed">
              Hover over administrative regions to review Census demographics. Click on a region to filter the grievance logs below.
            </p>

            {/* SVG MAP */}
            {isLoading ? (
              <div className="aspect-video bg-slate-50 border border-slate-100 rounded-xl flex items-center justify-center">
                <Loader2 className="h-8 w-8 text-slate-400 animate-spin" />
              </div>
            ) : (
              <div className="relative bg-slate-50 border border-slate-100 rounded-xl overflow-hidden shadow-inner">
                <svg viewBox="0 0 800 500" className="w-full h-auto">
                  {/* Grid overlay */}
                  <pattern id="mpGrid" width="40" height="40" patternUnits="userSpaceOnUse">
                    <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#f1f5f9" strokeWidth="0.5" />
                  </pattern>
                  <rect width="800" height="500" fill="url(#mpGrid)" />

                  {/* Regions */}
                  {regions.map((r) => (
                    <g key={r.id}>
                      <path
                        d={r.pathData}
                        fill={getHeatmapColor(r.priorityScore || 0)}
                        fillOpacity={selectedRegionId && selectedRegionId !== r.id ? 0.35 : 0.7}
                        className={getHeatmapClass(r.priorityScore || 0, r.id)}
                        onMouseMove={(e) => handleMapMouseMove(e, r)}
                        onMouseLeave={() => setHoveredRegion(null)}
                        onClick={() => setSelectedRegionId(selectedRegionId === r.id ? null : r.id)}
                      />
                      <text
                        x={r.centerCoords[0]}
                        y={r.centerCoords[1]}
                        className="text-[12px] font-display font-bold fill-slate-900 pointer-events-none select-none text-center"
                        textAnchor="middle"
                      >
                        {r.name.split(' - ')[0]}
                      </text>
                      <text
                        x={r.centerCoords[0]}
                        y={r.centerCoords[1] + 16}
                        className="text-[10px] font-mono font-extrabold fill-slate-800 pointer-events-none select-none text-center bg-white/40"
                        textAnchor="middle"
                      >
                        {r.priorityScore} Pts
                      </text>
                    </g>
                  ))}
                </svg>

                {/* Region Filter notification tag */}
                {selectedRegionId && (
                  <div className="absolute top-3 left-3 bg-slate-900/90 text-white text-[10px] font-semibold px-2.5 py-1 rounded-lg flex items-center space-x-1.5 shadow-md">
                    <span>Filtering: {regions.find(r => r.id === selectedRegionId)?.name.split(' - ')[0]}</span>
                    <button 
                      onClick={() => setSelectedRegionId(null)} 
                      className="text-slate-400 hover:text-white cursor-pointer font-bold font-mono ml-1"
                    >
                      ×
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Hover Tooltip Render */}
            {hoveredRegion && (
              <div 
                className="fixed bg-slate-900/95 text-white p-3.5 rounded-xl text-xs z-50 shadow-lg pointer-events-none max-w-xs border border-slate-700/50 backdrop-blur-xs font-mono space-y-1.5"
                style={{ left: hoveredRegion.x + 12, top: hoveredRegion.y + 12 }}
              >
                <div className="font-display font-bold text-sm text-amber-300 tracking-tight leading-tight flex items-center justify-between">
                  <span>{hoveredRegion.name}</span>
                  {hoveredRegion.populationIsEstimated && (
                    <span className="bg-amber-500/20 text-amber-300 text-[8px] px-1.5 py-0.5 rounded-full border border-amber-500/30 font-semibold tracking-wider">
                      ESTIMATED POP
                    </span>
                  )}
                </div>
                <div className="border-t border-slate-700/60 my-1 pt-1.5 grid grid-cols-2 gap-x-4 gap-y-1 font-semibold text-slate-300">
                  <span>Population:</span>
                  <span className="text-white text-right">{hoveredRegion.population.toLocaleString()}</span>
                  <span>Households:</span>
                  <span className="text-white text-right">{hoveredRegion.households.toLocaleString()}</span>
                  <span>Area Size:</span>
                  <span className="text-white text-right">{hoveredRegion.areaSqKm} km²</span>
                  <span>SC / ST %:</span>
                  <span className="text-white text-right">{hoveredRegion.scStPercentage}%</span>
                </div>
                <div className="border-t border-slate-700/60 pt-1.5 flex justify-between font-bold text-emerald-300">
                  <span>Active Grievances:</span>
                  <span>{hoveredRegion.activeGrievances} complaints</span>
                </div>
                <div className="flex justify-between font-bold text-red-300 text-sm mt-1">
                  <span>AI Priority Score:</span>
                  <span>{hoveredRegion.priorityScore} / 100</span>
                </div>
              </div>
            )}
          </div>

          {/* Interactive Weight Sliders */}
          <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-xs">
            <h3 className="font-display font-semibold text-sm text-slate-800 mb-4 flex items-center space-x-2">
              <Sliders className="h-4 w-4 text-emerald-600" />
              <span>Configure Prioritization Scoring Weights</span>
            </h3>

            <p className="text-xs text-slate-500 mb-5 leading-relaxed">
              Adjust sliders below to customize the weights for constituency prioritization formulas. Changes recalculate ward and category priority rankings immediately.
            </p>

            <div className="space-y-4 font-mono text-xs">
              {/* demographic slider */}
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                <div className="flex justify-between font-bold text-slate-700 mb-1">
                  <span>Vulnerable Demographic Profile (S_d)</span>
                  <span className="text-emerald-700">{weights.demographic}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={weights.demographic}
                  onChange={(e) => handleWeightChange('demographic', Number(e.target.value))}
                  className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-emerald-700"
                />
                <span className="text-[10px] text-slate-400 block mt-1">Weight for population density, SC/ST concentrations, and households.</span>
              </div>

              {/* infrastructure slider */}
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                <div className="flex justify-between font-bold text-slate-700 mb-1">
                  <span>Existing Infrastructure Gap (S_i)</span>
                  <span className="text-emerald-700">{weights.infrastructure}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={weights.infrastructure}
                  onChange={(e) => handleWeightChange('infrastructure', Number(e.target.value))}
                  className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-emerald-700"
                />
                <span className="text-[10px] text-slate-400 block mt-1">Weight for missing local water, power, roads, or safety networks.</span>
              </div>

              {/* urgency slider */}
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                <div className="flex justify-between font-bold text-slate-700 mb-1">
                  <span>Complaint Urgency / Hazard Levels (S_u)</span>
                  <span className="text-emerald-700">{weights.urgency}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={weights.urgency}
                  onChange={(e) => handleWeightChange('urgency', Number(e.target.value))}
                  className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-emerald-700"
                />
                <span className="text-[10px] text-slate-400 block mt-1">Weight for safety hazards, environmental distress, or critical alerts.</span>
              </div>

              {/* volume slider */}
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                <div className="flex justify-between font-bold text-slate-700 mb-1">
                  <span>Complaint Volume in Region (S_v)</span>
                  <span className="text-emerald-700">{weights.volume}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={weights.volume}
                  onChange={(e) => handleWeightChange('volume', Number(e.target.value))}
                  className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-emerald-700"
                />
                <span className="text-[10px] text-slate-400 block mt-1">Weight for cumulative count of filed complaints per region.</span>
              </div>
            </div>
          </div>

          {/* Google Workspace Sync Centre Panel */}
          <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-xs space-y-4">
            <h3 className="font-display font-semibold text-sm text-slate-800 flex items-center space-x-2">
              <Sparkles className="h-4 w-4 text-emerald-600 animate-pulse" />
              <span>Google Workspace Sync Centre</span>
            </h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Connect your official Member of Parliament (MP) Google account to unlock sheets export, site visit scheduling via Google Calendar, and citizen dispatches via Gmail.
            </p>

            {isGoogleLoading ? (
              <div className="flex items-center justify-center p-4">
                <Loader2 className="h-6 w-6 animate-spin text-emerald-700" />
              </div>
            ) : isGoogleConnected ? (
              <div className="space-y-3">
                <div className="bg-emerald-50 border border-emerald-100 p-3.5 rounded-xl flex items-center justify-between">
                  <div className="space-y-0.5">
                    <span className="text-[10px] uppercase font-bold text-emerald-600 block tracking-wider">SIGNED IN WITH GOOGLE</span>
                    <span className="font-bold text-slate-800 text-xs block">{googleUser?.displayName || 'MP Office'}</span>
                    <span className="text-[11px] text-slate-500 block font-mono">{googleUser?.email}</span>
                  </div>
                  <button
                    onClick={handleGoogleDisconnect}
                    className="bg-white border border-slate-200 hover:bg-slate-50 text-slate-600 text-[10px] font-bold px-2.5 py-1.5 rounded-lg cursor-pointer transition-colors"
                  >
                    Disconnect
                  </button>
                </div>

                <div className="bg-slate-50 border border-slate-150 p-3 rounded-xl space-y-2 text-[11px] font-mono font-medium text-slate-600">
                  <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-wider text-slate-400 border-b border-slate-200 pb-1.5 mb-1.5">
                    <span>ACTIVE GOOGLE PLUGINS</span>
                    <span className="text-emerald-600">ACTIVE</span>
                  </div>
                  <div className="flex items-center space-x-2 text-slate-700">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                    <span>Google Sheets Export & Bulk Ingestion</span>
                  </div>
                  <div className="flex items-center space-x-2 text-slate-700">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                    <span>Google Calendar Site Inspection Planner</span>
                  </div>
                  <div className="flex items-center space-x-2 text-slate-700">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                    <span>Gmail Official Resolution Dispatcher</span>
                  </div>
                </div>

                {/* Dispatch weekly summary trigger */}
                <button
                  onClick={() => {
                    setReportRecipient('');
                    setReportSubject('CitizenVoice - Executive Constituency Prioritization Summary');
                    setIsEmailModalOpen(true);
                  }}
                  className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs py-2 px-4 rounded-xl flex items-center justify-center space-x-2 shadow-xs cursor-pointer transition-colors"
                >
                  <Mail className="h-3.5 w-3.5" />
                  <span>Email Priority Report to Officers</span>
                </button>
              </div>
            ) : (
              <button onClick={handleGoogleConnect} className="gsi-material-button w-full cursor-pointer">
                <div className="gsi-material-button-state"></div>
                <div className="gsi-material-button-content-wrapper">
                  <div className="gsi-material-button-icon">
                    <svg version="1.1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" style={{ display: 'block' }}>
                      <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"></path>
                      <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"></path>
                      <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"></path>
                      <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"></path>
                    </svg>
                  </div>
                  <span className="gsi-material-button-contents">Sign in with Google Workspace</span>
                </div>
              </button>
            )}
          </div>
        </div>

        {/* Right Grid: Theme analysis or AI clusters */}
        <div className="lg:col-span-5 space-y-6">
          
          {/* Theme clusters list */}
          <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-xs h-full flex flex-col">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-display font-semibold text-sm text-slate-800 flex items-center space-x-2">
                <Sparkles className="h-4 w-4 text-emerald-600" />
                <span>AI Theme Clusters & Synopses</span>
              </h3>
              <span className="bg-emerald-50 text-emerald-700 text-[10px] font-mono px-2 py-0.5 rounded-full border border-emerald-100">
                Llama 3 + ChromaDB
              </span>
            </div>

            <p className="text-xs text-slate-500 mb-5 leading-relaxed">
              Consolidated community needs groups generated automatically via semantic clustering. Review summaries or trigger live AI consolidation.
            </p>

            <div className="space-y-4 flex-1 overflow-y-auto max-h-[720px] pr-1">
              {clusters.map((c) => (
                <div key={c.id} className="border border-slate-100 bg-slate-50/50 rounded-xl p-4 space-y-3 relative hover:border-slate-200 transition-colors">
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="text-[10px] uppercase tracking-wider font-mono bg-slate-200 text-slate-600 font-bold px-2 py-0.5 rounded-md">
                        {c.category}
                      </span>
                      <h4 className="font-display font-bold text-slate-800 text-sm mt-1.5 leading-tight">
                        {c.title}
                      </h4>
                    </div>
                    <div className="text-right">
                      <span className="text-[10px] text-slate-400 font-mono font-bold block">PRIORITY</span>
                      <span className="text-red-600 font-mono font-extrabold text-sm">{c.priorityScore} Pts</span>
                    </div>
                  </div>

                  <p className="text-xs text-slate-600 leading-relaxed font-medium">
                    {c.summary}
                  </p>

                  <div className="flex items-center justify-between border-t border-slate-100 pt-3">
                    <span className="text-[10px] font-mono font-semibold text-slate-400 uppercase">
                      Consolidated: {c.grievanceIds.length} submissions
                    </span>
                    
                    <button
                      onClick={() => handleSummarizeTheme(c.id)}
                      disabled={isSummarizingClusterId === c.id}
                      className="text-[10px] font-bold text-emerald-700 hover:text-emerald-800 flex items-center space-x-1 border border-emerald-100 bg-white hover:bg-emerald-50/50 px-2 py-1 rounded-lg cursor-pointer transition-colors"
                    >
                      {isSummarizingClusterId === c.id ? (
                        <>
                          <RefreshCw className="h-3 w-3 animate-spin" />
                          <span>Summarizing...</span>
                        </>
                      ) : (
                        <>
                          <Sparkles className="h-3 w-3" />
                          <span>Summarize with AI</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Control Deck: Strategic Competing Proposals & Ingested Grievance Ledger */}
      <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-xs" id="mp-control-deck">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between border-b border-slate-100 pb-5 mb-6 gap-4">
          <div>
            <h2 className="font-display font-extrabold text-lg text-slate-800 tracking-tight flex items-center space-x-2">
              <Sliders className="h-5 w-5 text-emerald-700" />
              <span>Constituency Allocation & Triage Matrix</span>
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              Select strategic action views. We weigh competing public proposals against census data, hard demographic metrics, and live complaints.
            </p>
          </div>

          {/* Tab Selector */}
          <div className="flex items-center space-x-1.5 bg-slate-100 p-1 rounded-xl">
            <button
              onClick={() => setActiveTab('proposals')}
              className={`px-4 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer flex items-center space-x-2 ${
                activeTab === 'proposals'
                  ? 'bg-emerald-700 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-800 hover:bg-slate-50'
              }`}
            >
              <Sparkles className="h-3.5 w-3.5" />
              <span>Proposed Projects Comparison Matrix</span>
            </button>
            <button
              onClick={() => setActiveTab('grievances')}
              className={`px-4 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer flex items-center space-x-2 ${
                activeTab === 'grievances'
                  ? 'bg-emerald-700 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-800 hover:bg-slate-50'
              }`}
            >
              <ListFilter className="h-3.5 w-3.5" />
              <span>Citizen Grievance Ledger ({filteredGrievances.length})</span>
            </button>
          </div>
        </div>

        {/* PROPOSALS COMPARISON MATRIX TAB */}
        {activeTab === 'proposals' && (
          <div className="space-y-6">
            <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-emerald-950 text-white p-5 rounded-xl border border-slate-800 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div className="space-y-1">
                <span className="bg-emerald-500/20 text-emerald-300 text-[9px] font-bold px-2 py-0.5 rounded-full border border-emerald-500/30 uppercase tracking-wider font-mono">
                  Dynamic Decision Engine
                </span>
                <h3 className="font-display font-bold text-base tracking-tight text-white">
                  Weighing Competing Projects Against Real-time Needs
                </h3>
                <p className="text-xs text-slate-300 max-w-2xl leading-relaxed">
                  These proposals are automatically scored on-the-fly. Slide the prioritization weights above to observe how school upgrades, vocational centres, and sewer networks align with your strategic focus.
                </p>
              </div>
              <div className="bg-white/5 border border-white/10 p-3 rounded-lg text-center shrink-0">
                <span className="text-[10px] text-slate-400 block font-semibold uppercase tracking-wider">Active Sliders Bias</span>
                <span className="font-mono text-emerald-400 text-sm font-extrabold">
                  {weights.demographic}:{weights.infrastructure}:{weights.urgency}:{weights.volume}
                </span>
              </div>
            </div>

            {/* Google Sheets Integration actions for Proposals */}
            <div className="bg-white border border-slate-100 p-4 rounded-xl shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="space-y-1">
                <span className="text-xs font-bold text-slate-700 flex items-center space-x-1.5">
                  <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>
                  <span>Google Sheets Sync Office</span>
                </span>
                <p className="text-[10px] text-slate-400">
                  Directly export competing proposals to Google Sheets or import external draft matrices to seed your dashboard.
                </p>
              </div>
              
              <div className="flex items-center space-x-2.5 w-full sm:w-auto">
                {isGoogleConnected ? (
                  <>
                    <button
                      onClick={handleExportProposalsToSheets}
                      disabled={exportingSheets}
                      className="flex-1 sm:flex-initial bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 font-bold text-xs px-4 py-2 rounded-lg flex items-center justify-center space-x-1.5 transition-colors cursor-pointer"
                    >
                      {exportingSheets ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <Download className="h-3.5 w-3.5" />
                      )}
                      <span>Export Proposals Matrix</span>
                    </button>
                    
                    <button
                      onClick={() => {
                        setImportError(null);
                        setImportSuccessCount(null);
                        setIsImportModalOpen(true);
                      }}
                      className="flex-1 sm:flex-initial bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 font-bold text-xs px-4 py-2 rounded-lg flex items-center justify-center space-x-1.5 transition-colors cursor-pointer"
                    >
                      <ArrowUpRight className="h-3.5 w-3.5" />
                      <span>Import Proposals</span>
                    </button>
                  </>
                ) : (
                  <button
                    onClick={handleGoogleConnect}
                    className="w-full sm:w-auto bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold text-xs px-4 py-2 rounded-lg flex items-center justify-center space-x-1.5 transition-colors cursor-pointer"
                  >
                    <Sparkles className="h-3.5 w-3.5 text-slate-400" />
                    <span>Connect Google Workspace to Sync Sheets</span>
                  </button>
                )}
              </div>
            </div>

            {/* Export Success Message Banners */}
            {exportResult && (
              <div className="bg-emerald-50 border border-emerald-100 p-4 rounded-xl flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
                <div className="space-y-0.5">
                  <p className="font-bold text-emerald-800">✓ Competing Proposals Exported Successfully</p>
                  <p className="text-[10px] text-slate-500 font-mono">Spreadsheet ID: {exportResult.spreadsheetId}</p>
                </div>
                <a
                  href={exportResult.spreadsheetUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-3 py-1.5 rounded-lg flex items-center space-x-1 cursor-pointer transition-colors"
                >
                  <Eye className="h-3.5 w-3.5" />
                  <span>Open Google Sheet</span>
                </a>
              </div>
            )}

            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
              {proposals.map((p) => {
                const regName = regions.find(r => r.id === p.regionId)?.name.split(' - ')[0] || "Constituency";
                const isApproved = p.status === 'Approved';
                const isRejected = p.status === 'Rejected';

                return (
                  <div 
                    key={p.id}
                    className={`border rounded-2xl p-5 flex flex-col justify-between transition-all duration-300 relative ${
                      isApproved 
                        ? 'bg-emerald-50/40 border-emerald-300 ring-2 ring-emerald-500/10' 
                        : isRejected 
                        ? 'bg-slate-50/50 border-slate-200 opacity-65'
                        : 'bg-white border-slate-150 hover:shadow-md'
                    }`}
                  >
                    {/* Upper Badges & Score */}
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <span className="font-mono text-[10px] font-bold text-slate-400 bg-slate-100 px-2 py-0.5 rounded-md border border-slate-200">
                            {p.id}
                          </span>
                          <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider font-mono ${
                            isApproved ? 'bg-emerald-600 text-white' :
                            isRejected ? 'bg-red-50 text-red-700 border border-red-100' :
                            'bg-amber-50 text-amber-700 border border-amber-100'
                          }`}>
                            {p.status === 'Approved' ? '✓ Approved & Funded' : p.status === 'Rejected' ? '✗ Rejected' : '⧗ Under Review'}
                          </span>
                        </div>

                        {/* Priority Alignment Score representation */}
                        <div className="text-right">
                          <div className="flex items-center space-x-2">
                            <span className="text-[10px] text-slate-400 font-mono font-bold uppercase tracking-wider">Dynamic Score</span>
                            <span className={`font-mono font-extrabold text-base md:text-lg ${
                              p.priorityScore >= 75 ? 'text-red-600' :
                              p.priorityScore >= 50 ? 'text-amber-600' : 'text-emerald-700'
                            }`}>
                              {p.priorityScore} Pts
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Main Title and Description */}
                      <div className="space-y-1.5">
                        <h4 className="font-display font-extrabold text-slate-800 text-base tracking-tight leading-snug">
                          {p.title}
                        </h4>
                        <p className="text-xs text-slate-500 leading-relaxed">
                          {p.description}
                        </p>
                      </div>

                      {/* Demographics / Hard Metrics / Real Evidence Grid */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-slate-50 p-3.5 rounded-xl border border-slate-150/70">
                        <div className="space-y-1">
                          <span className="text-slate-400 block text-[9px] uppercase tracking-wider font-extrabold font-mono">
                            {p.demographicContext.label1}
                          </span>
                          <span className="text-xs font-bold text-slate-700 block">
                            {p.demographicContext.value1}
                          </span>
                        </div>
                        <div className="space-y-1">
                          <span className="text-slate-400 block text-[9px] uppercase tracking-wider font-extrabold font-mono">
                            {p.demographicContext.label2}
                          </span>
                          <span className="text-xs font-bold text-slate-700 block leading-tight">
                            {p.demographicContext.value2}
                          </span>
                        </div>
                      </div>

                      {/* Dynamic Weighted breakdown slider components representation */}
                      <div className="space-y-1.5">
                        <span className="text-[9px] uppercase text-slate-400 font-extrabold tracking-wider font-mono block">Dynamic Input Parameters alignment</span>
                        <div className="grid grid-cols-4 gap-1.5 text-center text-[9px] font-mono">
                          <div className="bg-slate-100 p-1 rounded-sm">
                            <span className="text-slate-400 block font-bold">Demog</span>
                            <span className="text-slate-700 font-extrabold">{p.baseMetrics.demographicImpact}</span>
                          </div>
                          <div className="bg-slate-100 p-1 rounded-sm">
                            <span className="text-slate-400 block font-bold">Census</span>
                            <span className="text-slate-700 font-extrabold">{p.baseMetrics.infrastructureGap}</span>
                          </div>
                          <div className="bg-slate-100 p-1 rounded-sm">
                            <span className="text-slate-400 block font-bold">Urgency</span>
                            <span className="text-slate-700 font-extrabold">{p.baseMetrics.urgencyHazard}</span>
                          </div>
                          <div className="bg-slate-100 p-1 rounded-sm">
                            <span className="text-slate-400 block font-bold">Demand</span>
                            <span className="text-slate-700 font-extrabold">{p.baseMetrics.demandVolume}</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Bottom Metadata & MP Actions */}
                    <div className="border-t border-slate-150/60 mt-5 pt-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                      <div className="flex flex-col text-xs text-slate-400">
                        <span className="font-mono text-[10px] font-bold block uppercase tracking-wider">Region Target</span>
                        <span className="font-bold text-slate-700 block">{regName} ({p.category})</span>
                        <span className="font-mono font-extrabold text-emerald-800 text-[11px] block mt-0.5">Budget: {p.estimatedCost} Lakhs INR</span>
                      </div>

                      {/* Admin Decisions */}
                      <div className="flex items-center space-x-1.5 self-end sm:self-center">
                        <button
                          onClick={() => handleProposalAction(p.id, 'Rejected')}
                          className={`text-[10px] font-bold px-3 py-1.5 rounded-lg border transition-all cursor-pointer ${
                            isRejected 
                              ? 'bg-red-500 border-red-500 text-white'
                              : 'bg-white border-slate-200 text-red-600 hover:bg-red-50'
                          }`}
                        >
                          Reject
                        </button>
                        <button
                          onClick={() => handleProposalAction(p.id, 'Draft')}
                          className={`text-[10px] font-bold px-3 py-1.5 rounded-lg border transition-all cursor-pointer ${
                            p.status === 'Draft'
                              ? 'bg-amber-500 border-amber-500 text-white font-extrabold'
                              : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                          }`}
                        >
                          Under Review
                        </button>
                        <button
                          onClick={() => handleProposalAction(p.id, 'Approved')}
                          className={`text-[10px] font-bold px-3 py-1.5 rounded-lg border transition-all cursor-pointer flex items-center space-x-1 ${
                            isApproved
                              ? 'bg-emerald-600 border-emerald-600 text-white font-extrabold'
                              : 'bg-white border-slate-200 text-emerald-700 hover:bg-emerald-50'
                          }`}
                        >
                          <span>Approve & Fund</span>
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* DETAILED CITIZEN GRIEVANCE LEDGER TAB */}
        {activeTab === 'grievances' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-slate-100 pb-4 gap-4">
              <div>
                <h3 className="font-display font-semibold text-sm text-slate-800 flex items-center space-x-2">
                  <ListFilter className="h-4 w-4 text-emerald-600" />
                  <span>Prioritized Ingested Grievance Ledger</span>
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  Factual ledger sorted live by dynamic AI / demographic Priority Scores. Click on entries to order work.
                </p>
              </div>

              <div className="flex flex-wrap gap-2 items-center">
                {/* Category filter */}
                <select
                  value={filterCategory}
                  onChange={(e) => setFilterCategory(e.target.value)}
                  className="bg-slate-50 border border-slate-200 text-xs font-semibold rounded-xl px-3 py-2 text-slate-700 cursor-pointer"
                >
                  <option value="All">All Categories</option>
                  <option value="Roads">Roads & Connects</option>
                  <option value="Water">Water Gaps</option>
                  <option value="Power">Power Lines</option>
                  <option value="Sanitation">Sanitation</option>
                  <option value="Safety">Safety</option>
                </select>

                {/* CSV export */}
                <a
                  href="/api/reports/export"
                  className="bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold px-4 py-2 rounded-xl flex items-center space-x-1.5 transition-colors cursor-pointer shadow-xs"
                >
                  <Download className="h-3.5 w-3.5" />
                  <span>Export CSV</span>
                </a>
              </div>
            </div>

            {/* List of complaints */}
            {isLoading ? (
              <div className="py-20 flex items-center justify-center">
                <Loader2 className="h-8 w-8 text-slate-400 animate-spin" />
              </div>
            ) : filteredGrievances.length === 0 ? (
              <div className="py-20 text-center text-slate-400 text-xs italic">
                No active citizen grievances recorded matching this region or category filter.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredGrievances.map((g) => {
                  const regName = regions.find(r => r.id === g.regionId)?.name.split(' - ')[0] || "Constituency";
                  return (
                    <div 
                      key={g.id} 
                      className={`border rounded-xl p-5 flex flex-col justify-between transition-all ${
                        g.status === 'Completed' 
                          ? 'bg-slate-50/50 border-slate-100 opacity-70' 
                          : 'bg-white border-slate-100 hover:shadow-md hover:border-slate-200'
                      }`}
                    >
                      <div className="space-y-3">
                        {/* Header: ID, Category & Priority score */}
                        <div className="flex items-start justify-between">
                          <span className="font-mono font-bold text-slate-400 text-[11px]">
                            {g.id}
                          </span>
                          <div className="flex items-center space-x-1.5 font-mono text-[10px] font-bold">
                            <span className={`px-2 py-0.5 rounded-full ${
                              g.status === 'Completed' ? 'bg-slate-100 text-slate-500' :
                              g.status === 'Work Ordered' ? 'bg-blue-50 text-blue-700' :
                              g.status === 'Under Review' ? 'bg-amber-50 text-amber-700' :
                              'bg-slate-100 text-slate-700'
                            }`}>
                              {g.status}
                            </span>
                            <span className="bg-red-50 text-red-600 border border-red-100 px-2 py-0.5 rounded-full">
                              {g.priorityScore} Pts
                            </span>
                          </div>
                        </div>

                        {/* Title */}
                        <h4 className="font-display font-extrabold text-slate-800 text-sm leading-tight">
                          {g.title}
                        </h4>

                        {/* Meta info: region & category */}
                        <div className="flex items-center space-x-2 text-[10px] font-mono text-slate-400 font-semibold uppercase">
                          <span>{g.category}</span>
                          <span>•</span>
                          <span>{regName}</span>
                        </div>

                        {/* Translated description */}
                        <p className="text-xs text-slate-600 leading-relaxed font-medium line-clamp-3">
                          "{g.description}"
                        </p>

                        {/* Photo preview check */}
                        {g.photoUrl && (
                          <div className="relative aspect-video rounded-lg overflow-hidden border border-slate-100 shadow-xs">
                            <img src={g.photoUrl} alt="Visual Grievance Proof" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                          </div>
                        )}
                      </div>

                      <div className="border-t border-slate-100 mt-4 pt-3.5 flex items-center justify-between">
                        <div>
                          <span className="text-slate-400 font-mono text-[10px] font-bold block">CITIZEN</span>
                          <span className="text-xs font-bold text-slate-700 block max-w-[90px] truncate">{g.citizenName}</span>
                        </div>

                        <div className="flex items-center space-x-1.5">
                          {isGoogleConnected && (
                            <button
                              onClick={() => {
                                setSelectedCalendarGrievance(g);
                                setInspectionTitle(`Site Inspection: ${g.title}`);
                                setInspectionDesc(`Field visit regarding Citizen Grievance ID: ${g.id}.\n\nCategory: ${g.category}\nCitizen: ${g.citizenName}\n\nDescription: ${g.description}`);
                                setCalendarSuccess(null);
                              }}
                              className="bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 font-bold text-[10px] px-2.5 py-1.5 rounded-lg flex items-center space-x-1 cursor-pointer transition-colors"
                              title="Schedule on Google Calendar"
                            >
                              <Calendar className="h-3 w-3" />
                              <span>Schedule</span>
                            </button>
                          )}

                          <button
                            onClick={() => {
                              setSelectedGrievance(g);
                              setModalStatus(g.status);
                              setModalComment(g.mpComment || '');
                              setCitizenEmail('');
                              setSendGmailNotification(false);
                            }}
                            className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-[10px] px-3 py-1.5 rounded-lg flex items-center space-x-1 cursor-pointer transition-colors"
                          >
                            <Wrench className="h-3 w-3" />
                            <span>Take Action</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>

      {/* TAKE ACTION SLIDEOUT MODAL DIALOG */}
      {selectedGrievance && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-xs font-mono">
          <div className="bg-white rounded-2xl border border-slate-100 shadow-xl max-w-lg w-full overflow-hidden flex flex-col">
            <div className="bg-slate-900 text-white p-4 flex items-center justify-between">
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400">Constituency Secretariat Action Panel</span>
                <h3 className="font-display font-extrabold text-base tracking-tight text-white mt-0.5">
                  Actioning Grievance {selectedGrievance.id}
                </h3>
              </div>
              <button 
                onClick={() => setSelectedGrievance(null)}
                className="text-slate-400 hover:text-white cursor-pointer font-bold font-mono text-lg p-1"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSaveAction} className="p-5 space-y-4">
              {/* Submission details */}
              <div className="bg-slate-50 border border-slate-200 p-3.5 rounded-xl space-y-1.5 text-xs text-slate-700 leading-relaxed font-semibold">
                <span className="text-slate-400 block text-[9px] uppercase tracking-wider font-bold">Citizen Description</span>
                "{selectedGrievance.description}"
                {selectedGrievance.originalDescription && selectedGrievance.originalDescription !== selectedGrievance.description && (
                  <span className="text-[10px] text-slate-400 italic block mt-1">
                    * Translated automatically from {selectedGrievance.language}.
                  </span>
                )}
              </div>

              {/* Status option selector */}
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                  Update Action Status
                </label>
                <select
                  value={modalStatus}
                  onChange={(e) => setModalStatus(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 py-2.5 px-3 text-xs text-slate-800 bg-white font-semibold cursor-pointer"
                >
                  <option value="Pending">Pending Assignment</option>
                  <option value="Under Review">Secretariat Under Review</option>
                  <option value="Work Ordered">Executive Work Ordered (Funds Allocated)</option>
                  <option value="Completed">Work Completed (Issue Resolved)</option>
                </select>
              </div>

              {/* Secretariat comment statements */}
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                  Secretariat Action Statement (Becomes visible to Citizen in tracker)
                </label>
                <textarea
                  rows={4}
                  required
                  placeholder="e.g. Sanctioned transformation of transformer under PWD code 10392. Work starting next Tuesday..."
                  value={modalComment}
                  onChange={(e) => setModalComment(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 p-3 text-xs text-slate-800 placeholder-slate-400 focus:outline-hidden focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 leading-relaxed"
                />
              </div>

              {/* Gmail Dispatch Section */}
              {isGoogleConnected ? (
                <div className="bg-emerald-50/50 border border-emerald-100 p-4 rounded-xl space-y-3">
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="gmail-notify"
                      checked={sendGmailNotification}
                      onChange={(e) => setSendGmailNotification(e.target.checked)}
                      className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 h-4 w-4 cursor-pointer"
                    />
                    <label htmlFor="gmail-notify" className="text-xs font-bold text-slate-700 cursor-pointer flex items-center space-x-1">
                      <Mail className="h-3.5 w-3.5 text-emerald-600" />
                      <span>Dispatch official update to citizen via Gmail</span>
                    </label>
                  </div>
                  {sendGmailNotification && (
                    <div className="space-y-1">
                      <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                        Citizen Email Address
                      </label>
                      <input
                        type="email"
                        required
                        placeholder="citizen@example.com"
                        value={citizenEmail}
                        onChange={(e) => setCitizenEmail(e.target.value)}
                        className="w-full rounded-lg border border-slate-200 py-2 px-3 text-xs font-semibold focus:border-emerald-600 focus:outline-hidden"
                      />
                      <span className="text-[9px] text-slate-400 block font-mono">Official resolution note is included in the email dynamically.</span>
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-[10px] text-slate-400 italic">
                  💡 Tip: Sign in with Google at the left pane to automatically send resolution updates via Gmail and schedule site visits on your Google Calendar.
                </p>
              )}

              {/* Buttons */}
              <div className="pt-2 flex justify-end space-x-2 text-xs">
                <button
                  type="button"
                  onClick={() => setSelectedGrievance(null)}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 font-semibold hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isUpdatingStatus}
                  className="bg-emerald-700 hover:bg-emerald-800 text-white font-bold px-5 py-2.5 rounded-xl shadow-xs flex items-center space-x-1.5 cursor-pointer transition-colors"
                >
                  {isUpdatingStatus ? (
                    <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <>
                      <Save className="h-3.5 w-3.5" />
                      <span>Save Action note</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* GOOGLE SHEETS IMPORT MODAL */}
      {isImportModalOpen && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-xs font-mono">
          <div className="bg-white rounded-2xl border border-slate-100 shadow-xl max-w-lg w-full overflow-hidden flex flex-col">
            <div className="bg-slate-900 text-white p-4 flex items-center justify-between">
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400">Google Sheets Ingestion</span>
                <h3 className="font-display font-extrabold text-base tracking-tight text-white mt-0.5">
                  Import Draft Proposals
                </h3>
              </div>
              <button 
                onClick={() => setIsImportModalOpen(false)}
                className="text-slate-400 hover:text-white cursor-pointer font-bold font-mono text-lg p-1"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-5 space-y-4">
              <p className="text-xs text-slate-500 leading-relaxed font-semibold">
                Provide either a Google Spreadsheet ID or paste the full browser URL of the Google Sheet. The sheet must contain a header row with column mappings (e.g. Title, Category, Budget, Description, demographicImpact, infrastructureGap, urgencyHazard, demandVolume).
              </p>

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                    Spreadsheet ID or URL
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. https://docs.google.com/spreadsheets/d/1A2B3C..."
                    value={importSheetId}
                    onChange={(e) => setImportSheetId(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 p-3 text-xs text-slate-800 placeholder-slate-400 focus:outline-hidden font-mono font-medium"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                    Sheet Range Selection
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Sheet1!A1:I20"
                    value={importRange}
                    onChange={(e) => setImportRange(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 p-3 text-xs text-slate-800 placeholder-slate-400 focus:outline-hidden font-mono font-medium"
                  />
                  <span className="text-[9px] text-slate-400 mt-1 block">Specify the sheet name and range grid mapping including headers.</span>
                </div>
              </div>

              {importError && (
                <div className="bg-red-50 border border-red-100 p-3 rounded-xl text-red-700 text-xs font-semibold">
                  Error: {importError}
                </div>
              )}

              {importSuccessCount !== null && (
                <div className="bg-emerald-50 border border-emerald-100 p-3 rounded-xl text-emerald-800 text-xs font-bold">
                  ✓ Successfully imported {importSuccessCount} proposal records from Google Sheets! Recalculating allocations.
                </div>
              )}

              <div className="pt-2 flex justify-end space-x-2 text-xs">
                <button
                  type="button"
                  onClick={() => setIsImportModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 font-semibold hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  onClick={handleImportProposals}
                  disabled={importingSheets}
                  className="bg-emerald-700 hover:bg-emerald-800 text-white font-bold px-5 py-2.5 rounded-xl shadow-xs flex items-center space-x-1.5 cursor-pointer transition-colors"
                >
                  {importingSheets ? (
                    <>
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      <span>Ingesting rows...</span>
                    </>
                  ) : (
                    <>
                      <ArrowUpRight className="h-3.5 w-3.5" />
                      <span>Execute Import</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* GOOGLE CALENDAR SCHEDULER MODAL */}
      {selectedCalendarGrievance && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-xs font-mono">
          <div className="bg-white rounded-2xl border border-slate-100 shadow-xl max-w-lg w-full overflow-hidden flex flex-col">
            <div className="bg-slate-900 text-white p-4 flex items-center justify-between">
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400">Google Calendar Visit Planner</span>
                <h3 className="font-display font-extrabold text-base tracking-tight text-white mt-0.5">
                  Schedule Site Visit
                </h3>
              </div>
              <button 
                onClick={() => setSelectedCalendarGrievance(null)}
                className="text-slate-400 hover:text-white cursor-pointer font-bold font-mono text-lg p-1"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleScheduleInspection} className="p-5 space-y-4">
              <div className="bg-amber-50/50 border border-amber-200 p-3.5 rounded-xl text-xs text-slate-700 font-medium leading-relaxed">
                Creating calendar event for grievance <strong className="font-mono">{selectedCalendarGrievance.id}</strong>: "{selectedCalendarGrievance.title}".
              </div>

              <div className="space-y-3 text-xs">
                <div>
                  <label className="block font-bold text-slate-500 uppercase tracking-wider mb-1">
                    Event Title
                  </label>
                  <input
                    type="text"
                    required
                    value={inspectionTitle}
                    onChange={(e) => setInspectionTitle(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 p-2.5 text-xs text-slate-800 font-semibold"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-500 uppercase tracking-wider mb-1">
                    Description & Context
                  </label>
                  <textarea
                    rows={3}
                    required
                    value={inspectionDesc}
                    onChange={(e) => setInspectionDesc(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 p-2.5 text-xs text-slate-800 font-semibold leading-relaxed"
                  />
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="block font-bold text-slate-500 uppercase tracking-wider mb-1">
                      Inspection Date
                    </label>
                    <input
                      type="date"
                      required
                      value={inspectionDate}
                      onChange={(e) => setInspectionDate(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 p-2 text-xs text-slate-800 font-semibold"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-500 uppercase tracking-wider mb-1">
                      Start Time
                    </label>
                    <input
                      type="time"
                      required
                      value={inspectionStartTime}
                      onChange={(e) => setInspectionStartTime(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 p-2 text-xs text-slate-800 font-semibold"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-500 uppercase tracking-wider mb-1">
                      End Time
                    </label>
                    <input
                      type="time"
                      required
                      value={inspectionEndTime}
                      onChange={(e) => setInspectionEndTime(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 p-2 text-xs text-slate-800 font-semibold"
                    />
                  </div>
                </div>
              </div>

              {calendarSuccess && (
                <div className="bg-emerald-50 border border-emerald-100 p-3.5 rounded-xl text-xs space-y-1 font-semibold leading-normal">
                  <p className="font-bold text-emerald-800">✓ Visit Scheduled on Google Calendar!</p>
                  <a
                    href={calendarSuccess.htmlLink}
                    target="_blank"
                    rel="noreferrer"
                    className="text-emerald-700 underline font-bold block font-mono text-[10px] truncate"
                  >
                    View Calendar Invitation
                  </a>
                </div>
              )}

              <div className="pt-2 flex justify-end space-x-2 text-xs">
                <button
                  type="button"
                  onClick={() => setSelectedCalendarGrievance(null)}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 font-semibold hover:bg-slate-50 cursor-pointer"
                >
                  Close
                </button>
                <button
                  type="submit"
                  disabled={isSchedulingCalendar}
                  className="bg-emerald-700 hover:bg-emerald-800 text-white font-bold px-5 py-2.5 rounded-xl shadow-xs flex items-center space-x-1.5 cursor-pointer transition-colors"
                >
                  {isSchedulingCalendar ? (
                    <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <>
                      <Calendar className="h-3.5 w-3.5" />
                      <span>Invite via Google Calendar</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EMAIL SUMMARY REPORT MODAL */}
      {isEmailModalOpen && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-xs font-mono">
          <div className="bg-white rounded-2xl border border-slate-100 shadow-xl max-w-lg w-full overflow-hidden flex flex-col">
            <div className="bg-slate-900 text-white p-4 flex items-center justify-between">
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400">Gmail Officer Dispatch</span>
                <h3 className="font-display font-extrabold text-base tracking-tight text-white mt-0.5">
                  Send Prioritization Report
                </h3>
              </div>
              <button 
                onClick={() => setIsEmailModalOpen(false)}
                className="text-slate-400 hover:text-white cursor-pointer font-bold font-mono text-lg p-1"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSendGmailReport} className="p-5 space-y-4">
              <p className="text-xs text-slate-500 leading-relaxed font-semibold">
                Compile and dispatch a formatted status brief containing all **Approved Proposals** and the **Top 5 active high-priority grievances** to administrative officers and department heads.
              </p>

              <div className="space-y-3 text-xs">
                <div>
                  <label className="block font-bold text-slate-500 uppercase tracking-wider mb-1">
                    Officer's Email Address
                  </label>
                  <input
                    type="email"
                    required
                    placeholder="department-head@government.in"
                    value={reportRecipient}
                    onChange={(e) => setReportRecipient(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 p-2.5 text-xs text-slate-800 font-semibold"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-500 uppercase tracking-wider mb-1">
                    Email Subject Line
                  </label>
                  <input
                    type="text"
                    required
                    value={reportSubject}
                    onChange={(e) => setReportSubject(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 p-2.5 text-xs text-slate-800 font-semibold"
                  />
                </div>
              </div>

              {reportSuccess && (
                <div className="bg-emerald-50 border border-emerald-100 p-3 rounded-xl text-emerald-800 text-xs font-bold">
                  ✓ Priority Report dispatched successfully via Gmail! Executive table included.
                </div>
              )}

              <div className="pt-2 flex justify-end space-x-2 text-xs">
                <button
                  type="button"
                  onClick={() => setIsEmailModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 font-semibold hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={sendingReport}
                  className="bg-slate-900 hover:bg-slate-800 text-white font-bold px-5 py-2.5 rounded-xl shadow-xs flex items-center space-x-1.5 cursor-pointer transition-colors"
                >
                  {sendingReport ? (
                    <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <>
                      <Mail className="h-3.5 w-3.5" />
                      <span>Send Brief via Gmail</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
