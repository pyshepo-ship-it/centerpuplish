"use client"

/**
 * دليل التشغيل الكامل — شرح طريقة عمل المشروع بالكامل لمدير الموقع (المالك).
 *
 * صفحة تعريفية/إرشادية داخل لوحة التحكم تشرح:
 *   • نظرة عامة على النظام ومكوّناته
 *   • كيفية إعداد النظام لأول مرة (Supabase والحساب)
 *   • شرح كل قسم في لوحة التحكم ومتى يُستخدم
 *   • رحلة الطالب في البوابة العامة
 *   • دورة حياة البيانات والمزامنة والخصوصية
 *   • إعادة تسمية الموقع بالكامل باسم السنتر/المدرس
 */
import React, { useState } from "react"
import { motion } from "framer-motion"
import {
  BookOpen,
  Rocket,
  Settings,
  Calendar,
  Users,
  Bell,
  DollarSign,
  FileText,
  ClipboardCheck,
  BarChart3,
  Megaphone,
  GraduationCap,
  Database,
  ShieldCheck,
  Cloud,
  Smartphone,
  Store,
  ChevronDown,
  CheckCircle2,
  HelpCircle,
  LogIn,
  ListChecks,
  Award,
  FolderOpen,
  RefreshCw,
} from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { useSiteName } from "@/components/site-name"

const fadeUp = {
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0 },
}

function Section({
  icon: Icon,
  title,
  subtitle,
  color,
  children,
  delay = 0,
}: {
  icon: React.ElementType
  title: string
  subtitle?: string
  color: string
  children: React.ReactNode
  delay?: number
}) {
  return (
    <motion.div {...fadeUp} transition={{ delay }}>
      <Card className="bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800 shadow-lg overflow-hidden">
        <div className={`h-1 w-full bg-gradient-to-r ${color}`} />
        <CardContent className="p-6 pt-5">
          <div className="flex items-center gap-3 mb-4">
            <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${color} flex items-center justify-center shadow-lg shrink-0`}>
              <Icon className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">{title}</h2>
              {subtitle && <p className="text-sm text-gray-500 dark:text-gray-400">{subtitle}</p>}
            </div>
          </div>
          <div className="text-gray-700 dark:text-gray-300 text-[15px] leading-relaxed space-y-3">
            {children}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}

function Step({ n, title, children }: { n: number; title: string; children: React.ReactNode }) {
  return (
    <div className="flex gap-3">
      <div className="w-8 h-8 rounded-full bg-indigo-100 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-300 font-bold flex items-center justify-center shrink-0">
        {n}
      </div>
      <div className="pb-1">
        <p className="font-bold text-gray-900 dark:text-white mb-0.5">{title}</p>
        <div className="text-gray-600 dark:text-gray-400 text-sm leading-relaxed">{children}</div>
      </div>
    </div>
  )
}

function Feature({ icon: Icon, title, children }: { icon: React.ElementType; title: string; children: React.ReactNode }) {
  return (
    <div className="flex gap-3 p-3 rounded-xl bg-gray-50 dark:bg-gray-800/40">
      <div className="w-10 h-10 rounded-lg bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 flex items-center justify-center shrink-0">
        <Icon className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
      </div>
      <div>
        <p className="font-bold text-gray-900 dark:text-white text-sm mb-0.5">{title}</p>
        <p className="text-gray-600 dark:text-gray-400 text-sm leading-relaxed">{children}</p>
      </div>
    </div>
  )
}

function FaqItem({ q, children }: { q: string; children: React.ReactNode }) {
  const [open, setOpen] = useState(false)
  return (
    <div className="border border-gray-200 dark:border-gray-800 rounded-xl overflow-hidden">
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between gap-3 px-4 py-3 text-right bg-gray-50 dark:bg-gray-800/40 hover:bg-gray-100 dark:hover:bg-gray-800/70 transition-colors"
      >
        <span className="font-bold text-gray-900 dark:text-white text-sm flex items-center gap-2">
          <HelpCircle className="w-4 h-4 text-indigo-600 shrink-0" />
          {q}
        </span>
        <ChevronDown className={`w-4 h-4 text-gray-400 shrink-0 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>
      {open && (
        <div className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400 leading-relaxed border-t border-gray-200 dark:border-gray-800">
          {children}
        </div>
      )}
    </div>
  )
}

