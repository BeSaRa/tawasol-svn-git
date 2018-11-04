module.exports = function (app) {
    app.directive('magazineItemDirective', function ($compile) {
        'ngInject';
        return {
            restrict: 'A',
            // just to bind controller properties
            controller: function ($scope) {
                'ngInject';

            },
            controllerAs: 'itemCtrl',
            bindToController: true,
            require: ['magazineItemDirective', '^magazineLayoutDirective'],
            scope: {
                item: '=magazineItemDirective'
            },
            link: function (scope, element, attr, ctrl) {
                var self = ctrl.shift();
                var magazineCtrl = ctrl.pop();
                // to check if it is selected
                self.isSelected = function (print) {
                    return magazineCtrl.isWorkItemSelected(self.item);
                };

                self.selectWorkItem = function () {
                    magazineCtrl.selectItem(self.item);
                };
                self.deselectWorkItem = function () {
                    magazineCtrl.deSelectItem(self.item);
                };
                // toggle selected
                self.toggleSelect = function ($event) {
                    $event.preventDefault();
                    self.isSelected(true) ? self.deselectWorkItem() : self.selectWorkItem();
                };

                function enableRowSelection() {
                    return magazineCtrl.allowSelection;
                }

                function _createCheckBox() {
                    var checkbox = angular.element('<md-checkbox>').attr({
                        'aria-label': 'Select Row',
                        'ng-click': 'itemCtrl.toggleSelect($event)',
                        'ng-checked': 'itemCtrl.isSelected()',
                        'ng-disabled': 'itemCtrl.disabled',
                        'class': 'check-box-element'
                    });
                    return $compile(checkbox)(scope);
                }

                function _deleteCheckBox() {
                    element.find('.check-box-element').remove();
                }

                function _enableSelection() {
                    element.find('.magazine-check-box').append(_createCheckBox());
                }

                function _disableSelection() {
                    _deleteCheckBox();
                }

                scope.$watch(enableRowSelection, function (enabled) {
                    if (enabled) {
                        _enableSelection();
                    } else {
                        _disableSelection();
                    }
                });


            }
        }
    })
};