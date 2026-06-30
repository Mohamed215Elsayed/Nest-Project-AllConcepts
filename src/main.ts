import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
// import { NestExpressApplication } from '@nestjs/platform-express';
// The entry file of the application which uses the core function NestFactory to create a Nest application instance.
async function bootstrap() {
  const app = await NestFactory.create(AppModule, { abortOnError: false });
  // const app = await NestFactory.create<NestExpressApplication>(AppModule, {abortOnError: false});
  await app.listen(process.env.PORT ?? 3000);
}
// bootstrap();
// void bootstrap();
bootstrap().catch((err) => {
  console.error(err);
  process.exit(1);
});
