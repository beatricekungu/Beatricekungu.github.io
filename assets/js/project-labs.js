(function () {
  "use strict";

  function setText(id, value) {
    const element = document.getElementById(id);
    if (element) element.textContent = value;
  }

  function setMeter(id, value) {
    const element = document.getElementById(id);
    if (element) element.style.width = `${Math.max(0, Math.min(100, value))}%`;
  }

  function initDbaCommandCenter() {
    const root = document.querySelector("[data-dba-lab]");
    if (!root) return;

    const checks = Array.from(root.querySelectorAll("[data-dba-check]"));
    const deployButton = document.getElementById("dba-deploy");
    const status = document.getElementById("dba-status");
    const log = document.getElementById("dba-log");
    const stageTitle = document.getElementById("dba-stage-title");
    const stageBody = document.getElementById("dba-stage-body");
    const stageEvidence = document.getElementById("dba-stage-evidence");
    const stages = {
      secure: {
        title: "Secure",
        body: "Harden the database boundary with Entra administration, private connectivity, firewall review, auditing, and Defender alerting before release.",
        evidence: "Evidence: firewall export, Entra admin screenshot, audit destination, Defender alert rule."
      },
      monitor: {
        title: "Monitor",
        body: "Watch failed logins, DTU or vCore pressure, storage growth, deadlocks, Query Store regressions, and backup health from one operations view.",
        evidence: "Evidence: alert rules, metric charts, Query Store dashboard, backup retention settings."
      },
      tune: {
        title: "Tune",
        body: "Use Query Store to compare baseline duration, identify plan regressions, and document indexing or query changes before production rollout.",
        evidence: "Evidence: before/after query metrics, execution plan note, index recommendation decision."
      },
      recover: {
        title: "Recover",
        body: "Prove recoverability through point-in-time restore testing, restore timing, validation query results, and owner signoff.",
        evidence: "Evidence: restore timestamp, validation checklist, RTO note, rollback decision."
      },
      evidence: {
        title: "Audit Evidence",
        body: "Bundle operational proof into a handoff packet a DBA manager, auditor, or security reviewer can trust without chasing screenshots.",
        evidence: "Evidence: implementation record, control map, alert exports, restore proof, access review."
      }
    };

    function update() {
      const completed = checks.filter((check) => check.checked).length;
      const readiness = Math.round((completed / checks.length) * 100);
      const risk = 100 - readiness;

      checks.forEach((check) => {
        check.closest(".lab-control").classList.toggle("is-complete", check.checked);
      });

      setText("dba-readiness", `${readiness}%`);
      setText("dba-risk", `${risk}`);
      setText("dba-complete", `${completed}/${checks.length}`);
      setMeter("dba-readiness-meter", readiness);

      if (status) {
        status.classList.toggle("is-ready", completed === checks.length);
        status.innerHTML = completed === checks.length
          ? '<i class="bi bi-check-circle"></i> Production guardrail cleared'
          : '<i class="bi bi-exclamation-triangle"></i> Deployment locked';
      }

      if (deployButton) {
        deployButton.disabled = completed !== checks.length;
        deployButton.classList.toggle("is-ready", completed === checks.length);
      }

      if (log) {
        const selected = checks
          .filter((check) => check.checked)
          .map((check) => `<li>${check.dataset.dbaCheck}</li>`)
          .join("");
        log.innerHTML = selected || "<li>Select DBA controls to build the implementation evidence trail.</li>";
      }
    }

    checks.forEach((check) => check.addEventListener("change", update));

    root.querySelectorAll("[data-dba-stage]").forEach((button) => {
      button.addEventListener("click", () => {
        const stage = stages[button.dataset.dbaStage];
        if (!stage) return;
        root.querySelectorAll("[data-dba-stage]").forEach((tab) => tab.classList.remove("is-active"));
        button.classList.add("is-active");
        if (stageTitle) stageTitle.textContent = stage.title;
        if (stageBody) stageBody.textContent = stage.body;
        if (stageEvidence) stageEvidence.textContent = stage.evidence;
      });
    });

    if (deployButton) {
      deployButton.addEventListener("click", () => {
        setText("dba-deploy-message", "Policy package approved for simulated production deployment.");
      });
    }

    update();
  }

  function initEvidenceMapping() {
    const root = document.querySelector("[data-evidence-lab]");
    if (!root) return;

    let selectedEvidence = null;
    const evidenceCards = Array.from(root.querySelectorAll("[data-evidence]"));
    const drops = Array.from(root.querySelectorAll("[data-control]"));
    const matched = new Set();

    function updateScore() {
      const score = Math.round((matched.size / drops.length) * 100);
      setText("grc-score", `${score}%`);
      setText("grc-mapped", `${matched.size}/${drops.length}`);
      setMeter("grc-score-meter", score);

      const status = document.getElementById("grc-status");
      if (status) {
        status.classList.toggle("is-ready", matched.size === drops.length);
        status.innerHTML = matched.size === drops.length
          ? '<i class="bi bi-patch-check"></i> Audit packet ready'
          : '<i class="bi bi-folder-check"></i> Evidence mapping in progress';
      }
    }

    evidenceCards.forEach((card) => {
      card.addEventListener("click", () => {
        if (card.classList.contains("is-used")) return;
        evidenceCards.forEach((item) => item.classList.remove("is-selected"));
        card.classList.add("is-selected");
        selectedEvidence = card;
        setText("grc-feedback", `Selected evidence: ${card.querySelector("strong").textContent}`);
      });
    });

    drops.forEach((drop) => {
      drop.addEventListener("click", () => {
        if (!selectedEvidence || drop.classList.contains("is-complete")) return;

        const isMatch = selectedEvidence.dataset.evidence === drop.dataset.control;
        drops.forEach((item) => item.classList.remove("is-selected"));
        drop.classList.add("is-selected");

        if (!isMatch) {
          setText("grc-feedback", "That evidence does not fully support this control. Try another match.");
          return;
        }

        matched.add(drop.dataset.control);
        drop.classList.add("is-complete");
        selectedEvidence.classList.add("is-used");
        selectedEvidence.classList.remove("is-selected");
        drop.querySelector("[data-drop-result]").textContent = selectedEvidence.querySelector("strong").textContent;
        setText("grc-feedback", "Good match. The evidence now supports this control.");
        selectedEvidence = null;
        updateScore();
      });
    });

    const reset = document.getElementById("grc-reset");
    if (reset) {
      reset.addEventListener("click", () => {
        matched.clear();
        selectedEvidence = null;
        evidenceCards.forEach((card) => card.classList.remove("is-selected", "is-used"));
        drops.forEach((drop) => {
          drop.classList.remove("is-selected", "is-complete");
          drop.querySelector("[data-drop-result]").textContent = "Awaiting evidence";
        });
        setText("grc-feedback", "Select an evidence artifact, then choose the control it proves.");
        updateScore();
      });
    }

    updateScore();
  }

  function initIncidentRoom() {
    const root = document.querySelector("[data-ir-lab]");
    if (!root) return;

    const steps = Array.from(root.querySelectorAll("[data-ir-step]"));
    const decisions = new Map();

    function updateIncident() {
      const selected = Array.from(decisions.values());
      const totalImpact = selected.reduce((sum, choice) => sum + Number(choice.dataset.impact), 0);
      const risk = Math.max(0, Math.min(100, 85 - totalImpact));
      const confidence = Math.round((selected.length / steps.length) * 100);

      setText("ir-risk", risk);
      setText("ir-complete", `${selected.length}/${steps.length}`);
      setMeter("ir-risk-meter", 100 - risk);
      setText("ir-confidence", `${confidence}%`);

      const summary = document.getElementById("ir-summary");
      const status = document.getElementById("ir-status");

      if (status) {
        status.classList.toggle("is-ready", selected.length === steps.length && risk <= 25);
        status.innerHTML = selected.length === steps.length && risk <= 25
          ? '<i class="bi bi-check-circle"></i> Executive brief ready'
          : '<i class="bi bi-broadcast-pin"></i> Response still developing';
      }

      if (summary) {
        if (selected.length !== steps.length) {
          summary.textContent = "Complete each decision stage to generate an executive incident summary.";
          return;
        }

        summary.textContent = risk <= 25
          ? "Containment is controlled, evidence is preserved, stakeholders are informed, and recovery can proceed with a clear after-action record."
          : "The response has unresolved risk. Revisit the decision stages and choose actions that preserve evidence, reduce exposure, and align communication.";
      }
    }

    root.querySelectorAll("[data-impact]").forEach((choice) => {
      choice.addEventListener("click", () => {
        const step = choice.closest("[data-ir-step]");
        if (!step) return;

        step.querySelectorAll("[data-impact]").forEach((item) => {
          item.classList.remove("is-selected", "is-good", "is-risk");
        });

        choice.classList.add("is-selected");
        choice.classList.toggle("is-good", Number(choice.dataset.impact) >= 18);
        choice.classList.toggle("is-risk", Number(choice.dataset.impact) < 10);
        decisions.set(step.dataset.irStep, choice);
        updateIncident();
      });
    });

    updateIncident();
  }

  document.addEventListener("DOMContentLoaded", function () {
    initDbaCommandCenter();
    initEvidenceMapping();
    initIncidentRoom();
  });
})();
