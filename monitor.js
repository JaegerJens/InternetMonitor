const fetch = require('node-fetch');

const config = {
    requests: [
        'http://192.168.178.1/css/rd/images/fritzLogo.svg',
        'https://i-ssl.ligatus.com/blank.gif'
    ],
    interval: 10000
};

for(let endpoint of config.requests) {
    timeRequest(endpoint);
}

function timeRequest(url) {
    console.log(timestamp() + 'start request ' + url);
    let start = process.hrtime();
    fetch(url).then(res => {
        let duration = process.hrtime(start);
        console.log(timestamp() + 'duration of request ' + url +' ### ' + duration);
    })
}

function timestamp() {
    let now = new Date();
    return '[' + now.toISOString() + '] ';
}
