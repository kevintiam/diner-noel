/**
 * Vérifie que BMAD est bien installé dans le projet pour Claude Code.
 *
 * Utilisation, depuis la racine du projet :
 *   node verifier-bmad.mjs
 *
 * Le script ne modifie rien : il lit des fichiers et affiche un rapport.
 * Il se termine avec le code 1 si un élément manque.
 */

import { existsSync, readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { execSync } from "node:child_process";

const PROJECT_ROOT = process.cwd();
const SKILLS_FOLDER = join(PROJECT_ROOT, ".claude", "skills");
const BMAD_FOLDER = join(PROJECT_ROOT, "_bmad");
const EXPECTED_VERSION = "6.12.4";
const EXPECTED_SKILL_COUNT = 29;

// Les 5 agents de BMAD Method v6.12
const EXPECTED_AGENTS = [
  { skill: "bmad-agent-analyst", name: "Mary", role: "Analyste" },
  { skill: "bmad-agent-pm", name: "John", role: "Chef de produit" },
  { skill: "bmad-agent-ux-designer", name: "Sally", role: "Designer UX" },
  { skill: "bmad-agent-architect", name: "Winston", role: "Architecte" },
  { skill: "bmad-agent-dev", name: "Amelia", role: "Développeuse" },
];

// Les skills utilisés dans le guide du dîner de Noël
const EXPECTED_WORKFLOWS = [
  "bmad-help",
  "bmad-product-brief",
  "bmad-prd",
  "bmad-ux",
  "bmad-architecture",
  "bmad-create-epics-and-stories",
  "bmad-sprint-planning",
  "bmad-build",
  "bmad-code-review",
  "bmad-walkthrough",
  "bmad-qa-generate-e2e-tests",
  "bmad-retrospective",
];

let problemCount = 0;

/**
 * Affiche une ligne du rapport et compte les problèmes.
 * @param {boolean} isOk Vrai si l'élément vérifié est correct.
 * @param {string} label Ce qui a été vérifié.
 * @param {string} [detail] Précision affichée en cas de problème.
 */
function report(isOk, label, detail) {
  if (isOk) {
    console.log("  [OK]       " + label);
    return;
  }
  problemCount += 1;
  const suffix = detail ? " -> " + detail : "";
  console.log("  [MANQUANT] " + label + suffix);
}

/**
 * Lance une commande et renvoie sa sortie, ou null si elle échoue.
 * @param {string} command Commande à exécuter, ex. : "uv --version".
 * @returns {string | null} Première ligne de la sortie, ou null.
 */
function runCommand(command) {
  try {
    const output = execSync(command, { stdio: ["ignore", "pipe", "ignore"] });
    return output.toString().trim().split("\n")[0];
  } catch {
    return null;
  }
}

/**
 * Vérifie qu'un skill existe : son dossier contient un fichier SKILL.md.
 * @param {string} skillName Nom du dossier du skill, ex. : "bmad-prd".
 * @returns {boolean} Vrai si le skill est installé.
 */
function isSkillInstalled(skillName) {
  return existsSync(join(SKILLS_FOLDER, skillName, "SKILL.md"));
}

/**
 * Lit une valeur simple dans un fichier .toml, ex. : communication_language = "Français".
 * @param {string} filePath Chemin du fichier .toml.
 * @param {string} key Nom de la clé recherchée.
 * @returns {string | null} La valeur trouvée, ou null.
 */
function readTomlValue(filePath, key) {
  if (!existsSync(filePath)) {
    return null;
  }
  const lines = readFileSync(filePath, "utf8").split("\n");
  for (const line of lines) {
    const trimmedLine = line.trim();
    if (trimmedLine.startsWith(key + " ") || trimmedLine.startsWith(key + "=")) {
      const value = trimmedLine.split("=")[1];
      return value.trim().replace(/"/g, "");
    }
  }
  return null;
}

// 1. Outils nécessaires sur l'ordinateur
console.log("\n1. Outils");
const nodeMajor = parseInt(process.versions.node.split(".")[0], 10);
const nodeMinor = parseInt(process.versions.node.split(".")[1], 10);
const isNodeRecentEnough = nodeMajor > 20 || (nodeMajor === 20 && nodeMinor >= 12);
report(
  isNodeRecentEnough,
  "Node.js " + process.versions.node,
  "Node.js 20.12 ou plus récent est requis",
);

const uvVersion = runCommand("uv --version");
report(
  uvVersion !== null,
  uvVersion ? uvVersion : "uv",
  "installer uv : les skills BMAD l'utilisent",
);

const pythonVersion = runCommand("python3 --version") || runCommand("python --version");
report(
  pythonVersion !== null,
  pythonVersion ? pythonVersion : "Python",
  "Python 3.10 ou plus récent est requis",
);

// 2. Dossier _bmad et version installée
console.log("\n2. Installation BMAD");
report(existsSync(BMAD_FOLDER), "Dossier _bmad/", "lancer : npx bmad-method install");
report(existsSync(join(BMAD_FOLDER, "config.toml")), "_bmad/config.toml");

const manifestPath = join(BMAD_FOLDER, "_config", "manifest.yaml");
let installedVersion = null;
if (existsSync(manifestPath)) {
  const match = readFileSync(manifestPath, "utf8").match(/version:\s*([\d.]+)/);
  installedVersion = match ? match[1] : null;
}
report(
  installedVersion === EXPECTED_VERSION,
  "Version " + installedVersion,
  "version attendue : " + EXPECTED_VERSION,
);

const language = readTomlValue(join(BMAD_FOLDER, "config.user.toml"), "communication_language");
report(
  language === "Français",
  "Langue des agents : " + language,
  "relancer l'installation avec --communication-language Français",
);

// 3. Les 5 agents
console.log("\n3. Agents");
for (const agent of EXPECTED_AGENTS) {
  const label = agent.name + " (" + agent.role + ") : /" + agent.skill;
  report(isSkillInstalled(agent.skill), label);
}

// 4. Les skills utilisés dans le guide
console.log("\n4. Skills du parcours");
for (const workflow of EXPECTED_WORKFLOWS) {
  report(isSkillInstalled(workflow), "/" + workflow);
}

// 5. Nombre total de skills BMAD
console.log("\n5. Total");
let bmadSkillCount = 0;
if (existsSync(SKILLS_FOLDER)) {
  for (const folderName of readdirSync(SKILLS_FOLDER)) {
    if (folderName.startsWith("bmad-") && isSkillInstalled(folderName)) {
      bmadSkillCount += 1;
    }
  }
}
report(
  bmadSkillCount === EXPECTED_SKILL_COUNT,
  bmadSkillCount + " skills BMAD dans .claude/skills/",
  EXPECTED_SKILL_COUNT + " attendus",
);

// Résumé
console.log("");
if (problemCount === 0) {
  console.log("Tout est installé. Ouvre Claude Code dans ce dossier et tape /bmad-help.");
} else {
  console.log(
    problemCount + " problème(s) trouvé(s). Corrige-les, puis relance : node verifier-bmad.mjs",
  );
  process.exitCode = 1;
}
