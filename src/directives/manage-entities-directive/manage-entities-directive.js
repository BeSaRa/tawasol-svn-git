module.exports = function (app) {
    require('./manage-entities-style.scss');
    app.directive('manageEntitiesDirective', function () {
        'ngInject';
        return {
            restrict: 'E',
            controller: 'manageEntitiesDirectiveCtrl',
            controllerAs: 'ctrl',
            template: require('./manage-entities-template.html'),
            bindToController: true,
            scope: {
                fromDialog: '=?',
                linkedEntities: '=',
                vsId: '=',
                documentClass: '='
            }
        }
    })
};