import { ConfigService } from '@nestjs/config';
import { Test } from '@nestjs/testing';
import { UnrecoverableError, type Job } from 'bullmq';
import type { MailJob } from './interfaces/mail-job.interface';
import { RESEND } from './mail.constants';
import { SendMailProcessor } from './send-mail.processor';

describe('SendMailProcessor', () => {
  const resend = {
    emails: {
      send: jest.fn(),
    },
  };
  const config = {
    get: jest.fn(),
  };

  let processor: SendMailProcessor;

  beforeAll(async () => {
    const app = await Test.createTestingModule({
      providers: [
        SendMailProcessor,
        { provide: RESEND, useValue: resend },
        { provide: ConfigService, useValue: config },
      ],
    }).compile();

    processor = app.get(SendMailProcessor);
  });

  beforeEach(() => {
    resend.emails.send.mockReset();
    config.get.mockReset();
    mockConfig();
    resend.emails.send.mockResolvedValue({
      data: { id: 'email_1' },
      error: null,
      headers: null,
    });
  });

  it('should skip Resend for an example.com recipient outside production', async () => {
    await processor.process(createMailJob('casey@example.com'));

    expect(resend.emails.send).not.toHaveBeenCalled();
  });

  it('should send through Resend for an example.com recipient in production', async () => {
    mockConfig('production');

    await processor.process(createMailJob('casey@example.com'));

    expect(resend.emails.send).toHaveBeenCalledWith({
      from: 'onboarding@resend.dev',
      to: 'casey@example.com',
      subject: 'Verify your email',
      text: 'Verify your email by opening this link:\nhttps://kit.test/verify',
      html: '',
    });
  });

  it('should send through Resend for a normal recipient', async () => {
    await processor.process(createMailJob('casey@customer.test.io'));

    expect(resend.emails.send).toHaveBeenCalledWith({
      from: 'onboarding@resend.dev',
      to: 'casey@customer.test.io',
      subject: 'Verify your email',
      text: 'Verify your email by opening this link:\nhttps://kit.test/verify',
      html: '',
    });
  });

  it('should fail without retry when Resend returns a validation error', async () => {
    resend.emails.send.mockResolvedValue({
      data: null,
      error: {
        name: 'validation_error',
        message: 'Invalid `to` field',
        statusCode: 422,
      },
      headers: null,
    });

    await expect(
      processor.process(createMailJob('casey@customer.test.io')),
    ).rejects.toBeInstanceOf(UnrecoverableError);
  });

  it('should retry when Resend returns a server error', async () => {
    resend.emails.send.mockResolvedValue({
      data: null,
      error: {
        name: 'internal_server_error',
        message: 'Resend is down',
        statusCode: 500,
      },
      headers: null,
    });

    const pending = processor.process(createMailJob('casey@customer.test.io'));
    await expect(pending).rejects.toThrow('Resend is down');
    await expect(pending).rejects.not.toBeInstanceOf(UnrecoverableError);
  });

  function mockConfig(nodeEnv = 'test') {
    config.get.mockImplementation((key: string) => {
      if (key === 'MAIL_FROM') {
        return 'onboarding@resend.dev';
      }
      if (key === 'NODE_ENV') {
        return nodeEnv;
      }
      return undefined;
    });
  }
});

function createMailJob(to: string): Job<MailJob> {
  return {
    data: {
      to,
      subject: 'Verify your email',
      text: 'Verify your email by opening this link:\nhttps://kit.test/verify',
      html: '',
    },
  } as Job<MailJob>;
}
