module.exports = function (app) {
    app.directive('sidebarLeftDirective', function (cmsTemplate) {
        'ngInject';
        return {
            restrict: 'E',
            replace: true,
            controller: 'sidebarLeftDirectiveCtrl',
            controllerAs: 'sidebar',
            templateUrl: function () {
                var url = cmsTemplate.getDirective('sidebar-left-template');
                console.log(url);
                return url;
            }
        }
    });
};
