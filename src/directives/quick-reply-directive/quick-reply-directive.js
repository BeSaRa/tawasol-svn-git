module.exports = function (app) {
    app.directive('quickReplyDirective', function (cmsTemplate) {
        'ngInject';
        return {
            restrict: 'E',
            replace: true,
            controller: 'quickReplyDirectiveCtrl',
            controllerAs: 'ctrl',
            bindToController: true,
            templateUrl: cmsTemplate.getDirective('quick-reply-template.html'),
            scope: {
                workItem: '=',
                replyOn: '='
            }
        }
    })
};
