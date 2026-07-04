import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { UserService } from './user.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { Observable, of, delay, map } from 'rxjs';

@Controller('api/v1/users')
export class UserController {
  constructor(private readonly userService: UserService) { }

  @Post()
  create(@Body() createUserDto: CreateUserDto) {
    return this.userService.create(createUserDto);
  }

  @Get()
  findAll() {
    return this.userService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.userService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateUserDto: UpdateUserDto) {
    return this.userService.update(+id, updateUserDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.userService.remove(+id);
  }

  // 1. استخدام async/await (محاكاة جلب من قاعدة بيانات)
  @Get('db/:id')
  async getUserFromDB(@Param('id') id: string): Promise<{ id: string; name: string }> {
    // محاكاة انتظار استعلام قاعدة بيانات (مثلاً 2 ثانية)
    await new Promise(resolve => setTimeout(resolve, 2000));

    // إرجاع كائن (Nest سيحوله تلقائياً إلى JSON مع كود 200)
    return { id: id, name: `User from DB ${id}` };
  }

  // 2. استخدام Observable (محاكاة جلب من API خارجي بتيار بيانات)
  @Get('api/:id')
  getUserFromAPI(@Param('id') id: string): Observable<{ id: string; name: string }> {
    // إنشاء مصفوفة وهمية وتأخير الرد 1 ثانية ثم إرجاع أول عنصر
    return of({ id: id, name: `User from API ${id}` }).pipe(
      delay(1000), // تأخير لمحاكاة زمن الشبكة
      map(user => {
        // يمكنك إجراء تحويلات معقدة على البيانات هنا قبل إرجاعها
        return { ...user, source: 'External API' };
      })
    );
  }

  // 3. مزيج واقعي: جلب بيانات متعددة بالتوازي (Promise.all)
  @Get('dashboard/:id')
  async getDashboard(@Param('id') id: string): Promise<any> {
    // محاكاة جلب بيانات المستخدم وإعداداته وإحصائياته في نفس الوقت
    const [user, settings, stats] = await Promise.all([
      this.getUserFromDB(id),      // وعد (Promise)
      this.getSettings(id),        // وعد آخر
      this.getStats(id),           // وعد ثالث
    ]);

    return {
      user,
      settings,
      stats,
      message: 'Dashboard loaded successfully in parallel!'
    };
  }

  // دوال مساعدة وهمية
  private async getSettings(id: string) {
    await new Promise(resolve => setTimeout(resolve, 500));
    return { theme: 'dark', language: 'ar' };
  }

  private async getStats(id: string) {
    await new Promise(resolve => setTimeout(resolve, 300));
    return { posts: 10, followers: 500 };
  }

}
