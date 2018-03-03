module.exports = function (app) {
    app.directive('mainSiteSubSiteDirective', function () {
        'ngInject';
        return {
            restrict: 'E',
            template: require('./main-site-sub-site-directive.html'),
            controller: 'mainSiteSubSiteDirectiveCtrl',
            controllerAs: 'ctrl',
            bindToController: true,
            scope: {
                item: '='
            }
        }
    });
};