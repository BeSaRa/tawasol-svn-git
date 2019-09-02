module.exports = function (app) {
    app.run(function (CMSModelInterceptor,
                      _,
                      generator,
                      applicationUserService,
                      organizationTypeService,
                      organizationService,
                      referencePlanNumberService,
                      correspondenceSiteTypeService,
                      ouClassificationService,
                      ReferencePlanItemStartSerial,
                      ouCorrespondenceSiteService,
                      lookupService) {
        'ngInject';
        var ids = [
            'adminUserId',
            'managerId',
            'viceManagerId',
            'referenceNumberPlanId',
            'parent',
            'registryParentId',
            'centralArchiveUnitId'
        ];

        CMSModelInterceptor.whenInitModel('Organization', function (model) {
            model.setOrganizationService(organizationService);
            model.setOUClassificationService(ouClassificationService);
            model.setOUCorrespondenceSiteService(ouCorrespondenceSiteService);
            return model
        });


        CMSModelInterceptor.whenSendModel('Organization', function (model) {
            _.map(ids, function (property) {
                model[property] = model[property] && model[property].hasOwnProperty('id') ? model[property].id : model[property];
                return property;
            });
            model.correspondenceTypeId = (model.correspondenceTypeId && model.correspondenceTypeId.hasOwnProperty('id')) ? model.correspondenceTypeId.lookupKey : model.correspondenceTypeId;
            model.outype = model.outype.hasOwnProperty('id') ? model.outype.lookupKey : model.outype;
            model.registryParentId = model.hasRegistry ? null : (model.registryParentId && model.registryParentId.hasOwnProperty('id') ? model.registryParentId.id : model.registryParentId);
            model.securitySchema = model.securitySchema && model.securitySchema.hasOwnProperty('id') ? model.securitySchema.lookupKey : model.securitySchema;
            model.wfsecurity = model.wfsecurity && model.wfsecurity.hasOwnProperty('id') ? model.wfsecurity.lookupKey : model.wfsecurity;
            model.escalationProcess = model.escalationProcess && model.escalationProcess.hasOwnProperty('id') ? model.escalationProcess.lookupKey : model.escalationProcess;
            // to send just in case of the current organization is registry ou.
            model.referencePlanItemStartSerialList = model.hasRegistry ? model.referencePlanItemStartSerialList : [];

            if (model.referencePlanItemStartSerialList && angular.isArray(model.referencePlanItemStartSerialList)) {
                model.referencePlanItemStartSerialList = _.map(model.referencePlanItemStartSerialList, function (item) {
                    item.startSerial = Number(item.startSerial);
                    item.referencePlanItemId = item.referencePlanItemId.hasOwnProperty('id') ? item.referencePlanItemId.id : item.referencePlanItemId;
                    return item;
                });
            }
            if (!(model.hasRegistry || model.centralArchive)) {
                model.faxId = '';
            }

            // delete model.ldapPrefix;
            delete model.children;
            delete model.parentId;
            delete model.updatedByInfo;
            delete model.updatedOn;
            delete model.relationship;

            delete model.parentOrReportingToInfo;
            delete model.organizationTypeInfo;
            return model;
        });

        CMSModelInterceptor.whenReceivedModel('Organization', function (model) {
            var users = ['adminUserId', 'managerId', 'viceManagerId'];
            _.map(users, function (property) {
                if (model[property])
                    model[property] = applicationUserService.getApplicationUserById(model[property]);
            });
            model.outype = organizationTypeService.getOrganizationTypeByLookupKey(model.outype) || model.outype;
            model.referenceNumberPlanId = referencePlanNumberService.getReferencePlanNumberById(model.referenceNumberPlanId) || model.referenceNumberPlanId;
            model.securitySchema = lookupService.getLookupByLookupKey(lookupService.securitySchema, model.securitySchema);
            model.wfsecurity = lookupService.getLookupByLookupKey(lookupService.workflowSecurity, model.wfsecurity);
            model.escalationProcess = lookupService.getLookupByLookupKey(lookupService.escalationProcess, model.escalationProcess);
            model.correspondenceTypeId = correspondenceSiteTypeService.getCorrespondenceSiteTypeByLookupKey(model.correspondenceTypeId) || model.correspondenceTypeId;
            model.registryParentId = organizationService.getOrganizationById(model.registryParentId) || model.registryParentId;
            model.centralArchiveUnitId = organizationService.getOrganizationById(model.centralArchiveUnitId) || model.centralArchiveUnitId;
            // to check if the organization has reference plan Items.
            if (model.hasOwnProperty('referencePlanItemStartSerialList') && angular.isArray(model.referencePlanItemStartSerialList)) {
                model.referencePlanItemStartSerialList = _.map(model.referencePlanItemStartSerialList, function (item) {
                    return generator.interceptReceivedInstance('ReferencePlanItemStartSerial', (new ReferencePlanItemStartSerial(item)).getReferencePlanItem());
                });
            }

            if (model.parent)
                model.parentOrReportingToInfo = model.getParent();
            model.organizationTypeInfo = model.getType();

            return model;
        });

    })
};
