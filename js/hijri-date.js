(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
module.exports = require('./lib/index.js');

},{"./lib/index.js":6}],2:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.weekDay = weekDay;
function intPart(floatNum) {
  if (floatNum < -0.0000001) {
    return Math.ceil(floatNum - 0.0000001);
  }
  return Math.floor(floatNum + 0.0000001);
}
var delta = 1;

function GregToIsl(arg) {

  var d = parseInt(arg.CDay.value);
  var m = parseInt(arg.CMonth.value);
  var y = parseInt(arg.CYear.value);
  var jd = void 0,
      l = void 0,
      jd1 = void 0,
      n = void 0,
      j = void 0,
      delta = 1;
  if (y > 1582 || y == 1582 && m > 10 || y == 1582 && m == 10 && d > 14) {
    jd = intPart(1461 * (y + 4800 + intPart((m - 14) / 12)) / 4) + intPart(367 * (m - 2 - 12 * intPart((m - 14) / 12)) / 12) - intPart(3 * intPart((y + 4900 + intPart((m - 14) / 12)) / 100) / 4) + d - 32075 + delta;
  } else {
    jd = 367 * y - intPart(7 * (y + 5001 + intPart((m - 9) / 7)) / 4) + intPart(275 * m / 9) + d + 1729777 + delta;
  }

  jd1 = jd - delta;
  l = jd - 1948440 + 10632;
  n = intPart((l - 1) / 10631);
  l = l - 10631 * n + 354;
  j = intPart((10985 - l) / 5316) * intPart(50 * l / 17719) + intPart(l / 5670) * intPart(43 * l / 15238);
  l = l - intPart((30 - j) / 15) * intPart(17719 * j / 50) - intPart(j / 16) * intPart(15238 * j / 43) + 29;
  m = intPart(24 * l / 709);
  d = l - intPart(709 * m / 24);
  y = 30 * n + j - 30;

  return {
    d: d,
    m: m,
    y: y,
    dateOfWeek: jd1 % 7,
    dayName: weekDay(jd1 % 7)
  };
}

function IslToGreg(arg) {

  var d = parseInt(arg.HDay.value);
  var m = parseInt(arg.HMonth.value);
  var y = parseInt(arg.HYear.value);

  var jd = intPart((11 * y + 3) / 30) + 354 * y + 30 * m - intPart((m - 1) / 2) + d + 1948440 - 385 - delta;

  var l = void 0,
      n = void 0,
      i = void 0,
      j = void 0,
      k = void 0;

  if (jd > 2299160) {
    l = jd + 68569;
    n = intPart(4 * l / 146097);
    l = l - intPart((146097 * n + 3) / 4);
    i = intPart(4000 * (l + 1) / 1461001);
    l = l - intPart(1461 * i / 4) + 31;
    j = intPart(80 * l / 2447);
    d = l - intPart(2447 * j / 80);
    l = intPart(j / 11);
    m = j + 2 - 12 * l;
    y = 100 * (n - 49) + i + l;
  } else {
    j = jd + 1402;
    k = intPart((j - 1) / 1461);
    l = j - 1461 * k;
    n = intPart((l - 1) / 365) - intPart(l / 1461);
    i = l - 365 * n + 30;
    j = intPart(80 * i / 2447);
    d = i - intPart(2447 * j / 80);
    i = intPart(j / 11);
    m = j + 2 - 12 * i;
    y = 4 * k + n + i - 4716;
  }

  return {
    d: d,
    m: m,
    y: y,
    dateOfWeek: jd % 7,
    dayName: weekDay(jd % 7)
  };
}

function weekDay(wdn) {
  if (wdn == 0) {
    return "Mon";
  }
  if (wdn == 1) {
    return "Tue";
  }
  if (wdn == 2) {
    return "Wed";
  }
  if (wdn == 3) {
    return "Thu";
  }
  if (wdn == 4) {
    return "Fri";
  }
  if (wdn == 5) {
    return "Sat";
  }
  if (wdn == 6) {
    return "Sun";
  }
  return "";
}

