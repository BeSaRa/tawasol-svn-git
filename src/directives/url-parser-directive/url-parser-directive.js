module.exports = function (app) {
    require('./url-parser-style.scss');
    app.directive('urlParserDirective', function (cmsTemplate) {
        'ngInject';
        return {
            restrict: 'E',
            controller: 'urlParserDirectiveCtrl',
            controllerAs: 'ctrl',
            bindToController: true,
            replace: true,
            templateUrl: cmsTemplate.getDirective('url-parser-template.html'),
            scope: {
                dynamicMenuItem: '='
            }
        }
    })
};
