module.exports = function (app) {
    app.directive('manageTagsDirective', function () {
        'ngInject';
        return {
            restrict: 'E',
            scope: {
                fromDialog: '=',
                tags: '=',
                disableEverything: '=?'
            },
            template: require('./manage-tags-template.html'),
            controller: 'manageTagsDirectiveCtrl',
            controllerAs: 'ctrl',
            bindToController: true
        }
    });
};