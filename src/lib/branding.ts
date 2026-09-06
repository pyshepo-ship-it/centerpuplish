/**
 * هوية الموقع (البراندنج) — نظام إدارة الدروس الخصوصية
 *
 * اسم الموقع (اسم السنتر أو المدرس) يُستمد بالكامل من الإعدادات:
 *   • المالك يغيّر «اسم المدرس / السنتر» من لوحة التحكم → الإعدادات.
 *   • يُحفظ الاسم في جدول app_settings في Supabase (مفتاح teacherName).
 *   • يظهر تلقائياً في: عنوان المتصفح، الصفحة الرئيسية، صفحة الدخول،
 *     اللوحة الجانبية، شاشة الترحيب، ترويسة/تذليل الصفحات، ملفات PDF،
 *     أوراق الاختبارات والجداول، وتواقيع الشهادات ولوحة الشرف.
 *
 * عند عدم ضبط اسم، يظهر الاسم الافتراضي العام للنظام.
 */
import { queuePush, pushSetting } from "./supabase/sync"
import { readSetting, writeSetting } from "./memory-store"

/** العبارة الافتراضية لسطر التمني في تذييل الاختبارات والشهادات */
export const DEFAULT_TEACHER_SIGNATURE_LINE = "مع تمنياتي لكم بالتوفيق والنجاح"

/**
 * الاسم الافتراضي العام للنظام (يظهر قبل أن يحدّد المالك اسم سنتره/مدرّسه).
 * ليس تابعاً لمعلم بعينه — أي سنتر أو مدرس يستخدم نفس النظام.
 */
export const DEFAULT_TEACHER_NAME = "نظام إدارة الدروس الخصوصية"

/** اسم المنتج الثابت (لا يتغير باسم المالك) */
export const PRODUCT_NAME = "نظام إدارة الدروس الخصوصية"

/** مفتاح الإعداد الذي يخزّن اسم المدرس/السنتر في app_settings */
export const TEACHER_NAME_SETTING_KEY = "teacherName"

/** التوقيع الثابت (متوافق مع الشيفرات القديمة وفحوصات التدقيق) */
export const TEACHER_SIGNATURE_LINE = DEFAULT_TEACHER_SIGNATURE_LINE
export const TEACHER_NAME = DEFAULT_TEACHER_NAME
export const TEACHER_SIGNATURE = `${TEACHER_SIGNATURE_LINE} ${TEACHER_NAME}`

// الإعدادات مكانها جدول app_settings في Supabase (تصل مع pullAllData/fetchPublicData)،
// وذاكرة الجلسة للعرض الفوري فقط — لا يُكتب شيء على الجهاز.

/** قراءة عبارة التمني المخصصة من الإعدادات */
export const getTeacherSignatureLine = (): string =>
  readSetting("teacherSignatureLine", "") || DEFAULT_TEACHER_SIGNATURE_LINE

/** حفظ عبارة التمني المخصصة في Supabase (لتظهر للطلاب من أي جهاز) */
export const setTeacherSignatureLine = (line: string): void => {
  writeSetting("teacherSignatureLine", line)
  queuePush(() => pushSetting("teacherSignatureLine", line))
}

/**
 * قراءة اسم المدرس / السنتر (هوية الموقع) من الإعدادات.
 * هذا هو المصدر الموحّد الوحيد لاسم الموقع في كامل الواجهة.
 */
export const getTeacherName = (): string =>
  readSetting(TEACHER_NAME_SETTING_KEY, "") || DEFAULT_TEACHER_NAME

/**
 * حفظ اسم المدرس / السنتر في Supabase (لتتم إعادة تسمية الموقع بالكامل
 * ويظهر الاسم الجديد للطلاب من أي جهاز).
 */
export const setTeacherName = (name: string): void => {
  const clean = (name || "").trim()
  const value = clean || DEFAULT_TEACHER_NAME
  writeSetting(TEACHER_NAME_SETTING_KEY, value)
  queuePush(() => pushSetting(TEACHER_NAME_SETTING_KEY, value))
}

/**
 * اسم الموقع المختصر للشعارات والمساحات الضيقة (اللويحة الجانبية، شريط الجوال).
 * إن ضبط المالك اسماً طويلاً نُبقيه كما هو، والتنسيق يتكفّل بالاقتصاص.
 */
export const getSiteShortName = (): string => getTeacherName()

/**
 * عنوان صفحة المتصفح: اسم الموقع هو الأساس، ويُلحق باسم القسم عند توفّره.
 * مثال: «أ/ محمد عبدة — الاختبارات».
 */
export const buildPageTitle = (section?: string): string => {
  const site = getTeacherName()
  return section ? `${site} — ${section}` : site
}
