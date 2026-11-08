import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  UseGuards,
  Headers,
  Req,
  HttpCode,
  HttpStatus,
  Query,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse, ApiHeader } from '@nestjs/swagger';
import { PaymentsService } from './payments.service';
import { RealLedgerService } from './real-ledger.service';
import { CreatePaymentOrderDto } from './dto/create-payment-order.dto';
import { CreateWithdrawalDto } from './dto/create-withdrawal.dto';
import { ProcessWithdrawalDto } from './dto/process-withdrawal.dto';
import { CreateManualDepositDto } from './dto/create-manual-deposit.dto';
import { ProcessDepositDto } from './dto/process-deposit.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { VerifiedUserGuard } from '../auth/guards/verified-user.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { UserRole, PaymentProviderType, WithdrawalStatus, PaymentOrderStatus } from '@prisma/client';
import { Request } from 'express';

@ApiTags('Real International Payments & Settlement')
@Controller('payments')
export class PaymentsController {
  constructor(
    private readonly paymentsService: PaymentsService,
    private readonly realLedgerService: RealLedgerService,
  ) {}

  @Post('checkout-session')
  @UseGuards(JwtAuthGuard, RolesGuard, VerifiedUserGuard)
  @Roles(UserRole.BUYER, UserRole.PLATFORM_OWNER)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create real payment order session (Deposit or Direct Task Escrow Funding)' })
  @ApiResponse({ status: 201, description: 'Order created with provider checkout URL' })
  async createCheckoutSession(
    @CurrentUser('id') buyerId: string,
    @Body() dto: CreatePaymentOrderDto,
  ) {
    return this.paymentsService.createPaymentOrder(buyerId, dto);
  }

  @Post('webhooks/:provider')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Cryptographically verified provider webhook endpoint (Stripe, SSLCommerz, PayPal, SandboxMock)' })
  @ApiHeader({ name: 'stripe-signature', required: false, description: 'Stripe HMAC signature header' })
  @ApiHeader({ name: 'x-earnxpress-signature', required: false, description: 'EarnXpress Sandbox HMAC signature header' })
  async handleWebhook(
    @Param('provider') providerStr: string,
    @Headers() headers: Record<string, string>,
    @Req() req: Request,
    @Body() body: any,
  ) {
    const provider = providerStr.toUpperCase() as PaymentProviderType;
    const rawBody = (req as any).rawBody || JSON.stringify(body);
    return this.paymentsService.processWebhook(provider, headers, rawBody, body);
  }

  @Get('wallets/buyer')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.BUYER, UserRole.PLATFORM_OWNER)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Inspect Buyer Real Ledger Wallet (Available Balance, Real Escrow, Double-Entry Log)' })
  async getBuyerWallet(@CurrentUser('id') buyerId: string) {
    return this.realLedgerService.getBuyerWallet(buyerId);
  }

  @Get('wallets/worker')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.WORKER, UserRole.PLATFORM_OWNER)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Inspect Worker Real Ledger Wallet (Available Earnings, Pending Withdrawal, Double-Entry Log)' })
  async getWorkerWallet(@CurrentUser('id') workerId: string) {
    return this.realLedgerService.getWorkerWallet(workerId);
  }

  @Post('withdrawals')
  @UseGuards(JwtAuthGuard, RolesGuard, VerifiedUserGuard)
  @Roles(UserRole.WORKER, UserRole.PLATFORM_OWNER)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Worker requests withdrawal payout to verified bank, MFS or remittance channel' })
  async requestWithdrawal(
    @CurrentUser('id') workerId: string,
    @Body() dto: CreateWithdrawalDto,
  ) {
    return this.paymentsService.requestWithdrawal(workerId, dto);
  }

  @Get('withdrawals/my')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.WORKER, UserRole.PLATFORM_OWNER)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Worker views personal withdrawal payout requests history' })
  async getMyWithdrawals(@CurrentUser('id') workerId: string) {
    return this.paymentsService.getMyWithdrawals(workerId);
  }

  @Get('withdrawals')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.PLATFORM_OWNER, UserRole.SUPER_ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Platform Owner / Admin lists all worker withdrawal requests' })
  async listWithdrawals(
    @Query('status') status?: WithdrawalStatus,
    @Query('limit') limit?: number,
    @Query('offset') offset?: number,
  ) {
    return this.paymentsService.listWithdrawals({ status, limit, offset });
  }

  @Post('withdrawals/:id/process')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.PLATFORM_OWNER, UserRole.SUPER_ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Admin/Staff review and process withdrawal request (APPROVE, COMPLETE, REJECT)' })
  async processWithdrawal(
    @CurrentUser('id') adminId: string,
    @Param('id') withdrawalId: string,
    @Body() dto: ProcessWithdrawalDto,
  ) {
    return this.paymentsService.processWithdrawal(adminId, withdrawalId, dto);
  }

  @Post('tasks/:id/refund-unfilled')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.BUYER, UserRole.PLATFORM_OWNER)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Buyer cancels remaining unfilled slots on real-funded campaign and refunds escrow' })
  async refundUnfilledSlots(
    @CurrentUser('id') buyerId: string,
    @Param('id') taskId: string,
  ) {
    return this.paymentsService.refundTaskUnfilledSlots(buyerId, taskId);
  }

  @Get('exchange-rates')
  @ApiOperation({ summary: 'Get current international currency exchange conversion benchmarks' })
  async getExchangeRates() {
    return this.paymentsService.getExchangeRates();
  }

  @Get('reconciliation')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.PLATFORM_OWNER, UserRole.SUPER_ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Comprehensive Double-Entry Ledger Mathematical Reconciliation Audit' })
  async reconcileLedger() {
    return this.realLedgerService.reconcileRealLedger();
  }

  @Post('deposits/manual')
  @UseGuards(JwtAuthGuard, RolesGuard, VerifiedUserGuard)
  @Roles(UserRole.BUYER, UserRole.PLATFORM_OWNER)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Buyer submits manual deposit receipt (Binance Pay / USDT / bKash / Bank)' })
  async submitManualDeposit(
    @CurrentUser('id') buyerId: string,
    @Body() dto: CreateManualDepositDto,
  ) {
    return this.paymentsService.createManualDeposit(buyerId, dto);
  }

  @Get('deposits/my')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.BUYER, UserRole.PLATFORM_OWNER)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Buyer views personal deposit history' })
  async getMyDeposits(@CurrentUser('id') buyerId: string) {
    return this.paymentsService.getMyDeposits(buyerId);
  }

  @Get('deposits')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.PLATFORM_OWNER, UserRole.SUPER_ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Platform Owner / Admin lists all deposits' })
  async listDeposits(
    @Query('status') status?: PaymentOrderStatus,
    @Query('limit') limit?: number,
    @Query('offset') offset?: number,
  ) {
    return this.paymentsService.listDeposits({ status, limit: Number(limit) || 50, offset: Number(offset) || 0 });
  }

  @Post('deposits/:id/process')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.PLATFORM_OWNER, UserRole.SUPER_ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Admin/Staff review and process manual deposit (APPROVE, REJECT)' })
  async processDeposit(
    @CurrentUser('id') adminId: string,
    @Param('id') orderId: string,
    @Body() dto: ProcessDepositDto,
  ) {
    return this.paymentsService.processDeposit(adminId, orderId, dto);
  }
}
