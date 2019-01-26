module.exports = function (app) {
    require('./grid-search-directive-style.scss');
    app.directive('gridSearchDirective', function (cmsTemplate) {
        'ngInject';
        return {
            restrict: "E",
            templateUrl: cmsTemplate.getDirective('grid-search-template.html'),
            replace: true,
            scope: {
                grid: '=',
                serverSide: '=',
                placeholder: '@'
            },
            bindToController: true,
            controller: 'gridSearchDirectiveCtrl',
            controllerAs: 'ctrl'
        }
    })
};
