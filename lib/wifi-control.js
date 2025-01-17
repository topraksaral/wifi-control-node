// Generated by CoffeeScript 1.12.4
(function() {
  var CXT, WiFiScanner, execSyncToBuffer, os_instructions;

  WiFiScanner = require('node-wifiscanner2');

  execSyncToBuffer = require('sync-exec');

  CXT = {
    WiFiControlSettings: {
      iface: null,
      debug: false,
      connectionTimeout: 5000
    },
    execSync: function(command, options) {
      var results;
      if (options == null) {
        options = {};
      }
      results = execSyncToBuffer(command, options);
      if (!results.status) {
        return results.stdout;
      }
      throw {
        stderr: results.stderr
      };
    },
    WiFiLog: function(msg, error) {
      if (error == null) {
        error = false;
      }
      if (error) {
        return console.error("WiFiControl: " + msg);
      } else {
        if (this.WiFiControlSettings.debug) {
          return console.log("WiFiControl: " + msg);
        }
      }
    }
  };

  switch (process.platform) {
    case "linux":
      os_instructions = require('./linux.js');
      break;
    case "win32":
      os_instructions = require('./win32.js');
      break;
    case "darwin":
      os_instructions = require('./darwin.js');
      break;
    default:
      CXT.WiFiLog("Unrecognized operating system.", true);
      process.exit();
  }

  module.exports = {
    init: function(settings) {
      if (settings == null) {
        settings = {};
      }
      this.configure(settings);
      if (settings.iface == null) {
        return this.findInterface(settings.iface);
      }
    },
    configure: function(settings) {
      if (settings == null) {
        settings = {};
      }
      if (settings.debug != null) {
        CXT.WiFiControlSettings.debug = settings.debug;
        CXT.WiFiLog("Debug mode set to: " + settings.debug);
      }
      if (settings.connectionTimeout != null) {
        settings.connectionTimeout = parseInt(settings.connectionTimeout);
        CXT.WiFiControlSettings.connectionTimeout = settings.connectionTimeout;
        CXT.WiFiLog("AP connection attempt timeout set to: " + settings.connectionTimeout + "ms");
      }
      if (settings.iface != null) {
        return this.findInterface(settings.iface);
      }
    },
    findInterface: function(iface) {
      var _msg, error, interfaceResults;
      if (iface == null) {
        iface = null;
      }
      try {
        if (iface != null) {
          _msg = "Wireless interface manually set to " + iface + ".";
          CXT.WiFiLog(_msg);
          CXT.WiFiControlSettings.iface = iface;
          return {
            success: true,
            msg: _msg,
            "interface": iface
          };
        }
        CXT.WiFiLog("Determining system wireless interface...");
        interfaceResults = os_instructions.autoFindInterface.call(CXT);
        CXT.WiFiControlSettings.iface = interfaceResults["interface"];
        return interfaceResults;
      } catch (error1) {
        error = error1;
        _msg = "Encountered an error while searching for wireless interface: " + error;
        CXT.WiFiLog(_msg, true);
        return {
          success: false,
          msg: _msg
        };
      }
    },
    scanForWiFi: function(cb) {
      var _msg, error, networks;
      if (CXT.WiFiControlSettings.iface == null) {
        _msg = "You cannot scan for nearby WiFi networks without a valid wireless interface.";
        CXT.WiFiLog(_msg, true);
        return {
          success: false,
          msg: _msg
        };
      }
      try {
        CXT.WiFiLog("Scanning for nearby WiFi Access Points...");
        if (process.platform === "linux") {
          networks = os_instructions.scanForWiFi.apply(CXT);
          _msg = "Nearby WiFi APs successfully scanned (" + networks.length + " found).";
          CXT.WiFiLog(_msg);
          return cb(null, {
            success: true,
            msg: _msg,
            networks: networks
          });
        } else {
          return WiFiScanner.scan(function(err, networks) {
            if (err) {
              _msg = "We encountered an error while scanning for WiFi APs: " + error;
              CXT.WiFiLog(_msg, true);
              return cb(err, {
                success: false,
                msg: _msg
              });
            } else {
              _msg = "Nearby WiFi APs successfully scanned (" + networks.length + " found).";
              CXT.WiFiLog(_msg);
              return cb(null, {
                success: true,
                networks: networks,
                msg: _msg
              });
            }
          });
        }
      } catch (error1) {
        error = error1;
        _msg = "We encountered an error while scanning for WiFi APs: " + error;
        CXT.WiFiLog(_msg, true);
        return cb(error, {
          success: false,
          msg: _msg
        });
      }
    },
    connectToAP: function(_ap, cb) {
      var _msg, check_iface, error, request_msg, t0;
      if (CXT.WiFiControlSettings.iface == null) {
        _msg = "You cannot connect to a WiFi network without a valid wireless interface.";
        CXT.WiFiLog(_msg, true);
        return {
          success: false,
          msg: _msg
        };
      }
      try {
        if (!_ap.ssid.length) {
          return {
            success: false,
            msg: "Please provide a non-empty SSID."
          };
        }
        if (_ap.password == null) {
          _ap.password = "";
        }
        os_instructions.connectToAP.call(CXT, _ap);
        request_msg = "WiFi connection request to \"" + _ap.ssid + "\" has been processed.";
        CXT.WiFiLog(request_msg);
        t0 = new Date();
        check_iface = (function(_this) {
          return function(_ap, cb) {
            var connect_to_ap_result, ifaceState;
            ifaceState = _this.getIfaceState();
            if (ifaceState.success && ((ifaceState.connection === "connected") || (ifaceState.connection === "disconnected"))) {
              if (ifaceState.ssid === _ap.ssid) {
                _msg = "Successfully connected to \"" + _ap.ssid + "\"";
                CXT.WiFiLog(_msg);
                cb(null, {
                  success: true,
                  msg: _msg
                });
              } else if (ifaceState.ssid == null) {
                _msg = "Error: Interface is not currently connected to any wireless AP.";
                CXT.WiFiLog(_msg, true);
                cb(_msg, {
                  success: false,
                  msg: "Error: Could not connect to " + _ap.ssid
                });
              } else {
                _msg = "Error: Interface is currently connected to \"" + ifaceState.ssid + "\"";
                CXT.WiFiLog(_msg, true);
                connect_to_ap_result = {
                  success: false,
                  msg: _msg
                };
                cb(_msg, {
                  success: false,
                  msg: "Error: Could not connect to " + _ap.ssid
                });
              }
              return;
            }
            if ((new Date() - t0) < CXT.WiFiControlSettings.connectionTimeout) {
              return setTimeout(function() {
                return check_iface(_ap, cb);
              }, 250);
            } else {
              return cb("Connection confirmation timed out. (" + CXT.WiFiControlSettings.connectionTimeout + "ms)", {
                success: false,
                msg: "Error: Could not connect to " + _ap.ssid
              });
            }
          };
        })(this);
        return check_iface(_ap, cb);
      } catch (error1) {
        error = error1;
        _msg = "Encountered an error while connecting to \"" + _ap.ssid + "\": " + error;
        CXT.WiFiLog(_msg, true);
        return cb(error, {
          success: false,
          msg: _msg
        });
      }
    },
    resetWiFi: function(cb) {
      var _msg, check_iface, error, t0;
      try {
        os_instructions.resetWiFi.call(CXT);
        CXT.WiFiLog("Waiting for interface to finish resetting...");
        t0 = new Date();
        check_iface = (function(_this) {
          return function(cb) {
            var _msg, ifaceState;
            ifaceState = _this.getIfaceState();
            if (ifaceState.success && ((ifaceState.connection === "connected") || (ifaceState.connection === "disconnected"))) {
              _msg = "Success!  Wireless interface is now reset.";
              cb(null, {
                success: true,
                msg: _msg
              });
              return;
            }
            if ((new Date() - t0) < CXT.WiFiControlSettings.connectionTimeout) {
              return setTimeout(function() {
                return check_iface(cb);
              }, 250);
            } else {
              return cb("Reset confirmation timed out. (" + CXT.WiFiControlSettings.connectionTimeout + "ms)", {
                success: false,
                msg: "Error: Could not completely reset WiFi."
              });
            }
          };
        })(this);
        return check_iface(cb);
      } catch (error1) {
        error = error1;
        _msg = "Encountered an error while resetting wireless interface: " + error;
        CXT.WiFiLog(_msg, true);
        return cb(error, {
          success: false,
          msg: _msg
        });
      }
    },
    removeWiFiProfile: function(cb) {
      var _msg, check_iface, error, t0;
      try {
        os_instructions.removeWiFiProfile.call(CXT, cb);
        CXT.WiFiLog("Waiting for interface to finish resetting...");
        t0 = new Date();

        return true;

        check_iface = (function(_this) {
          return function(cb) {
            var _msg, ifaceState;
            ifaceState = _this.getIfaceState();
            if (ifaceState.success && ((ifaceState.connection === "connected") || (ifaceState.connection === "disconnected"))) {
              _msg = "Success!  Wireless interface is now reset.";
              cb(null, {
                success: true,
                msg: _msg
              });
              return;
            }
            if ((new Date() - t0) < CXT.WiFiControlSettings.connectionTimeout) {
              return setTimeout(function() {
                return check_iface(cb);
              }, 250);
            } else {
              return cb("Reset confirmation timed out. (" + CXT.WiFiControlSettings.connectionTimeout + "ms)", {
                success: false,
                msg: "Error: Could not completely reset WiFi."
              });
            }
          };
        })(this);
        return check_iface(cb);
      } catch (error1) {
        return false;
        
        error = error1;
        _msg = "Encountered an error while resetting wireless interface: " + error;
        CXT.WiFiLog(_msg, true);
        return cb(error, {
          success: false,
          msg: _msg
        });
      }
    },
    getIfaceState: function() {
      var _msg, error, interfaceState;
      try {
        interfaceState = os_instructions.getIfaceState.call(CXT);
        if (interfaceState.success !== false) {
          interfaceState.success = true;
          interfaceState.msg = "Successfully acquired state of network interface " + CXT.WiFiControlSettings.iface + ".";
        }
        return interfaceState;
      } catch (error1) {
        error = error1;
        _msg = "Encountered an error while acquiring network interface connection state: " + error;
        CXT.WiFiLog(_msg, true);
        return {
          success: false,
          msg: _msg
        };
      }
    }
  };

}).call(this);
