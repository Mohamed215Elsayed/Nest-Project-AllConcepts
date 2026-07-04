import {
    Controller,
    Get,
    Post,
    Put,
    Delete,
    HttpCode,
    Query,
    Req,
    Res,
    All,
    Header,
    Headers,
    Redirect,
    Param,
    Body,
} from '@nestjs/common';
import { CreateCatDto } from './dto/create-cat.dto';
import * as crypto from 'crypto';
import type { Request, Response } from 'express';

// ============================================================
// 🧩 الأنواع (Types) المساعدة للتوثيق
// ============================================================

/**
 * هيكل الرد عند طلب معلومات الطلب بالكامل.
 */
interface RequestInfoResponse {
    method: string;
    url: string;
    query: Record<string, unknown>;
    params: Record<string, string>;
    headers: Record<string, unknown>;
}

// ============================================================
// 🐱 وحدة التحكم الخاصة بالقطط
// ============================================================

@Controller('api/v1/cats')
export class CatsController {
    /**
     * ------------------------------------------------------------------
     * 📌 القسم الأول: المسارات الثابتة (Static Routes)
     *    - جميع هذه المسارات تتكون من قطعة واحدة (Single Segment).
     *    - يجب أن تأتي قبل المسار الديناميكي `:id` حتى لا يتم اختطافها.
     * ------------------------------------------------------------------
     */

    /**
     * @description جلب جميع القطط (الصفحة الرئيسية).
     * @route GET /api/v1/cats
     * @returns {object} رسالة ترحيب وقائمة فارغة.
     */
    @Get()
    @HttpCode(200)
    getAllCats() {
        return {
            message: 'All Cats',
            data: [],
        };
    }

    /**
     * @description جلب القطط بناءً على عمرها وسلالتها (فلترة).
     * @route GET /api/v1/cats/search?age=2&breed=Persian
     * @param {number} age - عمر القطة (Query Param).
     * @param {string} breed - سلالة القطة (Query Param).
     * @returns {string} رسالة توضح معايير الفلترة.
     */
    @Get('search')
    async findAll(@Query('age') age: number, @Query('breed') breed: string) {
        return `This action returns all cats filtered by age: ${age} and breed: ${breed}`;
    }

    /**
     * @description جلب سلالة محددة (مسار ثابت).
     * @route GET /api/v1/cats/breed
     * @returns {object} السلالة المطلوبة.
     */
    @Get('breed')
    getCatBreed() {
        return {
            breed: 'Persian',
        };
    }

    /**
     * @description جلب القطط مع دعم الترقيم (Pagination).
     * @route GET /api/v1/cats/pagination?page=2
     * @param {string} page - رقم الصفحة (Query Param - اختياري).
     * @returns {object} الصفحة الحالية.
     */
    @Get('pagination')
    getCatsByPage(@Query('page') page?: string) {
        return {
            currentPage: page ?? '1',
        };
    }

    /**
     * @description عرض جميع تفاصيل الطلب (Headers, Method, URL).
     * @route GET /api/v1/cats/request-info
     * @param {Request} req - كائن الطلب الأصلي من Express.
     * @returns {RequestInfoResponse} تفاصيل الطلب.
     */
    @Get('request-info')
    showRequestInformation(@Req() req: Request): RequestInfoResponse {
        return {
            method: req.method,
            url: req.url,
            query: req.query as Record<string, unknown>,
            params: req.params as Record<string, string>,
            headers: req.headers,
        };
    }

    /**
     * @description استخدام كائن الـ Response من Express (بدون Passthrough).
     * ⚠️ تحذير: هذه الطريقة تعطل الـ Interceptors و @HttpCode().
     * @route GET /api/v1/cats/express-response
     * @param {Response} res - كائن الرد الأصلي.
     * @returns {Response} رد Express مباشرة.
     */
    @Get('express-response')
    getUsingExpressResponse(@Res() res: Response) {
        return res.status(200).json({
            message: 'Response sent using Express (without passthrough)',
        });
    }

