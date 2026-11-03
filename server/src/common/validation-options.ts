import type { ValidationPipeOptions } from '@nestjs/common';

/**
 * Global request validation:
 * - `whitelist` strips properties that have no validation decorator,
 * - `forbidNonWhitelisted` rejects them instead of silently ignoring them,
 * - `transform` turns plain bodies into DTO instances.
 */
export const VALIDATION_PIPE_OPTIONS: ValidationPipeOptions = {
  whitelist: true,
  forbidNonWhitelisted: true,
  transform: true,
};
