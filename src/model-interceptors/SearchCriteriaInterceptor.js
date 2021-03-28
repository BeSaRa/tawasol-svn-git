module.exports = function (app) {
    app.run(function (CMSModelInterceptor) {
        'ngInject';

        var modelName = 'SearchCriteria';

        CMSModelInterceptor.whenInitModel(modelName, function (model) {
            return model;
        });

        CMSModelInterceptor.whenSendModel(modelName, function (model) {
            // model.hasOwnProperty('Tags') ? model.Tags = null : null;
            if (Array.isArray(model.Tags)) {
                model.Tags = null;
            }
            model.hasOwnProperty('LinkedDocs') ? model.LinkedDocs = null : null;

            model.hasOwnProperty('Attachments') ? model.Attachments = null : null;

            model.OU = model.OU && model.OU.hasOwnProperty('id') ? model.OU.id : model.OU;
            model.SubClassification = model.SubClassification && model.SubClassification.hasOwnProperty('id') ? model.SubClassification.id : model.SubClassification;
            model.MainClassification = model.MainClassification && model.MainClassification.hasOwnProperty('id') ? model.MainClassification.id : model.MainClassification;
            model.FileId = model.FileId && model.FileId.hasOwnProperty('id') ? model.FileId.id : model.FileId;
            model.SecurityLevel = model.SecurityLevel && model.SecurityLevel.hasOwnProperty('id') ? model.SecurityLevel.lookupKey : model.SecurityLevel;
            model.PriorityLevel = model.PriorityLevel && model.PriorityLevel.hasOwnProperty('id') ? model.PriorityLevel.lookupKey : model.PriorityLevel;
            model.DocType = model.DocType && model.DocType.hasOwnProperty('id') ? model.DocType.lookupKey : model.DocType;
            model.DocSubjectSrc = model.DocSubject;
            model.DocSubject = null;
            model.CreatorId = model.CreatorId ? model.CreatorId.applicationUser.id : null;
            return model;
        });

        CMSModelInterceptor.whenReceivedModel(modelName, function (model) {
            return model;
        });

    })
};
