module.exports = function (app) {
    require('./correspodnence-view-action-style.scss');
    app.directive('correspondenceViewActionDirective', function () {
        'ngInject';
        return {
            template: require('./correspondence-view-action-template.html'),
            controller: 'correspondenceViewActionDirectiveCtrl',
            controllerAs: 'ctrl',
            bindToController: true,
            replace: true,
            scope: {
                actions: '=',
                workItem: '=',
                correspondence: '='
            }
        }
    })
};