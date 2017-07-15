const fetch = require('node-fetch');
const colors = require('colors');
const notifier = require('node-notifier');
const fs = require('fs');
const util = require('util');
const log = require('./lib/log');

const readFileAsync = util.promisify(fs.readFile);

const configFile = 'monitor.config.json';

/** @type {boolean} */
let isOffline = false;

/**
 * time after first offline notification
 * to show next offline notification.
 * 
 * default: 5 minutes
 * @type {number}
*/
const offlineTimeout = 5 * 60 * 1000;

/**
 * @param {Object} config 
 */
function run(config) {
    for(let endpoint of config.requests) {
        timeRequest(endpoint);
    }
}

function notifyOffline() {
    if (!isOffline) {
        notifier.notify('Internet is Offline!');
        isOffline = true;
        setTimeout(() => isOffline = false, offlineTimeout);
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
            notifyOffline();
            await log.logError('HTTP', res.statusText + ' for ' + url.blue);
        } else {
            let duration = log.toMilliseconds(process.hrtime(start));
            let col = evaluateDuration(duration);
            await log.logEvent(col('duration of request ') + url.blue + col(' ### ' + duration + ' ms'));
        }
    }
    catch (ex) {
        notifyOffline();
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