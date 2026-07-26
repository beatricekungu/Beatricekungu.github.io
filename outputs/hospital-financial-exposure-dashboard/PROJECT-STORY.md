# Project Story: Hospital Financial Exposure Dashboard

## The Challenge

The Maven Hospital Challenge asked participants to act as an analytics consultant for Massachusetts General Hospital and build a high-level KPI report for executives.

The report needed to answer four business questions:

- How many patients have been admitted or readmitted over time?
- How long are patients staying in the hospital, on average?
- How much is the average cost per visit?
- How many procedures are covered by insurance?

## My Role

I approached this project as an executive analytics engagement. My goal was not only to build a dashboard, but to show how hospital performance data can be prepared, modeled, measured, and communicated in a way leaders can use.

I used Power BI, Power Query, and DAX to turn patient records into a published dashboard focused on admissions, readmissions, length of stay, visit cost, and insurance coverage.

## My Approach

### Business Framing

I started by translating the Maven questions into executive reporting needs: volume, utilization, cost, and coverage.

### Data Modeling

I organized the model around core hospital entities:

- encounters
- patients
- procedures
- payers
- organizations
- date

This structure allows the dashboard to connect patient activity, payer coverage, procedure cost, and time-based trends.

### Measures Layer

I created a dedicated Measures table to keep DAX logic centralized. This made the report easier to maintain and helped ensure that visuals use consistent KPI definitions.

The measure layer includes logic for admissions, readmissions, cost, length of stay, coverage rates, encounter totals, and payer/procedure coverage.

### Dashboard Design

The report layout was designed for executive scanning. KPI cards appear at the top, with supporting visuals underneath to explain trends, encounter mix, patient demographics, geography, and financial exposure.

## What This Shows Employers

This project demonstrates that I can:

- prepare and model data for reporting
- write KPI logic in DAX
- design a dashboard around business questions
- explain analytics work to non-technical stakeholders
- connect data reporting to governance, risk, and operational decision-making

For implementation, GRC, cybersecurity, database, and analytics roles, this project supports a broader message: I can build decision-support tools that are structured, explainable, and useful to leadership.

## Final Outcome

The final output is a published Power BI dashboard and a portfolio case study that document the build, the model, the measure layer, and the business value.

[View the live Power BI dashboard](https://app.powerbi.com/view?r=eyJrIjoiYTZmOTc5ZDQtMjQ2NS00ZTA4LTk4MTEtY2M3MThlMTI1N2NiIiwidCI6IjY3NzQ1OGU2LThjNTItNDYxMy05ZmRiLTJjYzgzN2Q1ZTRlZiJ9)
