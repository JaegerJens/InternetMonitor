const fetch = require('node-fetch');
const fs = require('fs');
const os = require('os');

const configFile = 'monitor.config.json';
const milli = 1000;
const nano = milli * milli * milli;

var outputStream = undefined;

readConfig()
    .then((config) => {
        outputStream = createOutputStream(config.output);
        setInterval(run, config.interval, config);
    });

function run(config) {
    for(let endpoint of config.requests) {
        timeRequest(endpoint);
    }
}

function timeRequest(url) {
    logEvent('start request ' + url);
    let start = process.hrtime();
    fetch(url)
    .then(res => {
        if (!res.ok) {
            logEvent('HTTP ERROR: ' + res.statusText + ' for ' + url);
        } else {
            let duration = toMilliseconds(process.hrtime(start));
            logEvent('duration of request ' + url +' ### ' + duration + ' ms');
        }
    })
    .catch(ex => {
        logEvent('FETCH ERROR: ' + ex);
    });
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