    /**
     * @description ملف تعريف متقدم للقطة مع كاش وهيدرات ديناميكية.
     * 💎 يستخدم `@Res({ passthrough: true })` للجمع بين التحكم اليدوي ومميزات Nest.
     * @route GET /api/v1/cats/fancy-profile?page=1
     * @param {Request} req - كائن الطلب (لقراءة الهيدرات).
     * @param {Response} res - كائن الرد (لتعيين الهيدرات).
     * @param {string} page - رقم الصفحة.
     * @returns {object} بيانات القطة مع هيدرات مخصصة.
     */
    @Get('fancy-profile')
    async getFancyCatProfile(
        @Req() req: Request,
        @Res({ passthrough: true }) res: Response,
        @Query('page') page?: string,
    ) {
        const isPremium = req.headers['x-user-tier'] === 'premium';
        const catData = {
            id: 1,
            name: 'Fancy Cat',
            breed: 'Persian',
            age: 3,
            features: isPremium ? ['sleep', 'eat', 'play', 'fly'] : ['sleep', 'eat'],
            page: page ?? '1',
            timestamp: new Date().toISOString(),
        };

        // إنشاء ETag بناءً على محتوى البيانات
        const etag = crypto.createHash('md5').update(JSON.stringify(catData)).digest('hex');

        // التحقق من If-None-Match (توفير الباندويث)
        if (req.headers['if-none-match'] === `"${etag}"`) {
            res.status(304);
            return;
        }

        // تعيين هيدرات ديناميكية
        res.setHeader('Cache-Control', isPremium ? 'private, max-age=3600' : 'no-cache');
        res.setHeader('ETag', `"${etag}"`);
        res.setHeader('X-User-Tier', isPremium ? 'premium' : 'free');
        res.setHeader('X-Response-Time', Date.now().toString());

        return catData;
    }

    /**
     * @description تحميل ملف ديناميكي (PDF أو صورة) مع هيدرات مخصصة.
     * @route GET /api/v1/cats/download?type=pdf
     * @param {string} type - نوع الملف (pdf أو image).
     * @param {Response} res - كائن الرد لتعيين Content-Disposition.
     * @returns {object} بيانات الملف.
     */
    @Get('download')
    async downloadCatFile(
        @Query('type') type: 'pdf' | 'image' = 'pdf',
        @Res({ passthrough: true }) res: Response,
    ) {
        const fileContent = type === 'pdf'
            ? { message: 'This is a PDF report about cats', format: 'pdf' }
            : { message: 'This is a cat image metadata', format: 'image' };

        if (type === 'pdf') {
            res.setHeader('Content-Type', 'application/pdf');
            res.setHeader('Content-Disposition', 'attachment; filename="cat-report.pdf"');
        } else {
            res.setHeader('Content-Type', 'image/jpeg');
            res.setHeader('Content-Disposition', 'inline; filename="cat-photo.jpg"');
        }

        return fileContent;
    }

    /**
     * @description إعادة توجيه بناءً على دور المستخدم (قراءة الهيدرات).
     * @route GET /api/v1/cats/dashboard
     * @param {string} role - دور المستخدم (Header: user-role).
     * @returns {object} رابط إعادة التوجيه ورمزه.
     */
    @Get('dashboard')
    @Redirect('/default-dashboard', 302)
    redirectBasedOnRole(@Headers('user-role') role: string) {
        if (role === 'admin') {
            return { url: '/admin-dashboard', statusCode: 303 };
        } else if (role === 'user') {
            return { url: '/user-dashboard' };
        }
    }

    /**
     * @description إعادة توجيه ثابتة إلى موقع NestJS الرسمي.
     * @route GET /api/v1/cats/redirect-nest
     */
    @Get('redirect-nest')
    @Redirect('https://nestjs.com', 301)
    redirectToNest() {
        // الدالة فارغة لأن التوجيه ثابت
    }

    /**
     * @description إعادة توجيه ديناميكية إلى وثائق NestJS (حسب الإصدار).
     * @route GET /api/v1/cats/redirect-docs?version=5
     * @param {string} version - إصدار الوثائق (Query Param).
     * @returns {object} رابط ورمز التوجيه (يتجاوز الديكور).
     */
    @Get('redirect-docs')
    @Redirect('https://docs.nestjs.com', 302)
    getDocs(@Query('version') version: string) {
        if (version && version === '5') {
            return {
                url: 'https://docs.nestjs.com/v5/',
                statusCode: 301,
            };
        }
    }

    /**
     * @description إعادة توجيه باستخدام `@Res()` مباشرة (طريقة بديلة).
     * @route GET /api/v1/cats/redirect-old
     * @param {Response} res - كائن الرد.
     */
    @Get('redirect-old')
    redirectOldPath(@Res() res: Response) {
        console.log('Redirecting old path to new path...');
        return res.redirect(301, 'https://new-website.com');
    }

    /**
     * @description يستجيب لأي مسار يبدأ بـ "abcd/" (Wildcard).
     * @route GET /api/v1/cats/abcd/*path
     * @returns {object} رسالة توضيحية.
     */
    @Get('abcd/*path')
    findWithWildcard() {
        return {
            message: 'This route uses a wildcard (*)',
            description: 'Matches any path that starts with "abcd/"',
        };
    }

    /**
     * @description يستجيب لأي طريقة HTTP (GET, POST, PUT, DELETE, إلخ...).
     * 📌 مفيد جداً لاستقبال Webhooks من خدمات خارجية.
     * @route ALL /api/v1/cats/webhook
     * @param {Request} req - كائن الطلب.
     * @returns {object} طريقة الطلب وتوقيت الاستلام.
     */
    @All('webhook')
    handleAnyRequest(@Req() req: Request) {
        return {
            message: `This endpoint accepts ALL HTTP methods. You just sent a ${req.method} request.`,
            receivedAt: new Date().toISOString(),
        };
    }