function GregToHijri(gregDate) {
  var hijriDate = GregToIsl({
    CDay: {
      value: gregDate.getDate()
    },
    CYear: {
      value: gregDate.getFullYear()
    },
    CMonth: {
      value: gregDate.getMonth() + 1
    }
  });

  return {
    year: hijriDate.y,
    month: hijriDate.m,
    date: hijriDate.d,
    hours: gregDate.getHours(),
    minutes: gregDate.getMinutes(),
    seconds: gregDate.getSeconds(),
    milliseconds: gregDate.getMilliseconds(),
    day: hijriDate.dateOfWeek,
    dayName: hijriDate.dayName
  };
};

function HijriToGreg(hijriDate) {
  var gregDate = IslToGreg({
    HDay: {
      value: hijriDate._date || hijriDate.date
    },
    HYear: {
      value: hijriDate._year || hijriDate.year
    },
    HMonth: {
      value: hijriDate._month || hijriDate.month
    }
  });

  return new Date(gregDate.y, gregDate.m - 1, gregDate.d, hijriDate.getHours(), hijriDate.getMinutes(), hijriDate.getSeconds(), hijriDate.getMilliseconds());
};

exports.GregToHijri = GregToHijri;
exports.HijriToGreg = HijriToGreg;
},{}],3:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
var dateFormat = function () {
  var token = /d{1,4}|m{1,4}|yy(?:yy)?|([HhMsTt])\1?|[LloSZ]|"[^"]*"|'[^']*'/g,
      timezone = /\b(?:[PMCEA][SDP]T|(?:Pacific|Mountain|Central|Eastern|Atlantic) (?:Standard|Daylight|Prevailing) Time|(?:GMT|UTC)(?:[-+]\d{4})?)\b/g,
      timezoneClip = /[^-+\dA-Z]/g,
      pad = function pad(val, len) {
    val = String(val);
    len = len || 2;
    while (val.length < len) {
      val = "0" + val;
    }return val;
  };

  return function (date, mask) {
    var options = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : {
      utc: false
    };

    var _require$default = require('./HijriDate').default,
        locales = _require$default.locales,
        defaultLocale = _require$default.defaultLocale;

    options.locale = options.locale || defaultLocale;
    if (!locales[options.locale]) {
      throw new Error("Locale " + options.locale + " is not supported yet .\n          Please, try to extend \"HijriDate.locales\" :\n             i.e: HijriDate.locales." + options.locale + " = {dayNames:[..14 items..], monthNames:[..24 items..]}\n        ");
      return;
    }

    if (arguments.length == 1 && Object.prototype.toString.call(date) == "[object String]" && !/\d/.test(date)) {
      mask = date;
      date = undefined;
    }

    mask = String(masks[mask] || mask || masks["default"]);

    if (mask.slice(0, 4) == "UTC:") {
      mask = mask.slice(4);
      options.utc = true;
    }

    var _ = options.utc ? "getUTC" : "get",
        d = date[_ + "Date"](),
        D = date[_ + "Day"](),
        m = date[_ + "Month"](),
        mIndex = date[_ + "MonthIndex"](),
        y = date[_ + "FullYear"](),
        H = date[_ + "Hours"](),
        M = date[_ + "Minutes"](),
        s = date[_ + "Seconds"](),
        L = date[_ + "Milliseconds"](),
        o = options.utc ? 0 : date.getTimezoneOffset(),
        flags = {
      d: d,
      dd: pad(d),
      ddd: locales[options.locale].dayNames[D === 7 ? 0 : D + 1],
      dddd: locales[options.locale].dayNames[(D === 7 ? 0 : D + 1) + 7],
      m: m,
      mm: pad(m),
      mmm: locales[options.locale].monthNames[mIndex],
      mmmm: locales[options.locale].monthNames[mIndex + 12],
      yy: String(y).slice(2),
      yyyy: y,
      h: H % 12 || 12,
      hh: pad(H % 12 || 12),
      H: H,
      HH: pad(H),
      M: M,
      MM: pad(M),
      s: s,
      ss: pad(s),
      l: pad(L, 3),
      L: pad(L > 99 ? Math.round(L / 10) : L),
      t: H < 12 ? "a" : "p",
      tt: H < 12 ? "am" : "pm",
      T: H < 12 ? "A" : "P",
      TT: H < 12 ? "AM" : "PM",

      o: (o > 0 ? "-" : "+") + pad(Math.floor(Math.abs(o) / 60) * 100 + Math.abs(o) % 60, 4),
      S: ["th", "st", "nd", "rd"][d % 10 > 3 ? 0 : (d % 100 - d % 10 != 10) * d % 10]
    };

    return mask.replace(token, function ($0) {
      return $0 in flags ? flags[$0] : $0.slice(1, $0.length - 1);
    });
  };
}();

