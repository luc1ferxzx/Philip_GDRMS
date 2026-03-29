-----

# 🛰️ PHILIP: Philippine Hazard Intelligence and Response Platform

**PHILIP** is a cutting-edge, geospatial AI-driven disaster response system designed to provide **personalized risk assessment** and **offline-first evacuation guidance** for citizens in the Philippines.

Unlike generic municipal-wide alerts, PHILIP calculates risk at the **individual level** using real-time GPS data, elevation models, and predictive machine learning to provide actionable intelligence when seconds matter most.

-----

## 🚩 The Problem

The Philippines faces an average of **20 typhoons annually**. Current systems often fail due to:

  * **Generic Alerts:** One-size-fits-all broadcasts that ignore individual GPS/elevation risks.
  * **No Prediction:** Reactive alerts sent only after the hazard has occurred.
  * **Infrastructure Failure:** Systems become useless when cell towers are destroyed during a storm.
  * **LGU Blindness:** Local Government Units lack real-time data on citizen locations during crises.

-----

## ✨ Key Differentiators

  * **Personalized Risk Scoring:** Real-time calculation (0.0 - 1.0) based on your exact altitude, proximity to rivers, and slope angle.
  * **Predictive AI:** Machine Learning models (RandomForest/LogisticRegression) providing **30–90 minute advance warnings**.
  * **Offline-First Architecture:** Full risk calculation and map navigation functionality **without internet access** using cached MBTiles and SQLite shapefiles.
  * **Hazard-Aware Routing:** Navigation that dynamically avoids flooded roads and landslide zones using a modified Dijkstra algorithm.

-----

## 🛠️ Tech Stack

### **Frontend & Mobile**

| Layer | Technology | Key Features |
| :--- | :--- | :--- |
| **Mobile App** | Flutter (Dart) | GPS tracking (30s intervals), Offline Maps, Push Notifications |
| **LGU Dashboard** | React (TypeScript) | Citizen Heatmaps, WebSocket Updates, Broadcast Alert System |
| **Mapping** | Leaflet.js / Flutter Map | 3D Buildings, Hazard Overlays (Flood, Landslide, Fault Lines) |

### **Backend & Intelligence**

| Layer | Technology | Key Features |
| :--- | :--- | :--- |
| **API Gateway** | Node.js (Express) | JWT Auth, Redis Caching, Socket.io for Real-time sync |
| **Risk Engine** | Python (FastAPI) | GeoPandas, Scikit-Learn (Flood & Landslide ML Predictors) |
| **Database** | **PostgreSQL 15** | **PostGIS** (Spatial), TimescaleDB (Time-series), pgRouting |

-----

## 📂 System Architecture

```text
PHILIP/
├── philip-backend/         # Node.js API Gateway & Auth
├── philip-risk-engine/     # Python FastAPI + ML Risk Calculation
├── philip-mobile-app/      # Flutter Application (Android/iOS)
├── philip-lgu-dashboard/   # React Dashboard for DRRM Officers
└── data/                   # NAMRIA DEMs, NOAH Shapefiles, OSM Road Networks
```

-----

## ⚙️ Setup & Installation

### 1\. Database Setup

Requires PostgreSQL with PostGIS and pgRouting extensions.

```sql
CREATE EXTENSION postgis;
CREATE EXTENSION pgrouting;
CREATE EXTENSION timescaledb;
```

### 2\. Backend API (`/philip-backend`)

1.  `npm install`
2.  Configure `.env` with your **PostgreSQL** and **Redis** credentials.
3.  `node server.js`

### 3\. AI Risk Engine (`/philip-risk-engine`)

1.  `pip install -r requirements.txt`
2.  `uvicorn main:app --port 8001`

### 4\. Mobile App (`/philip-mobile-app`)

1.  Ensure Flutter is installed.
2.  `flutter pub get`
3.  `flutter run`

-----

## 🗺️ Implementation Roadmap

  - [x] **Phase 1: MVP** - PostgreSQL/PostGIS setup, Basic Risk Service, GPS tracking.
  - [ ] **Phase 2: Expansion** - ML Model training, Offline map caching, LGU React Dashboard.
  - [ ] **Phase 3: Regional Rollout** - Metro Cebu deployment, WebSocket integration.
  - [ ] **Phase 4: Nationwide** - NDRRMC integration and scale to 1M+ concurrent users.

-----

## 👨‍💻 The Team (\!false flag)

  * **Philip** — Lead Developer & Geospatial Architect
  * **Team Members** — BSIT-3, University of Cebu - Lapu-Lapu and Mandaue (UCLM)

-----

## 📄 Academic Context

This project is an **Undergraduate Capstone Thesis** aimed at transforming disaster response from reactive to proactive. It is designed for real-world deployment, hackathon excellence, and potential startup incubation.

-----
