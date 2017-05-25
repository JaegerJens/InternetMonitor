"use strict";
const fetch = require('node-fetch');
const colors = require('colors');
const fs = require('fs');
const os = require('os');

const configFile = 'monitor.config.json';
const milli = 1000;
const nano = milli * milli * milli;

var outputStream = undefined;


async function main() {
    const config = await readConfig();
    outputStream = createOutputStream(config.output);
    setInterval(run, config.interval, config);
}
main();

function run(config) {
    for(let endpoint of config.requests) {
        timeRequest(endpoint);
    }
}

function timeRequest(url) {
    logEvent('start request '.grey + url.blue);
    let start = process.hrtime();
    fetch(url)
    .then(res => {
        if (!res.ok) {
            logEvent(colors.red('HTTP ERROR: ' + res.statusText + ' for ') + url.blue);
        } else {
            let duration = toMilliseconds(process.hrtime(start));
            var col = evaluateDuration(duration);
            logEvent(col('duration of request ') + url.blue + col(' ### ' + duration + ' ms'));
        }
    })
    .catch(ex => {
        logEvent('FETCH ERROR: '.red + ex.red);
    });
}

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

function timestamp() {
    let now = new Date();
    return '[' + now.toISOString() + '] ';
}

function toMilliseconds(hrtime) {
    let ms = hrtime[0] * milli + hrtime[1] * milli / nano; // duration in milliseconds
    return ms;
}

function logEvent(event) {
    let text = colors.magenta(timestamp()) + event;
    console.log(text);
    const eol = os.EOL;
    let cleanText = colors.stripColors(text);
    return new Promise((resolve, reject) => {
        outputStream.write(cleanText + eol, null, err => {
            if (err) {
                reject(err);
            }
            resolve();
        });
    });
}

function createOutputStream(filename) {
    const logFile = replaceDate(filename);
    console.log(`Logfile output: ${logFile}`.grey);
    return fs.createWriteStream(logFile, {encoding: 'utf8', flags: 'a'});
}

function replaceDate(filename) {
    const variable = "{date}";
    let now = getNowDate();
    return filename.replace(variable, now);
}

function getNowDate() {
    var now = new Date();
    var iso = now.toISOString().slice(0,10).replace(/-/g,'');
    return iso;
}

function readConfig() {
    return new Promise((resolve, reject) => {
        fs.readFile(configFile, 'utf8', (err, data) => {
            if (err) {
                reject(err);
            }
            let config = JSON.parse(data);
            resolve(config);
        })
    });
}