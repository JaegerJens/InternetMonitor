const fetch = require('node-fetch');

const config = {
    requests: [
        'http://192.168.178.1/css/rd/images/fritzLogo.svg',
        'https://i-ssl.ligatus.com/blank.gif'
    ],
    interval: 10000
};

for(var endpoint of config.requests) {
    console.log('request ' + endpoint);
    var start = process.hrtime();
    fetch(endpoint).then(res => {
        var duration = process.hrtime(start);
        console.log('duration: ' + duration);
    })
}
