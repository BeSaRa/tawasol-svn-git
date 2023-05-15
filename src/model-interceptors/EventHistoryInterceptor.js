module.exports = function (app) {
    app.run(function (CMSModelInterceptor,
                      moment,
                      lookupService,
                      WorkflowAction,
                      DocumentStatus,
                      viewDocumentService,
                      Information) {
        'ngInject';

        var modelName = 'EventHistory';

        CMSModelInterceptor.whenInitModel(modelName, function (model) {
            model.setViewDocumentService(viewDocumentService);
            return model;
        });

        CMSModelInterceptor.whenSendModel(modelName, function (model) {
            delete model.mainSite;
            delete model.subSite;
            delete model.mainSubSites;
            delete model.action;
            delete model.receiverInfo;

            delete model.actionDate_vts;
            delete model.documentCreationDate_vts;
            delete model.securityLevelLookup;
            delete model.securityLevelIndicator;
            delete model.mainSiteSubSiteString;   // added in model when binding main-site-sub-site directive value in grid
            delete model.actionType_vts;
            delete model.recordGridName;
            delete model.hasSequentialWFIndicator;
            delete model.trackingSheetIndicator;
            return model;
        });

        CMSModelInterceptor.whenReceivedModel(modelName, function (model) {
            (model.documentCreationDate_vts) = angular.copy(model.documentCreationDate);
            model.documentCreationDate_vts ? getDateFromUnixTimeStamp_Vts(model, ["documentCreationDate_vts"]) : "";
            (model.documentCreationDate) ? getDateFromUnixTimeStamp(model, ["documentCreationDate"]) : "";
            (model.actionDate_vts) = angular.copy(model.actionDate);
            model.actionDate_vts ? getDateFromUnixTimeStamp_Vts(model, ["actionDate_vts"]) : "";
            (model.actionDate) ? getDateFromUnixTimeStamp(model, ["actionDate"]) : "";
            (model.dueDate) ? getDateFromUnixTimeStamp(model, ["dueDate"]) : "";
            model.action = (model.workflowActionId) ? new WorkflowAction(model.workflowActionInfo) : (model.documentStatusInfo ? new DocumentStatus(model.documentStatusInfo) : new Information());
            model.userFromInfo = model.userFromInfo ? new Information(model.userFromInfo) : new Information();
            model.userToInfo = model.userToInfo ? new Information(model.userToInfo) : new Information();

            model.receiverInfo = (model.userToInfo && model.userToInfo.id !== -1) ? new Information(model.userToInfo) : new Information(model.userToOuInfo);

            model.userFromOuInfo = model.userFromOuInfo ? new Information(model.userFromOuInfo) : new Information();
            model.userToOuInfo = model.userToOuInfo ? new Information(model.userToOuInfo) : new Information();

            model.securityLevelLookup = lookupService.getLookupByLookupKey(lookupService.securityLevel, model.securityLevel);
            model.securityLevelIndicator = model.securityLevelLookup ? model.getSecurityLevelIndicator(model.securityLevelLookup) : null;

            model.priorityLevelLookup = lookupService.getLookupByLookupKey(lookupService.priorityLevel, model.priorityLevel);
            model.priorityLevelIndicator = (model.priorityLevelLookup && model.priorityLevelLookup.lookupKey !== 0) ? model.getPriorityLevelIndicator(model.priorityLevelLookup) : null;

            model.dueDateStatusIndicator = model.dueDate ? model.getDueDateStatusIndicator(model.dueDate) : null;

            model.docClassIndicator = model.docClassName ? model.getDocClassIndicator(model.docClassName) : null;
            model.hasSequentialWFIndicator = model.hasActiveSeqWF() ? model.getSequentialWFIndicator() : null;
            model.trackingSheetIndicator = model.getTrackingSheetIndicator();
            model.actionType_vts = model.mapActionType();
            model.setMainSiteSubSiteString();

            return model;
        });

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


        /**
         * convert unix timestamp to Original Date Format (YYYY-MM-DD hh:mm:ss A)
         * @param model
         * @param modelProperties
         * @returns {*}
         */
        var getDateFromUnixTimeStamp_Vts = function (model, modelProperties) {
            for (var i = 0; i < modelProperties.length; i++) {
                model[modelProperties[i]] = model[modelProperties[i]] ? moment(model[modelProperties[i]]).format('YYYY-MM-DD hh:mm:ss A') : null;
            }
            return model;
        };

        /**
         * @description Typecast the array of objects to the given model array
         * @param valuesArray
         * @param model
         * @returns {Array}
         */
        var getBulkTypeCast = function (valuesArray, model) {
            var result = [];
            for (var i = 0; i < valuesArray.length; i++) {
                result.push(new model(valuesArray[i]));
            }
            return result;
        };

        var separateParentChild = function (parents, children) {
            _.map(children, function (child) {
                if (child.id) {
                    var parent = _.find(parents, {id: child.parent});
                    if (!parent.hasOwnProperty('children'))
                        parent.children = [];
                    parent.children.push(child);
                }
                return true;
            });
            return parents;
        };

    })
};
