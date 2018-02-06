module.exports = function (app) {
    app.directive('manageTagsDirective', function () {
        'ngInject';
        return {
            restrict: 'E',
            scope: {
                fromDialog: '=',
                tags: '='
            },
            template: require('./manage-tags-template.html'),
            controller: 'manageTagsDirectiveCtrl',
            controllerAs: 'ctrl',
            bindToController: true
        }
    });
};