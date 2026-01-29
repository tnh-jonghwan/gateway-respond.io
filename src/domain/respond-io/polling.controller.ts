import { Controller, Get, Post, Param } from '@nestjs/common';
import { MessagePollingService } from './message-polling.service';

@Controller('polling')
export class PollingController {
  constructor(private readonly pollingService: MessagePollingService) {}

  @Get('status')
  getStatus() {
    return this.pollingService.getPollingStatus();
  }

  @Post('manual/:contactId')
  async manualPoll(@Param('contactId') contactId: string) {
    await this.pollingService.manualPoll(contactId);
    return {
      success: true,
      message: `Manual poll triggered for contact ${contactId}`,
    };
  }
}
