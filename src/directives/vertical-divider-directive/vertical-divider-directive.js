module.exports = function (app) {
    require('./vertical-divider-directive-style.scss');
    app.directive('verticalDividerDirective', function () {
        'ngInject';
        return {
            restrict: 'E'
        }
    })
};