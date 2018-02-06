module.exports = function (app) {
    app.directive('catchUploadFileDirective', function ($parse) {
        'ngInject';
        return {
            restrict: 'A',
            link: function (scope, element, attrs) {
                var callback = $parse(attrs.catchUploadFileDirective)(scope);
                var reset = attrs.resetAfterChange === 'true';

                element.on('change', function () {
                    var self = this;
                    if (this.files.length && typeof callback === 'function') {
                        scope.$apply(function () {
                            callback(self.files);
                        });

                        if (reset) {
                            this.value = '';
                        }

                    } else if (!this.files.length && typeof callback === 'function') {
                        scope.$apply(function () {
                            callback([]);
                        });
                    }
                });
            }
        }
    })
};