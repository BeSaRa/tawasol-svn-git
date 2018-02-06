module.exports = function (app) {
    app.controller('toolbarSearchDirectiveCtrl', function ($element,
                                                           $state,
                                                           loadingIndicatorService,
                                                           $location,
                                                           $scope,
                                                           quickSearchCorrespondenceService,
                                                           $timeout,
                                                           employeeService) {
        'ngInject';
        var self = this;
        self.controllerName = 'toolbarSearchDirectiveCtrl';
        self.quick = quickSearchCorrespondenceService;
        self.query = null;
        self.labels = {
            search: 'search'
        };
        self.loadingService = loadingIndicatorService;


        /**
         * @description Check if action will be shown on grid or not
         * @param action
         * @param model
         * @returns {boolean}
         */
        self.checkToShowAction = function (action, model) {
            /*if (action.hasOwnProperty('permissionKey'))
            return !action.hide && employeeService.hasPermissionTo(action.permissionKey);
        return (!action.hide);*/

            if (action.hasOwnProperty('permissionKey')) {
                if (typeof action.permissionKey === 'string') {
                    return (!action.hide) && employeeService.hasPermissionTo(action.permissionKey);
                }
                else if (angular.isArray(action.permissionKey)) {
                    if (!action.permissionKey.length) {
                        return (!action.hide);
                    }
                    else {
                        var hasPermissions = _.map(action.permissionKey, function (key) {
                            return employeeService.hasPermissionTo(key);
                        });
                        return (!action.hide) && !(_.some(hasPermissions, function (isPermission) {
                            return isPermission !== true;
                        }));
                    }
                }
            }
            return (!action.hide);
        };


        self.availableSearchCriteria = [
            {id: 1, key: 'DocSubjectSrc', value: 'document_subject', checkShow: self.checkToShowAction},
            {id: 2, key: 'DocFullSerial', value: 'full_serial', checkShow: self.checkToShowAction},
            {id: 3, key: 'Barcode', value: 'barcode', checkShow: self.checkToShowAction},
            {id: 4, key: 'Tags', value: 'tags', permissionKey: "TAG_SEARCH", checkShow: self.checkToShowAction},
            {id: 5, key: 'Content', value: 'search_content', permissionKey: "CONTENT_SEARCH", checkShow: self.checkToShowAction}
        ];

        self.showSearch = function () {
            self.quick.showSearchForm();
            if (self.query) {
                $state.go('app.search.quick-search',
                    {
                        key: self.searchCriteria.key,
                        q: self.query,
                        random: (Date.now()).toString()
                    });
            }
            $timeout(function () {
                $element.find('input').focus();
            });
        };

        self.hideSearch = function () {
            self.quick.hideSearchForm();
            self.query = null;
            self.searchCriteria = self.availableSearchCriteria[0];
        };

        self.toggleSearchForm = function () {
            self.quick.toggleSearchForm();
        };

        self.openMenu = function ($mdMenu, ev) {
            $mdMenu.open(ev);
        };

        self.setSelectedKey = function (menuItem) {
            self.searchCriteria = menuItem;
        };

        self.onKeyPressSearch = function (event) {
            var code = event.which || event.code;
            if (code === 13)
                self.showSearch();
            else if (code === 27) {
                self.hideSearch();
            }
        };

        self.searchCriteria = self.availableSearchCriteria[0];

        if ($location.search().key && $location.search().q) {
            self.quick.showSearchForm();
            $element.find('input').focus();
            self.query = $location.search().q;
            self.searchCriteria = _.filter(self.availableSearchCriteria, function (val) {
                return val.key === $location.search().key;
            })[0];
        }
        $scope.$on('$emptySearchInput', function () {
            //$element.find('input').val("");
            self.query = null;
            self.searchCriteria = self.availableSearchCriteria[0];
        })
    })
    ;
}
;
