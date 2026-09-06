import type { Metadata } from "next";
import "./globals.css";
import { ThemeProvider } from "@/components/providers/theme-provider";
import { ToastProvider } from "@/components/providers/toast-provider";
import { DeviceGuard } from "@/components/device-guard";
import { SiteDocumentTitle } from "@/components/site-name";
import { APP_FONTS_URL } from "@/lib/exam-templates";

export const metadata: Metadata = {
  // العنوان الافتراضي قبل تحميل الإعدادات — يُستبدل ديناميكياً باسم الموقع
  // (اسم المدرس / السنتر) من الإعدادات عبر <SiteDocumentTitle />.
  title: {
    default: "نظام إدارة الدروس الخصوصية",
    template: "%s — نظام إدارة الدروس الخصوصية",
  },
  description:
    "نظام متكامل واحترافي لإدارة مراكز الدروس الخصوصية والمدرسين الخصوصيين: الطلاب، الصفوف والمجموعات، المواعيد، الحضور والغياب، التحصيل المالي، الاختبارات الإلكترونية، التقارير، الإعلانات، وبوابة الطلاب.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ar" dir="rtl" suppressHydrationWarning>
      <head>
        {/* الخطوط المستخدمة فعلياً فقط: Cairo للواجهة + Noto Kufi Arabic/Tajawal
            لورقة الاختبار (الخط الموحّد لكل القوالب بقرار المالك) */}
        <link href={APP_FONTS_URL} rel="stylesheet" />
      </head>
      <body className="font-arabic antialiased">
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          enableSystem={false}
          disableTransitionOnChange
        >
          <ToastProvider />
          {/* عنوان تبويب المتصفح الديناميكي حسب اسم الموقع (اسم المدرس/السنتر) */}
          <SiteDocumentTitle />
          {/* حارس الجهاز: نبضة تعريف + شاشة إيقاف للجهاز المحظور (خارج لوحة المعلم) */}
          <DeviceGuard>{children}</DeviceGuard>
        </ThemeProvider>
      </body>
    </html>
  );
}
