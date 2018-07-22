module.exports = function (app) {
    app.run(function (CMSModelInterceptor,
                      generator,
                      moment) {
        'ngInject';

        var modelName = 'SearchInternal';

        CMSModelInterceptor.whenInitModel(modelName, function (model) {
            return model;
        });

        CMSModelInterceptor.whenSendModel(modelName, function (model) {
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

            //because we select only one linked entity. so, it can't be array
            if (model.linkedEntities && !angular.isArray(model.linkedEntities)) {
                model.linkedEntities = angular.toJson(generator.interceptSendInstance('LinkedObject', model.linkedEntities));
            } else {
                model.linkedEntities = null;
            }

            if (model.docDate.From)
                model.docDate.From = '' + model.docDate.From;
            //TODO : 14 Jan, 2018. This if condition is added for Iyad to check something. It has to be removed once he finished checking.
            if (model.docDate.To)
                model.docDate.To = '' + model.docDate.To;

            model.docDate = angular.toJson(model.docDate);

            typeof model.prepareApproved === 'function' ? model.prepareApproved() : null;

            delete model.selectedEntityType;

            delete model.docStatus;
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


            delete model.sitesInfoTo;
            delete model.sitesInfoCC;
            delete model.sitesInfoIncoming;
            return model;
        });

        CMSModelInterceptor.whenReceivedModel(modelName, function (model) {
            return model;
        });

    })
};