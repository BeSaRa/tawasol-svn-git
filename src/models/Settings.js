module.exports = function (app) {
    app.factory('Settings', function (CMSModelInterceptor,
                                      generator,
                                      Theme) {
        'ngInject';
        return function Settings(model) {
            var self = this;
            // every model has required fields
            // if you don't need to make any required fields leave it as an empty array
            var requiredFields = [];

            if (model) {
                if (model.theme && model.theme.hasOwnProperty('id'))
                    model.theme = generator.interceptReceivedInstance('Theme', new Theme(model.theme));
                angular.extend(this, model);
            }


            /**
             * get all required fields
             * @return {Array|requiredFields}
             */
            Settings.prototype.getRequiredFields = function () {
                return requiredFields;
            };
            /**
             * @description check if one of export options enabled.
             * @returns {boolean}
             */
            Settings.prototype.hasExportOptions = function () {
                return (this.exportAttachment || this.exportLinkedDoc || this.exportLinkedObj);
            };

            Settings.prototype.canExport = function (property) {
                return !!this['export' + property];
            };
            Settings.prototype.getAvailableTypes = function () {
                return this.fileTypesMap;
            };
            Settings.prototype.getSecurityLevels = function () {
                return this.securityLevels;
            };
            Settings.prototype.isSlowConnectionMode = function () {
                return this.slowConnectionMode;
            };
            Settings.prototype.isAllowEditAfterFirstApprove = function () {
                return this.allowEditAfterFirstApprove;
            };

            Settings.prototype.isDigitalCertificateEnabled = function () {
                return this.digitalCertificateEnabled;
            };

            Settings.prototype.isStampModuleEnabled = function () {
                return this.stampModuleEnabled;
            };

            Settings.prototype.isLimitedCentralUnitAccessEnabled = function () {
                return this.limitedCentralUnitAccess;
            }
            Settings.prototype.isHidePELocksEnabled = function () {
                return this.hidePELocks;
            };

            Settings.prototype.isSendRelatedDocsAllowed = function () {
                return this.wFRelatedBookStatus !== 0;
            };
            Settings.prototype.canSendRelatedDocsToSameDepartmentOnly = function () {
                return this.wFRelatedBookStatus === 2;
            }
            Settings.prototype.isSenderIncomingMailHidden = function () {
                return this.hideSenderIncomingMail;
            }
            Settings.prototype.legacyWorkflowHistoryEnabled = function () {
                return this.legacyWorkflowHistory;
            }
            Settings.prototype.isAllowPrintCorrespondenceReceipt = function () {
                return this.allowPrintCorReceipt;
            }
            Settings.prototype.isLegacySMSCorNotification = function () {
                return this.legacySMSCorNotification;
            }
            Settings.prototype.isAllowToSendToMinister = function () {
                return this.sendMinisterAsNewWF;
            }
            Settings.prototype.getDefaultMinisterAction = function () {
                return this.defaultMinisterAction;
            }
            Settings.prototype.getDefaultMinisterAssistantAction = function () {
                return this.defaultMinisterAssistantAction;
            }
            // don't remove CMSModelInterceptor from last line
            // should be always at last thing after all methods and properties.
            CMSModelInterceptor.runEvent('Settings', 'init', this);
        }
    })
};
