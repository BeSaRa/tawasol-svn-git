module.exports = function (app) {
    app.run(function (CMSModelInterceptor) {
        'ngInject';

        var modelName = 'SearchCriteria';

        CMSModelInterceptor.whenInitModel(modelName, function (model) {
            return model;
        });

        CMSModelInterceptor.whenSendModel(modelName, function (model) {
            model.hasOwnProperty('Tags') ? model.Tags = null : null;
            model.hasOwnProperty('LinkedDocs') ? model.LinkedDocs = null : null;
            model.hasOwnProperty('LinkedEntities') ? model.LinkedEntities = null : null;
            model.hasOwnProperty('Attachments') ? model.Attachments = null : null;
            model.hasOwnProperty('SitesInfoTo') ? model.SitesInfoTo = null : null;
            model.hasOwnProperty('SitesInfoCC') ? model.SitesInfoCC = null : null;

            model.OU = model.OU && model.OU.hasOwnProperty('id') ? model.OU.id : model.OU;
            model.SubClassification = model.SubClassification && model.SubClassification.hasOwnProperty('id') ? model.SubClassification.id : model.SubClassification;
            model.MainClassification = model.MainClassification && model.MainClassification.hasOwnProperty('id') ? model.MainClassification.id : model.MainClassification;
            model.FileId = model.FileId && model.FileId.hasOwnProperty('id') ? model.FileId.id : model.FileId;
            model.SecurityLevel = model.SecurityLevel && model.SecurityLevel.hasOwnProperty('id') ? model.SecurityLevel.id : model.SecurityLevel;

            model.DocSubjectSrc = model.DocSubject;
            model.DocSubject = null;
            return model;
        });

        CMSModelInterceptor.whenReceivedModel(modelName, function (model) {
            return model;
        });

    })
};