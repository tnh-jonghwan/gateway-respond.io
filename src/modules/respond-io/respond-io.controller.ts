import { Controller, Post, Body, Logger } from '@nestjs/common';
import { RespondIoService } from './respond-io.service';

@Controller('webhook')
export class RespondIoController {
  private readonly logger = new Logger(RespondIoController.name);

  constructor(private readonly respondIoService: RespondIoService) {}

  @Post('respond-io')
  async handleWebhook(@Body() payload: any) {
    this.logger.log('Webhook received from respond.io');
    
    const result = await this.respondIoService.handleWebhook(payload);
    
    return result;
  }
}
