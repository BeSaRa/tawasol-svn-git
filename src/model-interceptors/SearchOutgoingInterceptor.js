module.exports = function (app) {
    app.run(function (CMSModelInterceptor,
                      generator,
                      moment) {
        'ngInject';

        var modelName = 'SearchOutgoing';

        CMSModelInterceptor.whenInitModel(modelName, function (model) {
            return model;
        });

        CMSModelInterceptor.whenSendModel(modelName, function (model) {
            /*
            //This will be used when security level is multi-select
            var securityLevel = generator.getResultFromSelectedCollection(model.securityLevel, 'lookupKey');
            model.securityLevel = (securityLevel === 0) ? null : securityLevel;

            var followupStatus = generator.getResultFromSelectedCollection(model.followupStatus, 'lookupKey');
            model.followupStatus = (followupStatus === 0) ? null : followupStatus;*/
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
                        //TODO : 11 Jan, 2018. This if condition is added for Iyad to check something.
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

            if (angular.isArray(model.sitesInfoTo) && model.sitesInfoTo.length) {
                model.sitesInfoTo = model.sitesInfoTo[0];
                model.sitesInfoTo = JSON.stringify(generator.interceptSendInstance('Site', model.sitesInfoTo));
            } else {
                model.sitesInfoTo = null;
            }
            if (angular.isArray(model.sitesInfoCC) && model.sitesInfoCC.length) {
                model.sitesInfoCC = model.sitesInfoCC[0];
                model.sitesInfoCC = JSON.stringify(generator.interceptSendInstance('Site', model.sitesInfoCC));
            } else {
                model.sitesInfoCC = null;
            }
//because we select only one linked entity. so, it can't be array
            if (model.linkedEntities && !angular.isArray(model.linkedEntities)) {
                model.linkedEntities = angular.toJson(generator.interceptSendInstance('LinkedObject', model.linkedEntities));
            } else {
                model.linkedEntities = null;
            }

            model.approvers = model.approvers ? angular.toJson({
                userId: model.approvers.applicationUser.id,
                userOuId: model.approvers.ouid.id,
                approveDate: {
                    first: generator.getTimeStampFromDate(model.approveDateFrom),
                    second: generator.getTimeStampFromDate(model.approveDateTo)
                }
            }) : null;

            model.mainSiteId = model.mainSiteId ? (model.mainSiteId.exactId ? model.mainSiteId.exactId : null) : null;
            model.subSiteId = model.subSiteId ? (model.subSiteId.exactId ? model.subSiteId.exactId : null) : null;

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
            //TODO : 11 Jan, 2018. This if condition is added for Iyad to check something. It has to be removed once he finished checking.
            if (model.docDate.To)
                model.docDate.To = '' + model.docDate.To;
            model.docDate = angular.toJson(model.docDate);
            return model;
        });

        CMSModelInterceptor.whenReceivedModel(modelName, function (model) {
            return model;
        });

    })
};