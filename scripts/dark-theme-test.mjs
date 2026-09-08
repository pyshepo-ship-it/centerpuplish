/**
 * اختبار الوضع الداكن — node scripts/dark-theme-test.mjs
 *
 * يصوّر الصفحات والمكوّنات الحقيقية (src/app/dashboard/... و src/components/...)
 * داخل jsdom فوق ورقة الأنماط الحقيقية المُصرَّفة من src/app/globals.css بخط
 * أنابيب المشروع نفسه (@tailwindcss/postcss)، ثم يقيس التباين الفعلي لكل نص
 * في الوضع الداكن ويمنع أي نص تحت 4.5:1 (حد WCAG AA).
 *
 * عن القياس — ما يفعله jsdom وما لا يفعله:
 *   • jsdom ينفّذ التتالي (cascade) والوراثة و:is() ويحسب المتغيرات المخصّصة،
 *     لكنه لا يفكّ var() داخل الخصائص، ولا يعرف @layer إطلاقاً.
 *   • لذا: نفكّ أغلفة @layer بمحلّل CSS حقيقي (postcss) مع إبقاء ترتيب القواعد
 *     كما هو في الملف (ترتيب طبقات tailwind هو theme ← base ← utilities وهو نفسه
 *     ترتيب ظهورها)، ونفكّ var() بخطوة التعريف الواحدة التي يعرّفها CSS.
 *   • بقية الحساب (مزج الشفافية، تحويل oklch، نسبة التباين) رياضيات ألوان
 *     قياسية. تحويل oklch تقريبي بفارق ±1/255 ولا يغيّر الحكم.
 */
import { readFileSync, writeFileSync, mkdirSync, rmSync, existsSync } from "node:fs"
import { resolve, join, dirname, relative, extname } from "node:path"
import { pathToFileURL } from "node:url"
import postcss from "postcss"
import tailwind from "@tailwindcss/postcss"
import ts from "typescript"
import { JSDOM } from "jsdom"

const ROOT = process.cwd()
const TMP = resolve(ROOT, ".tmp-dark-theme")
const MIN_CONTRAST = 4.5

let failures = 0
const fail = (msg) => { failures++; console.log(`  ✗ ${msg}`) }
const pass = (msg) => console.log(`  ✓ ${msg}`)
const info = (msg) => console.log(`  • ${msg}`)
const section = (t) => console.log(`\n${"=".repeat(58)}\n${t}\n${"=".repeat(58)}`)

// ============================================================================
// 1) بيئة jsdom
// ============================================================================
const dom = new JSDOM("<!DOCTYPE html><html dir='rtl'><head></head><body></body></html>", {
  url: "http://localhost/",
  pretendToBeVisual: true,
})
const { window } = dom

const defineGlobal = (name, value) => {
  try { globalThis[name] = value } catch { /* خاصية للقراءة فقط */ }
  Object.defineProperty(globalThis, name, { value, configurable: true, writable: true })
}
for (const name of ["window", "document", "navigator", "location", "localStorage", "sessionStorage"]) {
  defineGlobal(name, window[name])
}
for (const key of Object.getOwnPropertyNames(window)) {
  if (key in globalThis) continue
  try { globalThis[key] = window[key] } catch { /* خاصية للقراءة فقط */ }
}
for (const key of ["Event", "CustomEvent", "UIEvent", "MouseEvent", "KeyboardEvent", "FocusEvent", "InputEvent", "PointerEvent"]) {
  if (typeof window[key] === "function") defineGlobal(key, window[key])
}
globalThis.HTMLElement = window.HTMLElement
globalThis.getComputedStyle = window.getComputedStyle.bind(window)
globalThis.requestAnimationFrame = (cb) => setTimeout(() => cb(Date.now()), 0)
globalThis.cancelAnimationFrame = (id) => clearTimeout(id)
window.requestAnimationFrame = globalThis.requestAnimationFrame
window.cancelAnimationFrame = globalThis.cancelAnimationFrame
window.matchMedia = window.matchMedia || ((query) => ({
  matches: false, media: query, onchange: null,
  addListener() {}, removeListener() {}, addEventListener() {}, removeEventListener() {}, dispatchEvent: () => false,
}))
globalThis.matchMedia = window.matchMedia
class ResizeObserverStub { observe() {} unobserve() {} disconnect() {} }
globalThis.ResizeObserver = ResizeObserverStub
window.ResizeObserver = ResizeObserverStub
for (const m of ["scrollIntoView", "hasPointerCapture", "setPointerCapture", "releasePointerCapture"]) {
  if (!window.HTMLElement.prototype[m]) window.HTMLElement.prototype[m] = () => {}
}
globalThis.IS_REACT_ACT_ENVIRONMENT = true

