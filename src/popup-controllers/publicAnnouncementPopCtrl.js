module.exports = function (app) {
    app.controller('publicAnnouncementPopCtrl', function (publicAnnouncementService,
                                                          _,
                                                          editMode,
                                                          toast,
                                                          PublicAnnouncement,
                                                          validationService,
                                                          generator,
                                                          dialog,
                                                          langService,
                                                          publicAnnouncement,
                                                          moment) {
        'ngInject';
        var self = this;
        self.controllerName = 'publicAnnouncementPopCtrl';
        self.editMode = editMode;
        self.publicAnnouncement = angular.copy(publicAnnouncement);
        self.model = angular.copy(publicAnnouncement);

        self.validateLabels = {
            arSubject: 'arabic_subject',
            enSubject: 'english_subject_name',
            arBody: 'arabic_body_text',
            enBody: 'english_body_text',
            itemOrder: 'item_order',
            status: 'status'
        };

        var today = new Date();
        self.currentDate = new Date(today.getFullYear(), today.getMonth(), today.getDate());

        self.alwaysActive = false;
        if (self.editMode) {
            self.alwaysActive = true;
            if (self.model.startDate && self.model.endDate) {
                self.alwaysActive = false;
            }

            // var today = new Date();
            self.isStatusDisabled = moment(self.model.endDate, "YYYY-MM-DD").valueOf() < moment(new Date(today.getFullYear(), today.getMonth(), today.getDate()), "YYYY-MM-DD").valueOf();

            // self.currentDate = new Date(today.getFullYear(), today.getMonth(), today.getDate());
            var currentDate = self.currentDate.getFullYear() + "-" + (self.currentDate.getMonth() + 1) + "-" + self.currentDate.getDate();

            if (self.model.startDate && typeof self.model.startDate !== "string") {
                self.model.startDate = moment(self.model.startDate).format('YYYY-MM-DD');
            }

            var IsStartDateGreaterThanCurrentDate = (self.model.startDate ? moment(self.model.startDate, "YYYY-MM-DD").valueOf() : null) > (moment(currentDate, "YYYY-MM-DD").valueOf());
            if (IsStartDateGreaterThanCurrentDate) {
                self.currentDate = new Date(self.model.startDate);
            }
        }


        /**
         * @description Add new public announcement
         */
        self.addPublicAnnouncementFromCtrl = function () {
            //console.log(self.publicAnnouncement);
            validationService
                .createValidation('ADD_PUBLIC_ANNOUNCEMENT')
                .addStep('check_required', true, generator.checkRequiredFields, self.publicAnnouncement, function (result) {
                    return !result.length;
                })
                .notifyFailure(function (step, result) {
                    var labels = _.map(result, function (label) {
                        return self.validateLabels[label];
                    });
                    generator.generateErrorFields('check_this_fields', labels);
                })
                .addStep('check_duplicate', true, publicAnnouncementService.checkDuplicatePublicAnnouncement, [self.publicAnnouncement, false], function (result) {
                    return !result;
                }, true)
                .notifyFailure(function () {
                    toast.error(langService.get('name_duplication_message'));
                })
                .addStep('check_start_date', true, self.checkStartDate, self.publicAnnouncement, function (result) {
                    return result;
                })
                .notifyFailure(function (step, result) {
                    var currentDate = self.currentDate.getFullYear() + "-" + (self.currentDate.getMonth() + 1) + "-" + self.currentDate.getDate();
                    toast.error(langService.get('max_current_date').replace(':today', currentDate));
                })
                .validate()
                .then(function () {
                    if (self.alwaysActive) {
                        self.publicAnnouncement.startDate = null;
                        self.publicAnnouncement.endDate = null;
                    }
                    publicAnnouncementService.addPublicAnnouncement(self.publicAnnouncement).then(function () {
                        toast.success(langService.get('add_success').change({name: self.publicAnnouncement.getNames()}));
                        dialog.hide();
                    });
                })
                .catch(function () {

                });
        };

        /**
         * @description Edit public announcement
         */
        self.editPublicAnnouncementFromCtrl = function () {
            validationService
                .createValidation('EDIT_PUBLIC_ANNOUNCEMENT')
                .addStep('check_required', true, generator.checkRequiredFields, self.publicAnnouncement, function (result) {
                    return !result.length;
                })
                .notifyFailure(function (step, result) {
                    var labels = _.map(result, function (label) {
                        return self.validateLabels[label];
                    });
                    generator.generateErrorFields('check_this_fields', labels);
                })
                .addStep('check_duplicate', true, publicAnnouncementService.checkDuplicatePublicAnnouncement, [self.publicAnnouncement, true], function (result) {
                    return !result;
                }, true)
                .notifyFailure(function () {
                    toast.error(langService.get('name_duplication_message'));
                })
                .addStep('check_start_date', true, self.checkStartDate, self.publicAnnouncement, function (result) {
                    return result;
                })
                .notifyFailure(function (step, result) {
                    var currentDate = self.currentDate.getFullYear() + "-" + (self.currentDate.getMonth() + 1) + "-" + self.currentDate.getDate();
                    toast.error(langService.get('max_current_date').replace(':today', currentDate));
                })
                .validate()
                .then(function () {
                    if (self.alwaysActive) {
                        self.publicAnnouncement.startDate = null;
                        self.publicAnnouncement.endDate = null;
                    }
                    publicAnnouncementService.updatePublicAnnouncement(self.publicAnnouncement).then(function () {
                        toast.success(langService.get('edit_success').change({name: self.publicAnnouncement.getNames()}));
                        dialog.hide();
                    });
                })
                .catch(function () {

                });
        };

        /**
         * @description check if start date greeter or equal than today
         * @param announcement
         * @returns {boolean}
         */
        self.checkStartDate = function (announcement) {
            return moment(announcement.startDate, "YYYY-MM-DD").valueOf() >= moment(new Date(today.getFullYear(), today.getMonth(), today.getDate()), "YYYY-MM-DD").valueOf();
        };

        /**
         * @description Close the popup
         */
        self.closePublicAnnouncementPopupFromCtrl = function () {
            dialog.cancel();
        };

        //on change of start date if date is null or start date is greater than end date, then end date will become null//
        /*self.onStartDateChange = function () {
            self.publicAnnouncement.startDate = self.startDate;

            var today = new Date();
            self.currentDate = new Date(today.getFullYear(), today.getMonth(), today.getDate());

            if (self.publicAnnouncement.startDate && typeof self.publicAnnouncement.startDate !== "string") {
                self.publicAnnouncement.startDate = moment(self.publicAnnouncement.startDate).format('YYYY-MM-DD');
            }

            if (self.publicAnnouncement.endDate && typeof self.publicAnnouncement.endDate !== "string") {
                self.publicAnnouncement.endDate = moment(self.publicAnnouncement.endDate).format('YYYY-MM-DD');
            }

            /!*var currentDate = self.currentDate.getFullYear() + "-" + (self.currentDate.getMonth() + 1) + "-" + self.currentDate.getDate();
             //compare start date with current date to set min date for end date
             var IsStartDateGreaterThanCurrentDate = (self.publicAnnouncement.startDate ? moment(self.publicAnnouncement.startDate, "YYYY-MM-DD").valueOf() : null) > (moment(currentDate, "YYYY-MM-DD").valueOf());
             if (IsStartDateGreaterThanCurrentDate) {
             self.currentDate = new Date(self.publicAnnouncement.startDate);
             }*!/

            if (self.publicAnnouncement.startDateGreaterThanCurrentDate()) {
                self.currentDate = new Date(self.publicAnnouncement.startDate);
            }

            //var IsStartDateGreater = self.compareDate(self.publicAnnouncement, "startDate", "endDate");
            if (!self.publicAnnouncement.startDate || (!self.publicAnnouncement.endDateGreaterThanStartDate() && self.publicAnnouncement.startDateGreaterThanCurrentDate())) {
                self.publicAnnouncement.endDate = null;
                self.endDate = null;
            }
        };*/

        self.onEndDateChange = function () {
            self.isStatusDisabled = false;
            if (self.publicAnnouncement.endDate) {
                var today = new Date();
                self.isStatusDisabled = moment(self.publicAnnouncement.endDate, "YYYY-MM-DD").valueOf() < moment(new Date(today.getFullYear(), today.getMonth(), today.getDate()), "YYYY-MM-DD").valueOf();
                if (self.isStatusDisabled)
                    self.publicAnnouncement.status = false;
            }
        };

        self.onAlwaysActiveChange = function () {
            if (self.alwaysActive) {
                self.publicAnnouncement.startDate = null;
                self.publicAnnouncement.endDate = null;
            }
        };

        /*/!**
         * common function to compare start date and end date, if date1 is greater than date2 then it will return true else false
         * @param model
         * @param date1
         * @param date2
         * @returns {boolean}
         *!/
         self.compareDate = function (model, date1, date2) {
         var startDate = model[date1] ? new moment(model[date1]) : null;
         var endDate = model[date2] ? new moment(model[date2]) : null;

         if (!startDate || !endDate)
         return false;

         return moment(startDate, "YYYY-MM-DD").valueOf() <= moment(endDate, "YYYY-MM-DD").valueOf();
         };*/

    });
};