var masks = exports.masks = {
  "default": "ddd mmm dd yyyy HH:MM:ss",
  shortDate: "m/d/yy",
  mediumDate: "mmm d, yyyy",
  longDate: "mmmm d, yyyy",
  fullDate: "dddd, mmmm d, yyyy",
  shortTime: "h:MM TT",
  mediumTime: "h:MM:ss TT",
  longTime: "h:MM:ss TT Z",
  isoDate: "yyyy-mm-dd",
  isoTime: "HH:MM:ss",
  isoDateTime: "yyyy-mm-dd'T'HH:MM:ss",
  isoUtcDateTime: "UTC:yyyy-mm-dd'T'HH:MM:ss'Z'"
};

exports.default = dateFormat;
},{"./HijriDate":4}],4:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.dateProps = undefined;

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _DateConverter = require('./DateConverter');

var _initializer = require('./initializer');

var _initializer2 = _interopRequireDefault(_initializer);

var _FormatDate = require('./FormatDate');

var _FormatDate2 = _interopRequireDefault(_FormatDate);

var _locales = require('./locales');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var HijriDate = function () {
  function HijriDate() {
    _classCallCheck(this, HijriDate);

    return this.init.apply(this, arguments);
  }

  _createClass(HijriDate, [{
    key: 'init',
    value: function init() {
      var _this = this;

      var props = {};
      if (!arguments.length) {
        props = _initializer2.default.initDefault();
      } else {
        try {
          var methodNameSuffix = Array.from(arguments).map(function (arg) {
            return typeof arg === 'undefined' ? 'undefined' : _typeof(arg);
          }).join('_');
          props = _initializer2.default['init_' + methodNameSuffix].apply(_initializer2.default, arguments);
        } catch (e) {
          throw new TypeError(hijriTypeErrorMessage + '\n--- Details:\n' + e);
        }
      }

      Object.keys(props).forEach(function (prop) {
        _this['_' + prop] = props[prop];
      });
      this.__proxy__ = (0, _DateConverter.HijriToGreg)(this);
      this.initDayOfWeek();
      return this;
    }
  }, {
    key: 'initDayOfWeek',
    value: function initDayOfWeek() {
      if (!this.__proxy__) return;
      this._day = this._day || this.__proxy__.getDay();
      this._dayName = this._dayName || (0, _DateConverter.weekDay)(this._day);
    }
  }, {
    key: 'getFullYear',
    value: function getFullYear() {
      return this.year;
    }
  }, {
    key: 'getMonthIndex',
    value: function getMonthIndex() {
      return this.month - 1;
    }
  }, {
    key: 'getMonth',
    value: function getMonth() {
      return this.month;
    }
  }, {
    key: 'getDate',
    value: function getDate() {
      return this.date;
    }
  }, {
    key: 'getDay',
    value: function getDay() {
      return this.day;
    }
  }, {
    key: 'getHours',
    value: function getHours() {
      return this.hours;
    }
  }, {
    key: 'getMinutes',
    value: function getMinutes() {
      return this.minutes;
    }
  }, {
    key: 'getSeconds',
    value: function getSeconds() {
      return this.seconds;
    }
  }, {
    key: 'getMilliseconds',
    value: function getMilliseconds() {
      return this.milliseconds;
    }
  }, {
    key: 'getTime',
    value: function getTime() {
      return this.time;
    }
  }, {
    key: 'getTimezoneOffset',
    value: function getTimezoneOffset() {
      return this.timezoneOffset;
    }
  }, {
    key: 'addDay',
    value: function addDay() {
      return this.addHours(24);
    }
  }, {
    key: 'addDays',
    value: function addDays(days) {
      var _this2 = this;

      if (typeof days === 'number') Array.from({
        length: days
      }, function (v, k) {
        return k + 1;
      }).forEach(function (i) {
        return _this2.addDay();
      });
      return this;
    }
  }, {
    key: 'addHours',
    value: function addHours(n) {
      return this.addMinutes(n * 60);
    }
  }, {
    key: 'addMinutes',
    value: function addMinutes(n) {
      return this.addSeconds(n * 60);
    }
  }, {
    key: 'addSeconds',
    value: function addSeconds(n) {
      return this.addMilliseconds(1000 * n);
    }
  }, {
    key: 'addMilliseconds',
    value: function addMilliseconds(n) {
      this.time += n;
      return this;
    }
  }, {
    key: 'subtractDays',
    value: function subtractDays(days) {
      var _this3 = this;

      Array.from({
        length: days
      }, function (v, k) {
        return k + 1;
      }).forEach(function (i) {
        return _this3.subtractDay();
      });
      return this;
    }
  }, {
    key: 'subtractDay',
    value: function subtractDay() {
      return this.subtractHours(24);
    }
  }, {
    key: 'subtractHours',
    value: function subtractHours(n) {
      return this.subtractMinutes(n * 60);
    }
  }, {
    key: 'subtractMinutes',
    value: function subtractMinutes(n) {
      return this.subtractSeconds(n * 60);
    }
  }, {
    key: 'subtractSeconds',
    value: function subtractSeconds(n) {
      return this.subtractMilliseconds(1000 * n);
    }
  }, {
    key: 'subtractMilliseconds',
    value: function subtractMilliseconds(n) {
      return this.addMilliseconds(-n);
    }
  }, {
    key: 'updateProxy',
    value: function updateProxy() {
      this.__proxy__ = (0, _DateConverter.HijriToGreg)(this);
      return this;
    }
  }, {
    key: 'toGregorian',
    value: function toGregorian() {
      return this.__proxy__;
    }
  }, {
    key: 'format',
    value: function format(mask, options) {
      return _FormatDate2.default.apply(undefined, [this].concat(Array.prototype.slice.call(arguments)));
    }
  }, {
    key: 'ignoreTime',
    value: function ignoreTime() {
      this.hours = 0;
      this.minutes = 0;
      this.seconds = 0;
      this.milliseconds = 0;
      this.updateProxy();
      return this;
    }
  }, {
    key: 'clone',
    value: function clone() {
      return new HijriDate(this.time);
    }
  }, {
    key: 'is',
    value: function is() {
      var _arguments = arguments,
          _this4 = this;

      if (!arguments.length) throw new Error('function cannot be called without arguments');
      if (arguments.length === 1 && _typeof(arguments[0]) === 'object' && Object.keys(arguments[0]).length) return Object.keys(arguments[0]).every(function (prop) {
        return parseInt(_arguments[0][prop]) === parseInt(_this4[prop]);
      });
      return Array.from(arguments).every(function (arg, i) {
        return arg === _this4[dateProps[i]];
      });
    }
  }, {
    key: 'isToday',
    value: function isToday() {
      return HijriDate.today().time == this.clone().ignoreTime().time;
    }
  }, {
    key: 'isYesterday',
    value: function isYesterday() {
      return HijriDate.yesterday().time == this.clone().ignoreTime().time;
    }
  }, {
    key: 'isTomorrow',
    value: function isTomorrow() {
      return HijriDate.tomorrow().time == this.clone().ignoreTime().time;
    }
  }, {
    key: 'valueOf',
    value: function valueOf() {
      return this.getTime();
    }
  }, {
    key: 'toString',
    value: function toString() {
      return this.format('default');
    }
  }, {
    key: 'year',
    get: function get() {
      return this._year;
    },
    set: function set(newYear) {
      this._year = newYear;
      this.updateProxy();
    }
  }, {
    key: 'month',
    get: function get() {
      return this._month;
    },
    set: function set(newMonth) {
      this._month = newMonth;
      this.updateProxy();
    }
  }, {
    key: 'date',
    get: function get() {
      return this._date;
    },
    set: function set(newDate) {
      this._date = newDate;
      this.updateProxy();
    }
  }, {
    key: 'time',
    get: function get() {
      return this.__proxy__.getTime();
    },
    set: function set(newTime) {
      var _this5 = this;

      var props = _initializer2.default.init_number(newTime);
      Object.keys(props).forEach(function (prop) {
        _this5['_' + prop] = props[prop];
      });
      this.__proxy__ = new Date(newTime);
    }
  }, {
    key: 'hours',
    get: function get() {
      return this._hours || 0;
    },
    set: function set(hours) {
      this._hours = hours;
      this.updateProxy();
    }
  }, {
    key: 'minutes',
    get: function get() {
      return this._minutes || 0;
    },
    set: function set(minutes) {
      this._minutes = minutes;
      this.updateProxy();
    }
  }, {
    key: 'seconds',
    get: function get() {
      return this._seconds || 0;
    },
    set: function set(seconds) {
      this._seconds = seconds;
      this.updateProxy();
    }
  }, {
    key: 'milliseconds',
    get: function get() {
      return this._milliseconds || 0;
    },
    set: function set(milliseconds) {
      this._milliseconds = milliseconds;
      this.updateProxy();
    }
  }, {
    key: 'timezoneOffset',
    get: function get() {
      return this.__proxy__.getTimezoneOffset();
    }
  }, {
    key: 'day',
    get: function get() {
      return this._day;
    }
  }, {
    key: 'dayName',
    get: function get() {
      return this._dayName;
    }
  }], [{
    key: 'now',
    value: function now() {
      return Date.now();
    }
  }, {
    key: 'today',
    value: function today() {
      return new HijriDate().ignoreTime();
    }
  }, {
    key: 'yesterday',
    value: function yesterday() {
      return this.today().subtractDay();
    }
  }, {
    key: 'tomorrow',
    value: function tomorrow() {
      return this.today().addDay();
    }
  }]);

  return HijriDate;
}();