// ============================================================================
// 2) ورقة الأنماط الحقيقية
// ============================================================================
const cssFrom = resolve(ROOT, "src/app/globals.css")
const compiled = await postcss([tailwind()]).process(readFileSync(cssFrom, "utf8"), { from: cssFrom })

const flattenLayers = (css) => {
  const root = postcss.parse(css)
  const layers = []
  root.walkAtRules("layer", (rule) => layers.push(rule))
  for (const rule of layers) {
    if (rule.nodes && rule.nodes.length) rule.replaceWith(rule.nodes)
    else rule.remove()
  }
  const props = []
  root.walkAtRules("property", (rule) => props.push(rule))
  for (const rule of props) rule.remove()
  return root.toString()
}
const CSS = flattenLayers(compiled.css)
console.log(`ورقة الأنماط المُصرَّفة: ${compiled.css.length} بايت (بعد فكّ @layer لـ jsdom: ${CSS.length})`)

const styleEl = window.document.createElement("style")
styleEl.textContent = CSS
window.document.head.appendChild(styleEl)

// ============================================================================
// 3) تجميع شجرة الوحدات الحقيقية (TSX → ESM)
// ============================================================================
rmSync(TMP, { recursive: true, force: true })
mkdirSync(TMP, { recursive: true })

const EXTS = [".tsx", ".ts", ".jsx", ".js", ".mjs"]
const STUBS = {
  "next/navigation": `export const useParams = () => globalThis.__routeParams || {}
export const usePathname = () => globalThis.__routePath || "/"
export const useSearchParams = () => new URLSearchParams(globalThis.__routeQuery || "")
export const useRouter = () => ({ push(){}, replace(){}, back(){}, refresh(){}, prefetch(){} })
`,
  "next/link": `import React from "react"
export default function Link({ href, children, ...rest }) {
  return React.createElement("a", { href: typeof href === "string" ? href : href?.pathname || "/", ...rest }, children)
}
`,
  "react-hot-toast": `const push = (message) => {
  const list = (globalThis.__toasts ||= [])
  list.push(String(message && message.message ? message.message : message))
  return "t" + list.length
}
push.success = (m) => push(m); push.error = (m) => push(m); push.dismiss = () => {}
export default push
`,
}

const stubPath = (name) => {
  const file = join(TMP, "stubs", name.replace(/[/@]/g, "_") + ".mjs")
  mkdirSync(dirname(file), { recursive: true })
  writeFileSync(file, STUBS[name], "utf8")
  return file
}

const resolveLocal = (fromFile, spec) => {
  const base = spec.startsWith("@/")
    ? resolve(ROOT, "src", spec.slice(2))
    : resolve(dirname(fromFile), spec)
  if (existsSync(base) && !extname(base)) {
    for (const e of EXTS) if (existsSync(base + e)) return base + e
    for (const e of EXTS) if (existsSync(join(base, "index" + e))) return join(base, "index" + e)
    return null
  }
  if (existsSync(base)) return base
  for (const e of EXTS) if (existsSync(base + e)) return base + e
  return null
}

const outPathOf = (srcFile) =>
  join(TMP, relative(ROOT, srcFile).replace(/\.(tsx|ts|jsx|js)$/, "") + ".mjs")

