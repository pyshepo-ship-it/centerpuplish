/**
 * معلومات التطبيق الثابتة — «حول الموقع»
 *
 * هذه بيانات ثابتة عن المنتج نفسه (الإصدار، اسم المطوّر، قنوات الدعم، حقوق
 * الملكية) وليست بيانات موقع ولا بيانات طلاب، لذلك تبقى في الكود ولا تُحفظ في
 * Supabase ولا على الجهاز — التزاماً بسياسة «السحابية الخالصة» للمشروع.
 *
 * تُستخدم في:
 *   • تبويب «حول الموقع» داخل لوحة التحكم ← الإعدادات.
 *   • بطاقة «معلومات النظام» في تبويب البيانات والمزامنة (مصدر واحد للإصدار).
 */

/** إصدار التطبيق الحالي — يُحدَّث هنا مع كل إصدار جديد فيظهر في كل المكان */
export const APP_VERSION = "1.0.2"

/** الإصدار بصيغة العرض: v1.0.2 */
export const APP_VERSION_LABEL = `v${APP_VERSION}`

/** اسم المنتج (ثابت — لا يتغير بتغيّر اسم السنتر/المدرس في الإعدادات) */
export const APP_NAME = "نظام إدارة الدروس الخصوصية"

/** سنة ثبوت حقوق الملكية (تظهر في سطر الحقوق) */
export const COPYRIGHT_YEAR = "2026"

/** المطوّر وبيانات التواصل الرسمية للدعم وطلبات الإذن */
export const DEVELOPER = {
  /** اسم المطوّر */
  name: "محمد عبده",
  /** صفته */
  role: "مطوّر ومالك النظام",
  /** رقم الهاتف كما يُطلب محلياً (مصر) */
  phone: "01207770329",
  /** الرقم بالصيغة الدولية (مفتاح الدولة) لروابط واتساب وتليجرام والاتصال */
  phoneInternational: "201207770329",
  /** البريد الإلكتروني الرسمي */
  email: "conta.shepo@gmail.com",
} as const

/**
 * معرّف تليجرام للمطوّر (بدون @) إن وُجد — يجعل رابط تليجرام على الشكل
 * t.me/username. فارغ حالياً فيُبنى الرابط من رقم الهاتف.
 */
export const DEVELOPER_TELEGRAM_USERNAME: string = ""

/** رابط واتساب مباشر مع المطوّر */
export const DEVELOPER_WHATSAPP_URL = `https://wa.me/${DEVELOPER.phoneInternational}`

/** رابط تليجرام: بالمعرّف إن ضُبط، وإلا برقم الهاتف */
export const DEVELOPER_TELEGRAM_URL = DEVELOPER_TELEGRAM_USERNAME
  ? `https://t.me/${DEVELOPER_TELEGRAM_USERNAME.replace(/^@/, "")}`
  : `tg://resolve?phone=${DEVELOPER.phoneInternational}`

/** رابط اتصال هاتفي مباشر */
export const DEVELOPER_TEL_URL = `tel:+${DEVELOPER.phoneInternational}`

/** رابط بريد إلكتروني مباشر */
export const DEVELOPER_MAIL_URL = `mailto:${DEVELOPER.email}`

/** سطر حقوق الملكية المختصر (يُستخدم في أكثر من موضع) */
export const COPYRIGHT_LINE = `جميع الحقوق محفوظة © ${COPYRIGHT_YEAR} — ${DEVELOPER.name}`

/** نص حظر التوزيع المختصر */
export const LICENSE_SHORT =
  "لا يجوز نسخ النظام أو توزيعه أو نشره أو بيعه بدون إذن كتابي مسبق من المطوّر."

/** المكوّنات التقنية المعروضة في «حول الموقع» */
export const APP_TECH_STACK: readonly { label: string; value: string }[] = [
  { label: "الواجهة", value: "Next.js 16 + React 19 + TypeScript" },
  { label: "التصميم", value: "Tailwind CSS v4 — عربية (RTL) مع وضع ليلي/نهاري" },
  { label: "قاعدة البيانات", value: "Supabase (PostgreSQL) — سحابة" },
  { label: "حفظ البيانات", value: "في السحابة فقط — صفر تخزين محلي لبيانات الطلاب" },
]
