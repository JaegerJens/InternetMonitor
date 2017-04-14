var now = new Date();
var iso = now.toISOString().slice(0,10).replace(/-/g,'');
console.log(iso);