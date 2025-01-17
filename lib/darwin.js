// Generated by CoffeeScript 1.12.4
(function() {
  var AirPortBinary, connectionStateMap, parsePatterns, powerStateMap;

  AirPortBinary = "/System/Library/PrivateFrameworks/Apple80211.framework/Versions/Current/Resources/airport";

  parsePatterns = {
    airport_line: new RegExp(/(.+): (.+)/)
  };

  connectionStateMap = {
    init: "disconnected",
    running: "connected"
  };

  powerStateMap = {
    On: true,
    Off: false
  };

  module.exports = {
    autoFindInterface: function() {
      var _iface, _interface, _msg, findInterfaceCom;
      this.WiFiLog("Host machine is MacOS.");
      findInterfaceCom = "networksetup -listallhardwareports | awk '/^Hardware Port: (Wi-Fi|AirPort)$/{getline;print $2}'";
      this.WiFiLog("Executing: " + findInterfaceCom);
      _interface = this.execSync(findInterfaceCom);
      if (_interface) {
        _iface = _interface.trim();
        _msg = "Automatically located wireless interface " + _iface + ".";
        this.WiFiLog(_msg);
        return {
          success: true,
          msg: _msg,
          "interface": _iface
        };
      } else {
        _msg = "Error: No network interface found.";
        this.WiFiLog(_msg, true);
        return {
          success: false,
          msg: _msg,
          "interface": null
        };
      }
    },
    getIfaceState: function() {
      var KEY, VALUE, connectionData, error, i, interfaceState, k, len, ln, parsedLine, powerData, ref;
      interfaceState = {};
      connectionData = this.execSync(AirPortBinary + " -I");
      ref = connectionData.split('\n');
      for (k = i = 0, len = ref.length; i < len; k = ++i) {
        ln = ref[k];
        try {
          parsedLine = parsePatterns.airport_line.exec(ln.trim());
          KEY = parsedLine[1];
          VALUE = parsedLine[2];
        } catch (error1) {
          error = error1;
          continue;
        }
        switch (KEY) {
          case "state":
            interfaceState.connection = connectionStateMap[VALUE];
            break;
          case "SSID":
            interfaceState.ssid = VALUE;
        }
        if (KEY === "SSID") {
          break;
        }
      }
      powerData = this.execSync("networksetup -getairportpower " + this.WiFiControlSettings.iface);
      try {
        parsedLine = parsePatterns.airport_line.exec(powerData.trim());
        KEY = parsedLine[1];
        VALUE = parsedLine[2];
      } catch (error1) {
        error = error1;
        return {
          success: false,
          msg: "Unable to retrieve state of network interface " + this.WiFiControlSettings.iface + "."
        };
      }
      interfaceState.power = powerStateMap[VALUE];
      return interfaceState;
    },
    connectToAP: function(_ap) {
      var COMMANDS, _msg, com, connectToAPChain, error, i, len, stdout;
      COMMANDS = {
        connect: "networksetup -setairportnetwork " + this.WiFiControlSettings.iface + " \"" + _ap.ssid + "\""
      };
      if (_ap.password.length) {
        COMMANDS.connect += " \"" + _ap.password + "\"";
      }
      connectToAPChain = ["connect"];
      for (i = 0, len = connectToAPChain.length; i < len; i++) {
        com = connectToAPChain[i];
        this.WiFiLog("Executing:\t" + COMMANDS[com]);
        try {
          stdout = this.execSync(COMMANDS[com]);
        } catch (error1) {
          error = error1;
        }
        if (stdout === ("Could not find network " + _ap.ssid + ".")) {
          _msg = "Error: No network called " + _ap.ssid + " could be found.";
          this.WiFiLog(_msg, true);
          return {
            success: false,
            msg: _msg
          };
        }
        this.WiFiLog("Success!");
      }
    },
    resetWiFi: function() {
      var COMMANDS, _msg, com, i, len, resetWiFiChain, results, stdout;
      COMMANDS = {
        enableAirport: "networksetup -setairportpower " + this.WiFiControlSettings.iface + " on",
        disableAirport: "networksetup -setairportpower " + this.WiFiControlSettings.iface + " off"
      };
      resetWiFiChain = ["disableAirport", "enableAirport"];
      results = [];
      for (i = 0, len = resetWiFiChain.length; i < len; i++) {
        com = resetWiFiChain[i];
        this.WiFiLog("Executing:\t" + COMMANDS[com]);
        stdout = this.execSync(COMMANDS[com]);
        _msg = "Success!";
        results.push(this.WiFiLog(_msg));
      }
      return results;
    },
    removeWiFiProfile: function(_ap) {
      var COMMANDS, _msg, com, j, len, resetWiFiChain, results, stdout;
      COMMANDS = {
        delete: "networksetup -removepreferredwirelessnetwork " + this.WiFiControlSettings.iface + " " + _ap
      };
      resetWiFiChain = ["delete"];
      results = [];
      for (j = 0, len = resetWiFiChain.length; j < len; j++) {
        com = resetWiFiChain[j];
        this.WiFiLog("Executing:\t" + COMMANDS[com]);
        stdout = this.execSync(COMMANDS[com]);
        _msg = "Success!";
        results.push(this.WiFiLog(_msg));
      }
      return results;
    }
  };

}).call(this);