    /**
     * ------------------------------------------------------------------
     * 📌 القسم الثاني: المسارات شبه الديناميكية (آمنة حتى لو جاءت بعد :id)
     *    - تحتوي على أكثر من قطعة (مثل old-style/:id).
     *    - وضعها هنا للتنظيم فقط، لكن وضعها قبل :id يضمن الأمان التام.
     * ------------------------------------------------------------------
     */

    /**
     * @description جلب قطة باستخدام البارامترات ككائن واحد.
     * @route GET /api/v1/cats/old-style/:id
     * @param {any} params - كائن يحتوي على جميع بارامترات المسار.
     * @returns {string} معرف القطة.
     */
    @Get('old-style/:id')
    findOneOldStyle(@Param() params: any): string {
        console.log('All params:', params);
        return `Old style: Returning cat with ID #${params.id}`;
    }

    /**
     * @description جلب قطة بتصفية حسب النوع (بارامتر اختياري).
     * @route GET /api/v1/cats/filter/:type
     * @param {string} type - نوع القطة (اختياري).
     * @returns {string} رسالة التصفية.
     */
    @Get('filter/:type')
    filterByType(@Param('type') type?: string): string {
        if (type) {
            return `Returning cats filtered by type: ${type}`;
        }
        return 'Returning all cats (no filter applied)';
    }

    /**
     * @description جلب قطة بناءً على الفئة والمعرف (بارامتران).
     * @route GET /api/v1/cats/:category/:id
     * @param {string} category - فئة القطة (مثل persian).
     * @param {string} id - معرف القطة.
     * @returns {string} رسالة البحث.
     */
    @Get(':category/:id')
    findOneByCategory(
        @Param('category') category: string,
        @Param('id') id: string,
    ): string {
        return `Searching for cat #${id} in the category: ${category}`;
    }

    /**
     * ------------------------------------------------------------------
     * 📌 القسم الثالث: المسار الديناميكي الأكثر خطورة (Single Segment)
     *    - يجب أن يكون آخر مسار GET على الإطلاق حتى لا يلتهم المسارات الثابتة.
     * ------------------------------------------------------------------
     */

    /**
     * @description جلب قطة باستخدام معرفها (المسار الديناميكي الأساسي).
     * ⚠️ يجب أن يكون آخر مسار GET في الكلاس.
     * @route GET /api/v1/cats/:id
     * @param {string} id - معرف القطة.
     * @returns {string} القطة المطلوبة.
     */
    @Get(':id')
    findOne(@Param('id') id: string): string {
        return `This action returns the cat with ID #${id}`;
    }

    /**
     * ------------------------------------------------------------------
     * 📌 القسم الرابع: طرق POST (إنشاء البيانات)
     *    - لا تتعارض مع GET، لذا يمكن وضعها في أي مكان، لكن نفصلها هنا.
     * ------------------------------------------------------------------
     */

    /**
     * @description إضافة قطة جديدة (مع كود 204 - بدون محتوى).
     * @route POST /api/v1/cats
     * @param {CreateCatDto} createCatDto - بيانات القطة الجديدة (Body).
     * @returns {string} رسالة تأكيد (قد تتجاهلها Nest بسبب HttpCode 204).
     */
    @Post()
    @HttpCode(204)
    async create(@Body() createCatDto: CreateCatDto) {
        console.log('Received cat:', createCatDto);
        return 'This action adds a new cat';
    }

    /**
     * @description إضافة قطة مع هيدرات مخصصة (تمنع الكاش).
     * @route POST /api/v1/cats/with-header
     * @returns {object} رسالة نجاح مع هيدرات مضافة.
     */
    @Post('with-header')
    @Header('Cache-Control', 'no-store')
    @Header('X-Custom-Header', 'HelloFromNest')
    createWithCustomHeader() {
        return {
            message: 'This action adds a new cat with custom headers',
        };
    }

    /**
     * @description إضافة قطة مع تحديد كود الحالة ديناميكياً (باستخدام @Res).
     * @route POST /api/v1/cats/custom-status
     * @param {Response} res - كائن الرد.
     * @returns {object} رد يحتوي على كود حالة محدد (201 أو 400).
     */
    @Post('custom-status')
    createWithDynamicStatus(@Res() res: Response) {
        const isCreatedSuccessfully = true; // محاكاة منطق الأعمال

        if (isCreatedSuccessfully) {
            return res.status(201).json({
                message: 'Cat created successfully!',
                cat: { name: 'Kitty' },
            });
        } else {
            return res.status(400).json({
                message: 'Failed to create cat. Invalid data.',
            });
        }
    }
}