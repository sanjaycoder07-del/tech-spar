# CitizenVoice: MP Constituency Development Prioritizer & Allocation System

CitizenVoice is an AI-powered, multi-lingual administrative prioritisation and community feedback ingestion platform designed specifically for Members of Parliament (MPs) and their secretariat team.

## 🌟 The Problem
MPs receive development requests through many disjointed channels—public meetings, physical letters, social media posts, outdated grievance portals, and direct constituency representations. At the same time, local development plans contain dozens of competing proposed projects.

Historically, there has been **no objective, data-driven way** to consolidate citizen feedback, spot recurring thematic needs, and weigh competing proposals against real-world demands (e.g., comparing school upgrades and travel-distance data against a proposed vocational center).

## 🚀 The Challenge & Our Solution
We built a **multilingual AI platform** where citizens can submit development suggestions via voice, text, photos, or messaging channels.

The platform provides a comprehensive administrative control deck that:
1. **Analyzes and translates submissions** instantly using Gemini AI models.
2. **Groups citizen needs semantically** into theme-based clusters (e.g. "Rampur Water Sanitation", "Adarsh Roadways").
3. **Maps demand hotspots** using a reactive, color-coded interactive SVG map.
4. **Calculates dynamically weighted AI priority scores** (0-100) combining Census demographics, infrastructure coverage gaps, safety hazard urgency, and cumulative complaint volume.
5. **Compares competing strategic proposals** (e.g., school upgrades, vocational centres, clean water grids) with live priority scorecards and funding controls to assist the MP in making optimized spending decisions.

---

## 🔒 Administrative Login Credentials (MP Dashboard)
To access the Member of Parliament Secretariat action board, configure prioritization sliders, and fund/approve competing proposals, use the secure login gateway:

- **Username:** `mp_admin`
- **Password:** `MP_Secure_2026`

*You can sign in by switching to the **MP Dashboard** tab at the top-right of the header.*

---

## 🛠️ Features & Architecture
- **Voice Ingestion & Translation:** Multilingual transcribing and localizing.
- **Dynamic Prioritization Sliders:** Interactive slider deck allowing real-time score adjustments based on changing administrative parameters.
- **AI-Consolidated Cluster Summaries:** Leverages LLM models to condense high-volume grievances into discrete, action-oriented summaries.
- **Durable Full-Stack Ingress:** Built with an Express server proxying Vite for production-grade routing and zero client-key exposure.
