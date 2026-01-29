import { Controller, Get, Post } from '@nestjs/common';
import { MessagePollingService } from './message-polling.service';

@Controller('polling')
export class PollingController {
  constructor(private readonly pollingService: MessagePollingService) { }

  @Post('manual-sync')
  async manualSyncAll() {
    // 백그라운드에서 실행 (await 안함) 또는 기다림
    // 여기서는 즉시 응답을 위해 async 실행만 트리거
    this.pollingService.syncAllContacts().catch(err => console.error(err));
    return {
      success: true,
      message: `Manual global sync triggered. Check logs for details.`,
    };
  }
}
