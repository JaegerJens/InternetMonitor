const fetch = require('node-fetch');
const colors = require('colors');
const fs = require('fs');
const util = require('util');
const log = require('./lib/log');

const readFileAsync = util.promisify(fs.readFile);

const configFile = 'monitor.config.json';

/**
 * @param {Object} config 
 */
function run(config) {
    for(let endpoint of config.requests) {
        timeRequest(endpoint);
    }
}

/**
 * @param {string} url
 * @returns {Promise} 
 */
async function timeRequest(url) {
    await log.logEvent('start request '.grey + url.blue);
    let start = process.hrtime();
    try {
        const res = await fetch(url);
        if (!res.ok) {
            await log.logError('HTTP', res.statusText + ' for ' + url.blue);
        } else {
            let duration = log.toMilliseconds(process.hrtime(start));
            let col = evaluateDuration(duration);
            await log.logEvent(col('duration of request ') + url.blue + col(' ### ' + duration + ' ms'));
        }
    }
    catch (ex) {
        await log.logError('FETCH', ex);
    }
}

/**
 * @param {Number} timespan
 * @returns {Color}
 */
function evaluateDuration(timespan) {
    let col = colors.green;
    if (timespan > 100) {
        col = colors.yellow;
    }
    if (timespan > 200) {
        col = colors.red;
    }
    return col;
}

/**
 * @returns {Promise<Object>}
 */
async function readConfig() {
    const data = await readFileAsync(configFile, 'utf8');
    return JSON.parse(data);
}

async function main() {
    const config = await readConfig();
    log.openLogFile(config.output);
    setInterval(run, config.interval, config);
}

main();