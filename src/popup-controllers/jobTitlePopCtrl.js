module.exports = function (app) {
    app.controller('jobTitlePopCtrl', function (lookupService,
                                                jobTitleService,
                                                jobTitle,
                                                $q,
                                                langService,
                                                toast,
                                                dialog,
                                                editMode,
                                                JobTitle, 
                                                validationService, 
                                                generator) {
        'ngInject';
        var self = this;
        self.controllerName = 'jobTitlePopCtrl';
        self.editMode = editMode;
        self.jobTitle = jobTitle;
        self.model = angular.copy(self.jobTitle);
        self.lookupStrKey = angular.copy(self.jobTitle.lookupStrKey);

        self.jobTitlePops = jobTitle;
        self.validateLabels = {
            arName: 'arabic_name',
            enName: 'english_name',
            itemOrder: 'item_order',
            status: 'status',
            lookupStrKey: 'code'
        };
        self.promise = null;
        self.selecteds = [];
        self.addJobTitleFromCtrl = function () {
            validationService
                .createValidation('ADD_JOB_TITLE')
                .addStep('check_required', true, generator.checkRequiredFields, self.jobTitle, function (result) {
                    return !result.length;
                })
                .notifyFailure(function (step, result) {
                    var labels = _.map(result, function (label) {
                        return self.validateLabels[label];
                    });
                    generator.generateErrorFields('check_this_fields', labels);
                })
                .addStep('check_duplicate', true, jobTitleService.checkDuplicateJobTitle, [self.jobTitle, false], function (result) {
                    return !result;
                }, true)
                .notifyFailure(function () {
                    toast.error(langService.get('name_lookupstringkey_duplicate'));
                })
                .validate()
                .then(function () {
                    jobTitleService.addJobTitle(self.jobTitle).then(function (result) {
                        dialog.hide(result);
                    });
                })
                .catch(function () {

                })
        };
        /**
         *
         */
        self.editJobTitleFromCtrl = function () {
          //  self.jobTitle.lookupStrKey = self.lookupStrKey;
            validationService
                .createValidation('EDIT_JOB_TITLE')
                .addStep('check_required', true, generator.checkRequiredFields, self.jobTitle, function (result) {
                    return !result.length;
                })
                .notifyFailure(function (step, result) {
                    var labels = _.map(result, function (label) {
                        return self.validateLabels[label];
                    });
                    generator.generateErrorFields('check_this_fields', labels);
                })
                .addStep('check_duplicate', true, jobTitleService.checkDuplicateJobTitle, [self.jobTitle, true], function (result) {
                    return !result;
                }, true)
                .notifyFailure(function () {
                    toast.error(langService.get('name_lookupstringkey_duplicate'));
                })
                .validate()
                .then(function () {
                    jobTitleService.updateJobTitle(self.jobTitle).then(function () {
                        dialog.hide(self.jobTitle);
                    });
                })
                .catch(function () {

                })
        };
        /**
         * @description close the popup
         */
        self.closePopUp = function () {
            dialog.cancel();
        }
    });
};