const built = new Map()
const buildEntry = (file) => {
  const queue = [file]
  while (queue.length) {
    const current = queue.shift()
    if (built.has(current)) continue
    const src = readFileSync(current, "utf8")
    const out = outPathOf(current)
    built.set(current, out)

    const specs = new Set()
    for (const m of src.matchAll(/(?:from|import)\s*["']([^"']+)["']/g)) specs.add(m[1])

    const map = new Map()
    for (const spec of specs) {
      let target = null
      if (STUBS[spec]) {
        target = stubPath(spec)
      } else if (spec.startsWith("@/") || spec.startsWith(".")) {
        const local = resolveLocal(current, spec)
        if (!local) continue
        if (!built.has(local)) queue.push(local)
        target = outPathOf(local)
      } else {
        continue
      }
      let rel = relative(dirname(out), target).replace(/\\/g, "/")
      if (!rel.startsWith(".")) rel = "./" + rel
      map.set(spec, rel)
    }
    const code = src.replace(/(["'])([^"'\n]+)\1/g, (m, q, spec) =>
      map.has(spec) ? q + map.get(spec) + q : m)

    const js = ts.transpileModule(code, {
      fileName: current,
      compilerOptions: {
        module: ts.ModuleKind.ESNext,
        target: ts.ScriptTarget.ES2020,
        jsx: ts.JsxEmit.ReactJSX,
        esModuleInterop: true,
        allowJs: true,
      },
    }).outputText
    mkdirSync(dirname(out), { recursive: true })
    writeFileSync(out, js, "utf8")
  }
}

const importBuilt = (absPath) => import(pathToFileURL(built.get(absPath)).href)

// ============================================================================
// 4) رياضيات الألوان
// ============================================================================
const clamp255 = (v) => Math.min(255, Math.max(0, Math.round(v)))

/** oklch() — صيغة Tailwind v4 لألوان gray وأخواتها — إلى sRGB (تقريبي ±1/255) */
const oklchToRgb = (L, C, hDeg) => {
  const h = (hDeg * Math.PI) / 180
  const a = C * Math.cos(h)
  const b = C * Math.sin(h)
  const l_ = L + 0.3963377774 * a + 0.2158037573 * b
  const m_ = L - 0.1055613458 * a - 0.0638541728 * b
  const s_ = L - 0.0894841775 * a - 1.291485548 * b
  const l = l_ ** 3, m = m_ ** 3, s = s_ ** 3
  const lin = [
    4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s,
    -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s,
    -0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s,
  ]
  const gamma = (v) => {
    const c = v <= 0.0031308 ? 12.92 * v : 1.055 * Math.pow(Math.max(v, 0), 1 / 2.4) - 0.055
    return clamp255(c * 255)
  }
  return lin.map(gamma)
}

const parseColorString = (value) => {
  const v = String(value || "").trim()
  if (!v || v === "transparent" || v === "initial" || v === "none") return { rgb: [0, 0, 0], alpha: 0 }
  const rgba = v.match(/^rgba?\(([^)]+)\)$/)
  if (rgba) {
    const parts = rgba[1].split(/[,\s/]+/).filter(Boolean)
    return { rgb: parts.slice(0, 3).map(Number), alpha: parts.length > 3 ? parseFloat(parts[3]) : 1 }
  }
  const hex = v.replace("#", "")
  if (/^[0-9a-f]{3}$|^[0-9a-f]{6}$|^[0-9a-f]{8}$/i.test(hex)) {
    const h = hex.length === 3 ? hex.split("").map((c) => c + c).join("") : hex
    return {
      rgb: [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16)),
      alpha: h.length === 8 ? parseInt(h.slice(6, 8), 16) / 255 : 1,
    }
  }
  const oklch = v.match(/^oklch\(\s*([\d.]+)(%?)\s*([\d.]+)\s+([\d.]+)\s*\)$/)
  if (oklch) {
    const rawL = parseFloat(oklch[1])
    const L = oklch[2] === "%" || rawL > 1 ? rawL / 100 : rawL
    return { rgb: oklchToRgb(L, parseFloat(oklch[3]), parseFloat(oklch[4])), alpha: 1 }
  }
  return null
}

/** يفكّ var() عبر قيمة المتغير المحسوبة من jsdom على العنصر نفسه */
const substituteVar = (el, value, depth = 0) => {
  if (depth > 6) return value
  const out = String(value).replace(/var\(\s*(--[A-Za-z0-9-]+)\s*(?:,\s*([^)]*))?\)/g, (_m, name, fallback) => {
    const resolved = window.getComputedStyle(el).getPropertyValue(name).trim()
    return resolved || (fallback || "").trim()
  })
  return out.includes("var(") ? substituteVar(el, out, depth + 1) : out
}

/** يفكّ color-mix(... transparent) إلى لون + شفافية (المزج في sRGB) */
const resolveColor = (el, raw, depth = 0) => {
  if (depth > 6) return null
  const value = substituteVar(el, raw).trim()
  const mix = value.match(/^color-mix\(in\s+[\w-]+,\s*(.+?)\s+([\d.]+)%,\s*(.+?)\s*([\d.]+)?%?\)$/)
  if (mix) {
    const a = resolveColor(el, mix[1], depth + 1)
    const b = resolveColor(el, mix[3], depth + 1)
    if (!a || !b) return null
    const pa = parseFloat(mix[2]) / 100
    const pb = mix[4] ? parseFloat(mix[4]) / 100 : 1 - pa
    const total = pa + pb || 1
    const alpha = (a.alpha * pa + b.alpha * pb) / total
    const rgb = [0, 1, 2].map((i) => clamp255((a.rgb[i] * pa + b.rgb[i] * pb) / total))
    return { rgb, alpha }
  }
  return parseColorString(value)
}

