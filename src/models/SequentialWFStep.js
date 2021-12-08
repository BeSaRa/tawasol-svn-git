module.exports = function (app) {
    app.factory('SequentialWFStep', function (CMSModelInterceptor,
                                              langService,
                                              _,
                                              generator) {
        'ngInject';
        return function SequentialWFStep(model) {
            var self = this,
                sequentialWorkflowService;

            self.id = null;
            self.arName = null;
            self.enName = null;
            self.stepType = null;
            self.toUserId = null;
            self.toOUID = null;// contains the ouId from selected user(ouAppUser)
            self.actionId = null;
            self.sLADueDay = null;
            self.actionType = null;
            self.sendSMS = null;
            self.sendEmail = null;
            self.userComment = null;
            self.itemOrder = null;
            self.sequentialWFId = null;
            self.uiOuId = null;  // selected regOu.
            self.toOUInfo = null;
            self.toUserInfo = null;
            self.proxyUserInfo = null;

            self.userIdAndOuId = null; // combination of user and ouId. To be deleted before sending
            self.isSelectedForSubSeqWF = false;

            // every model has required fields
            // if you don't need to make any required fields leave it as an empty array
            var requiredFields = [
                'arName',
                'enName',
                'itemOrder',
                'stepType'
            ];

            if (model)
                angular.extend(this, model);

            SequentialWFStep.prototype.setSequentialWorkflowService = function (service) {
                sequentialWorkflowService = service;
            };

            /**
             * @description Get all required fields
             * @return {Array|requiredFields}
             */
            SequentialWFStep.prototype.getRequiredFields = function () {
                return requiredFields;
            };

            SequentialWFStep.prototype.getId = function () {
                return this.id;
            };

            /**
             * @description Get the concatenated arabic name and english name with separator passed for sequential workflow step. If no separator is passed, it will take hyphen(-)
             * @param separator
             * @returns {string}
             */
            SequentialWFStep.prototype.getNames = function (separator) {
                return this.arName + ' ' + (separator ? separator : '-') + ' ' + this.enName;
            };

            /**
             * @description Get the translated arabic or english name according to current language for sequential workflow step. If reverse is passed, it will return the name in language other than current language
             * @param reverse
             * @returns {string}
             */
            SequentialWFStep.prototype.getTranslatedName = function (reverse) {
                return langService.current === 'ar' ? (reverse ? this.enName : this.arName) : (reverse ? this.arName : this.enName);
            };

            /**
             * @description Get the name of record with passed language name
             * @param language
             * @returns {string}
             */
            SequentialWFStep.prototype.getNameByLanguage = function (language) {
                return this[language + 'Name'];
            };

            SequentialWFStep.prototype.getTranslatedUserName = function () {
                if (!this.toUserInfo) {
                    return '';
                }
                return this.toUserInfo[langService.current + 'Name'];
            };

            SequentialWFStep.prototype.getTranslatedOuName = function () {
                if (!this.toOUInfo) {
                    return '';
                }
                return this.toOUInfo[langService.current + 'Name'];
            };

            SequentialWFStep.prototype.getTranslatedUserAndOuName = function () {
                if (!this.getTranslatedUserName()) {
                    return '';
                }
                return this.getTranslatedUserName() + ' - ' + this.getTranslatedOuName();
            };

            SequentialWFStep.prototype.isNewStep = function () {
                return !this.id;
            };

            SequentialWFStep.prototype.isSendDocumentStep = function () {
                return this.stepType === sequentialWorkflowService.workflowStepTypes.sendDocument;
            };

            SequentialWFStep.prototype.isAuthorizeAndSendStep = function () {
                return this.stepType === sequentialWorkflowService.workflowStepTypes.authorizeAndSend;
            };

            SequentialWFStep.prototype.isValidStep = function (sequentialWF) {
                return this.isAuthorizeAndSendStep() ? this.isAuthorizeAndSendStepValid(sequentialWF) : this.isSendDocumentStepValid();
            };

            SequentialWFStep.prototype.checkUserRequired = function (sequentialWF) {
                if (this.isSendDocumentStep()) {
                    return true;
                } else if (this.isAuthorizeAndSendStep()) {
                    return !this.isLastStep(sequentialWF);
                } else {
                    return true;
                }
            };

            SequentialWFStep.prototype.isSendDocumentStepValid = function () {
                return !!this.arName && !!this.enName && generator.validRequired(this.itemOrder) && (this.userIdAndOuId)
                    && generator.validRequired(generator.getNormalizedValue(this.actionId, 'id'));
            };

            SequentialWFStep.prototype.isAuthorizeAndSendStepValid = function (sequentialWF) {
                var isValid = !!this.arName && !!this.enName && generator.validRequired(this.itemOrder);

                if (!isValid) {
                    return false;
                }
                if (!this.isLastStep(sequentialWF)) {
                    return !!(this.userIdAndOuId && generator.validRequired(generator.getNormalizedValue(this.actionId, 'id')));
                }
                return true;
            };

            SequentialWFStep.prototype.isLastStep = function (sequentialWF) {
                return this.getStepIndex(sequentialWF) === (sequentialWF.stepRows.length - 1);
            };

            SequentialWFStep.prototype.getStepIndex = function (sequentialWF) {
                return _.findIndex(sequentialWF.stepRows, {itemOrder: this.itemOrder});
            };

            SequentialWFStep.prototype.getStepIcon = function () {
                if (this.isSendDocumentStep()) {
                    return 'account-arrow-right';
                } else if (this.isAuthorizeAndSendStep()) {
                    return 'account-check';
                }
                return '';
            };

            SequentialWFStep.prototype.getStepIconTooltip = function () {
                if (this.isSendDocumentStep()) {
                    return langService.get('seq_send_doc');
                } else if (this.isAuthorizeAndSendStep()) {
                    return langService.get('seq_authorize_and_send_doc');
                }
                return '';
            };

            SequentialWFStep.prototype.isPastSeqWFStep = function (correspondenceRecord) {
                //return this.id < correspondenceRecord.getSeqWFCurrentStepId();
                return this.id && this.id <= correspondenceRecord.getSeqWFCurrentStepId();
            };
            SequentialWFStep.prototype.isCurrentSeqWFStep = function (correspondenceRecord) {
                //return this.id === correspondenceRecord.getSeqWFCurrentStepId();
                return this.id && this.id === correspondenceRecord.getSeqWFNextStepId();
            };
            SequentialWFStep.prototype.isFutureSeqWFStep = function (correspondenceRecord) {
                //return this.id >= correspondenceRecord.getSeqWFNextStepId();
                return this.id && this.id > correspondenceRecord.getSeqWFNextStepId();
            };
            SequentialWFStep.prototype.getUserIdAndOuIdCombination = function () {
                if (this.toUserId && this.toOUID) {
                    return generator.getNormalizedValue(this.toUserId, 'id') + '-' + generator.getNormalizedValue(this.toOUID, 'id');
                }
                return '';
            };
            SequentialWFStep.prototype.getUserIdFromCombination = function () {
                if (this.userIdAndOuId) {
                    return this.userIdAndOuId.split('-')[0];
                }
                return null;
            };
            SequentialWFStep.prototype.getOuIdFromCombination = function () {
                if (this.userIdAndOuId) {
                    return this.userIdAndOuId.split('-')[1];
                }
                return null;
            };


            // don't remove CMSModelInterceptor from last line
            // should be always at last thing after all methods and properties.
            CMSModelInterceptor.runEvent('SequentialWFStep', 'init', this);
        }
    })
};
