module.exports = function (app) {
    app.factory('GlobalSetting', function (CMSModelInterceptor,
                                           BarcodeSetting,
                                           langService) {
        'ngInject';
        return function GlobalSetting(model) {
            var self = this;
            self.id = null;
            self.theme = null;
            self.bannerLogo = null;
            self.loginLogo = null;
            self.rootEntityId = null;
            self.sessionTimeout = 30;
            self.inboxRefreshInterval = 10;
            self.fileSize = null;
            self.fileType = [];
            self.enableMobileAccess = false;
            self.useCentralArchiveInternally = false;
            self.searchAmount = null;
            self.searchAmountLimit = null;
            self.supportPhoneNo = null;
            self.supportEmail = null;
            self.loginAdditionalContent = null;
            self.canChangePassword = false;
            self.copyrightText = null;
            self.showCopyrightText = false;
            self.tamcontent = null;
            self.auditLogin = 0;
            self.auditDocumentView = false;
            self.excludedUsersFromAudit = [];
            self.auditAdminOperation = false;
            self.attachmentInheritSecurity = false;
            self.exportAttachment = false;
            self.exportLinkedDoc = false;
            self.exportDocHistory = false;
            self.exportLinkedObj = false;
            self.securitySchema = null;
            self.defaultExportTypeGrouping = true;
            self.securityLevels = null;
            self.wfsecurity = null;
            self.enableEscalation = false;
            self.escalationNotifySender = false;
            self.escalationNotifyReceiver = false;
            self.deadlineReminder = 0;
            self.enableSMSNotification = false;
            self.enableEmailNotification = false;
            self.sla = null;
            self.escalationProcess = null;
            self.simpleCorsSiteSearch = false;
            //required
            self.barcodeElements = new BarcodeSetting();
            self.deadlineReminderDays = null;
            self.thumbnailMode = 0;
            self.allowSendWFRelatedBook = true;
            self.allowTwoWaysRelatedBook = false;
            self.removeMAIPSecurity = true;
            self.separateActionOnTransfer = false;
            self.defaultDisplayLang = 1;
            self.excludedConversionFileTypes = [];
            self.slowConnectionMode = false;
            self.digitalCertificateEnabled = false;
            self.digitalCertificateMode = null;
            //endregion

            // every model has required fields
            // if you don't need to make any required fields leave it as an empty array
            var requiredFields = [
                'searchAmount',
                'searchAmountLimit',
                'defaultDisplayLang',
                'inboxRefreshInterval',
                'sessionTimeout',
                'thumbnailMode',
                'enableMobileAccess',
                'canChangePassword',
                'showCopyrightText',
                'copyrightText',
                'tamcontent',
                'auditLogin',
                'auditDocumentView',
                'auditAdminOperation',
                //'excludedUsersFromAudit',
                'attachmentInheritSecurity',
                'exportAttachment',
                'exportLinkedDoc',
                'exportDocHistory',
                'exportLinkedObj',
                'securitySchema',
                'wfsecurity',
                'securityLevels',
                'escalationNotifySender',
                'escalationNotifyReceiver',
                'enableSMSNotification',
                'enableEmailNotification',
                'enableEscalation',
                'useCentralArchiveInternally',
                // 'escalationProcess',
                'simpleCorsSiteSearch',
                'theme'
            ];

            if (model)
                angular.extend(this, model);

            /**
             * @description Get all required fields
             * @return {Array|requiredFields}
             */
            GlobalSetting.prototype.getRequiredFields = function () {
                return requiredFields;
            };

            /**
             * @description Get the concatenated arabic name and english name with separator passed for global setting. If no separator is passed, it will take hyphen(-)
             * @param separator
             * @returns {string}
             */
            GlobalSetting.prototype.getNames = function (separator) {
                return this.arName + ' ' + (separator ? separator : '-') + ' ' + this.enName;
            };

            /**
             * @description Get the translated arabic or english name according to current language for global setting. If reverse is passed, it will return the name in language other than current language
             * @param reverse
             * @returns {string}
             */
            GlobalSetting.prototype.getTranslatedName = function (reverse) {
                return langService.current === 'ar' ? (reverse ? this.enName : this.arName) : (reverse ? this.arName : this.enName);
            };

            /**
             * @description Get the translated true/false as active/inactive or yes/no
             * @param fieldName
             * * @returns {*}
             */
            GlobalSetting.prototype.getTranslatedYesNo = function (fieldName) {
                return this[fieldName] ? langService.get('yes') : langService.get('no');
            };

            GlobalSetting.prototype.getAvailableTypes = function () {
                return this.fileTypesMap;
            };

            GlobalSetting.prototype.getSecurityLevels = function () {
                return this.securityLevels;
            };

            GlobalSetting.prototype.isSlowConnectionMode = function () {
                return this.slowConnectionMode;
            };

            GlobalSetting.prototype.isDigitalCertificateEnabled = function () {
                return this.digitalCertificateEnabled;
            };

            // don't remove CMSModelInterceptor from last line
            // should be always at last thing after all methods and properties.
            CMSModelInterceptor.runEvent('GlobalSetting', 'init', this);
        }
    })
};
