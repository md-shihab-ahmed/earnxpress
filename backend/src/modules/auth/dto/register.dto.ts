import { ApiProperty } from '@nestjs/swagger';
import {
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsString,
  MinLength,
  MaxLength,
  Validate,
  ValidationArguments,
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from 'class-validator';
import { UserRole } from '@prisma/client';
import { isValidCountryCode } from '../../../common/constants/countries.constant';
import { validatePassword } from '../../../common/validators/password.validator';

@ValidatorConstraint({ name: 'IsIso3166CountryCode', async: false })
export class IsIso3166CountryCodeConstraint implements ValidatorConstraintInterface {
  validate(countryCode: any) {
    return typeof countryCode === 'string' && isValidCountryCode(countryCode);
  }

  defaultMessage() {
    return 'countryCode must be a valid ISO 3166-1 alpha-2 country code (e.g., BD, US, GB, DE)';
  }
}

@ValidatorConstraint({ name: 'IsValidPasswordPolicy', async: false })
export class IsValidPasswordPolicyConstraint implements ValidatorConstraintInterface {
  private validationErrors: string[] = [];

  validate(password: any, args: ValidationArguments) {
    if (typeof password !== 'string') return false;
    const dto = args.object as any;
    const result = validatePassword(password, dto?.email);
    if (!result.isValid) {
      this.validationErrors = result.errors;
      return false;
    }
    return true;
  }

  defaultMessage() {
    return this.validationErrors.join(' ') || 'Password does not meet complexity requirements or is blacklisted.';
  }
}

export class RegisterDto {
  @ApiProperty({ example: 'worker@earnxpress.com', description: 'User email address' })
  @IsEmail({}, { message: 'Must be a valid email address' })
  @IsNotEmpty()
  email: string;

  @ApiProperty({ example: 'SecureP@ssw0rd2026', minLength: 8, maxLength: 64 })
  @IsString()
  @MinLength(8, { message: 'Password must be at least 8 characters long.' })
  @MaxLength(64, { message: 'Password cannot exceed 64 characters.' })
  @Validate(IsValidPasswordPolicyConstraint)
  password: string;

  @ApiProperty({ example: 'SecureP@ssw0rd2026', description: 'Must match password' })
  @IsString()
  @IsNotEmpty({ message: 'Password confirmation is required.' })
  confirmPassword: string;

  @ApiProperty({ example: 'Rahim Ahmed', description: 'Full Legal Name' })
  @IsString()
  @IsNotEmpty({ message: 'Full name is required.' })
  displayName: string;

  @ApiProperty({ example: 'BD', description: 'ISO 3166-1 alpha-2 country code (249 recognized countries)' })
  @IsString()
  @IsNotEmpty({ message: 'Country is required.' })
  @Validate(IsIso3166CountryCodeConstraint)
  countryCode: string;

  @ApiProperty({ enum: [UserRole.BUYER, UserRole.WORKER], default: UserRole.WORKER })
  @IsEnum([UserRole.BUYER, UserRole.WORKER], {
    message: 'Primary role on registration must be BUYER or WORKER',
  })
  primaryRole: UserRole;
}
