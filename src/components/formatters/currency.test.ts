/*
  Minimal tests for currency formatter.
  Run via: npm run test:formatters
*/

import {
  getLocaleSeparators,
  formatCurrencyLive,
  formatCurrencyValue,
  parseCurrency,
} from './currency.js';

function assertEqual(actual: unknown, expected: unknown, msg?: string) {
  if (actual !== expected) {
    throw new Error((msg ? msg + ' ' : '') + `Expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`);
  }
}

function assertClose(actual: number | undefined, expected: number, eps = 1e-9, msg?: string) {
  if (typeof actual !== 'number' || Math.abs(actual - expected) > eps) {
    throw new Error((msg ? msg + ' ' : '') + `Expected ~${expected}, got ${actual}`);
  }
}

function run() {
  // de-DE
  const sepDE = getLocaleSeparators('de-DE', 'EUR');
  assertEqual(sepDE.decimal, ',', 'de-DE decimal');

  // Live formatting basics
  assertEqual(formatCurrencyLive('1', sepDE), '1');
  assertEqual(formatCurrencyLive('1,', sepDE), '1,');
  assertEqual(formatCurrencyLive('1.2', sepDE), '1,2', 'normalize dot to comma');
  assertEqual(formatCurrencyLive(',', sepDE), '0,');
  assertEqual(formatCurrencyLive('.', sepDE), '0,');
  assertEqual(formatCurrencyLive('1234', sepDE), '1.234');
  assertEqual(formatCurrencyLive('1234567', sepDE), '1.234.567');
  assertEqual(formatCurrencyLive('1,234', sepDE), '1,23', 'limit to 2 fraction digits');
  assertEqual(formatCurrencyLive('-1,2', sepDE), '-1,2');
  assertEqual(formatCurrencyLive('€ 1.234,50', sepDE), '1.234,50');

  // en-GB
  const sepEN = getLocaleSeparators('en-GB', 'GBP');
  assertEqual(sepEN.decimal, '.', 'en-GB decimal');
  assertEqual(formatCurrencyLive('1,', sepEN), '1.', 'normalize comma to dot');
  assertEqual(formatCurrencyLive('1234', sepEN), '1,234');
  assertEqual(formatCurrencyLive('1.2', sepEN), '1.2');

  // Value formatting & parsing
  assertEqual(formatCurrencyValue(1234.56, 'de-DE', 'EUR'), '1.234,56');
  assertEqual(formatCurrencyValue(1234.56, 'en-GB', 'GBP'), '1,234.56');

  assertClose(parseCurrency('1.234,56 €', 'de-DE', 'EUR'), 1234.56);
  assertClose(parseCurrency('£1,234.56', 'en-GB', 'GBP'), 1234.56);
  assertClose(parseCurrency('-1,234.5', 'en-GB', 'GBP'), -1234.5);
}

run();

