module.exports = function (app) {
    app.run(function (CMSModelInterceptor,
                      _,
                      moment,
                      lookupService,
                      LinkedObject,
                      outgoingService,
                      documentTypeService,
                      documentTagService,
                      entityTypeService,
                      attachmentService,
                      Site,
                      documentCommentService,
                      correspondenceService,
                      //manageCorrespondenceSitesService,
                      $location,
                      generator) {
        'ngInject';
        var modelName = 'Outgoing';


        CMSModelInterceptor.whenInitModel(modelName, function (model) {
            return model;
        });

        CMSModelInterceptor.whenSendModel(modelName, function (model) {
            if (angular.isArray(model.sitesInfoTo) && model.sitesInfoTo.length) {
                model.sitesInfoTo = JSON.stringify(generator.interceptSendCollection('Site', model.sitesInfoTo));
            } else {
                model.sitesInfoTo = angular.toJson([]);
            }
            if (angular.isArray(model.sitesInfoCC) && model.sitesInfoCC.length) {
                model.sitesInfoCC = JSON.stringify(generator.interceptSendCollection('Site', model.sitesInfoCC));
            } else {
                model.sitesInfoCC = angular.toJson([]);
            }

            delete model.contentFile;


            return model;
        });

        function _prepareSites(item) {
            item.docClassName = 'outgoing';
            return new Site(item);
        }


        CMSModelInterceptor.whenReceivedModel(modelName, function (model) {
            model.sitesInfoCC = !angular.isArray(model.sitesInfoCC) && model.sitesInfoCC ? generator.interceptReceivedCollection('Site', _.map(model.ccSitesList, _prepareSites)) : [];
            model.sitesInfoTo = !angular.isArray(model.sitesInfoTo) && model.sitesInfoTo ? generator.interceptReceivedCollection('Site', _.map(model.toSitesList, _prepareSites)) : [];
            model.securityLevelLookup = lookupService.getLookupByLookupKey(lookupService.securityLevel, model.securityLevel);
            model.securityLevelIndicator = model.securityLevelLookup ? model.getSecurityLevelIndicator(model.securityLevelLookup) : null;

            model.priorityLevelLookup = lookupService.getLookupByLookupKey(lookupService.priorityLevel, model.priorityLevel);
            model.priorityLevelIndicator = (model.priorityLevelLookup && model.priorityLevelLookup.lookupKey !== 0) ? model.getPriorityLevelIndicator(model.priorityLevelLookup) : null;

            model.docClassIndicator = model.getDocClassIndicator();

            return model;
        });

    })
};