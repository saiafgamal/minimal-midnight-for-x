// Two parts of x.com have no color tokens to override: the sign-in and
// onboarding screens, and the older frontend. Both write literal colors into
// generated class names that change between releases, so a list of class
// names in midnight.css goes stale. This reads the rules X has inserted and
// answers each color with its Midnight equivalent, chosen by what the color
// is used for (surface, text or border) and how light it is.

const MMX_SURFACE = new Set(["background-color", "--jf-bg-color", "--bg-gradient-from", "--bg-gradient-to", "--background", "--accent", "--muted"]);
const MMX_TEXT = new Set(["color", "-webkit-text-fill-color", "caret-color", "fill", "stroke", "--jf-text-color", "--foreground"]);
const MMX_BORDER = new Set(["border-top-color", "border-right-color", "border-bottom-color", "border-left-color", "outline-color", "--jf-border-color", "--border"]);

// The page background of X's light, dim and lights-out themes.
const MMX_PAGE = new Set(["0,0,0", "21,32,43", "255,255,255", "247,249,249"]);

const MMX_COLOR = /^(?:rgba?\(\s*(\d+)\s*[, ]\s*(\d+)\s*[, ]\s*(\d+)\s*(?:[,/]\s*(.+?)\s*)?\)|#([0-9a-f]{3}|[0-9a-f]{6}))$/i;

function mmxParse(value) {
  const match = MMX_COLOR.exec(value.trim());
  if (!match) return null;
  if (match[5]) {
    const hex = match[5].length === 3 ? match[5].replace(/./g, "$&$&") : match[5];
    return { rgb: [0, 2, 4].map((i) => parseInt(hex.slice(i, i + 2), 16)), alpha: "" };
  }
  return { rgb: [+match[1], +match[2], +match[3]], alpha: match[4] || "" };
}

function mmxHsl([r, g, b]) {
  const max = Math.max(r, g, b) / 255;
  const min = Math.min(r, g, b) / 255;
  const l = (max + min) / 2;
  const d = max - min;
  if (!d) return [0, 0, l];
  const s = d / (1 - Math.abs(2 * l - 1));
  let h;
  if (max === r / 255) h = ((g - b) / 255 / d) % 6;
  else if (max === g / 255) h = (b - r) / 255 / d + 2;
  else h = (r - g) / 255 / d + 4;
  return [(h * 60 + 360) % 360, s, l];
}

// Returns the name of a --mmx-* token, or null to leave the color alone.
// `legacy` is the older frontend, where the same class sheet serves X's light
// theme: there, near-white surfaces and near-black text are the page and its
// body text, not a filled button and its label.
function mmxToken(role, rgb, legacy, alpha) {
  const [h, s, l] = mmxHsl(rgb);
  if (s > 0.45 && l > 0.2 && l < 0.9) {
    if (h >= 185 && h <= 255) return "link";
    if (h >= 300 && h < 345) return "like";
    if (h >= 345 || h <= 20) return "danger";
    if (h >= 120 && h < 185) return "repost";
    return null;
  }
  if (role === "border") return "line";
  if (role === "text") {
    if (l > 0.8) return "text";
    if (legacy) return l >= 0.25 ? "muted" : "text";
    if (l > 0.4) return "muted";
    if (l > 0.25) return "faint";
    return "on-accent";
  }
  if (legacy) {
    // A faint black or white is a hover wash. On navy it has to lighten.
    if (alpha < 0.25) return "text";
    if (MMX_PAGE.has(rgb.join(","))) return "surface";
    if (l < 0.22) return "raised";
    if (l < 0.32) return "hover";
    if (l < 0.6) return "line";
    return l < 0.9 ? "glow" : "raised";
  }
  if (l < 0.07) return "base";
  if (l < 0.14) return "raised";
  if (l < 0.21) return "glow";
  if (l < 0.32) return "hover";
  if (l < 0.55) return "line";
  if (l < 0.78) return "faint";
  return l < 0.93 ? "text-hover" : "text";
}

function mmxRole(property) {
  if (MMX_SURFACE.has(property)) return "surface";
  if (MMX_TEXT.has(property)) return "text";
  if (MMX_BORDER.has(property)) return "border";
  return null;
}

function mmxValue(token, alpha) {
  // A page-colored layer takes the surface of the panel it sits in.
  const color = token === "surface" ? "var(--mmx-surface, var(--mmx-base))" : `var(--mmx-${token})`;
  if (!alpha || parseFloat(alpha) === 1) return color;
  // Keep X's own opacity, which is often a variable.
  return `color-mix(in srgb, ${color} calc(${alpha} * 100%), transparent)`;
}

// Only X's generated classes: the sign-in components and the older
// frontend's one-class rules. Everything else is left to midnight.css.
function mmxScope(selector) {
  if (selector.includes("jetfuel-style-root") || selector.includes(".jf-")) return "current";
  if (/^\.r-[a-z0-9]+(:{1,2}[a-z-]+)?$/.test(selector)) return "legacy";
  return null;
}

function mmxAnswer(rule) {
  const scope = mmxScope(rule.selectorText);
  if (!scope) return "";
  let declarations = "";
  const done = new Set();
  for (const longhand of rule.style) {
    const role = mmxRole(longhand);
    if (!role) continue;
    // A shorthand written with var() leaves its longhands empty, so the
    // color has to be read from, and answered on, the shorthand.
    let property = longhand;
    if (!rule.style.getPropertyValue(longhand)) property = longhand === "background-color" ? "background" : longhand.startsWith("border-") ? "border-color" : longhand;
    if (done.has(property)) continue;
    done.add(property);
    const color = mmxParse(rule.style.getPropertyValue(property));
    if (!color || parseFloat(color.alpha) < 0.02) continue;
    const token = mmxToken(role, color.rgb, scope === "legacy", parseFloat(color.alpha));
    if (token) declarations += `${property}:${mmxValue(token, color.alpha)} !important;`;
  }
  return declarations && `${rule.selectorText}{${declarations}}`;
}

const mmxSeen = new WeakSet();
let mmxRuleCount = -1;
let mmxOutput;

function mmxWalk(rules, wrap, out) {
  for (const rule of rules) {
    if (mmxSeen.has(rule)) continue;
    if (rule.style && rule.selectorText) {
      mmxSeen.add(rule);
      const css = mmxAnswer(rule);
      if (css) out.push(wrap(css));
    } else if (rule.cssRules) {
      const condition = rule instanceof CSSMediaRule ? `@media ${rule.conditionText}` : rule instanceof CSSSupportsRule ? `@supports ${rule.conditionText}` : "";
      mmxWalk(rule.cssRules, condition ? (css) => wrap(`${condition}{${css}}`) : wrap, out);
    }
  }
}

// Called from features.js whenever the page changes. X inserts rules as new
// screens load, so the total is compared first and the sheets are only read
// when it has moved.
function mmxRecolor() {
  const sheets = [];
  let count = 0;
  for (const sheet of document.styleSheets) {
    if (sheet.ownerNode === mmxOutput) continue;
    try {
      count += sheet.cssRules.length;
      sheets.push(sheet);
    } catch {
      // A stylesheet from another origin. X's own token sheet is one, and
      // midnight.css handles it through the tokens.
    }
  }
  if (count === mmxRuleCount) return;
  mmxRuleCount = count;
  const out = [];
  for (const sheet of sheets) mmxWalk(sheet.cssRules, (css) => css, out);
  if (!out.length) return;
  if (!mmxOutput) {
    mmxOutput = document.createElement("style");
    mmxOutput.id = "xm-recolor";
  }
  if (!mmxOutput.isConnected) document.documentElement.appendChild(mmxOutput);
  mmxOutput.append(out.join("\n") + "\n");
}
