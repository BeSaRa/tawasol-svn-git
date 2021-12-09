module.exports = function (app) {
    app.directive('selectApplicationUsersDirective', function (cmsTemplate) {
        'ngInject';
        return {
            restrict: "E",
            templateUrl: cmsTemplate.getDirective('select-application-users-template.html'),
            replace: true,
            scope: {
                existingUsers: '=',
                saveCallback: '=',
                deleteCallback: '=',
                allowDelete: '=',
                editMode: '='
            },
            bindToController: true,
            controller: 'selectApplicationUsersDirectiveCtrl',
            controllerAs: 'ctrl'
        }
    })
};
