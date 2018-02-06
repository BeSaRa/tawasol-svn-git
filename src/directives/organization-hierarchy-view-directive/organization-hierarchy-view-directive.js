module.exports = function (app) {
    app.directive('organizationHierarchyViewDirective', function () {
        'ngInject';
        return {
            restrict: 'E',
            template: require('./organization-hierarchy-view-template.html'),
            controller: 'organizationHierarchyViewDirectiveCtrl',
            controllerAs: 'ctrl'
        }
    });
};