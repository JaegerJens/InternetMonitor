const fetch = require('node-fetch');
const fs = require('fs');
const os = require('os');

const milli = 1000;
const nano = milli * milli * milli;

const config = {
    requests: [
        'http://192.168.178.1/css/rd/images/fritzLogo.svg',
        'https://www.heise.de/avw-bin/ivw/CP/marston/'
    ],
    interval: 3 * milli, // milliseconds
    output: './log/status.log'
};

const outputStream = createOutputStream(config.output);
setInterval(run, config.interval);


function run() {
    for(let endpoint of config.requests) {
        timeRequest(endpoint);
    }
}

function timeRequest(url) {
    logEvent('start request ' + url);
    let start = process.hrtime();
    fetch(url).then(res => {
        if (!res.ok) {
            logEvent('HTTP ERROR: ' + res.statusText + ' for ' + url);
        }
        let duration = toMilliseconds(process.hrtime(start));
        logEvent('duration of request ' + url +' ### ' + duration + ' ms');
    })
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
    let text = timestamp() + event;
    console.log(text);
    const eol = os.EOL;
    return new Promise((resolve, reject) => {
        outputStream.write(text + eol, null, err => {
            if (err) {
                reject(err);
            }
            resolve();
        });
    });
}

function createOutputStream(filename) {
    return fs.createWriteStream(filename, {encoding: 'utf8', flags: 'a'});
}