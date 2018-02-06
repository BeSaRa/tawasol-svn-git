module.exports = function (app) {
    app.run(function (CMSModelInterceptor,
                      organizationService,
                      workflowActionService,
                      documentStatusService,
                      lookupService,
                      applicationUserService,
                      moment,
                      Information) {
        'ngInject';

        var modelName = 'OutgoingDeliveryReport';

        CMSModelInterceptor.whenInitModel(modelName, function (model) {
            return model;
        });

        CMSModelInterceptor.whenSendModel(modelName, function (model) {
            return model;
        });

        CMSModelInterceptor.whenReceivedModel(modelName, function (model) {
            model.sentByIdInfo = new Information(model.sentByIdInfo);
            model.mainSiteFromIdInfo = new Information(model.mainSiteFromIdInfo);
            model.subSiteFromIdInfo = new Information(model.subSiteFromIdInfo);
            model.priorityLevelInfo = new Information(model.priorityLevelInfo);
            model.messageStatusInfo = new Information(model.messageStatusInfo);
            model.receivedByIdInfo = new Information(model.receivedByIdInfo);
            model.mainSiteToIdInfo = new Information(model.mainSiteToIdInfo);
            model.subSiteToIdInfo = new Information(model.subSiteToIdInfo);
            return model;
        });
        /**
         * convert Date to Unix Timestamp
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