const readProp = (el, prop) => resolveColor(el, window.getComputedStyle(el)[prop])

const blend = (fg, alpha, bg) => [0, 1, 2].map((i) => clamp255(fg[i] * alpha + bg[i] * (1 - alpha)))

const luminance = ([r, g, b]) => {
  const ch = (v) => { const c = v / 255; return c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4) }
  return 0.2126 * ch(r) + 0.7152 * ch(g) + 0.0722 * ch(b)
}
const contrastOf = (a, b) => {
  const l1 = luminance(a), l2 = luminance(b)
  return (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05)
}
const hex = (rgb) => "#" + rgb.map((v) => clamp255(v).toString(16).padStart(2, "0")).join("")

/** خلفية العنصر الفعلية بعد تركيب كل خلفيات أسلافه الشفافة */
const effectiveBackground = (el) => {
  const chain = []
  for (let n = el; n && n.nodeType === 1; n = n.parentElement) chain.push(n)
  chain.reverse()
  let base = [255, 255, 255]
  for (const node of chain) {
    const bg = readProp(node, "backgroundColor")
    if (bg && bg.alpha > 0) base = blend(bg.rgb, bg.alpha, base)
  }
  return base
}

/**
 * نهايات التدرّج اللوني لأقرب سلف يحمل bg-gradient-to-*.
 * نقرأ الألوان من متغيرات ورقة الأنماط نفسها (--color-indigo-600 …) لا من
 * التخمين، ثم نقيس النص على أسوأ نهاية — لأن الخلفية الحقيقية تدرّج وليست
 * background-color، وبدون هذا يبدو نص الأزرار المتدرّجة كأنه على خلفية البطاقة.
 */
const gradientStops = (el) => {
  const isDark = window.document.documentElement.classList.contains("dark")
  for (let n = el; n && n.nodeType === 1; n = n.parentElement) {
    const cls = n.getAttribute("class") || ""
    if (!/\bbg-gradient-to-[trbl]\b|\bbg-linear-to-[trbl]\b/.test(cls)) continue

    // نهايات الحالة العادية فقط — لا hover:/focus: وإلا قِسنا على لون لا يظهر.
    // وفي الوضع الداكن الأولوية لنهايتي dark: لأن كثيراً من البطاقات تستبدل
    // التدرّج الفاتح بآخر داكن، وتجاهُلهما يقيس على لون غير معروض.
    const plain = /(?:^|\s)(?:from|via|to)-([a-z]+-[0-9]{2,3})(?:\/([0-9]+))?(?=\s|$)/g
    const darkRe = /(?:^|\s)dark:(?:from|via|to)-([a-z]+-[0-9]{2,3})(?:\/([0-9]+))?(?=\s|$)/g
    let matches = [...cls.matchAll(plain)]
    if (isDark) {
      const darkMatches = [...cls.matchAll(darkRe)]
      if (darkMatches.length) matches = darkMatches
    }

    const backdrop = effectiveBackground(n) // ما خلف التدرّج (لشفافية ‎/30)
    const stops = []
    for (const m of matches) {
      const raw = window.getComputedStyle(n).getPropertyValue(`--color-${m[1]}`).trim()
      const parsed = raw ? parseColorString(substituteVar(n, raw)) : null
      if (!parsed) continue
      const alpha = m[2] ? parseFloat(m[2]) / 100 : 1
      const rgb = alpha < 1 ? blend(parsed.rgb, alpha, backdrop) : parsed.rgb
      stops.push({ name: alpha < 1 ? `${m[1]}/${m[2]}` : m[1], rgb })
    }
    if (stops.length) return stops
  }
  return null
}

// ============================================================================
// 5) المدقّق: كل نص ظاهر يجب أن يتجاوز MIN_CONTRAST
// ============================================================================
const describe = (el) => {
  const txt = (el.textContent || "").replace(/\s+/g, " ").trim().slice(0, 42)
  const cls = (el.getAttribute("class") || "").split(/\s+/).filter((c) => c && !c.startsWith("dark:") && !c.startsWith("hover:")).slice(0, 4).join(".")
  return `<${el.tagName.toLowerCase()}${cls ? "." + cls : ""}> «${txt}»`
}

/**
 * الشفافية المقصودة تصميمياً فقط (أصناف opacity-NN).
 * لا نقرأ الشفافية المحسوبة: framer-motion يضبط inline opacity:0 في بداية كل
 * حركة (٨٠ موضعاً في المشروع) والحركة لا تعمل في jsdom، فلو حسبناها لصار كل
 * نص داخل حركة «لون = خلفية» بتباين 1:1 — قياس خاطئ لا عيب حقيقي.
 */
