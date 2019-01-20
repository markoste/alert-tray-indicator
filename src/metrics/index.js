const {Tray} = require('electron')
const http = require('http');
const path = require('path')

let appTrayIcon 

const defConMap = {
    critical: 2,
    warning: 1,
    no_alert: 0,
} 

module.exports.init = function(config) {
    appTrayIcon = new Tray(colorToImagePath('init'));
    console.log("Hello from metrics")
    
    setInterval(function() {
        //api call
        config.metric_servers.forEach(element => {
            http.get(element.parameters.address, (resp) => {
                let data = '';
                  // A chunk of data has been recieved.
                resp.on('data', (chunk) => {
                    data += chunk;
                });
                // The whole response has been received. Print out the result.
                resp.on('end', () => {
                    drawTrayIcon(data)
                });
                }).on("error", (err) => {
                    trayError(err);
                })
        });        
    }, 5e3)
}

function drawTrayIcon(data) {
    try {
        let trayIconColor = parseTrayIconStatus(JSON.parse(data))    
        updateTrayIcon(trayIconColor);
    } catch (error) {
        trayError(error);
    }
}

function trayError(err) {
    console.log("Error: " + err.message);
    updateTrayIcon('error');
}

// are we fucked?
function parseTrayIconStatus(responseObject) {
    console.log(responseObject);
    let defCon = 'no_alert';
    responseObject.data.forEach(element => {
        let severity = defConMap[element.labels.severity];
        if (severity > defConMap[defCon]) {
            defCon = element.labels.severity;
        }
    })
    return defCon;
}

function updateTrayIcon(color) {
  // set tray icon to default green
  appTrayIcon.setImage(colorToImagePath(color));
}

function colorToImagePath(color) {
    return path.join(__dirname, '../..', 'signal_' + color + '.png');
}