module.exports = function (app) {
    app.run(function (CMSModelInterceptor,
                      moment,
                      workflowActionService,
                      applicationUserService,
                      Classification,
                      CorrespondenceSite,
                      correspondenceService,
                      CorrespondenceSiteType,
                      managerService,
                      ApplicationUser,
                      WorkflowAction,
                      SenderInfo,
                      langService,
                      Organization,
                      downloadService,
                      WorkItemType,
                      lookupService,
                      Information) {
        'ngInject';

        var modelName = 'WorkItem';

        CMSModelInterceptor.whenInitModel(modelName, function (model) {
            model
                .setCorrespondenceService(correspondenceService)
                .setManagerService(managerService)
                .setDownloadService(downloadService);
            model.mainCoreSite = new CorrespondenceSite(model.mainCoreSite);
            model.subCoreSite = new CorrespondenceSite(model.subCoreSite);
            model.siteType = new CorrespondenceSiteType(model.siteType);
            model.senderInfo = new SenderInfo(model.senderInfo);
            model.action = model.action ? new WorkflowAction(model.action) : new WorkflowAction();
            return model;
        });

        CMSModelInterceptor.whenSendModel(modelName, function (model) {
            delete model.generalStepElm.numberOfDays;
            // delete model.senderInfo.domainName;
            // delete model.senderInfo.ouId;
            // delete model.senderInfo.ouArName;
            // delete model.senderInfo.ouEnName;
            delete model.type;
            delete model.department;
            delete model.sender;

            delete model.securityLevelLookup;
            delete model.securityLevelIndicator;
            delete model.priorityLevelLookup;
            delete model.priorityLevelIndicator;
            delete model.attachmentsIndicator;
            delete model.linkedDocsIndicator;
            delete model.tagsIndicator;
            delete model.followupStatusLookup;
            delete model.followUpStatusIndicator;
            delete model.dueDateStatusIndicator;
            delete model.dueDateOriginal;
            delete model.docTypeIndicator;
            delete model.isReassignedIndicator;
            delete model.isOpenedIndicator;
            delete model.isPaperIndicator;
            return model;
        });

        CMSModelInterceptor.whenReceivedModel(modelName, function (model) {
            model.generalStepElm.numberOfDays = getNumberOfDays(model.generalStepElm.receivedDate);
            model.generalStepElm.receivedDate ? getDateFromUnixTimeStamp(model.generalStepElm, ["receivedDate"]) : "";

            model.dueDateOriginal = angular.copy(model.generalStepElm.dueDate);
            if (model.generalStepElm.dueDate && model.generalStepElm.dueDate > 0 && model.generalStepElm.dueDate >= moment().unix())
                getDateFromUnixTimeStamp(model.generalStepElm, ["dueDate"]);
            else
                model.generalStepElm.dueDate = "";
            // model.senderInfo.domainName = model.generalStepElm.sender;
            // model.senderInfo.ouId = model.generalStepElm.appUserOUID;
            // model.senderInfo.ouArName = model.registeryOu.arName;
            // model.senderInfo.ouEnName = model.registeryOu.enName;
            model.type = model.generalStepElm.hasOwnProperty('orginality') ? (model.generalStepElm.orginality === 0 ? langService.get('original') : langService.get('copy')) : "";
            // model.department = model.fromRegOu ? model.fromRegOu[langService.current + "Name"] : "";
            //model.type = model.generalStepElm.hasOwnProperty('orginality') ? new WorkItemType(model.generalStepElm.orginality) : "";
            model.department = model.fromRegOu ? new Information(model.fromRegOu) : "";

            model.securityLevelLookup = lookupService.getLookupByLookupKey(lookupService.securityLevel, model.generalStepElm.securityLevel);
            model.securityLevelIndicator = model.securityLevelLookup ? model.getSecurityLevelIndicator(model.securityLevelLookup) : null;

            model.priorityLevelLookup = lookupService.getLookupByLookupKey(lookupService.priorityLevel, model.generalStepElm.priorityLevel);
            model.priorityLevelIndicator = (model.priorityLevelLookup && model.priorityLevelLookup.lookupKey !== 0) ? model.getPriorityLevelIndicator(model.priorityLevelLookup) : null;

            model.attachmentsIndicator = model.generalStepElm.attachementsNO ? model.getAttachmentsIndicator() : null;
            model.linkedDocsIndicator = model.generalStepElm.linkedDocsNO ? model.getLinkedDocumentsIndicator() : null;

            model.followupStatusLookup = lookupService.getLookupByLookupKey(lookupService.followupStatus, model.generalStepElm.followupStatus);
            model.followUpStatusIndicator = model.generalStepElm.followupStatus ? model.getFollowUpStatusIndicator(model.followupStatusLookup) : null;

            model.dueDateStatusIndicator = model.dueDateOriginal ? model.getDueDateStatusIndicator(model.generalStepElm.workFlowName, model.dueDateOriginal) : null;

            model.tagsIndicator = model.generalStepElm.tagsNO ? model.getTagsIndicator(model.generalStepElm.tagsNO) : null;
            model.docTypeIndicator = model.generalStepElm.workFlowName ? model.getDocTypeIndicator(model.generalStepElm.workFlowName) : null;
            model.isReassignedIndicator = model.getReassignedIndicator(model.generalStepElm.isReassigned);
            model.isOpenedIndicator = model.getOpenedIndicator(model.generalStepElm.isOpen);
            model.isPaperIndicator = model.getIsPaperIndicator(model.generalStepElm.addMethod);
            model.exportViaCentralArchiveIndicator = model.getExportViaCentralArchiveIndicator(model.generalStepElm.exportViaCentralArchive);

            model.sender = new Information(model.senderInfo);
            return model;
        });

        /**
         * @description Gets the difference in days between received date and now
         * @param {timestamp} receivedDate
         * @returns {*}
         */
        var getNumberOfDays = function (receivedDate) {
            return (receivedDate) ? -(moment(receivedDate).diff(moment(), 'days')) : "";
        };

        /**
         * @description convert Date to Unix Timestamp
         * @param model
         * @param modelProperties
         * @returns {*}
         */
        var getUnixTimeStamp = function (model, modelProperties) {
            for (var i = 0; i < modelProperties.length; i++) {
                if (typeof model[modelProperties[i]] !== "string" && typeof model[modelProperties[i]] !== "number" && model[modelProperties[i]]) {
                    var getDate = model[modelProperties[i]].getDate();
                    var getMonth = model[modelProperties[i]].getMonth() + 1;
                    var getFullYear = model[modelProperties[i]].getFullYear();
                    model[modelProperties[i]] = getFullYear + "-" + getMonth + "-" + getDate;
                }
                if (typeof model[modelProperties[i]] === "string" || typeof model[modelProperties[i]] === "object") {
                    model[modelProperties[i]] = model[modelProperties[i]] ? moment(model[modelProperties[i]], "YYYY-MM-DD").valueOf() : null;
                }
            }
            return model;
        };

        /**
         * convert unix timestamp to Original Date Format (YYYY-MM-DD)
         * @param model
         * @param modelProperties
         * @returns {*}
         */
        var getDateFromUnixTimeStamp = function (model, modelProperties) {
            for (var i = 0; i < modelProperties.length; i++) {
                model[modelProperties[i]] = model[modelProperties[i]] ? moment(model[modelProperties[i]]).format('YYYY-MM-DD') : null;
            }
            return model;
        };

    })
};