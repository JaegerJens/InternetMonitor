const fetch = require('node-fetch');
const milli = 1000;
const nano = milli * milli * milli;
const config = {
    requests: [
        'http://192.168.178.1/css/rd/images/fritzLogo.svg',
        'https://www.heise.de/avw-bin/ivw/CP/marston/'
    ],
    interval: 3 * milli // milliseconds
};

setInterval(run, config.interval);

function run() {
    for(let endpoint of config.requests) {
        timeRequest(endpoint);
    }
}

function timeRequest(url) {
    console.log(timestamp() + 'start request ' + url);
    let start = process.hrtime();
    fetch(url).then(res => {
        let duration = toMilliseconds(process.hrtime(start));
        console.log(timestamp() + 'duration of request ' + url +' ### ' + duration + ' ms');
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
