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

            model.securityLevelLookup = lookupService.getLookupByLookupKey(lookupService.securityLevel, model.securityLevel);
            model.securityLevelIndicator = model.securityLevelLookup ? model.getSecurityLevelIndicator(model.securityLevelLookup) : null;

             model.priorityLevelLookup = lookupService.getLookupByLookupKey(lookupService.priorityLevel, model.priorityLevel);
             model.priorityLevelIndicator = (model.priorityLevelLookup && model.priorityLevelLookup.lookupKey != 0)? model.getPriorityLevelIndicator(model.priorityLevelLookup) : null;

            model.dueDateStatusIndicator = model.dueDate ? model.getDueDateStatusIndicator(model.dueDate) : null;

            model.docTypeIndicator = model.docClassName ? model.getDocTypeIndicator(model.docClassName) : null;
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