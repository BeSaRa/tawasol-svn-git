module.exports = (function () {
    require('angular');

    function isError(value) {
        var tag = toString.call(value);
        switch (tag) {
            case '[object Error]':
                return true;
            case '[object Exception]':
                return true;
            case '[object DOMException]':
                return true;
            default:
                return value instanceof Error;
        }
    }

    /**
     * @ngdoc function
     * @name angular.isFunction
     * @module ng
     * @kind function
     *
     * @description
     * Determines if a reference is a `Function`.
     *
     * @param {*} value Reference to check.
     * @returns {boolean} True if `value` is a `Function`.
     */
    function isFunction(value) {
        return typeof value === 'function';
    }


    /**
     * Determines if a value is a regular expression object.
     *
     * @private
     * @param {*} value Reference to check.
     * @returns {boolean} True if `value` is a `RegExp`.
     */
    function isRegExp(value) {
        return toString.call(value) === '[object RegExp]';
    }


    /**
     * Checks if `obj` is a window object.
     *
     * @private
     * @param {*} obj Object to check
     * @returns {boolean} True if `obj` is a window obj.
     */
    function isWindow(obj) {
        return obj && obj.window === obj;
    }


    function isScope(obj) {
        return obj && obj.$evalAsync && obj.$watch;
    }


    function isFile(obj) {
        return toString.call(obj) === '[object File]';
    }


    function isFormData(obj) {
        return toString.call(obj) === '[object FormData]';
    }


    function isBlob(obj) {
        return toString.call(obj) === '[object Blob]';
    }


    function isBoolean(value) {
        return typeof value === 'boolean';
    }


    function isPromiseLike(obj) {
        return obj && isFunction(obj.then);
    }


    var TYPED_ARRAY_REGEXP = /^\[object (?:Uint8|Uint8Clamped|Uint16|Uint32|Int8|Int16|Int32|Float32|Float64)Array]$/;

    function isTypedArray(value) {
        return value && isNumber(value.length) && TYPED_ARRAY_REGEXP.test(toString.call(value));
    }

    function isArrayBuffer(obj) {
        return toString.call(obj) === '[object ArrayBuffer]';
    }


    var trim = function (value) {
        return isString(value) ? value.trim() : value;
    };

// Copied from:
// http://docs.closure-library.googlecode.com/git/local_closure_goog_string_string.js.source.html#line1021
// Prereq: s is a string.
    var escapeForRegexp = function (s) {
        return s
            .replace(/([-()[\]{}+?*.$^|,:#<!\\])/g, '\\$1')
            // eslint-disable-next-line no-control-regex
            .replace(/\x08/g, '\\x08');
    };


    /**
     * @ngdoc function
     * @name angular.isElement
     * @module ng
     * @kind function
     *
     * @description
     * Determines if a reference is a DOM element (or wrapped jQuery element).
     *
     * @returns {boolean} True if `value` is a DOM element (or wrapped jQuery element).
     * @param node
     */
    function isElement(node) {
        return !!(node &&
            (node.nodeName  // We are a direct element.
                || (node.prop && node.attr && node.find)));  // We have an on and find method part of jQuery API.
    }

    angular.equals = function equals(o1, o2, comparisons) {
        if (o1 === o2) return true;
        if (o1 === null || o2 === null) return false;
        if (o1 !== o1 && o2 !== o2) return true; // NaN === NaN
        var t1 = typeof o1, t2 = typeof o2, length, key, keySet;
        if (t1 === t2) {
            if (t1 === 'object') {
                comparisons || (comparisons = new WeakMap());
                if (comparisons.has(o1) && comparisons.get(o1).has(o2)) {
                    return true;
                } else {
                    if (!comparisons.has(o1)) {
                        comparisons.set(o1, new WeakMap());
                    }
                    comparisons.get(o1).set(o2, true);
                    if (!comparisons.has(o2)) {
                        comparisons.set(o2, new WeakMap());
                    }
                    comparisons.get(o2).set(o1, true);
                }
                if (angular.isArray(o1)) {
                    if (!angular.isArray(o2)) return false;
                    if ((length = o1.length) === o2.length) {
                        for (key = 0; key < length; key++) {
                            if (!equals(o1[key], o2[key], comparisons)) return false;
                        }
                        return true;
                    }
                } else if (angular.isDate(o1)) {
                    if (!angular.isDate(o2)) return false;
                    return equals(o1.getTime(), o2.getTime());
                } else if (isRegExp(o1) && isRegExp(o2)) {
                    return o1.toString() === o2.toString();
                } else {
                    if (isScope(o1) || isScope(o2) || isWindow(o1) || isWindow(o2) || angular.isArray(o2)) return false;
                    keySet = {};
                    for (key in o1) {
                        if (key.charAt(0) === '$' || isFunction(o1[key])) continue;
                        if (!equals(o1[key], o2[key], comparisons)) return false;
                        keySet[key] = true;
                    }
                    for (key in o2) {
                        if (!keySet.hasOwnProperty(key) &&
                            key.charAt(0) !== '$' &&
                            o2[key] !== undefined &&
                            !isFunction(o2[key])) return false;
                    }
                    return true;
                }
            }
        }
        return false;
    };
    require('angular-material');
    //TODO: we will apply this require after deploy the versions
    // require('angular-material/angular-material.min.css');
    require('angular-aria');
    require('angular-mocks');
    require('angular-cookies');
    require('angular-messages');
    require('angular-animate');
    require('@uirouter/angularjs');
    require('angular-local-storage/src/angular-local-storage');
    require('ng-idle');
    require('orgchart/dist/css/jquery.orgchart.css');
    require('es6-promise').polyfill(); // polyfill for promises
    require('angular-material-data-table'); // polyfill for promises
    require('angular-material-data-table/dist/md-data-table.min.css');
    // require('./sass/style.scss');

    require('jquery-ui/ui/widgets/sortable.js');
    require('jquery-ui/ui/widgets/droppable.js');
    require('jquery-ui/ui/widgets/draggable.js');
    require('jquery-ui/ui/disable-selection.js');
    require('jquery-ui/ui/widgets/resizable');

    require('orgchart');
    require('jquery-textcomplete');
    require('jquery-overlay');

    // tooltips
    require('angularjs-tooltips');
    require('angularjs-tooltips/dist/angular-tooltips.css');

    // color picker
    require('md-color-picker/dist/mdColorPicker.css');
    require('md-color-picker');
    require('chart.js');
    require('animate.css/animate.css');
    // angular ui mask
    require('angular-ui-mask');

    require('owl.carousel');
    require('owl.carousel/dist/assets/owl.carousel.css');

    // textAngular
    require('textangular/dist/textAngular.css');
    //require('textangular/dist/textAngular-rangy.min.js');
    require('rangy/lib/rangy-core.js');
    require('rangy/lib/rangy-selectionsaverestore.js');
    require('textangular/dist/textAngular-sanitize.min.js');
    require('textangular/dist/textAngular.min.js');
})();