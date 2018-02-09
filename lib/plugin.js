/**
 * plugin.js
 */
const util = require("util");
const qr = require("querystring");


module.exports = {
  params: {
    period: 10
  },

  setParams (obj) {
    if (typeof obj == "object") {
      Object.keys(obj).forEach(param => {
        if (this.params[param] != undefined) this.params[param] = obj[param];
      });
    }
  },

  config: [],
  setConfig (arr) {
    if (arr && util.isArray(arr)) {
     this.config = arr;
    }  
  }
}
  