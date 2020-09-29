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
                        //TODO : 11 Jan, 2018. This if condition is added for Iyad to check something.
                        To: angular.copy(model.year)
                    };
                } else if (model.docDateFrom && model.docDateTo) {
                    model.docDate = {
                        From: angular.copy(moment(model.docDateFrom).format("YYYY-MM-DD")),
                        To: angular.copy(moment(model.docDateTo).format("YYYY-MM-DD"))
                    };
                }
            }

            if (model.mainSite) {
                model.originality === 1 ? model.sitesInfoTo = [angular.copy(model.mainSite.convertToSiteSearchModel())] : model.sitesInfoCC = [model.mainSite.convertToSiteSearchModel()];
            }

            if (model.subSite) {
                model.originality === 1 ? model.sitesInfoTo = [angular.copy(model.subSite)] : model.sitesInfoCC = [angular.copy(model.subSite)];
            }
            if (angular.isArray(model.sitesInfoTo) && model.sitesInfoTo.length) {
                model.sitesInfoTo = model.sitesInfoTo[0];
                // if followupStatus = none, delete it
                if (!model.sitesInfoTo.followupStatus.lookupKey) {
                    delete model.sitesInfoTo.followupStatus;
                }
                //console.log(model.sitesInfoTo);
                if (model.sitesInfoTo.followupDate1 && model.sitesInfoTo.followupDate2) {
                    model.sitesInfoTo.followupDates = {
                        first: generator.getTimeStampFromDate(model.sitesInfoTo.followupDate1),
                        second: generator.getTimeStampFromDate(model.sitesInfoTo.followupDate2)
                    };
                }
                model.sitesInfoTo = generator.interceptSendInstance('Site', model.sitesInfoTo);
                delete model.sitesInfoTo.followupDate1;
                delete model.sitesInfoTo.followupDate2;
                delete model.sitesInfoTo.siteCategory;
                delete model.sitesInfoTo.followupDate;
                model.sitesInfoTo = JSON.stringify(model.sitesInfoTo);

            } else {
                model.sitesInfoTo = null;
            }
            if (angular.isArray(model.sitesInfoCC) && model.sitesInfoCC.length) {
                model.sitesInfoCC = model.sitesInfoCC[0];
                // if followupStatus = none, delete it
                if (!model.sitesInfoCC.followupStatus.lookupKey) {
                    delete model.sitesInfoCC.followupStatus;
                }
                if (model.sitesInfoCC.followupDate1 && model.sitesInfoCC.followupDate2) {
                    model.sitesInfoCC.followupDates = {
                        first: generator.getTimeStampFromDate(model.sitesInfoCC.followupDate1),
                        second: generator.getTimeStampFromDate(model.sitesInfoCC.followupDate2)
                    };
                }

                model.sitesInfoCC = generator.interceptSendInstance('Site', model.sitesInfoCC);

                delete model.sitesInfoCC.followupDate1;
                delete model.sitesInfoCC.followupDate2;
                delete model.sitesInfoCC.siteCategory;
                delete model.sitesInfoCC.followupDate;
                model.sitesInfoCC = JSON.stringify(model.sitesInfoCC);
            } else {
                model.sitesInfoCC = null;
            }

            //because we select only one linked entity. so, it can't be array
            if (model.linkedEntities && !angular.isArray(model.linkedEntities)) {
                model.linkedEntities = angular.toJson(generator.interceptSendInstance('LinkedObject', model.linkedEntities));
            } else {
                model.linkedEntities = null;
            }

            typeof model.prepareApproved === 'function' ? model.prepareApproved() : null;

            if (model.docDate.From)
                model.docDate.From = '' + model.docDate.From;
            //TODO : 11 Jan, 2018. This if condition is added for Iyad to check something. It has to be removed once he finished checking.
            if (model.docDate.To)
                model.docDate.To = '' + model.docDate.To;
            model.docDate = angular.toJson(model.docDate);

            // just when user select the correspondence type without select main or sub site
            if (!model.sitesInfoCC && !model.sitesInfoTo && !!model.siteType) {
                // model.sitesInfoTo = angular.toJson({siteType:model.siteType.lookupKey,mainSiteId:null,subSiteId:null});
                model.sitesInfoTo = angular.toJson({siteType: model.siteType.lookupKey});
            }

            if (model.followupStatus && model.followupStatus.length) {
                var followUpStatusList = _.map(model.followupStatus, 'lookupKey');
                followUpStatusList = {followupStatusList: followUpStatusList.join(',')};
                // if user select siteInfoTo
                if (model.sitesInfoTo) {
                    model.sitesInfoTo = angular.extend(angular.fromJson(model.sitesInfoTo), followUpStatusList);
                    model.sitesInfoTo = angular.toJson(model.sitesInfoTo);
                }
                // if user select siteInfoCC
                if (model.sitesInfoCC) {
                    model.sitesInfoCC = angular.extend(angular.fromJson(model.sitesInfoCC), followUpStatusList);
                    model.sitesInfoCC = angular.toJson(model.sitesInfoCC);
                }
                // if user dos'nt select any sites
                if (!model.sitesInfoCC && !model.sitesInfoTo) {
                    model.sitesInfoTo = angular.toJson(followUpStatusList);
                }
            }

            if (model.followUpFrom || model.followUpTo) {
                var date = {
                    followupDates: {
                        first: Date.UTC(model.followUpFrom.getFullYear() ,model.followUpFrom.getMonth(), model.followUpFrom.getDate()),
                        second: Date.UTC(model.followUpTo.getFullYear() ,model.followUpTo.getMonth(), model.followUpTo.getDate(),23, 59, 59, 999)
                    }
                };
                // if user select siteInfoTo
                if (model.sitesInfoTo) {
                    model.sitesInfoTo = angular.extend(angular.fromJson(model.sitesInfoTo), date);
                    model.sitesInfoTo = angular.toJson(model.sitesInfoTo);
                }
                // if user select siteInfoCC
                if (model.sitesInfoCC) {
                    model.sitesInfoCC = angular.extend(angular.fromJson(model.sitesInfoCC), date);
                    model.sitesInfoCC = angular.toJson(model.sitesInfoCC);
                }
                // if user dos'nt select any sites
                if (!model.sitesInfoCC && !model.sitesInfoTo) {
                    model.sitesInfoTo = angular.toJson(date);
                }
            }

            if (model.exportDateFrom && model.exportDateTo) {
                var exportDate = {
                    From: angular.copy(moment(model.exportDateFrom).format("YYYY-MM-DD")),
                    To: angular.copy(moment(model.exportDateTo).format("YYYY-MM-DD"))
                };
                model.exportDate = angular.toJson(exportDate);
            }

            model.serialNoFrom = (!model.serialNoFrom && model.serialNoTo) ? Number(model.serialNoTo) - 1 : model.serialNoFrom;
            model.serialNoTo = (model.serialNoFrom && !model.serialNoTo) ? Number(model.serialNoFrom) + 1 : model.serialNoTo;
            model.docSerial = (model.serialNoFrom && model.serialNoTo) ? model.serialNoFrom + ',' + model.serialNoTo : null;


            delete model.selectedEntityType;
            delete model.docStatus;
            delete model.approvedBy;
            delete model.approveDateFrom;
            delete model.approveDateTo;
            delete model.exportDateFrom;
            delete model.exportDateTo;

            delete model.serialNoFrom;
            delete model.serialNoTo;

            delete model.documentComments;

            delete model.createdFrom;
            delete model.createdTo;
            delete model.docDateFrom;
            delete model.docDateTo;
            delete model.year;

            delete model.followupStatus;
            delete model.siteType;

            delete model.dummySearchDocClass;

            return model;
        });

        CMSModelInterceptor.whenReceivedModel(modelName, function (model) {
            return model;
        });

    })
};
