import {
  Controller,
  Get,
  Post,
  Body,
  Query,
  UseGuards,
  Ip,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse } from '@nestjs/swagger';
import { DemoFinanceService } from './demo-finance.service';
import { ClaimFaucetDto } from './dto/faucet.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@ApiTags('Simulated Demo Financial Engine')
@Controller('demo-finance')
export class DemoFinanceController {
  constructor(private readonly demoFinanceService: DemoFinanceService) {}

  @Get('wallets')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get current user available, escrow, and pending demo balances' })
  @ApiResponse({ status: 200, description: 'Demo wallet balances' })
  async getWallets(@CurrentUser('id') userId: string) {
    return this.demoFinanceService.getUserWallets(userId);
  }

  @Post('faucet')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Claim virtual DEMO balance from test faucet (Default $1,000.00 demo USD)' })
  @ApiResponse({ status: 201, description: 'Demo credits injected into account' })
  async claimFaucet(
    @CurrentUser('id') userId: string,
    @Body() dto: ClaimFaucetDto,
    @Ip() ipAddress: string,
  ) {
    const amountCents = dto.amountCents ? BigInt(dto.amountCents) : 100000n;
    return this.demoFinanceService.claimFaucet(userId, amountCents, ipAddress);
  }

  @Get('transactions')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get paginated double-entry demo transaction ledger history' })
  async getTransactions(
    @CurrentUser('id') userId: string,
    @Query('limit') limit?: number,
    @Query('offset') offset?: number,
  ) {
    return this.demoFinanceService.getTransactionHistory(userId, Number(limit) || 20, Number(offset) || 0);
  }

  @Get('fx-snapshots')
  @ApiOperation({ summary: 'Get indicative exchange rates for local currency display (BDT, EUR, GBP, INR)' })
  getFxSnapshots() {
    return this.demoFinanceService.getFxSnapshots();
  }
}
