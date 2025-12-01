# 🏆 **Delytic — Enterprise Multi‑Agent AI Analyst for Automated Data Intelligence**

Upload your data → Let the agent clean, analyze, visualize, and build dashboards — **exactly like a real data analyst, but fully automated.**

---

## 🚀 **Overview**

**Delytic** is a full‑stack, multi‑tool AI Data Analyst built to turn raw datasets into actionable insights using natural language only.

Powered by **Gemini 2.5 Flash**, Delytic performs:

* Intelligent data preprocessing
* SQL querying & validation
* Statistical computation
* Automated chart generation
* Executive‑grade insights
* Autonomous dashboard creation & updates

It is a modern AI‑first alternative to Excel, Power BI, Looker, and Jupyter — but accessible to *any* user, even with zero technical skills.

---

## ✨ **Key Features**

### 🔼 **Dataset Upload & Preprocessing**

* CSV/XLSX upload
* Automatic column detection
* Missing‑value handling
* Data type normalization
* Column removal & renaming
* Duplicate detection & cleanup

### 🤖 **AI Agent (Multi‑Tool Orchestrator)**

A reasoning‑capable agent that can:

* Run SQL queries
* Compute statistics
* Detect trends & patterns
* Identify anomalies
* Summarize datasets
* Generate visual charts
* Build dashboards
* Explain insights in natural language

### 📊 **Chart Generation**

Supports multiple visualization types:

* Bar, Line, Pie
* Scatter, Heatmap
* Histograms
* Area & Trend charts

Charts are produced via structured JSON tool calls.

### 📈 **Dashboard Builder**

* Drag‑and‑drop layout
* Auto‑generated insight cards
* Save dashboards to Supabase
* Load dashboards anytime

---

## 🧩 **Architecture**

```yaml
architecture:
  orchestrator_agent:
    role: "Understands intent, selects tools, performs multi‑step reasoning"
  tools:
    - run_sql: "Executes SQL with safety checks"
    - compute_stats: "Descriptive & numeric analysis"
    - generate_chart: "Produces chart config JSON"
    - summarize_dataframe: "Schema, anomalies, column types"
    - python_tool: "Advanced logic (optional)"

  backend:
    platform: "Supabase"
    features:
      - dataset storage
      - auth
      - dashboard persistence

  frontend:
    stack:
      - Next.js 15
      - TypeScript
      - Tailwind v4
      - Framer Motion
      - Chart.js / Recharts
```

---

## 🛠 **Tech Stack**

### **Frontend**

* Next.js 15
* TypeScript
* Tailwind CSS v4
* Framer Motion
* Chart.js / Recharts

### **Backend**

* Supabase (Auth + DB + Storage)
* Supabase Edge Functions

### **AI Layer**

* Gemini 2.5 Flash (LLM reasoning + structured tool use)
* Multi‑tool agent loop

---

## 🔍 **End‑to‑End Workflow**

1. User uploads dataset
2. Agent analyzes schema & data types
3. User asks a question (e.g., *"Why is attrition high in Sales?"*)
4. Agent performs multi‑step reasoning:

   * SQL filtering
   * Statistical checks
   * Trend computation
   * Optional chart generation
5. Agent composes final insights
6. User turns charts into a dashboard
7. Dashboard is saved & can be re‑opened anytime

---

## 📁 **Folder Structure**

```
root/
│
├── app/
│   ├── upload/
│   ├── chat/
│   ├── dashboard/
│   ├── layout.tsx
│   └── globals.css
│
├── agent/
│   ├── generateAgentResponse.ts
│   ├── agentLoop.ts
│   └── tools/
│       ├── sqlTool.ts
│       ├── statsTool.ts
│       ├── chartTool.ts
│       └── pythonTool.ts
│
├── components/
│   ├── UploadDropzone.tsx
│   ├── ChatBubble.tsx
│   ├── ChartRenderer.tsx
│   └── DashboardCard.tsx
│
├── lib/
│   ├── supabaseClient.ts
│   └── utils.ts
│
└── public/
    └── logo.svg
```

---

## 🧪 **Running the Project**

```bash
npm install
npm run dev
```

### Environment Variables

Create `.env.local`:

```
NEXT_PUBLIC_SUPABASE_URL=your_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
GEMINI_API_KEY=your_key
```

---

## 🧲 **Roadmap**

* Predictive modeling agent
* Time‑series forecasting
* Notebook export (Markdown → PDF → Jupyter)
* Multi‑agent pipelines
* External database connectors (Postgres / BigQuery)
* Team collaboration dashboards
* Auto‑insights monitoring agent

---

## 📝 **License**

Released under **Attribution 4.0 International (CC BY 4.0)**.

---

## 👤 **Authors**

**Mohamed Abuhamida**
**Islam Elsohrb**

---

## 🔗 **Links**

* Kaggle Submission: *https://www.kaggle.com/competitions/agents-intensive-capstone-project/writeups/an-enterprise-multi-tool-ai-analyst-for-automated*
* GitHub Repo: *https://github.com/islamelsohrb/HR-Dynamic-Agent-Demo*

---

Thank you for checking out **Delytic**!
Feel free to collaborate, extend, or contribute to the project.
