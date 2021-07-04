module.exports = function (app) {
    app.directive('chatBotDirective', function (cmsTemplate) {
        'ngInject';
        return {
            restrict: 'E',
            replace: true,
            controller: 'chatBotDirectiveCtrl',
            controllerAs: 'ctrl',
            bindToController: true,
            templateUrl: cmsTemplate.getDirective('chat-bot-directive-template.html'),
            scope: {}
        }
    })
};
