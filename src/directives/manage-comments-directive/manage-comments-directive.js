module.exports = function (app) {
    require('./manage-comments-style.scss');
    app.directive('manageCommentsDirective', function () {
        'ngInject';
        return {
            restrict: 'E',
            template: require('./manage-comments-template.html'),
            controller: 'manageCommentsDirectiveCtrl',
            controllerAs: 'ctrl',
            bindToController: true,
            scope: {
                documentComments: '=',
                vsId: '=',
                showCommentForm: '=?',
                fromDialog: '=?',
                sourceCloseCallback: '=?',
                sourceSaveCallback: '=?',
                sourceCreateCallback: '=?',
                sourceEditMode: '=?',
                sourceComment: '=?'
            }
        }
    })
};