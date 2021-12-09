module.exports = function (app) {
    app.directive('catchUploadFileDirective', function ($parse, $timeout) {
        'ngInject';
        return {
            restrict: 'A',
            link: function (scope, element, attrs) {
                var callback = $parse(attrs.catchUploadFileDirective)(scope);
                var reset = attrs.resetAfterChange === 'true';
                var resetByCallback = attrs.resetByCallback ? attrs.resetByCallback : false;

                function _resetField() {
                    $timeout(function () {
                        element.wrap('<form>').closest('form').get(0).reset();
                        element.unwrap();
                    }, 1000);
                }

                element.on('change', function () {
                    var self = this;
                    if (this.files.length && typeof callback === 'function') {
                        $timeout(function () {
                            if (resetByCallback) {
                                callback(self.files, element, _resetField);
                            } else {
                                callback(self.files, element);
                            }
                            if (reset && !resetByCallback) {
                                _resetField();
                            }
                        });
                    } else if (!this.files.length && typeof callback === 'function') {
                        $timeout(function () {
                            callback([], element);
                        });
                    }
                });
            }
        }
    })
};
