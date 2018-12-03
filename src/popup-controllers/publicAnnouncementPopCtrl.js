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

        var today = new Date();
        self.currentDate = new Date(today.getFullYear(), today.getMonth(), today.getDate());
        self.alwaysActive = false;
        if (self.editMode) {
            self.alwaysActive = !(self.model.startDate && self.model.endDate);
            self.isStatusDisabled = moment(self.model.endDate, "YYYY-MM-DD").valueOf() < moment(self.currentDate, "YYYY-MM-DD").valueOf();
        }

        self.validateLabels = {
            arSubject: 'arabic_subject',
            enSubject: 'english_subject_name',
            arBody: 'arabic_body_text',
            enBody: 'english_body_text',
            itemOrder: 'item_order',
            status: 'status'
        };

        /**
         * @description Add new public announcement
         */
        self.addPublicAnnouncementFromCtrl = function () {
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
                    toast.error(langService.get('max_current_date').change({today : generator.convertDateToString(self.currentDate)}));
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
                    toast.error(langService.get('max_current_date').change({today : generator.convertDateToString(self.currentDate)}));
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
         * @description check if start date greater or equal than today
         * @param announcement
         * @returns {boolean}
         */
        self.checkStartDate = function (announcement) {
            return moment(announcement.startDate, "YYYY-MM-DD").valueOf() >= moment(self.currentDate, "YYYY-MM-DD").valueOf();
        };

        /**
         * @description Close the popup
         */
        self.closePublicAnnouncementPopupFromCtrl = function () {
            dialog.cancel();
        };

        /**
         * @description to disable status switch if end date < current date
         * @param publicAnnouncement
         * @returns {boolean}
         */
        self.disableStatus = function (publicAnnouncement) {
            if (publicAnnouncement.endDate)
                return moment(publicAnnouncement.endDate, "YYYY-MM-DD").valueOf() < moment(self.currentDate, "YYYY-MM-DD").valueOf();
            else
                return false;
        };

        self.onAlwaysActiveChange = function () {
            if (self.alwaysActive) {
                self.publicAnnouncement.startDate = null;
                self.publicAnnouncement.endDate = null;
            }
        };

    });
};