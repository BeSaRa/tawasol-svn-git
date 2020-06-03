module.exports = function (app) {
    app.factory('FollowupBook', function (CMSModelInterceptor,
                                          langService,
                                          Indicator,
                                          Information,
                                          viewDocumentService,
                                          Lookup,
                                          generator) {
        'ngInject';
        return function FollowupBook(model) {
            var self = this,
                followUpUserService,
                managerService,
                correspondenceService;
            self.id = null;
            self.actionDate = null;
            self.commentList = null;
            self.docClassId = null;
            self.docDate = null;
            self.docFullSerial = null;
            self.docSubject = null;
            self.docType = null;
            self.folderId = null;
            self.followupDate = null;
            self.ou = null;
            self.ouInfo = null;
            self.priorityLevel = null;
            self.refDocNumber = null;
            self.registeryOU = null;
            self.regouInfo = null;
            self.securityLevel = null;
            self.siteInfo = null;
            self.status = null;
            self.updatedBy = null;
            self.updatedByInfo = null;
            self.updatedOn = null;
            self.userId = null;
            self.userInfo = null;
            self.userOUID = null;
            self.userOuInfo = null;
            self.vsId = null;
            // every model has required fields
            // if you don't need to make any required fields leave it as an empty array
            var requiredFields = [];

            if (model)
                angular.extend(this, model);

            /**
             * @description to get documentClass,vsId.
             * @return {{documentClass: *, vsId: *}}
             */
            FollowupBook.prototype.getInfo = function () {
                return correspondenceService.getCorrespondenceInformation(this);
            };
            /**
             *  setCorrespondenceService
             * @param service
             * @returns {*}
             */
            FollowupBook.prototype.setCorrespondenceService = function (service) {
                correspondenceService = service;
                return this;
            };
            /**
             *  setManagerService
             * @param service
             * @returns {*}
             */
            FollowupBook.prototype.setManagerService = function (service) {
                managerService = service;
                return this;
            };
            /**
             * setFollowUpUserService
             * @param service
             * @returns {*}
             */
            FollowupBook.prototype.setFollowUpUserService = function (service) {
                followUpUserService = service;
                return this;
            };
            /**
             * @description Set the main site sub site string to display/sort in the grid
             * @returns {*}
             */
            FollowupBook.prototype.setMainSiteSubSiteString = function () {
                this.mainSiteSubSiteString = new Information({
                    arName: '',
                    enName: ''
                });
                if (this.getInfo().documentClass !== 'internal' && this.siteInfo) {
                    var mainSite = new Information(this.siteInfo.mainSite);
                    var subSite = (this.siteInfo.subSite) ? new Information(this.siteInfo.subSite) : null;

                    this.mainSiteSubSiteString.arName = mainSite.getTranslatedNameByLang('ar') + (subSite ? (' - ' + subSite.getTranslatedNameByLang('ar')) : '');
                    this.mainSiteSubSiteString.enName = mainSite.getTranslatedNameByLang('en') + (subSite ? (' - ' + subSite.getTranslatedNameByLang('en')) : '');
                }
                return this;
            };

            /**
             * @description Get the translated correspondence site info.
             * @returns {string}
             */
            FollowupBook.prototype.getTranslatedCorrespondenceSiteInfo = function () {
                return this.mainSiteSubSiteString.getTranslatedName();
            };

            FollowupBook.prototype.hasContent = function () {
                return true;
            };

            FollowupBook.prototype.getFollowupDate = function (returnString) {
                return returnString ? generator.getDateFromTimeStamp(this.followupDate) : this.followupDate;
            };

            var indicator = new Indicator();
            FollowupBook.prototype.getDocClassIndicator = function (docType) {
                return indicator.getDocClassIndicator(docType);
            };

            FollowupBook.prototype.getSecurityLevelIndicator = function (securityLevel) {
                return indicator.getSecurityLevelIndicator(securityLevel);
            };

            FollowupBook.prototype.getPriorityLevelIndicator = function (priorityLevel) {
                return indicator.getPriorityLevelIndicator(priorityLevel);
            };

            FollowupBook.prototype.getFollowupDateIndicator = function (followupDate) {
                return indicator.getFollowUpDateIndicator(followupDate);
            };

            /**
             * @description Get the indicator to show followup date of book. its not showing info for correspondence site followup date
             * @param followupDate
             * @returns {Indicator}
             */
            FollowupBook.prototype.getSiteFollowupDueDateIndicator = function (followupDate) {
                return indicator.getSiteFollowUpDueDateIndicator(this.followupDate);
            };

            FollowupBook.prototype.viewFromQueue = function (actions, queueName, $event, viewOnly) {
                return viewDocumentService.viewQueueDocument(this, actions, queueName, $event, viewOnly);
            };

            FollowupBook.prototype.terminate = function (ignoreMessage, $event) {
                return followUpUserService.terminateFollowup(this, $event);
            };

            FollowupBook.prototype.getTranslatedName = function () {
                return this.docSubject;
            };

            /**
             * @description Get the localization of field as Yes or No instead of true or false
             * @param fieldName
             * @returns {string}
             */
            FollowupBook.prototype.getTranslatedYesNo = function (fieldName) {
                return this[fieldName] ? langService.get('yes') : langService.get('no');
            };

            FollowupBook.prototype.manageDocumentComments = function ($event) {
                var info = this.getInfo();
                return managerService.manageDocumentComments(this, info.vsId, info.title, $event);
            };

            FollowupBook.prototype.openSendSMSDialog = function (mobileNumber, $event) {
                return correspondenceService.openSendSMSDialog(this, mobileNumber, $event);
            };

            FollowupBook.prototype.sendReminderEmail = function (email, $event) {
                return followUpUserService.sendReminderEmail(this, email, $event);
            };

            FollowupBook.prototype.getFolderId = function () {
                return this.folderId;
            };

            FollowupBook.prototype.addToFolder = function (showRoot, $event) {
                return followUpUserService.showAddFollowupBookToFolder(this, showRoot, $event);
            };


            // don't remove CMSModelInterceptor from last line
            // should be always at last thing after all methods and properties.
            CMSModelInterceptor.runEvent('FollowupBook', 'init', this);
        }
    })
};
