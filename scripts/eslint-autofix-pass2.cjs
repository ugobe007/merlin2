 
/**
 * ESLint auto-fix pass 2
 * Goals:
 * 1) Prefix unused vars/args/destructured bindings with "_" (config allows /^_/).
 * 2) Add braces to switch cases that contain lexical declarations (const/let/function/class)
 *    to avoid "Unexpected lexical declaration in case block" / parse issues.
 *
 * Run:
 *   node scripts/eslint-autofix-pass2.cjs
 */

const fs = require("fs");
const path = require("path");

const ROOT = process.cwd();

function walk(dir, out = []) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const e of entries) {
    if (
      e.name === "node_modules" ||
      e.name === "dist" ||
      e.name === "build" ||
      e.name === "coverage"
    ) continue;

    const p = path.join(dir, e.name);
    if (e.isDirectory()) walk(p, out);
    else if (/\.(ts|tsx)$/.test(e.name)) out.push(p);
  }
  return out;
}

function read(p) {
  return fs.readFileSync(p, "utf8");
}
function write(p, s) {
  fs.writeFileSync(p, s, "utf8");
}

function fixUnusedDestructuringBindings(code) {
  // Array destructuring: const [a, b, c] = ...
  code = code.replace(
    /\bconst\s*\[\s*([A-Za-z_$][\w$]*(?:\s*,\s*[A-Za-z_$][\w$]*)+)\s*\]\s*=\s*/g,
    (m, list) => {
      const items = list.split(",").map(s => s.trim());
      const out = items.map(x => (
        x && /^[A-Za-z_$][\w$]*$/.test(x) && !x.startsWith("_")
      ) ? `_${x}` : x);
      return m.replace(list, out.join(", "));
    }
  );

  // Object destructuring (simple): const { a, b: alias, c = 1 } = ...
  // Skip complex patterns: spreads, nested patterns
  code = code.replace(
    /\bconst\s*\{\s*([^}]+)\s*\}\s*=\s*/g,
    (m, inner) => {
      if (inner.includes("...") || inner.includes("{") || inner.includes("[")) return m;

      const parts = inner.split(",").map(s => s.trim()).filter(Boolean);
      const mapped = parts.map(p => {
        // plain: a
        if (/^[A-Za-z_$][\w$]*$/.test(p)) {
          return p.startsWith("_") ? p : `_${p}`;
        }
        // alias: b: alias
        const colon = p.match(/^([A-Za-z_$][\w$]*)\s*:\s*([A-Za-z_$][\w$]*)$/);
        if (colon) {
          const [, key, alias] = colon;
          const newAlias = alias.startsWith("_") ? alias : `_${alias}`;
          return `${key}: ${newAlias}`;
        }
        // default: c = 1
        const def = p.match(/^([A-Za-z_$][\w$]*)\s*=/);
        if (def) {
          const name = def[1];
          const rest = p.slice(name.length);
          const newName = name.startsWith("_") ? name : `_${name}`;
          return `${newName}${rest}`;
        }
        return p;
      });

      return m.replace(inner, mapped.join(", "));
    }
  );

  return code;
}

function fixUnusedFunctionParams(code) {
  // Arrow fn: (x) =>  =>  (_x) =>
  code = code.replace(
    /(\()\s*([A-Za-z_$][\w$]*)\s*(\)\s*=>)/g,
    (m, a, name, b) => `${a}${name.startsWith("_") ? name : `_${name}`}${b}`
  );

  // Arrow fn: x =>  =>  _x =>
  code = code.replace(
    /(^|[=\s,])([A-Za-z_$][\w$]*)\s*=>/gm,
    (m, pre, name) => `${pre}${name.startsWith("_") ? name : `_${name}`} =>`
  );

  // function f(a, b) => function f(_a, _b)
  code = code.replace(
    /\bfunction\s+([A-Za-z_$][\w$]*)\s*\(\s*([^)]*)\s*\)/g,
    (m, fname, params) => {
      const parts = params.split(",").map(s => s.trim()).filter(Boolean);
      const mapped = parts.map(p => (
        /^[A-Za-z_$][\w$]*$/.test(p) && !p.startsWith("_")
      ) ? `_${p}` : p);
      return m.replace(params, mapped.join(", "));
    }
  );

  return code;
}

function braceSwitchLexicals(code) {
  // Wrap case bodies that start with lexical decls:
  // case "x":
  //   const y = 1;
  // becomes
  // case "x":
  //   {
  //     const y = 1;
  //   }
  const lines = code.split("\n");
  const out = [];
  let inSwitch = false;
  let caseOpen = false;

  function isCaseLine(s) {
    return /^\s*(case\s+.+:|default\s*:)\s*$/.test(s);
  }
  function isLexicalStart(s) {
    return /^\s*(const|let|function|class)\b/.test(s);
  }

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    if (/\bswitch\s*\(/.test(line)) inSwitch = true;

    if (inSwitch && isCaseLine(line)) {
      if (caseOpen) {
        out.push("      }");
        caseOpen = false;
      }
      out.push(line);

      // peek next non-empty
      let j = i + 1;
      while (j < lines.length && lines[j].trim() === "") j++;
      if (j < lines.length && isLexicalStart(lines[j])) {
        out.push("      {");
        caseOpen = true;
      }
      continue;
    }

    // End of switch block (best-effort): close brace before }
    if (inSwitch && /^\s*}\s*$/.test(line)) {
      if (caseOpen) {
        out.push("      }");
        caseOpen = false;
      }
      out.push(line);
      inSwitch = false;
      continue;
    }

    out.push(line);
  }

  return out.join("\n");
}

function main() {
  const targets = [
    path.join(ROOT, "src"),
    path.join(ROOT, "packages"),
    path.join(ROOT, "tests"),
  ].filter(fs.existsSync);

  const files = targets.flatMap(walk);

  let changed = 0;
  for (const f of files) {
    let code = read(f);
    const before = code;

    code = fixUnusedDestructuringBindings(code);
    code = fixUnusedFunctionParams(code);
    code = braceSwitchLexicals(code);

    if (code !== before) {
      write(f, code);
      changed++;
    }
  }

  console.log(`Pass2 updated ${changed} files.`);
}

main();