const classOpacity = (el) => {
  const m = (el.getAttribute("class") || "").match(/(?:^|\s)opacity-(\d+)(?:\/\d+)?(?=\s|$)/)
  return m ? parseFloat(m[1]) / 100 : 1
}
const inheritedOpacity = (el) => {
  let o = 1
  for (let n = el; n && n.nodeType === 1; n = n.parentElement) o *= classOpacity(n)
  return o
}

const collectContrasts = (rootEl) => {
  const map = new Map()
  let skipped = 0
  const nodes = [rootEl, ...rootEl.querySelectorAll("*")]
  for (const el of nodes) {
    const cs = window.getComputedStyle(el)
    if (cs.display === "none" || cs.visibility === "hidden") continue

    const hasOwnText = [...el.childNodes].some((n) => n.nodeType === 3 && (n.textContent || "").trim())
    const isInput = el.tagName === "INPUT" || el.tagName === "TEXTAREA" || el.tagName === "SELECT"
    if (!hasOwnText && !isInput) continue

    const stops = gradientStops(el)
    const bg = stops ? null : effectiveBackground(el)
    if (!stops && cs.backgroundImage && cs.backgroundImage !== "none") { skipped++; continue } // صورة خلفية

    const fgRaw = readProp(el, "color")
    if (!fgRaw) { skipped++; continue }
    const fg = blend(fgRaw.rgb, fgRaw.alpha * inheritedOpacity(el), bg || [0, 0, 0])

    let ratio
    let bgLabel
    if (stops) {
      let worst = null
      for (const s of stops) {
        const r = contrastOf(fg, s.rgb)
        if (!worst || r < worst.ratio) worst = { ratio: r, name: s.name, rgb: s.rgb }
      }
      ratio = worst.ratio
      bgLabel = `تدرّج ${worst.name} ${hex(worst.rgb)}`
    } else {
      ratio = contrastOf(fg, bg)
      bgLabel = hex(bg)
    }
    map.set(el, { ratio, fg: hex(fg), bg: bgLabel, declared: substituteVar(el, cs.color).trim() })
  }
  return { map, skipped }
}

/**
 * يقارن العنصر نفسه في الوضعين. القاعدة:
 *   • الوضع الداكن مكسور وتحت الحد، وهو أسوأ من الفاتح  ← فشل (عطل وضع داكن).
 *   • الاثنان تحت الحد  ← تحذير فقط: قرار ألوان قائم قبل الوضع الداكن وليس عطبه.
 */
const auditSubtree = async (rootEl, label) => {
  await setTheme("light")
  const light = collectContrasts(rootEl)
  await setTheme("dark")
  const dark = collectContrasts(rootEl)

  const broken = []
  const preexisting = []
  let checked = 0
  for (const [el, d] of dark.map) {
    const l = light.map.get(el)
    if (!l) continue
    checked++
    if (d.ratio >= MIN_CONTRAST) continue
    const line = `${describe(el)} — داكن ${d.fg} على ${d.bg} = ${d.ratio.toFixed(2)}:1 (فاتح ${l.ratio.toFixed(2)}:1)`
    if (d.ratio < l.ratio - 0.25) broken.push(line)
    else preexisting.push(line)
  }

  console.log(`\n--- ${label}: قورن ${checked} نصاً بين الوضعين (تُخطّي ${dark.skipped}) ---`)
  if (!broken.length) pass(`لا نص انكسر في الوضع الداكن (الحد ${MIN_CONTRAST}:1)`)
  for (const line of broken) fail(line)
  if (preexisting.length) {
    console.log(`  ⚠ ${preexisting.length} نص تحت ${MIN_CONTRAST}:1 في الوضعين معاً — قرار ألوان قائم وليس عطل الوضع الداكن:`)
    for (const line of preexisting) console.log(`     · ${line}`)
  }
  await setTheme("dark")
  return broken.length
}

// ============================================================================
// 6) أدوات التصيير
// ============================================================================
const React = (await import("react")).default
const { act } = await import("react")
const { createRoot } = await import("react-dom/client")

const html = window.document.documentElement
const setTheme = async (theme) => {
  html.className = theme === "dark" ? "dark" : ""
  await act(async () => { await new Promise((r) => setTimeout(r, 0)) })
}
const flush = async (ms = 40) => { await act(async () => { await new Promise((r) => setTimeout(r, ms)) }) }
const click = async (el) => {
  await act(async () => {
    for (const type of ["pointerdown", "mousedown", "pointerup", "mouseup", "click"]) {
      el.dispatchEvent(new window.MouseEvent(type, { bubbles: true, cancelable: true, button: 0 }))
    }
    await new Promise((r) => setTimeout(r, 40))
  })
}
const byText = (needle, tag = "button") =>
  [...window.document.body.querySelectorAll(tag)].find((el) => (el.textContent || "").includes(needle))