HijriDate.locales = {
  ar: _locales.ar,
  en: _locales.en
};
HijriDate.defaultLocale = 'ar';

var hijriTypeErrorMessage = '\n  Wrong call of constructor !\n  Please, try to use of the following constructors:\n    \u21E2 new HijriDate() ; //current date\n      or\n    \u21E2 new HijriDate(year, month, day [, hour][, minutes][, seconds][, milliseconds]);\n         .i.e: new HijriDate(1438, 12, 23)\n      or\n    \u21E2 new HijriDate(date[, format])\n         .i.e: new HijriDate(\'1438-12-23\', \'yyyy-mm-dd\')\n  ';

var dateProps = exports.dateProps = ['year', 'month', 'date', 'hours', 'minutes', 'seconds', 'milliseconds'];
exports.default = HijriDate;
},{"./DateConverter":2,"./FormatDate":3,"./initializer":7,"./locales":8}],5:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var StringDateParser = function () {
  function StringDateParser() {
    _classCallCheck(this, StringDateParser);
  }

  _createClass(StringDateParser, null, [{
    key: 'extract',
    value: function extract(string, format, formatChunk) {
      var ignoreCase = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : true;

      var targetFormat = ignoreCase ? format.toLowerCase() : format;
      if (targetFormat.includes(formatChunk)) {
        return parseInt(string.substr(targetFormat.indexOf(formatChunk), formatChunk.length));
      }
    }
  }, {
    key: 'extractYear',
    value: function extractYear(dateString, format) {
      var year = this.extract.apply(this, Array.prototype.slice.call(arguments).concat(['yyyy']));
      if (!year) {
        year = this.extract.apply(this, Array.prototype.slice.call(arguments).concat(['yy']));
        if (year) year = Number('14' + year);
      }
      return year;
    }
  }, {
    key: 'extractMonth',
    value: function extractMonth(dateString, format) {
      var month = this.extract.apply(this, Array.prototype.slice.call(arguments).concat(['mm', false]));
      if (month) return month;
      return 1;
    }
  }, {
    key: 'extractDate',
    value: function extractDate(dateString, format) {
      var date = this.extract.apply(this, Array.prototype.slice.call(arguments).concat(['dd', false]));
      if (date) return date;
      return 1;
    }
  }, {
    key: 'extractHours',
    value: function extractHours(dateString, format) {
      var hours = this.extract.apply(this, Array.prototype.slice.call(arguments).concat(['hh']));
      if (hours) return hours;
      return 0;
    }
  }, {
    key: 'extractMinutes',
    value: function extractMinutes(dateString, format) {
      var minutes = this.extract.apply(this, Array.prototype.slice.call(arguments).concat(['MM', false]));
      if (minutes) return minutes;
      return 0;
    }
  }, {
    key: 'extractSeconds',
    value: function extractSeconds(dateString, format) {

      var seconds = this.extract.apply(this, Array.prototype.slice.call(arguments).concat(['ss', false]));
      if (seconds) return seconds;
      return 0;
    }
  }, {
    key: 'extractMilliseconds',
    value: function extractMilliseconds(dateString, format) {

      var milliseconds = this.extract.apply(this, Array.prototype.slice.call(arguments).concat(['SS', false]));
      if (milliseconds) return milliseconds;
      return 0;
    }
  }]);

  return StringDateParser;
}();