export default function GuidePage() {
  const siteName = useSiteName()

  const modules = [
    {
      icon: Calendar,
      title: "الصفوف والمواعيد",
      href: "/dashboard/grades",
      color: "from-purple-500 to-pink-600",
      body: (
        <>
          هنا تُنشئ <b>الصفوف الدراسية</b> (مثل: أولى ثانوي، تانية إعدادي…)، وداخل كل صف تنشئ
          <b> المجموعات</b> بأيامها وأوقاتها (من: إلى) وسعر الاشتراك الشهري. الجدول العام يُبنى
          تلقائياً من هذه المواعيد، ويمكنك <b>نشره للطلاب</b> كجدول أسبوعي وتحميله PDF.
        </>
      ),
    },
    {
      icon: Users,
      title: "الطلاب",
      href: "/dashboard/students",
      color: "from-green-500 to-emerald-600",
      body: (
        <>
          قاعدة بيانات كل طلابك: الاسم، الصف، المجموعة، رقم ولي الأمر، والحساب الإلكتروني.
          من هنا توافق على طلبات التسجيل، تنقل طالباً بين المجموعات، توقف (تحظر) طالباً،
          أو تُنشئ حساباً يدوياً. كل طالب يربط بمجموعته لتظهر له اختباراته ومواعيده.
        </>
      ),
    },
    {
      icon: Bell,
      title: "طلبات الطلاب",
      href: "/dashboard/requests",
      color: "from-orange-500 to-red-600",
      body: (
        <>
          تتجمع هنا كل الطلبات الواردة من البوابة العامة: <b>طلبات تسجيل</b> جديدة،
          <b> طلبات نقل</b> بين المجموعات، و<b>الاستفسارات/الرسائل</b> من الطلاب.
          العداد الأحمر في الشريط الجانبي يُنبّهك بالجديد فوراً. توافق أو ترفض بنقرة.
        </>
      ),
    },
    {
      icon: DollarSign,
      title: "التحصيل الشهري",
      href: "/dashboard/payments",
      color: "from-yellow-500 to-orange-600",
      body: (
        <>
          الحسابات المالية: تحدّد <b>الرسوم المستحقة</b> لكل طالب/مجموعة، ثم تسجّل
          <b> الدفعات</b> المدفوعة شهرياً. النظام يحسب تلقائياً <b>المتأخرات والرصيد</b>،
          ويعرض إجمالي المحصّل والمتبقي، مع تقارير مالية جاهزة.
        </>
      ),
    },
    {
      icon: FileText,
      title: "الاختبارات",
      href: "/dashboard/exams",
      color: "from-red-500 to-rose-600",
      body: (
        <>
          تنشئ <b>اختبارات ورقية</b> قابلة للطباعة/التصدير PDF بتنسيق احترافي، أو
          <b> اختبارات إلكترونية (أونلاين)</b> بأسئلة اختيارية ودرجات وتصحيح تلقائي.
          تحدّد الفئة المستهدفة (صف/مجموعة)، موعد الفتح، وتخصّص إجابات نموذجية للمراجعة.
          الطالب يحل من حسابه وتُحفظ نتيجته فوراً.
        </>
      ),
    },
    {
      icon: ClipboardCheck,
      title: "الحضور والغياب",
      href: "/dashboard/attendance",
      color: "from-teal-500 to-cyan-600",
      body: (
        <>
          تسجيل حضور/غياب الطلاب لكل جلسة حسب المجموعة واليوم. يُحسب تلقائياً
          <b> نسبة الحضور</b> لكل طالب، وتظهر الإحصائيات في التقارير والصفحة الرئيسية.
        </>
      ),
    },
    {
      icon: BarChart3,
      title: "التقارير",
      href: "/dashboard/reports",
      color: "from-indigo-500 to-blue-600",
      body: (
        <>
          تقارير شاملة: مستويات الطلاب ودرجات الاختبارات، نسب الحضور، التحصيل المالي،
          والمتأخرات. تقارير فردية لكل طالب يمكن مشاركتها مع ولي الأمر (عبر تفعيل تقارير الطلاب).
        </>
      ),
    },
    {
      icon: Megaphone,
      title: "الإعلانات ولوحة الشرف",
      href: "/dashboard/announcements",
      color: "from-amber-500 to-orange-600",
      body: (
        <>
          تنشر <b>إعلانات</b> تظهر في الصفحة الرئيسية للجميع، وتكرّم المتفوقين في
          <b> لوحة الشرف</b>، وترفع <b>ملفات</b> (مذكرات/مراجعات) و<b>روابط مهمة</b> (جروبات/فيديوهات).
          كلها عامة للطلاب دون تسجيل دخول.
        </>
      ),
    },
    {
      icon: Store,
      title: "الإعدادات وهوية الموقع",
      href: "/dashboard/settings",
      color: "from-gray-500 to-slate-600",
      body: (
        <>
          مركز التحكم: تغيير كلمة المرور، ضبط <b>اسم المدرس/السنتر</b> (يعيد تسمية الموقع بالكامل)،
          عبارة التمني، رقم الواتساب، فتح/إغلاق التسجيل، التفعيل المباشر، تقارير الطلاب،
          إدارة البيانات (تصدير/استيراد/مزامنة/حذف)، وإغلاق السنة الدراسية وأرشفتها.
        </>
      ),
    },
  ]

  return (
    <div className="space-y-8 max-w-5xl mx-auto pb-10">
      {/* العنوان */}
      <motion.div {...fadeUp} className="text-center">
        <div className="inline-flex items-center gap-3 mb-3">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 flex items-center justify-center shadow-xl shadow-indigo-500/30">
            <BookOpen className="w-7 h-7 text-white" />
          </div>
        </div>
        <h1 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-2">
          دليل التشغيل الكامل
        </h1>
        <p className="text-gray-500 dark:text-gray-400 max-w-2xl mx-auto">
          شرح تفصيلي لطريقة عمل <b className="text-indigo-600 dark:text-indigo-400">{siteName || "نظام إدارة الدروس الخصوصية"}</b> —
          كيف تُعدّه، وكيف تدير سنترك أو دروسك الخصوصية من الألف إلى الياء.
        </p>
      </motion.div>

      {/* نظرة عامة سريعة */}
      <Section
        icon={Rocket}
        title="ما هو هذا النظام؟"
        subtitle="نظرة عامة على الفكرة والمكوّنات"
        color="from-indigo-500 to-purple-600"
      >
        <p>
          هذا <b>نظام متكامل لإدارة مراكز الدروس الخصوصية والمدرسين الخصوصيين</b>. تحصل من خلاله على
          موقع إلكتروني باسم سنترك أو اسمك، فيه بوابة عامة للطلاب ولوحة تحكم لك كمدير. يعمل من أي
          جهاز (كمبيوتر أو موبايل) ومن أي مكان، لأن كل بياناتك محفوظة بأمان على السحابة (Supabase).
        </p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-1">
          <Feature icon={ShieldCheck} title="لوحة تحكم للمدير">
            أنت فقط من يدخلها بكلمة سر، ومنها تدير كل شيء.
          </Feature>
          <Feature icon={GraduationCap} title="بوابة للطلاب">
            صفحة عامة + حسابات خاصة للطلاب لعرض المواعيد والاختبارات والنتائج.
          </Feature>
          <Feature icon={Cloud} title="حفظ سحابي">
            لا تخزين على الأجهزة — كل البيانات في قاعدة بيانات آمنة ومتاحة دائماً.
          </Feature>
        </div>
      </Section>

      {/* الإعداد لأول مرة */}
      <Section
        icon={Settings}
        title="الإعداد لأول مرة"
        subtitle="خطوات تشغيل النظام قبل بدء الاستخدام"
        color="from-emerald-500 to-teal-600"
        delay={0.05}
      >
        <div className="space-y-4">
          <Step n={1} title="إنشاء مشروع Supabase (قاعدة البيانات السحابية)">
            أنشئ حساباً مجانياً على Supabase، وأنشئ مشروعاً جديداً، ثم نفّذ ملفات قاعدة البيانات
            الموجودة في مجلد <code className="px-1.5 py-0.5 rounded bg-gray-100 dark:bg-gray-800 text-indigo-600">supabase/</code> (راجع ملف SUPABASE_SETUP.md خطوة بخطوة).
            هذه الجداول هي مكان حفظ كل بياناتك نهائياً.
          </Step>
          <Step n={2} title="ربط الموقع بقاعدة البيانات">
            انسخ رابط المشروع والمفتاح العام (Project Settings ← API) إلى ملف
            <code className="px-1.5 py-0.5 rounded bg-gray-100 dark:bg-gray-800 text-indigo-600">.env.local</code> (من القالب .env.example).
            عند النشر على Vercel تُضاف نفس القيم في Environment Variables.
          </Step>
          <Step n={3} title="إنشاء حساب المدير">
            من Supabase Authentication أنشئ مستخدماً واحداً (بريدك وكلمة سر) — هذا هو حسابك أنت المدير.
            ثم ادخل على <b>/login</b> وسجّل دخولك.
          </Step>
          <Step n={4} title="تحديد هوية الموقع (اسمك/اسم السنتر)">
            من <b>الإعدادات ← هوية الموقع</b> اكتب «اسم المدرس / السنتر» (مثل: أ/ محمد عبده أو سنتر النور)
            واحفظ. سيُعاد تسمية الموقع بالكامل بهذا الاسم فوراً — العنوان، الصفحة الرئيسية، الشعارات، والمطبوعات.
          </Step>
          <Step n={5} title="إدخال بياناتك الأساسية">
            أضف الصفوف والمجموعات ومواعيدها، ثم ابدأ في قبول تسجيل الطلاب (أو أضفهم يدوياً)،
            وسجّل الرسوم والدفعات، وانشر الإعلانات.
          </Step>
        </div>
        <div className="flex items-start gap-2 p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 text-emerald-800 dark:text-emerald-300 text-sm">
          <CheckCircle2 className="w-5 h-5 shrink-0 mt-0.5" />
          <span>
            يمكنك تجربة النظام بدون Supabase (وضع المعاينة)، لكن في هذه الحالة لا تُحفظ البيانات ولا
            يستطيع الطلاب الوصول إليها — لذا اربط Supabase قبل الاستخدام الفعلي.
          </span>
        </div>
      </Section>

      {/* أقسام لوحة التحكم */}
      <Section
        icon={ListChecks}
        title="أقسام لوحة التحكم"
        subtitle="ماذا يفعل كل قسم ومتى تستخدمه"
        color="from-blue-500 to-indigo-600"
        delay={0.05}
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {modules.map((m) => (
            <a
              key={m.href}
              href={m.href}
              className="block p-4 rounded-xl border border-gray-200 dark:border-gray-800 hover:border-indigo-300 dark:hover:border-indigo-700 hover:shadow-md transition-all group"
            >
              <div className="flex items-center gap-3 mb-2">
                <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${m.color} flex items-center justify-center shrink-0`}>
                  <m.icon className="w-5 h-5 text-white" />
                </div>
                <p className="font-bold text-gray-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                  {m.title}
                </p>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">{m.body}</p>
            </a>
          ))}
        </div>
      </Section>

      {/* رحلة الطالب */}
      <Section
        icon={GraduationCap}
        title="رحلة الطالب في البوابة"
        subtitle="كيف يستخدم الطالب الموقع"
        color="from-pink-500 to-rose-600"
        delay={0.05}
      >
        <div className="space-y-3">
          <Step n={1} title="الصفحة الرئيسية (بدون تسجيل دخول)">
            يفتح الطالب رابط الموقع فيجد الإعلانات، لوحة الشرف، الملفات والروابط المهمة،
            جدول المواعيد المنشور، الاختبارات العامة، وزر التواصل عبر واتساب.
          </Step>
          <Step n={2} title="تسجيل طالب جديد">
            من زر «تسجيل طالب جديد» (/student/register) يملأ بياناته ويختار صفه ومجموعته.
            يصل طلبه إليك في «طلبات الطلاب» للموافقة (أو يُقبل فوراً إن فعّلت التسجيل المباشر).
          </Step>
          <Step n={3} title="دخول الطالب">
            من «دخول الطالب» (/student/login) يسجّل الدخول بحسابه، فيرى مواعيد مجموعته،
            اختباراته المتاحة، نتائجه، تقريره (إن فعّلته)، ويستطيع إرسال استفسار أو طلب نقل لمجموعة.
          </Step>
          <Step n={4} title="حل الاختبار الإلكتروني">
            يفتح الاختبار المخصص لصفه/مجموعته خلال وقت فتحه، يجيب على الأسئلة، وتُحفظ محاولته
            وتُصحّح تلقائياً وتظهر النتيجة، مع إمكانية مراجعة الإجابات النموذجية.
          </Step>
        </div>
      </Section>

      {/* إعادة التسمية */}
      <Section
        icon={Store}
        title="إعادة تسمية الموقع بالكامل باسمك"
        subtitle="هوية الموقع"
        color="from-violet-500 to-purple-600"
        delay={0.05}
      >
        <p>
          ليس هذا الموقع تابعاً لمعلم بعينه — هو <b>نظام جاهز لأي سنتر أو مدرس</b>. يكفي أن تكتب
          اسمك أو اسم سنترك في الإعدادات ليصبح الموقع كله باسمك:
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <Feature icon={Smartphone} title="أين يظهر الاسم؟">
            عنوان تبويب المتصفح، الصفحة الرئيسية، صفحة دخول المدير، اللوحة الجانبية، شاشة الترحيب،
            والتذييل.
          </Feature>
          <Feature icon={FileText} title="وفي المطبوعات أيضاً">
            أوراق الاختبارات، جداول المواعيد PDF، الشهادات، التقارير، وتواقيع لوحة الشرف.
          </Feature>
        </div>
        <p>
          الطريقة: <b>الإعدادات ← الحساب والتخصيص ← هوية الموقع (اسم المدرس/السنتر)</b> ←
          اكتب الاسم ← «حفظ اسم الموقع». يُحفظ الاسم في السحابة فيراه كل الطلاب من أي جهاز فوراً.
        </p>
      </Section>

      {/* البيانات والمزامنة والخصوصية */}
      <Section
        icon={Database}
        title="كيف تُحفظ البيانات وتتزامن؟"
        subtitle="الخصوصية وأمان المعلومات"
        color="from-cyan-500 to-blue-600"
        delay={0.05}
      >
        <ul className="space-y-2.5">
          <li className="flex gap-2.5">
            <Cloud className="w-5 h-5 text-indigo-600 dark:text-indigo-400 shrink-0 mt-0.5" />
            <span><b>المصدر الوحيد للبيانات هو Supabase</b> (قاعدة بيانات سحابية). كل إضافة أو تعديل أو حذف يُحفظ هناك أولاً.</span>
          </li>
          <li className="flex gap-2.5">
            <RefreshCw className="w-5 h-5 text-indigo-600 dark:text-indigo-400 shrink-0 mt-0.5" />
            <span><b>المزامنة تلقائية</b>: عند فتح لوحة التحكم تُسحب أحدث البيانات، وأي تغيير تُجريه يُرفع فوراً. توجد أيضاً مزامنة يدوية وأدوات فحص الاتصال في الإعدادات.</span>
          </li>
          <li className="flex gap-2.5">
            <ShieldCheck className="w-5 h-5 text-indigo-600 dark:text-indigo-400 shrink-0 mt-0.5" />
            <span><b>صفر تخزين على الجهاز</b>: لا تُحفظ بيانات الطلاب أو المالية في متصفح أحد. تبقى في الذاكرة أثناء الجلسة فقط وتُمحى عند إغلاق الصفحة أو تسجيل الخروج — لحماية خصوصية الطلاب.</span>
          </li>
          <li className="flex gap-2.5">
            <LogIn className="w-5 h-5 text-indigo-600 dark:text-indigo-400 shrink-0 mt-0.5" />
            <span><b>الصلاحيات</b>: لوحة التحكم محمية بحساب المدير فقط. الطلاب يرون بياناتهم هم فقط عبر حساباتهم، والزائيرون يرون المحتوى العام فقط (إعلانات/جدول بلا أسعار أو بيانات حساسة).</span>
          </li>
          <li className="flex gap-2.5">
            <FolderOpen className="w-5 h-5 text-indigo-600 dark:text-indigo-400 shrink-0 mt-0.5" />
            <span><b>النسخ الاحتياطي والسنة الدراسية</b>: يمكنك تصدير كل البيانات كملف، استيرادها عند الحاجة، وعند نهاية العام تُغلق السنة وتُؤرشف لتستنشط سنة جديدة ببيانات نظيفة.
            </span>
          </li>
        </ul>
      </Section>

      {/* أسئلة شائعة */}
      <Section
        icon={HelpCircle}
        title="أسئلة شائعة"
        subtitle="إجابات سريعة لأكثر الاستفسارات"
        color="from-amber-500 to-orange-600"
        delay={0.05}
      >
        <div className="space-y-2.5">
          <FaqItem q="هل يصلح النظام لسنتر كامل فيه عدة صفوف ومجموعات؟">
            نعم تماماً. يمكنك إنشاء عدد غير محدود من الصفوف، وداخل كل صف عدة مجموعات بأيام وأوقات
            وأسعار مختلفة، مع طلاب ومدرسين واختبارات وتحصيل مستقل لكل مجموعة.
          </FaqItem>
          <FaqItem q="هل يصلح لمدرس خصوصي فردي؟">
            نعم، يكفي إنشاء صف واحد ومجموعة واحدة وإضافة طلابك. صُمم النظام ليعمل بكفاءة للحالتين:
            سنتر كبير أو مدرس فردي.
          </FaqItem>
          <FaqItem q="هل يستطيع الطلاب رؤية بيانات بعضهم أو بيانات مالية؟">
            لا. كل طالب يرى مواعيده واختباراته ونتائجه فقط. الجدول العام المنشور يُظهر المواعيد دون
            أسعار أو أعداد أو بيانات شخصية. والصفحات المالية والكشوفات داخل لوحة المدير فقط.
          </FaqItem>
          <FaqItem q="غيّرت اسم السنتر في الإعدادات — هل سيتغيّر عند الطلاب؟">
            نعم. الاسم يُحفظ في قاعدة البيانات السحابية، فيظهر الاسم الجديد تلقائياً في الصفحة
            الرئيسية وكل المطبوعات لكل الطلاب من أي جهاز، دون أي إجراء إضافي.
          </FaqItem>
          <FaqItem q="ماذا يحدث لبياناتي إذا أغلقت المتصفح أو غيّرت الجهاز؟">
            لا شيء — كل بياناتك محفوظة في Supabase. افتح الموقع من أي جهاز وسجّل دخولك فتجد كل شيء.
            (الذاكرة المؤقتة على الجهاز تُمحى، لكن النسخة الأصلية في السحابة تبقى.)
          </FaqItem>
          <FaqItem q="كيف أبدأ سنة دراسية جديدة دون فقدان بيانات السنة السابقة؟">
            من <b>الإعدادات ← السنة الدراسية ← إغلاق السنة</b>. تُؤرشف بيانات السنة كاملة (صفوف، طلاب،
            دفعات، حضور…) ويمكن استعادتها في أي وقت من الأرشيف، ثم تبدأ السنة الجديدة ببيانات نظيفة.
          </FaqItem>
          <FaqItem q="الاختبار الإلكتروني لا يظهر للطلاب، ما السبب؟">
            تأكد أن الاختبار نوعه «إلكتروني/أونلاين»، ومفعّل خيار «السماح بالحل أونلاين»، وموجّه
            لصف/مجموعة الطالب، وأن وقت فتحه حان. الاختبارات العامة فقط (بلا فئة محددة) تظهر في الصفحة الرئيسية.
          </FaqItem>
        </div>
      </Section>

      {/* تذييل */}
      <motion.div {...fadeUp} transition={{ delay: 0.1 }} className="text-center pt-2">
        <div className="inline-flex items-center gap-2 px-5 py-3 rounded-2xl bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-950/40 dark:to-purple-950/40 border border-indigo-200 dark:border-indigo-900">
          <Award className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
          <p className="text-sm text-gray-700 dark:text-gray-300">
            بعد إعداد الهوية والصفوف والمجموعات، أنت جاهز لإدارة {siteName || "سنترك"} بالكامل. بالتوفيق! 🎓
          </p>
        </div>
      </motion.div>
    </div>
  )
}
