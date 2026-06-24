export interface SubCase {
  id: string;
  title: string;
  summary: string;
  description: string;
  businessValue: string[];
  techStack: string[];
}

export interface UseCase {
  id: string;
  title: string;
  category: string;
  summary: string;
  description: string;
  businessValue: string[];
  techStack: string[];
  limitations: string[];
  complianceFlags: string[];
  subCases?: SubCase[];
  owner?: string;
  lastUpdated?: string;
}

export const usecases: UseCase[] = [
  {
    id: "contract-management",
    title: "Contract Management Agent",
    category: "Operations & Admin",

    summary:
      "Automatically extracts, centralises, and monitors contracts — flagging expiry dates, compliance gaps, and anomalies before they become problems.",
    description:
      "Contracts are stored across folders, emails and shared drives, causing missed deadlines and compliance blind spots. The Contract Management Agent uses Document AI to extract key data on intake, stores everything in a centralised searchable repository, and continuously monitors expiry dates, renewal windows and compliance obligations. Rule-based validation flags missing clauses or anomalies, while an LLM layer generates on-demand summaries for any contract in the system.",
    businessValue: [
      "Zero manual data entry for contract intake",
      "No missed renewals or lapsed agreements across communities",
      "Centralised visibility across the entire portfolio",
      "Proactive compliance management with auto-alerts before deadlines",
      "Significant staff time savings on administrative overhead",
    ],
    techStack: ["Copilot AI", "Document AI", "SharePoint", "Automated Workflows", "LLM", "Rule-Based Validation"],
    limitations: [
      "Requires structured or semi-structured contract formats for best extraction accuracy",
      "Custom clause libraries needed per community for anomaly detection",
      "Human review recommended before acting on auto-flagged anomalies",
    ],
    complianceFlags: ["Document Retention Policy", "PII Handling", "Role-Based Access"],
    owner: "NuAig",
    lastUpdated: "2025-06-01",
  },
  {
    id: "root-cause-analysis",
    title: "Root Cause Analysis Agent",
    category: "Resident Care",

    summary:
      "Correlates data across EMR, staffing, and medication systems to generate structured incident reports with root-cause hypotheses and prevention strategies.",
    description:
      "Incident investigations today require manual correlation across EMR records, staffing logs, sensor data and medication records — a slow and often incomplete process. The RCA Agent automatically pulls from all connected systems simultaneously, identifies environmental and contextual risk factors, and produces a structured incident report with a root-cause hypothesis. Critically, it also proactively flags similar risk patterns before new incidents occur, enabling a shift from reactive documentation to proactive prevention.",
    businessValue: [
      "Faster, more thorough multi-factor incident analysis",
      "Actionable prevention strategies derived from data patterns",
      "Significant reduction in incident recurrence rates",
      "Reduced documentation burden on clinical staff",
      "Regulatory-ready incident reports generated automatically",
    ],
    techStack: ["Copilot AI", "EMR Integration", "Risk Reporting Software", "LLM", "RAG", "Knowledge Graph"],
    limitations: [
      "Requires API or data-export access to EMR, staffing, and medication systems",
      "AI-generated hypotheses must be validated by a qualified clinician",
      "Knowledge graph quality depends on quality of incident history data",
    ],
    complianceFlags: ["HIPAA", "PHI Handling", "Clinical Data Governance", "Audit Logging"],
    owner: "NuAig",
    lastUpdated: "2025-06-01",
  },
  {
    id: "prior-authorization",
    title: "Prior Authorization AI Agent",
    category: "Resident Care",

    summary:
      "AI agent automates Medicare Part B prior authorization — validating ICD-10 codes, verifying provider NPIs, and cross-referencing live CMS national and local coverage policies before submission.",
    description:
      "Prior authorization for Medicare Part B services requires clinical staff to manually look up ICD-10 diagnosis and procedure codes, verify ordering and rendering provider NPI credentials against the CMS registry, cross-reference applicable National Coverage Determinations (NCDs) and Local Coverage Determinations (LCDs) from the relevant Medicare Administrative Contractor (MAC), and compile everything into a payer submission packet. The Prior Auth Agent automates this end-to-end: it queries the ICD-10 MCP for accurate billable codes, validates provider NPIs via the NPI Registry MCP, checks Part B coverage policy via the CMS Coverage MCP, and generates a complete, evidence-backed prior auth request — flagging non-covered services and coverage gaps before submission to prevent denials.",
    businessValue: [
      "Prior auth submission time cut from hours to under minutes",
      "Higher first-pass approval rates through pre-validated codes and live coverage checks",
      "Reduced clinical and billing staff burden on administrative paperwork",
      "Non-covered services flagged before submission — avoids costly claim denials",
      "Full audit trail of ICD-10 lookups, NPI checks, and NCD/LCD verifications",
      "Always current — queries live CMS Coverage and NPI Registry data, not stale spreadsheets",
    ],
    techStack: [
      "Claude AI Agent",
      "ICD-10 MCP (Diagnosis & Procedure Codes)",
      "NPI Registry MCP (Provider Verification)",
      "CMS Coverage MCP (NCDs / LCDs / MACs)",
      "LLM",
      "RAG",
    ],
    limitations: [
      "Covers Medicare Part B (medical services) only — Part D oral drugs and Part A inpatient require separate workflows",
      "AI-generated authorization requests require clinical review and provider sign-off before payer submission",
      "LCD policies are MAC-jurisdiction-specific; the correct contractor must be identified per community location",
      "NPI Registry confirms CMS enrollment but not active state licensure or facility-level credentialing",
    ],
    complianceFlags: ["HIPAA", "PHI Handling", "Medicare Billing Compliance (CMS)", "Clinical Oversight Required", "Audit Logging"],
    owner: "NuAig",
    lastUpdated: "2025-06-01",
  },
  {
    id: "voice-ai-suite",
    title: "Voice AI Suite",
    category: "Resident Care",

    summary:
      "Seven intelligent voice agents across resident care, caregiver wellbeing, and family communication — replacing manual workflows with natural language AI calls.",
    description:
      "The Voice AI Suite deploys seven distinct voice AI agents across four service areas: resident care (wellness check-ins, post-visit feedback, meal preferences, service tickets, grocery ordering), caregiver support (mental health & fatigue surveys), and family communication (authenticated wellness update calls). Each agent uses natural language to collect data, take action, and escalate to staff — enabling 24/7 consistent engagement without added headcount.",
    businessValue: [
      "Eliminates manual data collection across resident care touchpoints",
      "24/7 consistent resident engagement without added staff headcount",
      "Earlier detection of health concerns through continuous monitoring",
      "Reduced inbound calls to front desk via proactive outreach",
      "Data-driven insights across satisfaction, wellness, and operations",
    ],
    techStack: ["Voice AI", "Speech-to-Text", "NLP", "LLM", "Sentiment Analysis"],
    limitations: [
      "Residents with hearing or speech impairments need alternative channels",
      "Call schedules must respect resident preferences and rest times",
      "EMR and system integrations must be configured per community and sub-use-case",
    ],
    complianceFlags: ["HIPAA", "Resident Consent Required", "PHI Handling", "Employee Privacy (caregiver)"],
    subCases: [
      {
        id: "voice-post-visit-feedback",
        title: "Post-Visit Feedback via Voice AI",
        summary: "Automated satisfaction call after family visits; flags negative sentiment for follow-up.",
        description:
          "Visit feedback is rarely collected systematically today, leaving quality signals unmeasured and concerns unaddressed. An automated voice call is placed to the resident within hours of a visit, gathering conversational satisfaction feedback. AI detects sentiment in real-time, escalates negative feedback to management, and aggregates results into community-level satisfaction dashboards. Families can optionally receive a follow-up call for their perspective.",
        businessValue: [
          "Consistent post-visit satisfaction data collected automatically",
          "Faster identification and resolution of resident concerns",
          "Improved family engagement and trust in the community",
          "Management visibility into satisfaction trends across communities",
        ],
        techStack: ["Voice AI", "Speech-to-Text", "NLP", "Sentiment Analysis", "Power BI"],
      },
      {
        id: "voice-wellness-checkin",
        title: "Resident Wellness Voice Check-in",
        summary: "Daily or weekly AI calls monitor mood, pain, sleep, and appetite — escalating concerns in real time.",
        description:
          "Manual wellness rounds are time-consuming and inconsistent. AI places automated daily or weekly wellness calls asking residents natural language questions about mood, pain, sleep and appetite. Responses are converted to structured health data in real-time, with tone analysis flagging emotional distress or cognitive changes. Escalation paths route concerning responses directly to clinical staff, and longitudinal data builds in each resident's profile.",
        businessValue: [
          "Earlier detection of health concerns before they escalate",
          "Reduced burden on clinical staff for routine check-ins",
          "Consistent monitoring across all residents at scale",
          "Longitudinal trend data enabling proactive care planning",
        ],
        techStack: ["Voice AI", "Speech-to-Text", "NLP", "LLM", "Sentiment Analysis", "EMR Integration"],
      },
      {
        id: "voice-caregiver-survey",
        title: "Caregiver Mental Health & Fatigue Survey",
        summary: "60–90 sec post-shift voice check-ins surface burnout signals early — anonymously.",
        description:
          "Caregiver burnout goes unreported until attrition occurs. A short weekly voice check-in after each shift asks caregivers about energy levels, stress, workload and morale. Emotional tone analysis detects early burnout signals. An anonymous mode ensures psychologically safe responses. Escalation triggers when stress thresholds are breached, and aggregate trend reports surface team-level fatigue patterns for supervisors.",
        businessValue: [
          "Early identification of burnout before attrition occurs",
          "Actionable team morale insights for supervisors",
          "Reduced caregiver turnover through proactive intervention",
          "Caregiver wellbeing culture backed by data",
        ],
        techStack: ["Voice AI", "Speech-to-Text", "NLP", "Sentiment Analysis", "LLM", "HR Dashboard Integration"],
      },
      {
        id: "voice-meal-preference",
        title: "Voice-Based Meal Preference Selection",
        summary: "Residents choose meals via voice before each meal period; preferences route directly to the kitchen.",
        description:
          "Paper menus and manual entry create delays and errors. Automated voice calls before each meal period present today's menu options in natural, conversational language. Residents select meals and portions verbally. Preferences are routed directly to the kitchen management system, dietary restrictions are cross-checked automatically, and preference trends inform future menu planning.",
        businessValue: [
          "Reduced meal errors and dietary incidents",
          "Higher resident satisfaction with personalised dining",
          "Staff time saved from manual menu collection rounds",
          "Richer data for personalised nutrition planning",
        ],
        techStack: ["Voice AI", "Speech-to-Text", "NLP", "LLM", "Kitchen Management System Integration"],
      },
      {
        id: "voice-service-ticket",
        title: "Voice-Based Service Ticket Raising",
        summary: "Residents report maintenance issues hands-free; tickets are auto-created and routed with follow-up.",
        description:
          "Residents struggle to navigate forms or apps, leading to unreported issues. Residents call or activate an in-room voice device to report an issue. The AI gathers issue type, location, urgency and timing, then creates and categorises a ticket in the work order system. The department is notified immediately with priority level, and the resident receives a voice confirmation with an estimated response time.",
        businessValue: [
          "Faster issue reporting and resolution cycle",
          "No issues lost due to verbal-only reporting",
          "Resident empowerment regardless of tech literacy",
          "Operational visibility into maintenance demand patterns",
        ],
        techStack: ["Voice AI", "Speech-to-Text", "NLP", "LLM", "Work Order System Integration"],
      },
      {
        id: "voice-grocery-ordering",
        title: "Voice-Assisted Grocery Ordering",
        summary: "Spoken grocery preferences are consolidated across residents and sent to delivery partners automatically.",
        description:
          "Grocery coordination for residents is staff-intensive with limited personalisation. Residents speak their grocery preferences via voice call or in-room device. The AI builds a structured shopping list, cross-checks against dietary restrictions and care plan guidelines, consolidates orders across all residents for community delivery, and sends the final order to the preferred grocery partner. Residents receive a voice confirmation with estimated delivery.",
        businessValue: [
          "Staff time saved on manual grocery coordination",
          "More personalised and accurate orders per resident",
          "Reduced errors from manual list-taking",
          "Improved resident independence and dignity",
        ],
        techStack: ["Voice AI", "Speech-to-Text", "NLP", "LLM", "Grocery API Integration", "Delivery Workflow Automation"],
      },
      {
        id: "voice-family-checkin",
        title: "AI Family Check-up Calls",
        summary: "Scheduled AI calls to authenticated family members keep them informed and reduce inbound front-desk calls.",
        description:
          "Families need regular updates but staff capacity for routine calls is limited. AI places scheduled calls to designated family members, with identity verified via a pre-set authorisation code before any resident information is shared. The AI answers frequent questions using the community knowledge base (RAG), flags significant health or behavioural changes, supports multiple languages, and escalates to a human staff member if the family expresses concern.",
        businessValue: [
          "Consistent, proactive family communication at scale",
          "Significant reduction in inbound calls to front desk",
          "Greater family confidence and satisfaction",
          "Multilingual support for diverse family populations",
        ],
        techStack: ["Voice AI", "Speech-to-Text", "NLP", "LLM", "RAG", "Multi-language Support", "Auth Code Verification"],
      },
    ],
    owner: "NuAig",
    lastUpdated: "2025-06-01",
  },
  {
    id: "concierge-agent",
    title: "Concierge Agent (MS Teams Copilot)",
    category: "Staff & Workforce",

    summary:
      "A knowledge assistant embedded in MS Teams that lets concierge staff query protocols, retrieve SOPs, exchange handover notes, and escalate alerts — without leaving their existing workflow.",
    description:
      "Concierge staff rely on scattered knowledge documents, tribal knowledge and manual handovers, causing delays and inconsistency in resident services. The Concierge Agent is built on Microsoft Copilot Studio and embedded in MS Teams, giving staff a natural language interface to the community's full knowledge base. Staff can ask about visitor policies, emergency procedures, dining schedules and more. Structured handover notes are captured in Teams and surfaced contextually for incoming shift staff. Unresolved requests or protocol gaps are automatically flagged to supervisors.",
    businessValue: [
      "Faster staff response to resident and visitor queries",
      "Consistent knowledge access across all shifts and staff members",
      "Better shift handovers with structured, searchable notes",
      "Reduced time spent hunting through shared drives for SOPs",
      "Automatic escalation prevents issues falling through shift changes",
    ],
    techStack: ["Microsoft Copilot Studio", "Power Virtual Agents", "SharePoint", "MS Teams", "RAG", "LLM"],
    limitations: [
      "Requires Microsoft 365 E3/E5 or Copilot Studio licensing",
      "Knowledge base must be structured and maintained in SharePoint",
      "Teams-only deployment — not available on mobile without further configuration",
    ],
    complianceFlags: ["Microsoft 365 Data Governance", "SOC2", "Role-Based Access", "Audit Logging"],
    owner: "NuAig",
    lastUpdated: "2025-06-01",
  },
  {
    id: "newsletter-generator",
    title: "AI-Powered Newsletter Generator",
    category: "Operations & Admin",

    summary:
      "Five-stage pipeline: domain crawl → AI filtering → LLM summarisation → branded HTML newsletter → automated email delivery. Zero manual research required.",
    description:
      "Staying current on fast-moving topics — clinical care, regulation, technology, and senior living trends — requires constant manual research. The Newsletter Generator automates this entirely: a Serper API domain crawl fetches new content matching user-specified keywords; an LLM filtering prompt removes ads, duplicates and low-quality sources; a second LLM pass summarises each article in plain language; a branded HTML template assembles the newsletter; and an automated dispatch engine delivers to the configured mailing list on schedule.",
    businessValue: [
      "Zero manual research — fully automated from crawl to inbox",
      "Always up-to-date on chosen topics without staff effort",
      "Configurable for any domain: clinical, regulatory, tech, senior living",
      "Consistent brand presentation in every edition",
      "Scales to any number of topics, communities, or audience segments",
    ],
    techStack: ["Serper API", "LLM Filtering", "LLM Summarisation", "HTML Templates", "Email Dispatch Automation"],
    limitations: [
      "Serper API costs scale with crawl frequency and keyword breadth",
      "AI summarisation may occasionally miss nuance in highly technical articles",
      "Mailing list management and unsubscribe flows require separate configuration",
    ],
    complianceFlags: ["CAN-SPAM / Email Compliance", "Third-Party API Data Usage", "Unsubscribe Mechanism Required"],
    owner: "NuAig",
    lastUpdated: "2025-06-01",
  },
  {
    id: "prs-financial-review",
    title: "PRS Financial Review",
    category: "Sales & Admissions",

    summary:
      "AI-powered year-by-year financial modelling qualifies senior living prospects with actuarial-grade projections, survivability scenarios, and instant YES/CAUTION/NO decisions.",
    description:
      "Determining whether a prospect can financially sustain senior living costs for life requires complex, time-consuming manual calculations across assets, income, expenses, and life expectancy. The PRS Financial Review platform automates this entirely: AI runs year-by-year projections across all asset classes, survivability modelling auto-adjusts when a spouse passes, and a what-if scenario engine lets advisors model alternate financial futures in real time. Qualification decisions — YES, CAUTION, or NO — are returned instantly with colour-coded confidence levels. All SSN data is encrypted with AES-256-GCM.",
    businessValue: [
      "Instant qualification decisions replacing days of manual analysis",
      "Higher confidence in move-in decisions with actuarial-grade projections",
      "Multi-community visibility for Org Admins across the entire portfolio",
      "HIPAA-compliant data security with role-based access controls",
      "Dramatic reduction in financial risk from under-qualified residents",
    ],
    techStack: [
      "AI Analysis Engine",
      "Next.js",
      "PostgreSQL (Supabase)",
      "AES-256-GCM Encryption",
      "Role-Based Access Control",
      "Actuarial Life Expectancy Models",
    ],
    limitations: [
      "Requires accurate and complete financial data input from the prospect",
      "Projections are estimates — do not constitute certified financial advice",
      "Must be used alongside a qualified financial or admissions advisor",
    ],
    complianceFlags: ["HIPAA", "PII Handling", "AES-256 Encryption", "SSN Data", "Role-Based Access", "SOC2"],
    owner: "NuAig",
    lastUpdated: "2025-06-01",
  },
  {
    id: "holleran-survey-automation",
    title: "Holleran Survey Automation",
    category: "Quality & Compliance",

    summary:
      "Vision AI digitises handwritten Holleran paper surveys automatically, then NLP extracts themes and sentiment — turning weeks of manual entry into hours of actionable insight.",
    description:
      "Holleran collects high-value resident and family satisfaction surveys on paper. Data entry is manual, slow and error-prone, delaying insights that could improve care quality. This use case deploys Vision AI / OCR to digitise handwritten surveys automatically, then applies NLP to extract sentiment, themes and key concerns from open-ended responses. AI clustering groups feedback by category — dining, care, activities, facilities — and trend dashboards surface recurring issues across communities over time.",
    businessValue: [
      "Near-zero manual data entry — from weeks to hours per survey cycle",
      "Faster time-to-insight enabling proactive service recovery",
      "Consistent, unbiased analysis across all resident feedback",
      "Benchmarking across communities to identify best practices",
      "Higher satisfaction scores driven by data-informed improvements",
    ],
    techStack: ["Vision AI", "OCR", "NLP", "Sentiment Analysis", "LLM", "AI Clustering", "Trend Dashboard & Alerting"],
    limitations: [
      "Handwriting quality and form consistency affect OCR accuracy",
      "Requires human QA on a sample of digitised surveys to validate accuracy",
      "Trend analysis requires a minimum volume of survey data to be meaningful",
    ],
    complianceFlags: ["HIPAA", "Resident PHI", "Survey Data Retention Policy", "Benchmarking Data Anonymisation"],
    owner: "NuAig",
    lastUpdated: "2025-06-01",
  },
];
