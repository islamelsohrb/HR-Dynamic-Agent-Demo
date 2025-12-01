# Delytic — AI Data Analyst Agent

A full-stack AI-powered data analytics platform enabling users to upload datasets, preprocess them, interact with an intelligent multi‑tool agent, generate visual insights, and build automated dashboards — all through natural language.

---

## 🚀 Overview

**Delytic** transforms raw data into insights using an AI agent powered by Gemini 2.5 Flash and a set of analytical tools (SQL, statistics, chart generation, Python execution, etc.).

Users can:

* Upload CSV/XLSX files
* Clean & preprocess datasets
* Run analysis using natural language
* Generate charts
* Build dashboards automatically
* Save and load their dashboards

This makes Delytic a modern alternative to tools like Excel, Power BI, and Jupyter — but with an AI-first workflow.

---

## 🧩 Features

### 🔼 Dataset Upload

* Upload CSV/XLSX
* Preview first rows
* Automatic column detection
* Preprocessing:

  * Remove columns
  * Handle missing values
  * Normalize/select data types

### 🤖 AI Agent

A multi-tool agent capable of:

* SQL querying
* Statistical analysis
* Data summarization
* Chart creation
* Insights extraction
* Multi-step reasoning

### 📊 Chart Generation

Supports:

* Bar charts
* Line charts
* Scatter plots
* Histograms
* Heatmaps

### 📈 Dashboard Builder

* Convert charts into a dashboard layout
* Drag & drop positioning
* Save dashboard to Supabase
* Load existing dashboards

---

## 🏗️ Architecture

### **Frontend**

* Next.js 15
* TypeScript
* Tailwind v4
* Framer Motion
* Chart.js / Recharts

### **Backend**

* Supabase (Auth, DB, Storage)
* Gemini 2.5 Flash
* Multi-tool agent framework

### **Agent Tools**

* `run_sql(query)` — SQL analysis
* `compute_stats(columns)` — numeric stats
* `generate_chart(type, x, y)` — chart config JSON
* `summarize_dataframe()` — dataset summary
* `python_tool(code)` — (optional) advanced Python

---

## 📁 Folder Structure

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
├── public/
│   └── logo.svg
│
└── README.md
```

---

## ⚙️ Installation

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

## 🧪 Running the Agent

The agent is triggered through the chat UI.
It sends the conversation → dataset → user query to the orchestrator → which selects the correct tools.

Each tool returns JSON, and the agent composes a final answer.

---

## 🧲 Roadmap

* Predictive modeling tool
* Time-series forecasting
* Notebook export (ipynb)
* Multi-agent orchestration
* External data source connectors (Postgres / BigQuery)
* Team collaboration mode

---

## 📝 License

Released under **Attribution 4.0 International (CC BY 4.0)**.

---

## 🔗 Links

**Kaggle Submission:** [Add link](https://www.kaggle.com/competitions/agents-intensive-capstone-project/writeups/an-enterprise-multi-tool-ai-analyst-for-automated)
**GitHub Repository:** [Add repo link](https://github.com/islamelsohrb/HR-Dynamic-Agent-Demo)


---

## 👤 Author

**Mohamed Abuhamida** <br><br>
**Esalm Sohrob**

Thank you for checking out Delytic! Let me know if you'd like to contribute or collaborate.
