module.exports = function (app) {
    app.controller('filterPopCtrl', function (filter,
                                              dialog,
                                              actions,
                                              senders,
                                              $scope,
                                              langService,
                                              LangWatcher,
                                              lookupService,
                                              editMode) {
        'ngInject';
        var self = this;
        self.controllerName = 'filterPopCtrl';
        LangWatcher($scope);
        self.editMode = editMode;
        self.model = angular.copy(filter);
        self.filter = angular.copy(filter);

        self.senders = senders;
        self.actions = actions;
        self.documentTypes = lookupService.returnLookups(lookupService.documentClass);

        //console.log(lookupService.returnLookups(lookupService.inboxFilterKey));

        /**
         * @description save user filter
         * @param $event
         */
        self.saveUserFilterFromCtrl = function ($event) {
            self.filter.saveUserFilter().then(function (filter) {
                self.filter = angular.copy(self.filter);
                dialog.hide(filter);
            })
        };


        self.receivedDateFilterTypes = [
            {
                optionLangKey: 'none',
                optionValue: null
            },
            {
                optionLangKey: 'user_inbox_filter_recieve_date_greater_than',
                optionValue: 4
            },
            {
                optionLangKey: 'user_inbox_recieve_date_less_than',
                optionValue: 6
            },
            {
                optionLangKey: 'user_inbox_filter_recieved_date_between',
                optionValue: 11
            }
        ];


        self.changeReceivedDateType = function ($event) {
            self.filter.ui['key_4'].value = null;
            self.filter.ui['key_6'].value = null;
            self.filter.ui['key_11'].value1 = null;
            self.filter.ui['key_11'].value2 = null;
        };

        self.checkDisabled = function (form) {
            var hasCriteria = false, record, typeOfRecord;
            for (var key in self.filter.ui) {
                if (!self.filter.ui.hasOwnProperty(key))
                    continue;

                typeOfRecord = typeof self.filter.ui[key].value;
                record = self.filter.ui[key];

                if (typeOfRecord === 'string')
                    record.value = record.value.trim();

                if (typeOfRecord !== 'undefined' && record.value !== null) {
                    hasCriteria = true;
                    break;
                }
            }
            return form.$invalid || !hasCriteria;
        };

        self.resetFilterForm = function (form, $event) {
            self.filter = angular.copy(self.model);
            self.filter.ui['key_8'].value = (self.filter.ui['key_8'].value === '-2000000000000L');
            form.$setUntouched();
        };

        self.closeFilterForm = function ($event) {
            dialog.cancel();
        };
    });
};