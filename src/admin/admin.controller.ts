import { Controller, Get, HostParam } from '@nestjs/common';

// 1. نطاق فرعي ثابت (Static Sub-domain)
// أي طلب يصل إلى admin.example.com سيدخل إلى هذا الـ Controller
@Controller({ host: 'admin.example.com' })
export class AdminController {
  @Get()
  index(): string {
    return 'مرحباً أيها المدير! هذه لوحة التحكم الخاصة بك.';
  }

  @Get('settings')
  settings(): string {
    return 'إعدادات المدير العام';
  }
}

// 2. نطاق فرعي ديناميكي (Dynamic Sub-domain) - الأكثر فائدة!
// أي طلب يصل إلى [أي_اسم].example.com سيدخل إلى هنا
@Controller({ host: ':tenantId.example.com' })
export class TenantController {

  // استخدام @HostParam لاستقبال القيمة الديناميكية من النطاق
  @Get()
  getTenantInfo(@HostParam('tenantId') tenantId: string): string {
    // هنا ستستقبل 'school1' أو 'school2' بناءً على النطاق الذي جاء منه الطلب
    return `مرحباً بك في لوحة مدرسة: ${tenantId}`;
  }

  @Get('students')
  getStudents(@HostParam('tenantId') tenantId: string): string {
    // يمكنك استخدام tenantId لجلب بيانات الطلاب الخاصة بهذه المدرسة من قاعدة البيانات
    return `قائمة طلاب مدرسة: ${tenantId}`;
  }
}