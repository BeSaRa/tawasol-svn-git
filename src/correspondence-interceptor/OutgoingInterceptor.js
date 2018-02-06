module.exports = function (app) {
    app.run(function (CMSModelInterceptor,
                      _,
                      moment,
                      lookupService,
                      LinkedObject,
                      outgoingService,
                      documentFileService,
                      documentTypeService,
                      classificationService,
                      documentTagService,
                      entityTypeService,
                      attachmentService,
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

        CMSModelInterceptor.whenReceivedModel(modelName, function (model) {
            model.sitesInfoCC = !angular.isArray(model.sitesInfoCC) && model.sitesInfoCC ? angular.fromJson(model.sitesInfoCC) : [];
            model.sitesInfoTo = !angular.isArray(model.sitesInfoTo) && model.sitesInfoTo ? angular.fromJson(model.sitesInfoTo) : [];
            return model;
        });

    })
};