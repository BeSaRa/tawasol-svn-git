module.exports = function (app) {
    app.directive('searchFilterDirective', function (cmsTemplate) {
        'ngInject';
        return {
            restrict: "E",
            templateUrl: cmsTemplate.getDirective('search-filter-template.html'),
            replace: true,
            scope: {
                model: '=',
                onChange: '=',
                cancelCallback: '&',
                changeIconModel: '='
            },
            bindToController: true,
            controller: 'searchFilterDirectiveCtrl',
            controllerAs: 'searchFilter'
        }
    })
};
