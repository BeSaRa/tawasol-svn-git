module.exports = function (app) {
    app.directive('helpVideosDirective', function (cmsTemplate) {
        'ngInject';
        return {
            restrict: "E",
            templateUrl: cmsTemplate.getDirective('help-videos-template.html'),
            replace: true,
            scope: {
                url: '=',
            },
            bindToController: true,
            controller: 'helpVideosDirectiveCtrl',
            controllerAs: 'ctrl'
        }
    })
};
