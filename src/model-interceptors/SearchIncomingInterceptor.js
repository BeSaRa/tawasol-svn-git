module.exports = function (app) {
    app.run(function (CMSModelInterceptor,
                      generator,
                      moment,
                      _) {
        'ngInject';

        var modelName = 'SearchIncoming';

        CMSModelInterceptor.whenInitModel(modelName, function (model) {
            return model;
        });

        CMSModelInterceptor.whenSendModel(modelName, function (model) {
            model.docStatus = null;
            /*if (model.createdFrom || model.createdTo) {
                model.createdFrom = (model.createdFrom) ? moment(model.createdFrom).format("YYYY-MM-DD") : '1900-01-01';
                model.createdTo = (model.createdTo) ? model.createdTo : moment().format("YYYY-MM-DD");
                model.createdOn = {From: angular.copy(model.createdFrom), To: angular.copy(model.createdTo)};
            }*/

            if (model.mainSite) {
                model.sitesInfoIncoming = [model.mainSite.convertToSiteSearchModel()];
            }

            if (model.subSite) {
                model.sitesInfoIncoming = [model.subSite];
            }

            model.FollowupStatus = (model.followupStatus && model.followupStatus.length) ?
                angular.toJson(_.map(model.followupStatus, "lookupKey")) : null;

            if (model.year === 'All' && model.docDateFrom && model.docDateTo) {
                model.docDate = {
                    From: angular.copy(moment(model.docDateFrom).format("YYYY-MM-DD")),
                    To: angular.copy(moment(model.docDateTo).format("YYYY-MM-DD"))
                };
            } else if (model.year !== 'All') {
                if (!model.docDateFrom && model.docDateTo) {
                    model.docDate = {
                        From: angular.copy(model.year),
                        To: angular.copy(moment(model.docDateTo).format("YYYY-MM-DD"))
                    };
                } else if (model.docDateFrom && !model.docDateTo) {
                    model.docDate = {
                        From: angular.copy(moment(model.docDateFrom).format("YYYY-MM-DD")),
                        To: angular.copy(model.year)
                    };
                } else if (!model.docDateFrom && !model.docDateTo) {
                    model.docDate = {
                        From: angular.copy(model.year),
                        //TODO : 14 Jan, 2018. This if condition is added for Iyad to check something.
                        To: angular.copy(model.year)
                    };
                } else if (model.docDateFrom && model.docDateTo) {
                    model.docDate = {
                        From: angular.copy(moment(model.docDateFrom).format("YYYY-MM-DD")),
                        To: angular.copy(moment(model.docDateTo).format("YYYY-MM-DD"))
                    };
                }
            }

            // ref document date
            if (model.refDocDateFrom && model.refDocDateTo) {
                model.RefDocDate = {
                    From: angular.copy(moment(model.refDocDateFrom).format("YYYY-MM-DD")),
                    To: angular.copy(moment(model.refDocDateTo).format("YYYY-MM-DD"))
                };
            }

            // followUp status document date
            if (model.followUpFrom && model.followUpTo) {
                model.FollowUpDate = {
                    From: angular.copy(moment(model.followUpFrom).format("YYYY-MM-DD")),
                    To: angular.copy(moment(model.followUpTo).format("YYYY-MM-DD"))
                };
            }

            if (angular.isArray(model.sitesInfoIncoming) && model.sitesInfoIncoming.length) {
                model.sitesInfoIncoming = model.sitesInfoIncoming[0];
                model.sitesInfoIncoming.getSiteToIncoming(model,);
            } else {
                model.siteType = model.siteType ? model.siteType.lookupKey : null;
            }


            delete model.sitesInfoIncoming;

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

            model.serialNoFrom = (!model.serialNoFrom && model.serialNoTo) ? Number(model.serialNoTo) - 1 : model.serialNoFrom;
            model.serialNoTo = (model.serialNoFrom && !model.serialNoTo) ? Number(model.serialNoFrom) + 1 : model.serialNoTo;
            model.docSerial = (model.serialNoFrom && model.serialNoTo) ? model.serialNoFrom + ',' + model.serialNoTo : null;

            delete model.followUpFrom;
            delete model.followUpTo;
            model.FollowUpDate = (model.FollowUpDate) ? angular.toJson(model.FollowUpDate) : null;
            //delete model.followUpDate;
            delete model.approvedBy;
            delete model.approveDateFrom;
            delete model.approveDateTo;

            delete model.serialNoFrom;
            delete model.serialNoTo;

            delete model.documentComments;

            delete model.createdFrom;
            delete model.createdTo;
            delete model.docDateFrom;
            delete model.docDateTo;
            delete model.year;

            // delete refDocDate
            delete model.refDocDateFrom;
            delete model.refDocDateTo;
            model.RefDocDate = (model.RefDocDate) ? angular.toJson(model.RefDocDate) : null;

            delete model.dummySearchDocClass;
            return model;
        });

        CMSModelInterceptor.whenReceivedModel(modelName, function (model) {
            return model;
        });

    })
};
