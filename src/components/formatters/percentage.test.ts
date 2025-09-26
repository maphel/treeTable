import {
  getLocaleSeparators,
  formatPercentLive,
  parsePercent,
} from './percentage.js';

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
  const sepDE = getLocaleSeparators('de-DE');
  assertEqual(sepDE.decimal, ',', 'de-DE decimal');

  assertEqual(formatPercentLive('1', sepDE), '1');
  assertEqual(formatPercentLive('1,', sepDE), '1,', 'keep trailing decimal');
  assertEqual(formatPercentLive('1,2', sepDE), '1,2');
  assertEqual(formatPercentLive('1,23', sepDE), '1,23');

  assertEqual(formatPercentLive('1.', sepDE), '1,', 'normalize dot to comma');
  assertEqual(formatPercentLive('1.2', sepDE), '1,2');

  assertEqual(formatPercentLive(',', sepDE), '0,');
  assertEqual(formatPercentLive('.', sepDE), '0,');

  assertEqual(formatPercentLive('a1b,2c%', sepDE), '1,2');

  assertEqual(formatPercentLive('1,2,3', sepDE), '1,23');

  assertEqual(formatPercentLive('-1,2', sepDE), '-1,2');
  assertEqual(formatPercentLive(' - 1 , 2 % ', sepDE), '-1,2');

  const sepEN = getLocaleSeparators('en-GB');
  assertEqual(sepEN.decimal, '.', 'en-GB decimal');
  assertEqual(formatPercentLive('1', sepEN), '1');
  assertEqual(formatPercentLive('1.', sepEN), '1.', 'keep trailing dot');
  assertEqual(formatPercentLive('1.2', sepEN), '1.2');
  assertEqual(formatPercentLive('1,', sepEN), '1.', 'normalize comma to dot');
  assertEqual(formatPercentLive('1,2', sepEN), '1.2');

  assertClose(parsePercent('1,5%', 'de-DE'), 1.5, 1e-9, 'parse de-DE percent');
  assertClose(parsePercent('1.5%', 'en-GB'), 1.5, 1e-9, 'parse en-GB percent');
  assertClose(parsePercent(' 1 , ', 'de-DE'), 1, 1e-9, 'parse incomplete decimal -> 1');
  if (parsePercent(',', 'de-DE') !== undefined) {
    throw new Error('parse just decimal should be undefined');
  }

  console.log('percentage.formatter tests passed');
}

run();
