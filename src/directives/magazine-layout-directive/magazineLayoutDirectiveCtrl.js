module.exports = function (app) {
    app.controller('magazineLayoutDirectiveCtrl', function ($scope, _, employeeService, LangWatcher, $compile, $timeout, $element, $mdMedia, sidebarService) {
        'ngInject';
        var self = this;
        LangWatcher($scope);
        self.controllerName = 'magazineLayoutDirectiveCtrl';
        // the workItems from the parent scope
        self.workItems = [];
        // the selected workItems from the parent scope
        self.selectedWorkItems = [];
        // default disable
        self.disabled = false;
        // by default the client pagination true
        self.clientPagination = true;

        self.page = 1;

        self.paginate = function (e) {
            console.log(self.page);
        };

        self.employeeService = employeeService;


        self.isObject = function (limit) {
            return angular.isObject(limit);
        };

        self.isGreatThanSmall = function () {
            return $mdMedia('gt-sm');
        };

        self.sidebarOpend = function (sidebarCode) {
            return sidebarService.getSidebar(sidebarCode).isLockedOpen;
        };

        function _getItemPosition(item, debug) {
            if (debug) {
                console.log(self.selectedWorkItems);
                console.log(self.selectedWorkItems.indexOf(item));
            }
            return self.selectedWorkItems.indexOf(item)
        }

        function _checkSelected(item, debug) {
            return _getItemPosition(item, debug) !== -1;
        }

        /**
         * @description to check if the workItems Selected
         * @param item
         * @param debug
         * @return {*}
         */
        self.isWorkItemSelected = function (item, debug) {
            return !!_checkSelected(item, debug);
        };
        /**
         * @description to select item
         * @param item
         */
        self.selectItem = function (item) {
            self.selectedWorkItems.push(item);
        };
        /**
         * @description to deSelect item
         * @param item
         */
        self.deSelectItem = function (item) {
            if (self.isWorkItemSelected(item)) {
                self.selectedWorkItems.splice(_getItemPosition(item), 1);
            }
        };
        /**
         * @description get magazine layout element as dom element
         * @return {$element|*} dom element
         */
        self.getMagazineBody = function () {
            return self.getRootElement().find('.magazine-layout')[0];
        };
        /**
         * @description get magazine header element.
         */
        self.getHeaderElement = function () {
            return self.getRootElement().find('.top-bar-meta-data')[0];
        };
        /**
         * @description
         * @return {$element|*}
         */
        self.getRootElement = function () {
            return $element;
        };
        /**
         * @description to return current page items
         * @return {T[]}
         */
        self.getPageItems = function () {
            return Array.prototype.filter.call(self.getMagazineBody().children, function (item) {
                return !item.classList.contains('ng-leave');
            });
        };

        function _itemController(element) {
            return angular.element(element).controller('magazineItemDirective');
        }

        self.getItemsControllers = function () {
            return Array.prototype.map.call(self.getPageItems(), _itemController);
        };

        self.isSelectedAll = function () {
            var controllers = self.getItemsControllers();
            return controllers.length && controllers.every(function (ctrl) {
                return ctrl.isSelected();
            });
        };

        self.isSelectedAllow = function () {
            return self.allowSelection;
        };

        self.toggleAll = function ($event) {
            $event.preventDefault();
            self.isSelectedAll() ? self.deselectAllItems() : self.selectAllItems();
        };

        self.selectAllItems = function () {
            var controllers = self.getItemsControllers();
            controllers.length && controllers.map(function (ctrl) {
                if (!ctrl.isSelected()) {
                    ctrl.selectWorkItem();
                }
            });
        };

        self.deselectAllItems = function () {
            var controllers = self.getItemsControllers();
            controllers.length && controllers.map(function (ctrl) {
                if (ctrl.isSelected()) {
                    ctrl.deselectWorkItem();
                }
            });
        };

        function _attachSelectAllCheckBox() {
            var checkbox = angular.element('<md-checkbox>').attr({
                'aria-label': 'Select All',
                'ng-click': 'ctrl.toggleAll($event)',
                'ng-checked': 'ctrl.isSelectedAll()',
                'ng-disabled': 'ctrl.disabled',
                'class': 'select-all-check-box m0 width-20'
            });
            checkbox = angular.element('<div />', {layout: 'row', 'layout-align': 'center center'}).append(checkbox);
            angular.element(self.getHeaderElement()).prepend($compile(checkbox)($scope))
        }

        function _detachSelectAllCheckBox() {
            var checkbox = angular.element(self.getHeaderElement()).find('.top-bar-meta-data').children().get(0);
            checkbox ? checkbox.remove() : null;
        }

        $scope.$watch(self.isSelectedAllow, function (allow) {
            if (allow) {
                if (!self.selectedWorkItems || !angular.isArray(self.selectedWorkItems)) {
                    console.error('we to provide array in the selectedWorkItem attribute but you provide ' + typeof self.selectedWorkItems)
                }
                _attachSelectAllCheckBox();
            } else {
                _detachSelectAllCheckBox();
            }
        });
    });
};