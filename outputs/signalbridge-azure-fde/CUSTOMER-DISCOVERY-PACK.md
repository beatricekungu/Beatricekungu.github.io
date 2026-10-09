# SignalBridge customer discovery pack

## Opening scenario

You have joined a fictional regional transit authority for an eight-week pilot. The operations director asks for an "AI disruption assistant" because dispatchers lose time assembling information during service interruptions. Your first task is to discover the actual bottleneck and define a narrow operational outcome—not to begin with an agent.

## Stakeholders

| Stakeholder | Needs | Can block the pilot because... |
|---|---|---|
| Operations director | Faster recovery and credible executive measures | The pilot cannot show operational value. |
| Service-control dispatcher | One trustworthy view and fewer repetitive steps | The system adds clicks, hides freshness, or suggests impractical actions. |
| Operations supervisor | Safe, policy-compliant decisions | Approval authority or evidence is unclear. |
| Accessibility lead | Equivalent-service obligations represented in every option | The impact model overlooks riders with disabilities. |
| Maintenance/crew coordinator | Real resource constraints | Recommendations assume unavailable vehicles or staff. |
| Customer communications | Accurate, timely, approved rider messages | Drafts contain unsupported times or routes. |
| Auditor/data owner | Traceability, retention, and least privilege | Sources, versions, actors, or changes cannot be reconstructed. |

## Discovery questions

### Current workflow

1. Show me what happens from the first delay signal to an approved recovery plan.
2. Which screens, calls, spreadsheets, or messages does a dispatcher use?
3. Which decisions are fixed by procedure and which require judgment?
4. What information is usually missing when the first alert arrives?
5. What makes a supervisor reject or revise a proposed response?

### APIs and data

6. Which feed is authoritative for schedules, vehicle positions, trip changes, and service alerts?
7. How old can a feed be before it is operationally unsafe to rely on?
8. How are duplicates, missing trips, canceled service, and feed outages handled today?
9. Where do crew, maintenance, transfer, accessibility, and weather constraints live?
10. Which data can be stored in traces, and which fields must be excluded?

### Outcomes and adoption

11. What is the current median time from disruption detection to an approved plan?
12. Which disruption type creates the highest passenger-delay impact?
13. What wrong recommendation would make dispatchers stop trusting the tool?
14. What actions must always remain human-controlled?
15. What four-week result would justify expanding the pilot?

## Working assumptions to validate

- The largest delay comes from assembling context and drafting coordinated options.
- Feed freshness and missing resource information are more important than polished wording.
- Dispatchers will trust transparent impact factors and source evidence more than a single AI confidence score.
- Accessibility and transfer impact must be first-class fields, not notes.
- A simulated downstream action is sufficient for the portfolio MVP.

## Baseline measures

- Time from first qualifying event to case creation
- Time from case creation to proposed recovery option
- Time from proposal to supervisor approval
- Number of systems consulted per disruption
- Percentage of cases with stale or incomplete data
- Recommendation edit/rejection rate
- Time to approved rider communication
- Passenger-delay proxy before and after the chosen response

## Pilot scope statement

The pilot will ingest public GTFS, GTFS-Realtime, and weather data; combine it with synthetic agency constraints; calculate a transparent disruption-impact score; draft cited recovery options and rider communications; and route every action through human approval. It will not control vehicles, dispatch staff, publish messages, process passenger identities, or connect to a production transit-control system.

## Example acceptance criterion

> Given a delayed accessible bus route serving a major transfer hub during the evening peak, when the vehicle-position feed becomes stale and no spare accessible vehicle is available, then the system displays the stale-data warning, calculates only the supported impact factors, excludes the unavailable vehicle-swap option, drafts a cited escalation summary, prevents simulated publication, and records the reason for escalation.

## Weekly customer cadence

- **Monday:** 20-minute priority, feed-quality, and blocker review
- **Wednesday:** 30-minute working demonstration using saved or synthetic disruptions
- **Friday:** Decision log, metric review, and scope-change check
- **End of weeks 2, 5, and 8:** Formal milestone acceptance

## Final executive readout

1. What part of service recovery was slow or inconsistent?
2. What changed in the pilot workflow?
3. What did the operational and evaluation evidence show?
4. Where did SignalBridge abstain or fail?
5. What is the smallest responsible next deployment?
