module.exports = function (app) {
    app.directive('counterDirective', function () {
        'ngInject';
        return {
            restrict: 'A',
            link: function (scope, element, attrs) {
                var options = {
                    useEasing: true,
                    useGrouping: true,
                    separator: ',',
                    decimal: '.'
                };
                var values = {
                    from: 0,
                    to: 0
                };
                var count = null;

                scope.$watch(attrs.counterDirective, function (value) {

                    if (value.options) angular.extend(options, value.options);
                    if (value) angular.extend(values, value);
                    count = new CountUp(element[0], values.from, values.to, 0, 2, options);
                    if (value.callback) {
                        count.start(value.callback);
                    } else {
                        count.start();
                    }

                    if (count) {
                        count.update(values.to);
                    }
                });

            }
        }
    })
};