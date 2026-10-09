# SignalBridge Azure Transit Recovery Desk

## Forward Deployed Engineering capstone for Beatrice Kungu

**Industry:** Public transportation operations  
**Status:** Planned  
**Recommended build:** 8 weeks part-time, 9-11 hours per week  
**Estimated effort:** 75-90 hours  
**Cloud boundary:** Microsoft Azure and Microsoft Fabric only; no AWS or Google Cloud  
**Data boundary:** Public transit/weather feeds and synthetic agency data only

## One-sentence pitch

SignalBridge is an Azure-only operations workspace that detects transit disruptions from live API data, calculates their passenger and network impact with transparent rules, drafts evidence-grounded recovery options, routes every operational decision to a human dispatcher, and measures whether service recovered faster.

## Why this project fits Beatrice

This is a new industry, but it uses skills Beatrice already demonstrates:

1. **Microsoft Fabric and Power BI** for real-time and historical operational analytics.
2. **Python** for API clients, validation, transformations, testing, and business logic.
3. **Azure SQL** for workflow state, approvals, feedback, and audit history.
4. **Incident triage** for prioritizing disruptions and escalating ambiguous cases.
5. **IAM and RBAC** for separating dispatcher, supervisor, auditor, and administrator actions.
6. **GRC and evidence mapping** for traceable decisions, policy citations, retention, and handoff.
7. **Executive storytelling** for explaining operational value instead of presenting model metrics alone.

It does not reuse CISA, vulnerability data, healthcare data, or a cybersecurity customer scenario.

## Fictional customer and problem

**Customer:** A regional transit authority operating bus and light-rail routes.  
**Primary user:** Service-control dispatcher.  
**Approver:** Operations supervisor.  
**Other stakeholders:** Customer communications, maintenance, accessibility, safety, data engineering, and executive operations.

The authority receives vehicle positions, trip updates, cancellations, and alerts through GTFS and GTFS-Realtime feeds. Weather alerts, crew availability, vehicle maintenance, transfer dependencies, and accessibility requirements live elsewhere. During a disruption, dispatchers manually assemble the evidence, estimate the network impact, compare recovery options, write a rider message, and seek approval. The slowest part is not seeing that a delay exists; it is turning fragmented data into a coordinated decision.

### Target outcome

Reduce median time from disruption detection to an approved recovery plan while preserving human dispatch authority, accessible-service requirements, citations, role-based access, and a complete audit trail.

## MVP user journey

1. A Python collector reads one public GTFS schedule and GTFS-Realtime feed plus National Weather Service alerts.
2. Azure Event Hubs receives normalized events. Fabric Eventstream routes them into an Eventhouse for fast time-based analysis and into OneLake for historical reporting.
3. Deterministic rules calculate an impact score using delay, cancellations, affected trips, peak period, transfer-hub importance, accessibility impact, weather, and available recovery resources.
4. A dispatcher opens a disruption case and sees the source events, impact factors, affected routes, and missing information.
5. A Microsoft Foundry agent retrieves approved operating procedures and communications templates from Azure AI Search, then drafts two recovery options and a rider notice with citations.
6. The dispatcher edits, rejects, escalates, or sends a recommendation to the supervisor. The agent cannot control vehicles, dispatch crews, or publish messages.
7. The approved simulated action and its evidence are recorded in Azure SQL.
8. Power BI reports detection time, time-to-plan, time-to-approval, passenger-delay proxy, overrides, policy compliance, model quality, and cost per reviewed disruption.

## Azure and Fabric architecture

| Layer | Microsoft service | Purpose |
|---|---|---|
| API ingestion | Python Azure Function | Call public GTFS/GTFS-Realtime and weather endpoints; apply timeouts, retries, validation, and freshness checks. |
| Event transport | Azure Event Hubs | Buffer normalized trip, vehicle, alert, and weather events. |
| Streaming analytics | Fabric Eventstream and Eventhouse | Route, transform, store, and query time-based operational events with KQL. |
| Historical analytics | Fabric Lakehouse in OneLake | Store schedules, route dimensions, replay data, synthetic staffing/maintenance data, and curated outcome tables. |
| Operational store | Azure SQL Database | Store disruption cases, workflow state, approvals, feedback, idempotency keys, and audit references. |
| Reporting | Power BI semantic model | Combine live operational measures with historical service-recovery performance. |
| Knowledge retrieval | Azure AI Search | Index approved standard operating procedures, escalation rules, accessibility requirements, and message templates. |
| Agent | Microsoft Foundry Agent Service | Draft grounded recovery options, identify missing evidence, and call only allow-listed read or draft tools. |
| Application | Python/FastAPI on Azure Container Apps | Enforce workflow rules, authorization, approval transitions, and API contracts. |
| Security | Microsoft Entra ID, managed identities, Azure RBAC, and Key Vault | Authenticate users and services without credentials in source code. |
| Observability | Azure Monitor, Application Insights, and Log Analytics | Record latency, failures, feed freshness, tool calls, token use, and safe business events. |
| Infrastructure | Bicep | Reproduce Azure development and demonstration environments. |

