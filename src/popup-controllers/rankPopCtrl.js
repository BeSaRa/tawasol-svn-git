module.exports = function (app) {
    app.controller('rankPopCtrl', function (lookupService,
                                                rankService,
                                                rank,
                                                $q,
                                                langService,
                                                toast,
                                                dialog,
                                                editMode,
                                                Rank,
                                                validationService,
                                                generator) {
        'ngInject';
        var self = this;
        self.controllerName = 'rankPopCtrl';
        self.editMode = editMode;
        self.rank = rank;
        self.model = angular.copy(self.rank);
        self.lookupStrKey = angular.copy(self.rank.lookupStrKey);
        /**
         *@description All s
         */
        self.rankPops = rank;
        self.validateLabels = {
            arName: 'arabic_name',
            enName: 'english_name',
            itemOrder: 'item_order'
        };
        self.promise = null;
        self.selecteds = [];
        self.addRankFromCtrl = function () {
            self.rank.lookupStrkey = self.lookupStrKey;
            validationService
                .createValidation('ADD_RANK')
                .addStep('check_required', true, generator.checkRequiredFields, self.rank, function (result) {
                    return !result.length;
                })
                .notifyFailure(function (step, result) {
                    var labels = _.map(result, function (label) {
                        return self.validateLabels[label];
                    });
                    generator.generateErrorFields('check_this_fields', labels);
                })
                .addStep('check_duplicate', true, rankService.checkDuplicateRank, [self.rank, false], function (result) {
                    return !result;
                }, true)
                .notifyFailure(function () {
                    toast.error(langService.get('name_lookupstringkey_duplicate'));
                })
                .validate()
                .then(function () {
                    rankService.addRank(self.rank).then(function () {
                        dialog.hide(self.rank);
                    });
                })
                .catch(function () {

                })
        };
        /**
         *
         */
        self.editRankFromCtrl = function () {
            validationService
                .createValidation('EDIT_RANK')
                .addStep('check_required', true, generator.checkRequiredFields, self.rank, function (result) {
                    return !result.length;
                })
                .notifyFailure(function (step, result) {
                    var labels = _.map(result, function (label) {
                        return self.validateLabels[label];
                    });
                    generator.generateErrorFields('check_this_fields', labels);
                })
                .addStep('check_duplicate', true, rankService.checkDuplicateRank, [self.rank, true], function (result) {
                    return !result;
                }, true)
                .notifyFailure(function () {
                    toast.error(langService.get('name_duplication_message'));
                })
                .validate()
                .then(function () {
                    rankService.updateRank(self.rank).then(function () {
                        dialog.hide(self.rank);
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