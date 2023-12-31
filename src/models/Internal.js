module.exports = function (app) {
    app.factory('Internal', function (CMSModelInterceptor,
                                      langService,
                                      generator,
                                      Correspondence,
                                      dialog,
                                      queueStatusService,
                                      Indicator) {
            'ngInject';
            return function Internal(model) {
                var self = this, correspondenceService, exportData = {
                    label_serial: 'docFullSerial',
                    subject: 'docSubject',
                    priority_level: function () {
                        return this.priorityLevel.getTranslatedName();
                    },
                    label_document_type: function () {
                        if (this.docTypeInfo && this.docTypeInfo.hasOwnProperty('id') && this.docTypeInfo.id) {
                            return this.docTypeInfo.getTranslatedName();
                        } else if (this.docType && this.docType.hasOwnProperty('id') && this.docType.id) {
                            return this.docType.getTranslatedName();
                        }
                        return '';
                    },
                    creator: function () {
                        return this.creatorInfo.getTranslatedName();
                    },
                    created_by: function () {
                        if (typeof this.createdBy === 'string') {
                            return this.createdBy;
                        }
                        return this.createdBy.getTranslatedName();
                    },
                    created_on: 'createdOn',
                    security_level: function () {
                        return this.securityLevel.getTranslatedName();
                    },
                    deleted_by: function () {
                        return this.lastModifierInfo.getTranslatedName();
                    },
                    deleted_on: 'lastModified',
                    last_modifier: function () {
                        return this.lastModifierInfo.getTranslatedName();
                    }
                };


                Correspondence.call(this);
                self.docClassName = 'Internal';
                self.classDescription = 'Internal';
                self.internalDocType = 1;
                self.docStatus = 2; // by default
                self.fromEditOnDesktop = false;

                /*These fields come from common correspondence model. The below fields are not in Internal model*/
                delete self.exportInfo;

                // every model has required fields
                // if you don't need to make any required fields leave it as an empty array
                var requiredFields = [];


                if (model)
                    angular.extend(this, model);


                var indicator = new Indicator();


                Internal.prototype.getExportedData = function () {
                    return exportData;
                };

                Internal.prototype.getIsPaperIndicator = function () {
                    return indicator.getIsPaperIndicator(this.addMethod);
                };

                Internal.prototype.getSecurityLevelIndicator = function (securityLevel) {
                    return indicator.getSecurityLevelIndicator(securityLevel);
                };

                Internal.prototype.getDocClassIndicator = function () {
                    return indicator.getDocClassIndicator('internal');
                };

                Internal.prototype.getPriorityLevelIndicator = function (priorityLevel) {
                    return indicator.getPriorityLevelIndicator(priorityLevel);
                };
                Internal.prototype.isCompositeSites = function () {
                    return false;
                };
                Internal.prototype.isInternalPersonal = function () {
                    return this.internalDocType === 0;
                };


                Internal.prototype.launchWorkFlowAndCheckApprovedInternal = function ($event, action, tab) {
                    correspondenceService = this.getCorrespondenceService();
                    var info = this.getInfo();
                    var self = this;

                    // internal electronic and not approved
                    if (info.documentClass.toLowerCase() === 'internal' && info.docStatus < 24 && !info.isPaper) {
                        return dialog.confirmMessage(langService.get("confirm_launch_document_has_active_workflow")).then(function () {
                            correspondenceService.launchCorrespondenceWorkflow(self, $event, action, tab);
                        })
                    } else {
                        return correspondenceService.launchCorrespondenceWorkflow(this, $event, action, tab);
                    }
                };
                Internal.prototype.saveCreateReplyDocument = function (status, vsId) {
                    correspondenceService = this.getCorrespondenceService();
                    if (status)
                        this.docStatus = queueStatusService.getDocumentStatus(status);
                    return correspondenceService.addCreateReplyCorrespondence(this, vsId);
                };
                Internal.prototype.saveCreateReplyDocumentWithContent = function (information, vsId, sendToReview) {
                    correspondenceService = this.getCorrespondenceService();
                    if (sendToReview)
                        this.docStatus = 4;
                    return correspondenceService.addCreateReplyCorrespondenceWithContent(this, information, vsId);
                };
                Internal.prototype.openSendFaxDialog = function ($event) {
                    correspondenceService = this.getCorrespondenceService();
                    return correspondenceService.openSendFaxDialog(this, $event);
                };


                // don't remove CMSModelInterceptor from last line
                // should be always at last thing after all methods and properties.
                CMSModelInterceptor.runEvent('Internal', 'init', this);
            }
        }
    )
};