const mountPage = async (Component) => {
  const container = window.document.createElement("div")
  window.document.body.appendChild(container)
  const root = createRoot(container)
  await act(async () => {
    root.render(React.createElement(Component))
    await new Promise((r) => setTimeout(r, 120))
  })
  return {
    container,
    unmount: async () => {
      await act(async () => { root.unmount() })
      for (const el of [...window.document.body.children]) el.remove()
    },
  }
}

// ============================================================================
// 7) السيناريو الأول: نافذة «إضافة مجموعة» (الشاشة المُبلَّغ عنها)
// ============================================================================
const PROBE_SOURCE = `
import React from "react"
import { TimePicker } from "@/components/time-picker"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

export function ProbeDialog() {
  const [start, setStart] = React.useState("16:00")
  const [end, setEnd] = React.useState("18:00")
  return (
    <Dialog open>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>إضافة مجموعة جديدة</DialogTitle>
          <DialogDescription>أدخل بيانات المجموعة الجديدة</DialogDescription>
        </DialogHeader>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <TimePicker label="وقت البداية" value={start} onChange={setStart} required />
          <TimePicker label="وقت النهاية" value={end} onChange={setEnd} required />
        </div>
        <div>
          <Label htmlFor="monthlyFee">السعر الشهري (ج.م) *</Label>
          <Input id="monthlyFee" defaultValue="150" className="mt-1 bg-white dark:bg-gray-900" />
        </div>
      </DialogContent>
    </Dialog>
  )
}
`
const PROBE_FILE = join(TMP, "probe-entry.tsx")
writeFileSync(PROBE_FILE, PROBE_SOURCE, "utf8")
buildEntry(PROBE_FILE)
const { ProbeDialog } = await importBuilt(PROBE_FILE)

section("1) منتقي الوقت داخل نافذة مجموعة — الوضعان")
const probeMount = window.document.createElement("div")
window.document.body.appendChild(probeMount)
const probeRoot = createRoot(probeMount)
await act(async () => { probeRoot.render(React.createElement(ProbeDialog)) })

const measureTimePickers = (theme) => {
  console.log(`\n  [الوضع ${theme === "dark" ? "الداكن" : "الفاتح"}]`)
  const dialog = window.document.querySelector("[role='dialog']")
  const dialogBg = effectiveBackground(dialog)
  info(`خلفية النافذة: ${hex(dialogBg)}`)
  const triggers = [...window.document.querySelectorAll("button[role='combobox']")]
  for (const [i, btn] of triggers.entries()) {
    const bg = effectiveBackground(btn)
    const fg = readProp(btn, "color")
    const ratio = contrastOf(fg.rgb, bg)
    const line = `قائمة #${i + 1} «${btn.textContent.replace(/\s+/g, " ").trim()}»: نص ${hex(fg.rgb)} على ${hex(bg)} = ${ratio.toFixed(2)}:1`
    if (ratio < MIN_CONTRAST) fail(line)
    else pass(line)
  }
  const input = window.document.querySelector("input#monthlyFee")
  if (input) {
    const bg = effectiveBackground(input)
    const fg = readProp(input, "color")
    const ratio = contrastOf(fg.rgb, bg)
    const line = `حقل السعر الشهري: نص ${hex(fg.rgb)} على ${hex(bg)} = ${ratio.toFixed(2)}:1`
    if (ratio < MIN_CONTRAST) fail(line)
    else pass(line)
  }
}

await setTheme("light")
measureTimePickers("light")
await setTheme("dark")
measureTimePickers("dark")

// القائمة المنسدلة نفسها (Portal عند الفتح)
await click(window.document.querySelector("button[role='combobox']"))
const listbox = window.document.querySelector("[role='listbox']")
if (listbox) {
  const bg = effectiveBackground(listbox)
  const option = listbox.querySelector("[role='option']") || listbox
  const fg = readProp(option, "color")
  const ratio = contrastOf(fg.rgb, bg)
  const line = `القائمة المنسدلة (داكن): نص ${hex(fg.rgb)} على ${hex(bg)} = ${ratio.toFixed(2)}:1`
  if (ratio < MIN_CONTRAST) fail(line)
  else pass(line)
} else {
  info("لم تُفتح القائمة المنسدلة داخل jsdom")
}
await act(async () => { probeRoot.unmount() })
for (const el of [...window.document.body.children]) el.remove()

