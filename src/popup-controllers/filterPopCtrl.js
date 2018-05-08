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

        self.getMaxReceivedStartDate = function () {
            var endDate = new Date(self.filter.ui.key_11.value2);
            self.calculatedMaxReceivedStartDate = endDate ? new Date(endDate.setDate(endDate.getDate() - 1)) : null;
        };
        self.calculatedMaxReceivedStartDate = self.filter.ui.key_11.value1 ? self.filter.ui.key_11.value1 : self.getMaxReceivedStartDate();

        self.getMinReceivedEndDate = function () {
            var startDate = new Date(self.filter.ui.key_11.value1);
            self.calculatedMinReceivedEndDate = startDate ? new Date(startDate.setDate(startDate.getDate() + 1)) : null;
        };
        self.calculatedMinReceivedEndDate = self.filter.ui.key_11.value2 ? self.filter.ui.key_11.value2 : self.getMinReceivedEndDate();

        self.getMaxDueStartDate = function () {
            var endDate = new Date(self.filter.ui.key_10.value2);
            self.calculatedMaxDueStartDate = endDate ? new Date(endDate.setDate(endDate.getDate() - 1)) : null;
        };
        self.calculatedMaxDueStartDate = self.filter.ui.key_10.value1 ? self.filter.ui.key_10.value1 : self.getMaxDueStartDate();

        self.getMinDueEndDate = function () {
            var startDate = new Date(self.filter.ui.key_10.value1);
            self.calculatedMinDueEndDate = startDate ? new Date(startDate.setDate(startDate.getDate() + 1)) : null;
        };
        self.calculatedMinDueEndDate = self.filter.ui.key_10.value2 ? self.filter.ui.key_10.value2 : self.getMinDueEndDate();




        self.checkDisabled = function (form) {
            var hasCriteria = false, record, typeOfRecord = 'undefined', recordValue;
            for (var key in self.filter.ui) {
                if (!self.filter.ui.hasOwnProperty(key))
                    continue;

                record = self.filter.ui[key];
                if (record.hasOwnProperty('value') && record.value) {
                    typeOfRecord = typeof record.value;
                    recordValue = record.value;
                }
                else if (record.hasOwnProperty('value1') && record.value1) {
                    typeOfRecord = typeof record.value1;
                    recordValue = record.value1;
                }

                if (typeOfRecord === 'string')
                    recordValue = recordValue.trim();

                if (typeOfRecord !== 'undefined' && recordValue !== null) {
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