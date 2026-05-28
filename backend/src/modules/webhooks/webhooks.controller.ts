import { Controller, Post, Body, Param, Headers, HttpCode } from '@nestjs/common';
import { WebhooksService } from './webhooks.service';

@Controller('webhooks')
export class WebhooksController {
  constructor(private readonly webhooksService: WebhooksService) {}

  @Post('facebook')
  @HttpCode(200)
  handleFacebook(@Body() payload: Record<string, unknown>) {
    return this.webhooksService.handleFacebookLead(payload);
  }

  @Post('website')
  @HttpCode(200)
  handleWebsite(@Body() payload: Record<string, unknown>) {
    return this.webhooksService.handleWebsiteLead(payload);
  }

  @Post('evolution/:instanceId')
  @HttpCode(200)
  handleEvolution(
    @Param('instanceId') instanceId: string,
    @Body() payload: Record<string, unknown>,
  ) {
    return this.webhooksService.handleEvolutionWebhook(instanceId, payload);
  }
}
