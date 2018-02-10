/**
 * rasp1w.js
 * Имя плагина - rasp1w, манифест - rasp1w.json
 */

const util = require("util");
const fs = require('fs');

const logger = require("./lib/logger");
const plugin = require("./lib/plugin");

const w1folder = process.argv[2];

let step = 0;

// На старте считать конфигурацию подключенную 
let devList = getDevList();

// От сервера конфигурацию не получаем. Получаем параметры и запускаем цикл опроса 
next();

function next() {
  switch (step) {
    case 0:
      // Запрос на получение параметров - период опроса
      getTable("params");
      step = 1;
      break;

    case 1:
      // Передать каналы на сервер
      sendChannels();

      // Запуск Основного цикла опроса
      pollDevices();
      setInterval(pollDevices, plugin.params.period*1000); // Период задан в сек
      step = 2;
      break;
    default:
  }
}

function getTable(name) {
  process.send({ type: "get", tablename: name  });
}

function sendChannels() {
    process.send({type:'channels', data:devList.map(id => ({id:'temp_'+id, desc:'TEMP'}))});
}

/**
 **/
function pollDevices() {
	var filename, value ;
	
		for (var i=0; i<devList.length; i++) {
			filename = w1folder+'/'+devList[i]+'/'+'w1_slave';
		
			if ( isDS18B20Sensor( devList[i] )) {
				val = null;
				try {
					if (fs.existsSync(filename)) 	{
						// Открыть файл, читать значение
						value = readTemp(fs.readFileSync(filename));
					}
				} catch (e) {
					logger.log('ERR: '+e.message);
				}
				process.send({type:'data', data:[{id: 'temp_'+devList[i], value}]});
			}	
		}
	}	
 	
 
	function readTemp(data) {	
	var j, result;

		data = data.toString();
		if (data.indexOf('YES') > 0) {
			j = data.indexOf('t=')
			if (j>0) {
				result = parseInt(data.substr(j+2));
			}	
		} 
		return (isNumeric(result) ? result : null);
	}
 
	
	function isDS18B20Sensor( name ) {
		return ( name && (name.substr(0,2) == '28'));
    }
    
    function isNumeric(n) {
        return ((n != undefined) && !isNaN(parseFloat(n)) && isFinite(n));
    }

/** Получить список папок - для каждого датчика своя папка **/
function getDevList() {
  let arr = [];  
  let stats;

  try {
    let filelist = fs.readdirSync(w1folder);
    if (!util.isArray(filelist)) {
      throw { message: ""};
    }

    for (var i = 0; i < filelist.length; i++) {
      if (!isDS18B20Sensor( filelist[i]))  continue;

      stats = fs.statSync(w1folder + "/" + filelist[i]);
      if (stats.isDirectory()) {
        arr.push(filelist[i]);
      }
    }
    return arr;

  } catch (e) {
    logger.log("Error reading folder " + w1folder+ ". " + e.message);
    process.exit();
  }
  
}

/******************************** Входящие от IH ****************************************************/
process.on("message", function(message) {
  if (!message) return;
  if (typeof message == "string") {
    if (message == "SIGTERM") process.exit(0);
  }

  if (typeof message == "object") {
    try {
      if (message.type) parseMessageFromServer(message);
    } catch (e) {
      logger.log(e.message);
    }
  }
});

function parseMessageFromServer(message) {
  switch (message.type) {
    case "get":
      if (message.params) {
        plugin.setParams(message.params);
        if (message.params.debug) logger.setDebug(message.params.debug);
      }
      if (message.config) plugin.setConfig(message.config);
      next();
      break;

    case "debug":
      if (message.mode) logger.setDebug(message.mode);
      break;

    default:
  }
}

process.on("uncaughtException", function(err) {
  var text = "ERR (uncaughtException): " + util.inspect(err);
  logger.log(text);
});

process.on("disconnect", function() {
  process.exit();
});
