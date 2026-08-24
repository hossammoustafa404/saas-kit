import { createZodDto } from 'nestjs-zod';
import { HealthSchema } from '@saas-kit/schemas';

export class HealthDto extends createZodDto(HealthSchema) {}