exports.default = StringDateParser;
},{}],6:[function(require,module,exports){
(function (global){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

var _safe = require('./safe');

var _safe2 = _interopRequireDefault(_safe);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var globalScope = function () {
  if ((typeof window === 'undefined' ? 'undefined' : _typeof(window)) === 'object') {
    return window;
  }
  if ((typeof global === 'undefined' ? 'undefined' : _typeof(global)) === 'object') {
    return global;
  }
  return {};
}();

globalScope.HijriDate = _safe2.default;

Date.prototype.toHijri = function () {
  return (0, _safe.toHijri)(this);
};

exports.default = _safe2.default;
}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{"./safe":9}],7:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _DateConverter = require('./DateConverter');

var _StringDateParser = require('./StringDateParser');

var _StringDateParser2 = _interopRequireDefault(_StringDateParser);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var defaultFormat = 'yyyy/mm/dd';
var defaultProps = {
  month: 1,
  date: 1,
  hours: 0,
  minutes: 0,
  seconds: 0,
  milliseconds: 0
};

var Initializer = function () {
  function Initializer() {
    _classCallCheck(this, Initializer);
  }

  _createClass(Initializer, null, [{
    key: 'initDefault',
    value: function initDefault() {
      return (0, _DateConverter.GregToHijri)(new Date());
    }
  }, {
    key: 'init_number',
    value: function init_number(number) {
      return (0, _DateConverter.GregToHijri)(new Date(number));
    }
  }, {
    key: 'init_number_number',
    value: function init_number_number(year, month) {

      return this.init_number_number_number(year, month, 1);
    }
  }, {
    key: 'init_number_number_number',
    value: function init_number_number_number() {
      return this.initFromNumbers.apply(this, arguments);
    }
  }, {
    key: 'init_number_number_number_number',
    value: function init_number_number_number_number() {
      return this.initFromNumbers.apply(this, arguments);
    }
  }, {
    key: 'init_number_number_number_number_number',
    value: function init_number_number_number_number_number() {
      return this.initFromNumbers.apply(this, arguments);
    }
  }, {
    key: 'init_number_number_number_number_number_number',
    value: function init_number_number_number_number_number_number() {
      return this.initFromNumbers.apply(this, arguments);
    }
  }, {
    key: 'init_number_number_number_number_number_number_number',
    value: function init_number_number_number_number_number_number_number() {
      return this.initFromNumbers.apply(this, arguments);
    }
  }, {
    key: 'init_string',
    value: function init_string() {
      return this.initFromStrings.apply(this, arguments);
    }
  }, {
    key: 'init_string_string',
    value: function init_string_string() {
      return this.initFromStrings.apply(this, arguments);
    }
  }, {
    key: 'init_object',
    value: function init_object(object) {
      return Object.assign({}, defaultProps, object);
    }
  }, {
    key: 'initFromNumbers',
    value: function initFromNumbers(year, month, date) {
      var hours = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : 0;
      var minutes = arguments.length > 4 && arguments[4] !== undefined ? arguments[4] : 0;
      var _arguments = arguments;
      var seconds = arguments.length > 5 && arguments[5] !== undefined ? arguments[5] : 0;
      var milliseconds = arguments.length > 6 && arguments[6] !== undefined ? arguments[6] : 0;

      Array.from(arguments).forEach(function (arg, index) {
        _arguments[index] = parseInt(arg);
      });

      return {
        year: year,
        month: month,
        date: date,
        hours: hours,
        minutes: minutes,
        seconds: seconds,
        milliseconds: milliseconds
      };
    }
  }, {
    key: 'initFromStrings',
    value: function initFromStrings(dateString) {
      var format = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : defaultFormat;

      var props = {};
      props.year = _StringDateParser2.default.extractYear(dateString, format);
      props.month = _StringDateParser2.default.extractMonth(dateString, format);
      props.date = _StringDateParser2.default.extractDate(dateString, format);
      return Object.assign({}, defaultProps, props);
    }
  }]);

  return Initializer;
}();

Initializer.defaultFormat = defaultFormat;

exports.default = Initializer;
},{"./DateConverter":2,"./StringDateParser":5}],8:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
var ar = exports.ar = {
  dayNames: ["أحد", "اثن", "ثلا", "ارب", "خم", "جم", "سبت", "الأحد", "الإثنين", "الثلاثاء", "الإربعاء", "الخميس", "الجمعة", "السبت"],
  monthNames: ["مح", "صف", "ربع١", "ربع٢", "جم١", "جم٢", "رجب", "شعب", "رمض", "شو", "ذو ق", "ذو ح", "محرّم", "صفر", "ربيع أول", "ربيع الآخر", "جمادى أولى", "جمادى الآخرة", "رجب", "شعبان", "رمضان", "شوال", "ذو القعدة", "ذو الحجّة"]
};

