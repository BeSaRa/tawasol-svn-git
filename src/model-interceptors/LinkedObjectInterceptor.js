module.exports = function (app) {
    app.run(function (CMSModelInterceptor,
                      correspondenceService,
                      entityTypeService) {
        'ngInject';

        var modelName = 'LinkedObject';

        CMSModelInterceptor.whenInitModel(modelName, function (model) {
            return model;
        });

        CMSModelInterceptor.whenSendModel(modelName, function (model) {
            model.preparedType();
            model.typeId = entityTypeService.setLinkedType(model.typeId);
            // fix the employeeNum to send it for backend team as String.
            if (model.hasOwnProperty('employeeNum') && model.employeeNum)
                model.employeeNum = '' + model.employeeNum;

            if (model.xsendSMS && model.xsmsTemplateId) {
                model.xsmsTemplateId = model.xsmsTemplateId.hasOwnProperty('id') ? model.xsmsTemplateId.id : model.xsmsTemplateId;
            } else {
                model.xsmsTemplateId = null;
            }
            return model;
        });

        CMSModelInterceptor.whenReceivedModel(modelName, function (model) {
            if (model && model.hasOwnProperty('documentClass')) {
                var entityTypes = correspondenceService.getLookup(model.documentClass, 'entityTypes');
                model.typeId = entityTypeService.getLinkedType(model.typeId, entityTypes);
            } else {
                model.typeId = entityTypeService.getLinkedType(model.typeId);
            }
            model.xsendSMS = false;
            model.xsmsTemplateId = null;
            delete model.documentClass;
            return model;
        });

    })
};
