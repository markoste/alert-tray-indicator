const {Tray, Menu} = require('electron')
const http = require('http');
const path = require('path')

let appTrayIcon 
let contextMenu

const defConMap = {
    critical: 2,
    warning: 1,
    no_alert: 0,
}



module.exports.init = function(config) {
    appTrayIcon = new Tray(colorToImagePath('init'));

    contextMenu = Menu.buildFromTemplate([
        { label: 'Item1', type: 'radio' },
        { label: 'Item2', type: 'radio' },
        { label: 'Item3', type: 'radio', checked: true },
        { label: 'Item4', type: 'radio' }
      ])
      appTrayIcon.setToolTip('Tray Alarm.')
      appTrayIcon.setContextMenu(contextMenu)

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
                    drawTrayStatusIcon(data)
                });
                }).on("error", (err) => {
                    drawTrayErrorIcon(err);
                })
        });        
    }, 5e3)
}

function drawTrayStatusIcon(data) {
    try {
        let trayIconColor = parseTrayIconStatus(JSON.parse(data))
        let contextMenuElements = parseContextMenu(JSON.parse(data))    
        updateTrayIcon(trayIconColor);
        updateContextMenu(contextMenuElements);
    } catch (error) {
        drawTrayErrorIcon(error);
    }
}

function drawTrayErrorIcon(err) {
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

function parseContextMenu(responseObject) {
    let menu = [];
    responseObject.data.forEach(element => {
        let label = element.labels.alertname
        menu.push(label);
    })
    console.log("context menu items: " + menu)
    return menu
}

function updateTrayIcon(color) {
  appTrayIcon.setImage(colorToImagePath(color));
}

function colorToImagePath(color) {
    return path.join(__dirname, '../..', 'signal_' + color + '.png');
}

function updateContextMenu(contextMenuElements) {
    //we receive an array of Context Menue elements (warnings)
    // now let's build the corresponding menu entries with labels and stuff
    console.log("wtf: " + contextMenuElements)
    contextMenuArray = []
    contextMenuElements.forEach(element => {
        console.log(element)
        contextMenuArray.push({label: element, type: 'radio'})
    })
    console.log(contextMenuArray)
   
    contextMenu = Menu.buildFromTemplate(contextMenuArray)
    // has to be updated each time to work properly on linux
    appTrayIcon.setContextMenu(contextMenu)
}