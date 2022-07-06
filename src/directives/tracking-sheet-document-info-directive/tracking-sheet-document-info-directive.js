module.exports = function (app) {
    app.directive('trackingSheetDocumentInfoDirective', function (cmsTemplate) {
        'ngInject';
        return {
            restrict: 'E',
            templateUrl: cmsTemplate.getDirective('tracking-sheet-document-info-template.html'),
            controller: function ($scope, LangWatcher) {
                'ngInject';
                var self = this;
                LangWatcher($scope);
            },
            controllerAs: 'ctrl',
            bindToController: true,
            replace: true,
            scope: {
                document: '='
            }
        }
    });
};
