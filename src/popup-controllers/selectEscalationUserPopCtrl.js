module.exports = function (app) {
    app.controller('selectEscalationUserPopCtrl', function (langService,
                                                            organizationService,
                                                            $q,
                                                            dialog,
                                                            DistributionUserWFItem,
                                                            //  escalationUsers,
                                                            UserSearchCriteria,
                                                            distributionWFService,
                                                            gridService,
                                                            employeeService,
                                                            $timeout,
                                                            $filter,
                                                            generator,
                                                            _) {
        'ngInject';
        var self = this;
        self.controllerName = 'selectEscalationUserPopCtrl';
        self.currentEmployee = employeeService.getEmployee();
        self.escalationUserSearchText = '';
        self.ouSearchText = '';
        self.usersCriteria = null;

        $timeout(function () {
            if (!self.escalationUserId) {
                self.usersCriteria = new UserSearchCriteria({
                    ou: (self.organizationGroups.length ? _.find(self.organizationGroups, function (item) {
                        return item.toOUId === ('g' + self.currentEmployee.getOUID())
                    }) : self.currentEmployee.getOUID())
                });
            } else {
                self.usersCriteria = new UserSearchCriteria({
                    ou: _.find(self.organizationGroups, function (item) {
                        return item.toOUId === ('g' + self.escalationUserId.ouId)
                    })
                });
            }
            self.onOrganizationChanged()
                .then(function () {
                    if (self.escalationUserId) {
                        self.selectedEscalationUser = _.find(self.escalationUsers, function (wfUser) {
                            return wfUser.ouUSerId === self.escalationUserId.ouUSerId;
                        });
                    }
                });
        });

        self.selectEscalationUser = function ($event) {
            dialog.hide(self.selectedEscalationUser);
        };

        /**
         * @description Clears the searchText for the given field
         * @param fieldType
         */
        self.clearSearchText = function (fieldType) {
            self[fieldType + 'SearchText'] = '';
        };


        /**
         * @description Prevent the default dropdown behavior of keys inside the search box of workflow action dropdown
         * @param $event
         */
        self.preventSearchKeyDown = function ($event) {
            if ($event) {
                var code = $event.which || $event.keyCode;
                if (code !== 38 && code !== 40)
                    $event.stopPropagation();
            }
        };

        self.onOrganizationChanged = function () {
            if (!self.usersCriteria)
                return;
            return distributionWFService
                .searchUsersByCriteria(self.usersCriteria)
                .then(function (result) {
                    return self.escalationUsers = result;
                });
        };

        /**
         * close dialog
         */
        self.closeSelectEscalationUser = function () {
            dialog.cancel();
        };

    });
};
