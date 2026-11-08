import { ApiProperty } from '@nestjs/swagger';
import {
  IsEmail,
  IsNotEmpty,
  IsString,
  MinLength,
  MaxLength,
  Validate,
  ValidationArguments,
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from 'class-validator';
import { validatePassword } from '../../../common/validators/password.validator';

@ValidatorConstraint({ name: 'IsValidResetPasswordPolicy', async: false })
export class IsValidResetPasswordPolicyConstraint implements ValidatorConstraintInterface {
  private validationErrors: string[] = [];

  validate(password: any, _args: ValidationArguments) {
    if (typeof password !== 'string') return false;
    const result = validatePassword(password);
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

export class ForgotPasswordDto {
  @ApiProperty({ example: 'user@earnxpress.com', description: 'Account email address' })
  @IsEmail({}, { message: 'Must be a valid email address' })
  @IsNotEmpty({ message: 'Email address is required' })
  email: string;
}

export class ResetPasswordDto {
  @ApiProperty({ example: '32-byte-hex-token-string', description: 'Raw reset token received via email' })
  @IsString()
  @IsNotEmpty({ message: 'Reset token is required' })
  token: string;

  @ApiProperty({ example: 'NewSecurePassword123!', minLength: 8, maxLength: 64 })
  @IsString()
  @MinLength(8, { message: 'Password must be at least 8 characters long.' })
  @MaxLength(64, { message: 'Password cannot exceed 64 characters.' })
  @Validate(IsValidResetPasswordPolicyConstraint)
  password: string;

  @ApiProperty({ example: 'NewSecurePassword123!', description: 'Must match new password' })
  @IsString()
  @IsNotEmpty({ message: 'Password confirmation is required' })
  confirmPassword: string;
}
