module.exports = function (app) {
    app.directive('manageTagsDirective', function (cmsTemplate) {
        'ngInject';
        return {
            restrict: 'E',
            scope: {
                fromDialog: '=',
                tags: '=',
                disableEverything: '=?',
                notifyAfterChanges: '=?'
            },
            templateUrl: cmsTemplate.getDirective('manage-tags-template.html'),
            controller: 'manageTagsDirectiveCtrl',
            controllerAs: 'ctrl',
            bindToController: true
        }
    });
};
