import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNumber, IsOptional, IsString, Min } from 'class-validator';

export class CreateManualDepositDto {
  @ApiProperty({ example: 5000, description: 'Deposit amount in USD cents (min $1.00 = 100 cents)' })
  @IsNumber()
  @Min(100)
  amountCents: number;

  @ApiProperty({ example: 'BINANCE_PAY', description: 'Payment channel: BINANCE_PAY, USDT_CRYPTO, BKASH, NAGAD, BANK_TRANSFER' })
  @IsString()
  depositMethod: string;

  @ApiProperty({ example: '857219403', description: 'Sender Binance Pay ID, Phone Number, or Bank Account' })
  @IsString()
  senderIdentifier: string;

  @ApiProperty({ example: '24891829104', description: 'Binance TxID, bKash TrxID, or Bank Transfer Reference' })
  @IsString()
  transactionReference: string;

  @ApiPropertyOptional({ example: 'https://storage.earnxpress.com/receipts/proof.jpg' })
  @IsOptional()
  @IsString()
  proofScreenshotUrl?: string;

  @ApiPropertyOptional({ example: 'Buyer deposited via Binance Pay USDT' })
  @IsOptional()
  @IsString()
  notes?: string;
}
