import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { NestExpressApplication } from '@nestjs/platform-express';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, { abortOnError: false });
  app.set('query parser', 'extended');
  await app.listen(process.env.PORT ?? 3000);
}
console.log(`🚀 Application is running on port: ${process.env.PORT ?? 3000}`);
bootstrap().catch((err) => {
  console.error(err);
  process.exit(1);
});
