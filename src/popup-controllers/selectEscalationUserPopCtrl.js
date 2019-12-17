module.exports = function (app) {
    app.controller('selectEscalationUserPopCtrl', function (langService,
                                                            organizationService,
                                                            $q,
                                                            dialog,
                                                            escalationUsers,
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

        self.escalationUsers = _.filter(escalationUsers, function (user) {
            return self.currentEmployee.id !== user.id;
        });

        self.selectedEscalationUser = null;

        $timeout(function () {
            if (self.escalationUserId) {
                self.selectedEscalationUser = _.filter(self.escalationUsers, function (wfUser) {
                    return wfUser.ouUSerId === self.escalationUserId.ouUSerId;
                })[0];
            }
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

        /**
         * close dialog
         */
        self.closeSelectEscalationUser = function () {
            dialog.cancel();
        };

    });
};
