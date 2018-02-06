module.exports = function (app) {
    app.directive('removeLayoutElement', function (layoutService) {
        'ngInject';
        return {
            restrict: 'E',
            template: '<div><md-button ng-click="removeElement()" class="md-icon-button"><md-icon md-svg-icon="close"></md-icon></md-button></div>',
            controller: function ($scope, $element) {
                $scope.removeElement = function () {
                    var widget = $element.parent().data('relation');
                    widget.delete().then(function () {
                        $element.parent().remove();
                    });
                }
            }
        }
    })
};