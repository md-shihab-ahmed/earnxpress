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
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { UserRole, PaymentProviderType } from '@prisma/client';
import { Request } from 'express';

@ApiTags('Real International Payments & Settlement')
@Controller('payments')
export class PaymentsController {
  constructor(
    private readonly paymentsService: PaymentsService,
    private readonly realLedgerService: RealLedgerService,
  ) {}

  @Post('checkout-session')
  @UseGuards(JwtAuthGuard, RolesGuard)
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
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.WORKER, UserRole.PLATFORM_OWNER)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Worker requests withdrawal payout to verified bank, MFS or remittance channel' })
  async requestWithdrawal(
    @CurrentUser('id') workerId: string,
    @Body() dto: CreateWithdrawalDto,
  ) {
    return this.paymentsService.requestWithdrawal(workerId, dto);
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
}
