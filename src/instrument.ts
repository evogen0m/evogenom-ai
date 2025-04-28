import * as Sentry from '@sentry/nestjs';

Sentry.init({
  dsn: 'https://78ecf999349432c51d1ee72521d94d5c@o4509229435650048.ingest.de.sentry.io/4509229437419600',

  // Setting this option to true will send default PII data to Sentry.
  // For example, automatic IP address collection on events
  sendDefaultPii: true,
  release: process.env.SENTRY_RELEASE,
});
