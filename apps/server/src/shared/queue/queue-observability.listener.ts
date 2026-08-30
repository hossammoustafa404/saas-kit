import { OnQueueEvent, QueueEventsHost } from '@nestjs/bullmq';
import { ObservabilityService } from '../observability/services';

export abstract class QueueObservabilityListener extends QueueEventsHost {
  constructor(
    protected readonly observabilityService: ObservabilityService,
    protected readonly queueName: string,
  ) {
    super();
  }

  @OnQueueEvent('added')
  onAdded({ jobId, name }: { jobId: string; name: string }): void {
    this.observabilityService.logForQueue({
      event: 'added',
      queueName: this.queueName,
      jobId,
      jobName: name,
    });
  }

  @OnQueueEvent('active')
  onActive({ jobId }: { jobId: string }): void {
    this.observabilityService.logForQueue({
      event: 'active',
      queueName: this.queueName,
      jobId,
    });
  }

  @OnQueueEvent('completed')
  onCompleted({ jobId }: { jobId: string }): void {
    this.observabilityService.logForQueue({
      event: 'completed',
      queueName: this.queueName,
      jobId,
    });
  }

  @OnQueueEvent('failed')
  onFailed({
    jobId,
    failedReason,
  }: {
    jobId: string;
    failedReason: string;
  }): void {
    this.observabilityService.logForQueue({
      event: 'failed',
      queueName: this.queueName,
      jobId,
      error: failedReason,
    });
  }

  @OnQueueEvent('stalled')
  onStalled({ jobId }: { jobId: string }): void {
    this.observabilityService.logForQueue({
      event: 'stalled',
      queueName: this.queueName,
      jobId,
    });
  }
}
