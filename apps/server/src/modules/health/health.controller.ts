import {
  Controller,
  Get,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { AllowAnonymous } from '@thallesp/nestjs-better-auth';
import { HealthDto } from './dto';
import { GetHealthService } from './services';

@ApiTags('Health')
@Controller('health')
export class HealthController {
  constructor(private readonly getHealthService: GetHealthService) {}

  @Get()
  @AllowAnonymous()
  @ApiOperation({
    summary: 'Get Health',
    description:
      'No authentication required. Returns a Health signal that the API process is accepting HTTP requests. Does not check PostgreSQL or other dependencies.',
  })
  @ApiOkResponse({
    type: HealthDto,
    description: 'Process is accepting HTTP',
  })
  get() {
    return this.getHealthService.execute();
  }
}
