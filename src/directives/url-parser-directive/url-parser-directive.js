module.exports = function (app) {
    require('./url-parser-style.scss');
    app.directive('urlParserDirective', function () {
        'ngInject';
        return {
            restrict: 'E',
            controller: 'urlParserDirectiveCtrl',
            controllerAs: 'ctrl',
            bindToController: true,
            replace: true,
            template: require('./url-parser-template.html'),
            scope: {
                dynamicMenuItem: '='
            }
        }
    })
};
