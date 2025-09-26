/*
  Minimal test file for percentage formatter.
  Run via: npm run test:formatters
*/
import { getLocaleSeparators, formatPercentLive, parsePercent, } from './percentage.js';
function assertEqual(actual, expected, msg) {
    if (actual !== expected) {
        throw new Error((msg ? msg + ' ' : '') + `Expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`);
    }
}
function assertClose(actual, expected, eps = 1e-9, msg) {
    if (typeof actual !== 'number' || Math.abs(actual - expected) > eps) {
        throw new Error((msg ? msg + ' ' : '') + `Expected ~${expected}, got ${actual}`);
    }
}
function run() {
    // de-DE
    const sepDE = getLocaleSeparators('de-DE');
    assertEqual(sepDE.decimal, ',', 'de-DE decimal');
    // Live formatting basics (de-DE)
    assertEqual(formatPercentLive('1', sepDE), '1');
    assertEqual(formatPercentLive('1,', sepDE), '1,', 'keep trailing decimal');
    assertEqual(formatPercentLive('1,2', sepDE), '1,2');
    assertEqual(formatPercentLive('1,23', sepDE), '1,23');
    // Typing other decimal for de-DE should normalize to comma
    assertEqual(formatPercentLive('1.', sepDE), '1,', 'normalize dot to comma');
    assertEqual(formatPercentLive('1.2', sepDE), '1,2');
    // Edge: starting with decimal
    assertEqual(formatPercentLive(',', sepDE), '0,');
    assertEqual(formatPercentLive('.', sepDE), '0,');
    // Strip letters/symbols
    assertEqual(formatPercentLive('a1b,2c%', sepDE), '1,2');
    // Multiple decimals -> keep first
    assertEqual(formatPercentLive('1,2,3', sepDE), '1,23');
    // Negative
    assertEqual(formatPercentLive('-1,2', sepDE), '-1,2');
    assertEqual(formatPercentLive(' - 1 , 2 % ', sepDE), '-1,2');
    // en-GB
    const sepEN = getLocaleSeparators('en-GB');
    assertEqual(sepEN.decimal, '.', 'en-GB decimal');
    assertEqual(formatPercentLive('1', sepEN), '1');
    assertEqual(formatPercentLive('1.', sepEN), '1.', 'keep trailing dot');
    assertEqual(formatPercentLive('1.2', sepEN), '1.2');
    // normalize comma to dot for en-GB
    assertEqual(formatPercentLive('1,', sepEN), '1.', 'normalize comma to dot');
    assertEqual(formatPercentLive('1,2', sepEN), '1.2');
    // parsePercent
    assertClose(parsePercent('1,5%', 'de-DE'), 1.5, 1e-9, 'parse de-DE percent');
    assertClose(parsePercent('1.5%', 'en-GB'), 1.5, 1e-9, 'parse en-GB percent');
    assertClose(parsePercent(' 1 , ', 'de-DE'), 1, 1e-9, 'parse incomplete decimal -> 1');
    if (parsePercent(',', 'de-DE') !== undefined) {
        throw new Error('parse just decimal should be undefined');
    }
    console.log('percentage.formatter tests passed');
}
run();
