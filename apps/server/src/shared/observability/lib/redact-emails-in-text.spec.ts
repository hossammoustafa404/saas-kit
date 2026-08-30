import { REDACTED_VALUE } from '../observability.constants';
import { redactEmailsInText } from './redact-emails-in-text';

describe('redactEmailsInText', () => {
  it('should redact a standard dot-atom email', () => {
    expect(
      redactEmailsInText('Resend rejected pii-user@example.com', REDACTED_VALUE),
    ).toBe(`Resend rejected ${REDACTED_VALUE}`);
  });

  it('should redact quoted-local-part and IPv4 literal emails', () => {
    expect(
      redactEmailsInText(
        'Rejected "pii.user+tag"@example.com and user@[192.168.1.1]',
        REDACTED_VALUE,
      ),
    ).toBe(`Rejected ${REDACTED_VALUE} and ${REDACTED_VALUE}`);
  });

  it('should redact IPv6 literal and escaped-quote local-part emails', () => {
    expect(
      redactEmailsInText(
        'Failed for user@[IPv6:2001:db8::1] and "john\\"doe"@example.com',
        REDACTED_VALUE,
      ),
    ).toBe(`Failed for ${REDACTED_VALUE} and ${REDACTED_VALUE}`);
  });

  it('should redact IDN domain emails', () => {
    expect(
      redactEmailsInText('Contact ユーザー@例え.jp today', REDACTED_VALUE),
    ).toBe(`Contact ${REDACTED_VALUE} today`);
  });

  it('should not redact @ inside a quoted local part', () => {
    expect(
      redactEmailsInText('"user@host"@example.com', REDACTED_VALUE),
    ).toBe(REDACTED_VALUE);
  });

  it('should leave non-email text unchanged', () => {
    expect(redactEmailsInText('SMTP connection timed out', REDACTED_VALUE)).toBe(
      'SMTP connection timed out',
    );
  });
});
