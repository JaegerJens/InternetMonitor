const notifier = require('node-notifier');
const colors = require('colors');
const fs = require('fs');
const os = require('os');
const util = require('util');

/** @type {WriteStream} */
let outputStream = undefined;

/** @type {boolean} */
let isOffline = false;

/** @type {Number} */
const milli = 1000;
const nano = milli * milli * milli;

function openLogFile(filename) {
    outputStream = createOutputStream(filename);
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

exports.openLogFile = openLogFile;
exports.toMilliseconds = toMilliseconds;
exports.logError = logError;
exports.logEvent =logEvent;
