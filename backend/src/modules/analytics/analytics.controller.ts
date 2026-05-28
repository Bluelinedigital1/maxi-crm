import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { AnalyticsService } from './analytics.service';
import { JwtAuthGuard } from '@common/guards/jwt-auth.guard';
import { RolesGuard } from '@common/guards/roles.guard';
import { Roles } from '@common/decorators/roles.decorator';
import { Role } from '@prisma/client';

function parseRange(from?: string, to?: string) {
  const now = new Date();
  return {
    from: from ? new Date(from) : new Date(now.getFullYear(), now.getMonth(), 1),
    to: to ? new Date(to) : now,
  };
}

@Controller('analytics')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN, Role.MANAGER)
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Get('overview')
  getOverview(@Query('from') from?: string, @Query('to') to?: string) {
    return this.analyticsService.getOverview(parseRange(from, to));
  }

  @Get('sellers')
  getSellerPerformance(@Query('from') from?: string, @Query('to') to?: string) {
    return this.analyticsService.getSellerPerformance(parseRange(from, to));
  }

  @Get('consignment/field')
  getConsignmentField() {
    return this.analyticsService.getConsignmentField();
  }

  @Get('trends')
  getLeadsTrend(
    @Query('from') from?: string,
    @Query('to') to?: string,
    @Query('groupBy') groupBy?: 'day' | 'week' | 'month',
  ) {
    return this.analyticsService.getLeadsTrend(parseRange(from, to), groupBy ?? 'day');
  }
}
