module.exports = function (app) {
    app.factory('Internal', function (CMSModelInterceptor,
                                      langService,
                                      generator,
                                      Correspondence,
                                      dialog,
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
                        return this.docTypeInfo.getTranslatedName();
                    },
                    creator: function () {
                        return this.creatorInfo.getTranslatedName();
                    },
                    created_on: 'createdOn'
                };
                Correspondence.call(this);
                self.docClassName = 'Internal';
                self.classDescription = 'Internal';
                self.internalDocType = null;
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


                Internal.prototype.launchWorkFlowAndCheckApprovedInternal = function ($event, action, tab) {
                    correspondenceService = this.getCorrespondenceService();
                    var info = this.getInfo();
                    if (info.documentClass.toLowerCase() === 'internal' && info.docStatus === 24 || info.isPaper) {
                        return correspondenceService.launchCorrespondenceWorkflow(this, $event, action, tab);
                    } else {
                        return correspondenceService.checkWorkFlowForVsId(info.vsId).then(function (result) {
                            return result ? dialog.infoMessage(langService.get('cannot_launch_document_has_active_workflow')) : correspondenceService.launchCorrespondenceWorkflow(self, $event, action, tab);
                        });
                    }
                };


                // don't remove CMSModelInterceptor from last line
                // should be always at last thing after all methods and properties.
                CMSModelInterceptor.runEvent('Internal', 'init', this);
            }
        }
    )
}
;
