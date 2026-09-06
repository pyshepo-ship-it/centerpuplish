"use client"

/**
 * مكوّنات واسم الموقع الديناميكي.
 *
 * اسم الموقع يُستمد من إعداد «اسم المدرس / السنتر» (teacherName) في
 * app_settings. هذه المكوّنات تقرأ الاسم من ذاكرة الجلسة المعبأة من السحابة
 * وتشترك في تحديثاتها، فتتحدث تلقائياً في كل مكان عند تغيير المالك للاسم:
 *   • عنوان تبويب المتصفح (document.title)
 *   • الشعار في الترويسة واللوحة الجانبية
 *   • شاشات الدخول والترحيب والتذييل
 */
import { useEffect, useState } from "react"
import { getTeacherName, buildPageTitle } from "@/lib/branding"
import { onStoreUpdate } from "@/lib/memory-store"

/**
 * خطاف يُرجع اسم الموقع الحالي ويتحدّث تلقائياً عند وصول/تغيير الإعداد.
 */
export function useSiteName(): string {
  const [name, setName] = useState<string>("")

  useEffect(() => {
    const sync = () => setName(getTeacherName())
    sync()
    // اشترك في تحديثات ذاكرة الجلسة (وصول بيانات السحابة أو تغيير الإعداد)
    const unsub = onStoreUpdate(sync)
    // تحديث دوري احتياطي خفيف (رصد أي تغيير خارجي)
    const timer = window.setInterval(sync, 5000)
    return () => {
      unsub()
      window.clearInterval(timer)
    }
  }, [])

  return name
}

/**
 * يضبط عنوان تبويب المتصفح ديناميكياً: «اسم الموقع» أو «اسم الموقع — القسم».
 * يُستخدم مرة في الجذر، ويمكن إعادة استخدامه بقرصنة اسم قسم في أي صفحة.
 */
export function SiteDocumentTitle({ section }: { section?: string }) {
  useEffect(() => {
    const apply = () => {
      document.title = buildPageTitle(section)
    }
    apply()
    const unsub = onStoreUpdate(apply)
    const timer = window.setInterval(apply, 5000)
    return () => {
      unsub()
      window.clearInterval(timer)
    }
  }, [section])

  return null
}

/**
 * نص اسم الموقع (يتحدّث تلقائياً). مثال:
 *   <SiteName />
 *   <SiteName fallback="لوحة التحكم" className="font-bold" />
 */
export function SiteName({
  className = "",
  fallback,
}: {
  className?: string
  fallback?: string
}) {
  const name = useSiteName()
  const display = name || fallback || getTeacherName()
  return <span className={className}>{display}</span>
}
