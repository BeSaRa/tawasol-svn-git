module.exports = function (app) {
    require('./correspodnence-view-action-style.scss');
    app.directive('correspondenceViewActionDirective', function (cmsTemplate) {
        'ngInject';
        return {
            templateUrl: cmsTemplate.getDirective('correspondence-view-action-template.html'),
            controller: 'correspondenceViewActionDirectiveCtrl',
            controllerAs: 'ctrl',
            bindToController: true,
            replace: true,
            scope: {
                actions: '=',
                workItem: '=',
                correspondence: '=',
                g2gItemCopy: '=?',
                editMode: '=',
                saveCorrespondenceChanges: '=',
                notifyCallback: '=?'
            }
        }
    })
};
