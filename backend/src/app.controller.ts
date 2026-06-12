import { Controller, Get } from '@nestjs/common';

@Controller()
export class AppController {
  @Get('health')
  getHealth() {
    return {
      status: 'ok',
      message: 'Clínica Salud Total API corriendo',
      timestamp: new Date().toISOString(),
    };
  }
}
