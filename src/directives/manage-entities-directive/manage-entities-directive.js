module.exports = function (app) {
    require('./manage-entities-style.scss');
    app.directive('manageEntitiesDirective', function (cmsTemplate) {
        'ngInject';
        return {
            restrict: 'E',
            controller: 'manageEntitiesDirectiveCtrl',
            controllerAs: 'ctrl',
            templateUrl: cmsTemplate.getDirective('manage-entities-template.html'),
            bindToController: true,
            scope: {
                fromDialog: '=?',
                linkedEntities: '=',
                vsId: '=',
                documentClass: '=',
                disableEverything: '=?'
            }
        }
    })
};
