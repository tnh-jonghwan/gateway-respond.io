import { Controller, Post, Body, HttpException, HttpStatus } from '@nestjs/common';
import { SendMessageDto } from './dto/send-message.dto';
import { RespondIoService } from '@domain/respond-io/respond-io.service';

@Controller('api/messages')
export class MessageController {
  constructor(private readonly respondIoService: RespondIoService) {}

  // starfruit -> respond.io
  @Post('send')
  async sendMessage(@Body() dto: SendMessageDto) {
    try {
      const result = await this.respondIoService.sendMessage(dto);
      
      return {
        success: true,
        messageId: result.messageId,
        sentAt: new Date().toISOString(),
      };
    } catch (error) {
      throw new HttpException(
        {
          success: false,
          error: error.message || 'Failed to send message',
        },
        HttpStatus.BAD_REQUEST,
      );
    }
  }
}
