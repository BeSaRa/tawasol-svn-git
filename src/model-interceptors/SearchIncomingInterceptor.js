module.exports = function (app) {
    app.run(function (CMSModelInterceptor,
                      generator,
                      moment) {
        'ngInject';

        var modelName = 'SearchIncoming';

        CMSModelInterceptor.whenInitModel(modelName, function (model) {
            return model;
        });

        CMSModelInterceptor.whenSendModel(modelName, function (model) {
            /*
            //This will be used when security level is multi-select
            var securityLevel = generator.getResultFromSelectedCollection(model.securityLevel, 'lookupKey');
            model.securityLevel = (securityLevel === 0) ? null : securityLevel;

             var followupStatus = generator.getResultFromSelectedCollection(model.followupStatus, 'lookupKey');
            model.followupStatus = (followupStatus === 0) ? null : followupStatus;
            */

            if (model.createdFrom || model.createdTo) {
                model.createdFrom = (model.createdFrom) ? moment(model.createdFrom).format("YYYY-MM-DD") : '1900-01-01';
                model.createdTo = (model.createdTo) ? model.createdTo : moment().format("YYYY-MM-DD");
                model.createdOn = {From: angular.copy(model.createdFrom), To: angular.copy(model.createdTo)};
            }
            if (model.year === 'All' && model.docDateFrom && model.docDateTo) {
                model.docDate = {
                    From: angular.copy(moment(model.docDateFrom).format("YYYY-MM-DD")),
                    To: angular.copy(moment(model.docDateTo).format("YYYY-MM-DD"))
                };
            }
            else if (model.year !== 'All') {
                if (!model.docDateFrom && model.docDateTo) {
                    model.docDate = {
                        From: angular.copy(model.year),
                        To: angular.copy(moment(model.docDateTo).format("YYYY-MM-DD"))
                    };
                }
                else if (model.docDateFrom && !model.docDateTo) {
                    model.docDate = {
                        From: angular.copy(moment(model.docDateFrom).format("YYYY-MM-DD")),
                        To: angular.copy(model.year)
                    };
                }
                else if (!model.docDateFrom && !model.docDateTo) {
                    model.docDate = {
                        From: angular.copy(model.year),
                        //TODO : 14 Jan, 2018. This if condition is added for Iyad to check something.
                        To: angular.copy(model.year)
                    };
                }
                else if (model.docDateFrom && model.docDateTo) {
                    model.docDate = {
                        From: angular.copy(moment(model.docDateFrom).format("YYYY-MM-DD")),
                        To: angular.copy(moment(model.docDateTo).format("YYYY-MM-DD"))
                    };
                }
            }


            if (model.followUpFrom || model.followUpTo) {
                model.followUpFrom = (model.followUpFrom) ? moment(model.followUpFrom).format("YYYY-MM-DD") : '1900-01-01';
                model.followUpTo = (model.followUpTo) ? model.followUpTo : moment().format("YYYY-MM-DD");
                model.followUpDate = {From: angular.copy(model.followUpFrom), To: angular.copy(model.followUpTo)};
            }

            model.tags = (model.tags.length) ? model.tags : null;
            model.linkedDocs = (model.linkedDocs.length) ? model.linkedDocs : null;
            model.linkedEntities = (model.linkedEntities.length) ? model.linkedEntities : null;
            model.attachments = (model.attachments.length) ? model.attachments : null;


            delete model.followUpFrom;
            delete model.followUpTo;
            delete model.followUpDate;
            delete model.approvedBy;
            delete model.approveDateFrom;
            delete model.approveDateTo;
            delete model.documentComments;

            delete model.createdFrom;
            delete model.createdTo;
            delete model.docDateFrom;
            delete model.docDateTo;
            delete model.year;

            delete model.followupStatus;
            delete model.siteType;
            delete model.mainSiteId;
            delete model.subSiteId;
            if (model.docDate.From)
                model.docDate.From = '' + model.docDate.From;
            //TODO : 14 Jan, 2018. This if condition is added for Iyad to check something. It has to be removed once he finished checking.
            if (model.docDate.To)
                model.docDate.To = '' + model.docDate.To;

            model.docDate = angular.toJson(model.docDate);
            return model;
        });

        CMSModelInterceptor.whenReceivedModel(modelName, function (model) {
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