// ============================================================================
// 8) السيناريو الثاني: صفحات حقيقية في الوضع الداكن
// ============================================================================
const PAGE_FILES = {
  home: "src/app/dashboard/page.tsx",
  grades: "src/app/dashboard/grades/page.tsx",
  students: "src/app/dashboard/students/page.tsx",
  requests: "src/app/dashboard/requests/page.tsx",
  payments: "src/app/dashboard/payments/page.tsx",
  attendance: "src/app/dashboard/attendance/page.tsx",
  reports: "src/app/dashboard/reports/page.tsx",
  announcements: "src/app/dashboard/announcements/page.tsx",
  settings: "src/app/dashboard/settings/page.tsx",
  exams: "src/app/dashboard/exams/page.tsx",
}
const PAGE_PATHS = Object.fromEntries(
  Object.entries(PAGE_FILES).map(([k, rel]) => [k, resolve(ROOT, rel)])
)
const MEM_LIB = resolve(ROOT, "src/lib/memory-store.ts")
for (const f of [...Object.values(PAGE_PATHS), MEM_LIB]) buildEntry(f)
const PAGES = {}
for (const [k, f] of Object.entries(PAGE_PATHS)) PAGES[k] = (await importBuilt(f)).default
const MEM = await importBuilt(MEM_LIB)

const nowIso = new Date().toISOString()
/** التغذية كما تفعل pullAllData من Supabase: ذاكرة الجلسة فقط */
const seed = (data) => {
  MEM.clearStore()
  window.localStorage.clear()
  globalThis.__toasts = []
  for (const [k, v] of Object.entries(data)) MEM.writeRows(k, v)
}

const GRADE = {
  id: "g-1", name: "الصف الأول الثانوي", academicYear: "2026-2027", createdAt: nowIso,
  groups: [{
    id: "gr-1", name: "مجموعة السبت", days: ["السبت"], startTime: "16:00", endTime: "18:00",
    monthlyFee: 300, sessionFee: 0, weeklyFee: 0, sessionsPerMonth: 4,
    pricingMode: "monthly", studentsCount: 1,
  }],
}
const STUDENT = {
  id: "s-1", name: "أحمد محمد", phone: "01000000000", gradeId: "g-1", groupId: "gr-1",
  status: "active", createdAt: nowIso, updatedAt: nowIso,
}
const DUE = {
  id: "d-1", studentId: "s-1", groupId: "gr-1", month: 9, year: 2026, amount: 300,
  status: "pending", createdAt: nowIso, periodLabel: "سبتمبر 2026", dueDate: "2026-09-10",
}
const PAYMENT = {
  id: "p-1", studentId: "s-1", dueId: "d-1", amount: 300, method: "cash",
  date: "2026-09-05", createdAt: nowIso,
}
const EXAM = {
  id: "e-1", title: "اختبار الشهر الأول", type: "objective", gradeId: "g-1", groupId: "",
  totalMarks: 10, status: "draft", questions: [], createdAt: nowIso,
}
const ANNOUNCEMENT = {
  id: "a-1", title: "موعد الاختبار", content: "الاختبار يوم السبت", audience: "all",
  createdAt: nowIso,
}
const BASE = {
  grades: [GRADE], students: [STUDENT], dues: [DUE], payments: [PAYMENT],
  exams: [EXAM], announcements: [ANNOUNCEMENT], attendance: [], duesExtra: [],
  registrationRequests: [], groupTransferRequests: [], inquiries: [],
  honorees: [], surveys: [], surveyResponses: [], sharedFiles: [], importantLinks: [],
  manualGrades: [], studentAccounts: [], studentHistory: [], sessions: [], examAttempts: [],
}

await setTheme("dark")

const scenarios = [
  { name: "الصفوف والمواعيد + نافذة «إضافة مجموعة»", page: "grades", open: "إضافة مجموعة" },
  { name: "الصفوف والمواعيد + نافذة «إضافة صف جديد»", page: "grades", open: "إضافة صف جديد" },
  { name: "الطلاب + نافذة «إضافة طالب جديد»", page: "students", open: "إضافة طالب جديد" },
  { name: "التحصيل الشهري", page: "payments", open: null },
  { name: "الرئيسية", page: "home", open: null },
  { name: "الحضور والغياب", page: "attendance", open: null },
  { name: "التقارير", page: "reports", open: null },
  { name: "طلبات الطلاب", page: "requests", open: null },
  { name: "الإعلانات + نافذة إنشاء إعلان", page: "announcements", open: "إضافة إعلان" },
  { name: "الإعدادات", page: "settings", open: null },
  {
    name: "الإعدادات — تبويب «حول الموقع»",
    page: "settings",
    open: null,
    tab: "حول الموقع",
    expect: [
      "محمد عبده",
      "01207770329",
      "conta.shepo@gmail.com",
      "v1.0.2",
      "جميع الحقوق محفوظة",
      "لا يجوز توزيع النظام بدون إذن مسبق",
    ],
    links: [
      "wa.me/201207770329",
      "mailto:conta.shepo@gmail.com",
      "tel:+201207770329",
      "tg://resolve?phone=201207770329",
    ],
  },
  { name: "الاختبارات", page: "exams", open: null },
]



