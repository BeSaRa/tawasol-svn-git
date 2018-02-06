module.exports = function (app) {
    app.run(function (CMSModelInterceptor,
                      organizationService,
                      applicationUserService,
                      moment,
                      lookupService,
                      smsTemplateService) {
        'ngInject';

        var modelName = 'SmsLog';

        CMSModelInterceptor.whenInitModel(modelName, function (model) {
            return model;
        });

        CMSModelInterceptor.whenSendModel(modelName, function (model) {
            return model;
        });

        CMSModelInterceptor.whenReceivedModel(modelName, function (model) {
            /*if(model.ouId){
                model.organization = organizationService.getOrganizationById(model.ouId);
            }
            if(model.actionBy)
            {
                model.user = applicationUserService.getApplicationUserById(model.actionBy);
            }
            if(model.smsTemplateId)
            {
                model.smsTemplate = smsTemplateService.getSmsTemplateById(model.smsTemplateId);
            }*/
            /*if(model.mainDocClassID){
                model.mainDocClass = lookupService.getLookupByLookupId(lookupService.documentClass, model.mainDocClassID);
            }
            if(model.linkedDocClassID){
                model.linkedDocClass = lookupService.getLookupByLookupId(lookupService.documentClass, model.linkedDocClassID);
            }*/
            (model.actionDate) ? getDateFromUnixTimeStamp(model, ["actionDate"]) : "";
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