### Architecture flow

```text
GTFS schedule + GTFS-Realtime + weather API
                     |
              Python Azure Function
                     |
              Azure Event Hubs
                     |
       Fabric Eventstream -> Eventhouse -> Real-time operations view
                     |             |
                     +---------- OneLake / Lakehouse -> Power BI

Dispatcher -> Container Apps API -> Azure SQL workflow and audit store
                     |
           Microsoft Foundry Agent Service
                     |
               Azure AI Search
                     |
        approved procedures and templates

Cross-cutting: Entra ID | managed identity | Key Vault | Azure Monitor | Bicep
```

## API learning path inside the project

Because Beatrice already knows Python and is learning APIs, API engineering is a visible part of the capstone rather than hidden setup work.

### Stage 1: Reliable HTTP client

- `requests` or `httpx`
- Query parameters and request headers
- Status codes and structured errors
- Connect/read timeouts
- Retries with exponential backoff and jitter
- Rate-limit handling
- Secrets and configuration outside source code

### Stage 2: Transit data contracts

- Static GTFS ZIP files and CSV relationships
- GTFS-Realtime Protocol Buffer messages
- Trip updates, vehicle positions, and service alerts
- Feed timestamps, freshness, duplicates, and missing entities
- Pydantic models for the normalized internal event schema

### Stage 3: Production behavior

- Correlation IDs and structured logs
- Idempotency and replay protection
- Dead-letter/quarantine handling
- Contract tests using saved responses
- Replay mode so the demo does not depend on a live feed
- Health endpoints and dependency status

## Product decisions

- Use **one bounded agent** for the MVP. The workflow does not need multi-agent orchestration.
- Use **deterministic code** for impact scoring, state transitions, authorization, message-publishing gates, and SLA calculations.
- Use the model for **evidence synthesis, option drafting, missing-information detection, and plain-language rider communications**.
- Require **human approval** before any operational action or rider communication is simulated.
- Treat feed freshness as a product feature: stale data must be visible and must lower confidence.
- Support recorded event replay so every interview demo is reliable and reproducible.

## Recommended eight-week schedule

| Week | Focus | Deliverable | Estimated time |
|---|---|---|---:|
| 1 | Customer discovery and API basics | Workflow map, stakeholders, success measures, non-goals, first GTFS call, and saved sample responses | 8-10 h |
| 2 | Reliable Python ingestion | GTFS/GTFS-Realtime parser, weather client, normalized schemas, retries, freshness checks, and replay mode | 10-12 h |
| 3 | Fabric real-time foundation | Event Hubs, Eventstream, Eventhouse, Lakehouse reference data, KQL queries, and data-quality dashboard | 10-12 h |
| 4 | Impact model and Power BI | Transparent disruption score, benchmark scenarios, route/transfer analysis, and first operations report | 9-11 h |
| 5 | Grounded recovery assistant | Azure AI Search index, Foundry agent, cited options, rider-message draft, and 15-case evaluation set | 10-12 h |
| 6 | Dispatcher workflow and security | FastAPI app, Azure SQL state machine, approve/edit/reject/escalate, Entra ID, RBAC, and Key Vault | 11-13 h |
| 7 | Deployment and evaluation | Container Apps, Bicep, Application Insights, 40-case suite, failure drills, and cost controls | 9-11 h |
| 8 | Pilot and portfolio handoff | Timed simulation, final Power BI report, decision log, runbook, demo video, and executive outcome brief | 8-10 h |

**Realistic total:** 75-90 hours. Python experience keeps the estimate near eight weeks even while API skills are developing.

## What Beatrice needs to know

### Reuse immediately

- Python data manipulation and business logic
- Fabric, Power BI, semantic modeling, DAX, and data storytelling
- SQL and Azure SQL security concepts
- Incident prioritization and escalation thinking
- IAM, RBAC, governance, and audit evidence

### Learn during weeks 1-3

- HTTP APIs, timeouts, retries, rate limits, and structured errors
- GTFS static relationships and GTFS-Realtime Protocol Buffers
- Pydantic schemas, API contract tests, and replay fixtures
- Event Hubs, Fabric Eventstream, Eventhouse, and basic KQL

### Learn during weeks 4-7

- FastAPI endpoints, idempotency, and workflow state machines
- RAG, hybrid search, citations, and groundedness evaluation
- Foundry agents, tool schemas, and evaluation gates
- Entra authentication, managed identity, Key Vault, and least privilege
- Container Apps, Application Insights/OpenTelemetry, and Bicep

### Not required for the MVP

