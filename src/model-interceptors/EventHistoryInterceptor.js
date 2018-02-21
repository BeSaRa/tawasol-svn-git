module.exports = function (app) {
    app.run(function (CMSModelInterceptor,
                      moment,
                      lookupService,
                      Information) {
        'ngInject';

        var modelName = 'EventHistory';

        CMSModelInterceptor.whenInitModel(modelName, function (model) {
            return model;
        });

        CMSModelInterceptor.whenSendModel(modelName, function (model) {
            delete model.mainSite;
            delete model.subSite;
            delete model.mainSubSites;

            delete model.actionDate_vts;
            delete model.documentCreationDate_vts;
            delete model.securityLevelLookup;
            delete model.securityLevelIndicator;
            delete model.commentsIndicator;
            delete model.followupStatusLookup;
            return model;
        });

        CMSModelInterceptor.whenReceivedModel(modelName, function (model) {
             /*model.mainSiteInfo = [
                {
                    "arName": "أحمد مصطفى",
                    "enName": "789 Minister of Communications",
                    "id": 1,
                    "parent": null
                },
                 {
                     "arName": "أحمد مصطفى",
                     "enName": "123 Minister of Communications",
                     "id": 3,
                     "parent": null
                 }
            ];

             model.subSiteInfo = [
                 {
                     "arName": "أحمد مصطفى",
                     "enName": "456 Minister of Communications",
                     "id": 2,
                     "parent": 1
                 },
                 {
                     "arName": "أحمد مصطفى",
                     "enName": "123 Minister of Communications",
                     "id": 4,
                     "parent": 1
                 }
             ];*/

            //model.mainSite = (model.mainSiteInfo.length) ? getBulkTypeCast(model.mainSiteInfo, Information) : new Array(new Information());
            //model.subSite = (model.subSiteInfo.length) ? getBulkTypeCast(model.subSiteInfo, Information) : new Array(new Information());

            //model.mainSubSites = separateParentChild(model.mainSite, model.subSite);

            (model.documentCreationDate_vts) = angular.copy(model.documentCreationDate);
            model.documentCreationDate_vts ? getDateFromUnixTimeStamp_Vts(model, ["documentCreationDate_vts"]) : "";
            (model.documentCreationDate) ? getDateFromUnixTimeStamp(model, ["documentCreationDate"]) : "";
            (model.actionDate_vts) = angular.copy(model.actionDate);
            model.actionDate_vts ? getDateFromUnixTimeStamp_Vts(model, ["actionDate_vts"]) : "";
            (model.actionDate) ? getDateFromUnixTimeStamp(model, ["actionDate"]) : "";
            (model.dueDate) ? getDateFromUnixTimeStamp(model, ["dueDate"]) : "";

            model.securityLevelLookup = lookupService.getLookupByLookupKey(lookupService.securityLevel, model.securityLevel);
            model.securityLevelIndicator = model.securityLevelLookup ? model.getSecurityLevelIndicator(model.securityLevelLookup) : null;

             model.priorityLevelLookup = lookupService.getLookupByLookupKey(lookupService.priorityLevel, model.priorityLevel);
             model.priorityLevelIndicator = (model.priorityLevelLookup && model.priorityLevelLookup.lookupKey != 0)? model.getPriorityLevelIndicator(model.priorityLevelLookup) : null;

            /*model.attachmentsIndicator = model.generalStepElm.attachementsNO ? model.getAttachmentsIndicator() : null;
            model.linkedDocsIndicator = model.generalStepElm.linkedDocsNO ? model.getLinkedDocumentsIndicator() : null;*/

            /*model.followupStatusLookup = lookupService.getLookupByLookupKey(lookupService.followupStatus, model.generalStepElm.followupStatus);
            model.followUpStatusIndicator = model.generalStepElm.followupStatus ? model.getFollowUpStatusIndicator(model.followupStatusLookup) : null;*/

            // model.followUpStatusIndicator =  model.getFollowUpStatusIndicator(model);
            /*model.dueDateStatusIndicator = model.generalStepElm.dueDate ? model.getDueDateStatusIndicator(model.generalStepElm.workFlowName,model.generalStepElm.dueDate) : null;*/

            /*model.tagsIndicator = model.generalStepElm.tagsNO ? model.getTagsIndicator(model.generalStepElm.tagsNO) : null;*/
            model.docTypeIndicator = model.docClassName ? model.getDocTypeIndicator(model.docClassName) : null;

            //model.commentsIndicator = model.comments ? model.getCommentsIndicator(model.comments.length) : null;

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