section("2) تدقيق شامل للتباين في الوضع الداكن — صفحات حقيقية")
for (const sc of scenarios) {
  seed({ ...BASE, ...(sc.data || {}) })
  const { unmount } = await mountPage(PAGES[sc.page])
  await flush()

  // فتح تبويب فرعي داخل الصفحة (مثل تبويبات الإعدادات) قبل الفحص
  if (sc.tab) {
    const tabBtn = byText(sc.tab)
    if (tabBtn) {
      await click(tabBtn)
      await flush(80)
    } else {
      fail(`تبويب «${sc.tab}» غير موجود في ${sc.name}`)
    }
  }

  await auditSubtree(window.document.body, `${sc.name} — الصفحة`)

  // نصوص وروابط يجب أن تظهر فعلاً بعد التصيير
  if (sc.expect) {
    const text = window.document.body.textContent || ""
    for (const needle of sc.expect) {
      if (text.includes(needle)) pass(`${sc.name} — يعرض «${needle}»`)
      else fail(`${sc.name} — لا يعرض «${needle}»`)
    }
  }
  if (sc.links) {
    const anchors = [...window.document.querySelectorAll("a")].map(a => a.getAttribute("href") || "")
    for (const href of sc.links) {
      if (anchors.some(h => h.includes(href))) pass(`${sc.name} — رابط ${href}`)
      else fail(`${sc.name} — لا رابط فيه ${href}`)
    }
  }

  if (sc.open) {
    const btn = byText(sc.open)
    if (btn) {
      await click(btn)
      await flush(80)
      const dialog = window.document.querySelector("[role='dialog']")
      if (dialog) await auditSubtree(dialog, `${sc.name} — النافذة المفتوحة`)
      else info(`فُتح «${sc.open}» لكن لا حوار Radix في المستند`)
    } else {
      info(`زر «${sc.open}» غير موجود في هذه الحالة — لم تُفحص النافذة`)
    }
  }
  await unmount()
}

// ============================================================================
// 9) تحقق بنيوي: الدلالات تتغيّر فعلاً بين الوضعين
// ============================================================================
section("3) دلالات الألوان: هل تتغيّر فعلاً في الوضع الداكن؟")
const UTILITY_TOKENS = [
  "bg-background", "text-foreground", "bg-popover", "text-popover-foreground",
  "bg-accent", "text-muted-foreground", "bg-card", "border-input", "bg-muted",
]
for (const utility of UTILITY_TOKENS) {
  const rule = new RegExp(`\\.${utility.replace(/[-/\\^$*+?.()|[\]{}]/g, "\\$&")}\\s*\\{[^}]*\\}`).exec(CSS)
  if (!rule) { fail(`الأداة .${utility} غير موجودة في ورقة الأنماط`); continue }
  const varName = (rule[0].match(/var\((--[A-Za-z0-9-]+)\)/) || [])[1]
  if (!varName) { fail(`الأداة .${utility} لا تستعمل متغير دلالات: ${rule[0].replace(/\s+/g, " ")}`); continue }

  await setTheme("light")
  const light = window.getComputedStyle(window.document.body).getPropertyValue(varName).trim()
  await setTheme("dark")
  const dark = window.getComputedStyle(window.document.body).getPropertyValue(varName).trim()

  const line = `.${utility} ← ${varName}: فاتح ${light || "(فارغ)"} / داكن ${dark || "(فارغ)"}`
  if (!dark) fail(`${line} — لا قيمة داكنة`)
  else if (light === dark) fail(`${line} — القيمة لا تتغيّر في الوضع الداكن`)
  else pass(line)
}

rmSync(TMP, { recursive: true, force: true })
console.log(`\n${failures === 0 ? "✅ نجح اختبار الوضع الداكن" : `❌ فشل اختبار الوضع الداكن — ${failures} مشكلة`}`)
process.exit(failures === 0 ? 0 : 1)