- Kubernetes or AKS
- Fine-tuning
- Multi-agent frameworks
- A mobile application
- A live connection to a transit control system
- Real employee or passenger data
- AWS or Google Cloud

## Data model

### Public API data

- `routes`, `trips`, `stops`, `stop_times`, and `calendar`
- `vehicle_positions`
- `trip_updates`
- `service_alerts`
- `weather_alerts`

### Synthetic agency data

- `route_profiles`: ridership band, transfer importance, accessibility obligations, operating hours
- `vehicles`: class, capacity, accessibility, maintenance status
- `crew_availability`: role, depot, shift, availability status
- `recovery_options`: shuttle, short turn, vehicle swap, hold, alternate-route guidance
- `operating_procedures`: trigger, constraints, required approver, evidence, current version
- `disruption_cases`: state, impact score, assigned dispatcher, due time, decision outcome
- `workflow_events`: actor, action, timestamp, correlation ID, before/after hash, rationale
- `evaluation_cases`: expected route, required evidence, prohibited action, pass/fail result

## Transparent disruption-impact score

A sample 100-point model:

- Estimated passenger impact: 0-20
- Delay and cancellation severity: 0-20
- Peak service period: 0-10
- Transfer-hub/network effect: 0-15
- Accessibility-service impact: 0-15
- Weather or external hazard: 0-10
- Recovery-resource constraint: 0-10

The agent may explain these factors but cannot change them. Missing or stale high-impact fields must appear as data-quality warnings and can force escalation.

## MVP acceptance gates

| Gate | Target before calling the MVP complete |
|---|---|
| Workflow safety | 100% of simulated operational actions and rider messages require recorded human approval. |
| Feed reliability | Saved/replayed events produce the same normalized records and impact score on every run. |
| Freshness handling | 100% of stale-feed test cases are visibly flagged and cannot be presented as current. |
| Citation validity | At least 95% of material procedure claims link to the correct approved source passage. |
| Recovery-route agreement | At least 85% agreement with the labeled expected option or escalation route. |
| Safe abstention | 100% of insufficient, contradictory, or unauthorized cases abstain or escalate. |
| Role isolation | Zero cross-role information disclosures in authorization tests. |
| Operability | Runbook covers feed outage, bad data, model/search outage, duplicate action, and rollback. |
| Value proof | A timed simulation compares manual and assisted disruption handling. |

These are targets, not current results. Publish actual results, sample size, failures, and limitations after the pilot.

## Portfolio evidence to publish

1. Customer discovery brief and current-state workflow map
2. API contract, saved response fixtures, and reliability tests
3. Fabric Eventstream/Eventhouse architecture and KQL examples
4. Transparent impact-score specification and benchmark scenarios
5. Dispatcher workflow, RBAC matrix, and approval-state diagram
6. Foundry evaluation dataset and scorecard with visible failure cases
7. Power BI pages for live operations, service recovery, AI quality, and cost
8. Bicep, deployment guide, monitoring dashboard, and incident runbook
9. Timed pilot results and changes made after user feedback
10. Five-minute demonstration and one-page executive outcome brief

## First five build actions

1. Choose one GTFS provider and download both its static schedule and a small set of GTFS-Realtime samples.
2. Write the normalized `TransitEvent` Pydantic schema before writing the production collector.
3. Build a local replay command that produces identical normalized JSON from the saved inputs.
4. Define five disruption scenarios and label the correct operational route before adding generative AI.
5. Interview a fictional dispatcher persona using the discovery pack and turn the findings into signed-off MVP acceptance criteria.

## Reference links

- [GTFS-Realtime trip updates](https://gtfs.org/documentation/realtime/feed-entities/trip-updates/)
- [GTFS-Realtime best practices](https://gtfs.org/documentation/realtime/realtime-best-practices/)
- [National Weather Service API documentation](https://www.weather.gov/documentation/standards/services-web-api)
- [Microsoft Fabric Real-Time Intelligence](https://learn.microsoft.com/en-us/fabric/real-time-intelligence/overview)
- [Fabric Eventhouse overview](https://learn.microsoft.com/en-us/fabric/real-time-intelligence/eventhouse)
- [Fabric Eventstreams overview](https://learn.microsoft.com/en-us/fabric/real-time-intelligence/event-streams/overview)
- [RAG and indexes in Microsoft Foundry](https://learn.microsoft.com/en-us/azure/foundry/concepts/retrieval-augmented-generation)
- [Run evaluations in Microsoft Foundry](https://learn.microsoft.com/en-us/azure/foundry/how-to/evaluate-generative-ai-app)
- [Azure Container Apps overview](https://learn.microsoft.com/en-us/azure/container-apps/overview)
- [Bicep overview](https://learn.microsoft.com/en-us/azure/azure-resource-manager/bicep/overview)
