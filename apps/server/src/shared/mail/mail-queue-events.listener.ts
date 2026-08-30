import { QueueEventsListener } from '@nestjs/bullmq';
import { Injectable } from '@nestjs/common';
import { ObservabilityService } from '../observability/services';
import { QueueObservabilityListener } from '../queue/queue-observability.listener';
import { MAIL_QUEUE } from './mail.constants';

@Injectable()
@QueueEventsListener(MAIL_QUEUE)
export class MailQueueEventsListener extends QueueObservabilityListener {
  constructor(observabilityService: ObservabilityService) {
    super(observabilityService, MAIL_QUEUE);
  }
}
