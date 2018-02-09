/**
 * Функции - адаптеры для rpi
 */
const util = require('util');
const fs = require('fs');

const w1folder = '/sys/bus/w1/devices/';  // Raspberry Pi has this folder for 1-wire devices
// Можно засунуть в манифест?


module.exports = {
  // Передать в командной строке имя вирт папки 
  getArgs: function (unit, houser) {
   // Проверить что папка существует
   // Если папки нет - сразу выходим
	if ( !fs.existsSync(w1folder) ) {
        console.log('ADAPTER: Not found '+w1folder+'. 1-wire driver is not installed!');
        throw {message:'Not found '+w1folder+'. 1-wire driver is not installed!'};
    }   

    return [w1folder];
  }
};

