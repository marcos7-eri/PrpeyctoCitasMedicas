"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = require("@nestjs/core");
const app_module_1 = require("./app.module");
async function bootstrap() {
    const app = await core_1.NestFactory.create(app_module_1.AppModule);
    app.setGlobalPrefix('api');
    app.enableCors({
        origin: true,
        credentials: true,
    });
    const PORT = process.env.PORT ?? 3001;
    await app.listen(PORT);
    console.log(`Servidor backend corriendo en http://localhost:${PORT}`);
    console.log(`Health check: http://localhost:${PORT}/api/health`);
}
bootstrap();
//# sourceMappingURL=main.js.map