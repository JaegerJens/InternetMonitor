const fetch = require('node-fetch');
const colors = require('colors');
const notifier = require('node-notifier');
const fs = require('fs');
const os = require('os');
const util = require('util');

const readFileAsync = util.promisify(fs.readFile);

const configFile = 'monitor.config.json';
/** @type {Number} */
const milli = 1000;
const nano = milli * milli * milli;

/** @type {WriteStream} */
let outputStream = undefined;

/** @type {boolean} */
let isOffline = false;

async function main() {
    const config = await readConfig();
    outputStream = createOutputStream(config.output);
    setInterval(run, config.interval, config);
}
main();

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
    await logEvent('start request '.grey + url.blue);
    let start = process.hrtime();
    try {
        const res = await fetch(url);
        if (!res.ok) {
            await logError('HTTP', res.statusText + ' for ' + url.blue);
        } else {
            let duration = toMilliseconds(process.hrtime(start));
            let col = evaluateDuration(duration);
            await logEvent(col('duration of request ') + url.blue + col(' ### ' + duration + ' ms'));
        }
    }
    catch (ex) {
        await logError('FETCH', ex);
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
 * @returns {string}
 */
function timestamp() {
    let now = new Date();
    return '[' + now.toISOString() + '] ';
}

/**
 * @param {Number} hrtime
 * @returns {Number}
 */
function toMilliseconds(hrtime) {
    let ms = hrtime[0] * milli + hrtime[1] * milli / nano; // duration in milliseconds
    return ms;
}

async function logError(category, errormessage) {
    if (!isOffline) {
        notifier.notify('Internet is Offline!');
        isOffline = true;
    }
    await logEvent(`${category} ERROR: ${errormessage}`.red);
}

/**
 * @param {string} event
 * @returns {Promise}
 */
function logEvent(event) {
    let text = colors.magenta(timestamp()) + event;
    console.log(text);
    const eol = os.EOL;
    let cleanText = colors.stripColors(text);
    return outputStream.WriteAsync(cleanText + eol, null);
}

/**
 * @param {string} filename
 * @returns {WriteStream}
 */
function createOutputStream(filename) {
    const logFile = replaceDate(filename);
    console.log(`Logfile output: ${logFile}`.grey);
    let output = fs.createWriteStream(logFile, {encoding: 'utf8', flags: 'a'});
    output.WriteAsync = util.promisify(output.write);
    return output;
}

/**
 * @param {string} filename
 * @returns {string}
 */
function replaceDate(filename) {
    const variable = "{date}";
    let now = getNowDate();
    return filename.replace(variable, now);
}

/**
 * @returns {string}
 */
function getNowDate() {
    let now = new Date();
    let iso = now.toISOString().slice(0,10).replace(/-/g,'');
    return iso;
}

/**
 * @returns {Promise<Object>}
 */
async function readConfig() {
    const data = await readFileAsync(configFile, 'utf8');
    return JSON.parse(data);
}