var en = exports.en = {
  dayNames: ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"],
  monthNames: ["Muha", "Saf", "Rab1", "Rab2", "Jumd1", "Jumd2", "Rajb", "Shbn", "Rmdn", "Shwl", "Qada", "Hija", "Muharram", "Safar", "Rabi'ul Awwal", "Rabi'ul Akhir", "Jumadal Ula", "Jumadal Akhira", "Rajab", "Sha'ban", "Ramadan", "Shawwal", "Dhul Qa'ada", "Dhul Hijja"]
};
},{}],9:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.toHijri = undefined;

var _HijriDate = require('./HijriDate');

var _HijriDate2 = _interopRequireDefault(_HijriDate);

var _DateConverter = require('./DateConverter');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var toHijri = exports.toHijri = function toHijri(gregDate) {
  var _GregToHijri = (0, _DateConverter.GregToHijri)(gregDate),
      year = _GregToHijri.year,
      month = _GregToHijri.month,
      date = _GregToHijri.date;

  return new _HijriDate2.default(year, month, date, gregDate.getHours(), gregDate.getMinutes(), gregDate.getSeconds(), gregDate.getMilliseconds());
};
exports.default = _HijriDate2.default;
},{"./DateConverter":2,"./HijriDate":4}]},{},[1]);
