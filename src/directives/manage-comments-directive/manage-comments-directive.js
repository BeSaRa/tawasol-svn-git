module.exports = function (app) {
    require('./manage-comments-style.scss');
    app.directive('manageCommentsDirective', function (cmsTemplate) {
        'ngInject';
        return {
            restrict: 'E',
            templateUrl: cmsTemplate.getDirective('manage-comments-template.html'),
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
                sourceComment: '=?',
                disableEverything: '=?',
                isValid: '=?',
                correspondence: '=?'
            },
            link: function ($scope, element, attrs) {
                $scope.$watch(function () {
                        return $scope.ctrl.isValidComment($scope.ctrl.documentCommentForm);
                    },
                    function (newValue, oldValue) {
                        $scope.ctrl.isValid = newValue;
                    });
            }
        }
    })
};
