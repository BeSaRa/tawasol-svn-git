module.exports = function (app) {
    app.run(function ($httpBackend, urlService, generator, Response, Organization) {
        'ngInject';
        var urlWithId = new RegExp(urlService.classifications + '\/(\\d+)');

        var organizations = [
            {
                "id": 1,
                "code": "1",
                "arName": "وزارة البلدية واالبيئة",
                "enName": "Ministry of Municipality and Environment",
                "description": "1",
                "parent": null,
                "registryParentId": 1,
                "centralArchiveUnitId": 1,
                "hasRegistry": true,
                "centralArchive": true,
                "status": true,
                "ldapPrefix": "dsad",
                "email": "dasd@jj.com",
                "mobile": "222",
                "referenceNumberPlanId": 1,
                "adminUserId": null,
                "managerId": null,
                "viceManagerId": null,
                "logo": null,
                "followupUsers": null,
                "outype": 166,
                "correspondenceTypeId": 1,
                "securitySchema": 41,
                "enableEscalation": true,
                "escalationProcess": null,
                "escalationNotifySender": true,
                "escalationNotifyReceiver": true,
                "deadlineReminder": 1,
                "enableSmsnotification": true,
                "enableEmailNotification": true,
                "sla": 2,
                "classificationList": null,
                "correspondenceSiteList": null,
                "documentFileList": null,
                "referencePlan": null,
                "errorCode": null,
                "errorMessage": null
            },
            {
                "id": 2,
                "code": "1",
                "arName": "مكتب وزير التنمية\r\nالإدارية",
                "enName": "Office of the Minister of Administrative Development",
                "description": "1",
                "parent": 1,
                "registryParentId": 1,
                "centralArchiveUnitId": 1,
                "hasRegistry": true,
                "centralArchive": true,
                "status": true,
                "ldapPrefix": "dsad",
                "email": "dasd@jj.com",
                "mobile": "222",
                "referenceNumberPlanId": 1,
                "adminUserId": null,
                "managerId": null,
                "viceManagerId": null,
                "logo": null,
                "followupUsers": null,
                "outype": 167,
                "correspondenceTypeId": 1,
                "securitySchema": 41,
                "enableEscalation": true,
                "escalationProcess": null,
                "escalationNotifySender": true,
                "escalationNotifyReceiver": true,
                "deadlineReminder": 1,
                "enableSmsnotification": true,
                "enableEmailNotification": true,
                "sla": 2,
                "classificationList": null,
                "correspondenceSiteList": null,
                "documentFileList": null,
                "referencePlan": null,
                "errorCode": null,
                "errorMessage": null
            },
            {
                "id": 5,
                "code": "89564",
                "arName": "ادارة الشؤون القانونية",
                "enName": "Department of Legal Affairs",
                "description": "كل سنه وانتوا طيبين",
                "parent": 1,
                "registryParentId": null,
                "centralArchiveUnitId": null,
                "hasRegistry": true,
                "centralArchive": true,
                "status": true,
                "ldapPrefix": "dsad",
                "email": "dasd@jj.com",
                "mobile": "222",
                "referenceNumberPlanId": 17,
                "adminUserId": null,
                "managerId": null,
                "viceManagerId": null,
                "logo": null,
                "followupUsers": null,
                "outype": 166,
                "correspondenceTypeId": 1,
                "securitySchema": 42,
                "enableEscalation": true,
                "escalationProcess": 46,
                "escalationNotifySender": true,
                "escalationNotifyReceiver": true,
                "deadlineReminder": 1,
                "enableSmsnotification": true,
                "enableEmailNotification": true,
                "sla": 2,
                "classificationList": null,
                "correspondenceSiteList": null,
                "documentFileList": null,
                "referencePlan": null,
                "errorCode": null,
                "errorMessage": null
            },
            {
                "id": 6,
                "code": "1",
                "arName": "مكتب الوكيل\r\nالمساعد لشؤون\r\nالخدمات المشتركة",
                "enName": "Office of the Assistant Undersecretary for Common Services",
                "description": "1",
                "parent": 2,
                "registryParentId": null,
                "centralArchiveUnitId": 1,
                "hasRegistry": false,
                "centralArchive": true,
                "status": true,
                "ldapPrefix": "dsad",
                "email": "dasd@jj.com",
                "mobile": "222",
                "referenceNumberPlanId": 1,
                "adminUserId": null,
                "managerId": null,
                "viceManagerId": null,
                "logo": null,
                "followupUsers": null,
                "outype": 166,
                "correspondenceTypeId": 1,
                "securitySchema": 41,
                "enableEscalation": true,
                "escalationProcess": null,
                "escalationNotifySender": true,
                "escalationNotifyReceiver": true,
                "deadlineReminder": 1,
                "enableSmsnotification": true,
                "enableEmailNotification": true,
                "sla": 2,
                "classificationList": null,
                "correspondenceSiteList": null,
                "documentFileList": null,
                "referencePlan": null,
                "errorCode": null,
                "errorMessage": null
            },
            {
                "id": 7,
                "code": "1",
                "arName": "مكتب مستشار يالوزير",
                "enName": "Office of Counselors of the Minister",
                "description": "1",
                "parent": 2,
                "registryParentId": null,
                "centralArchiveUnitId": null,
                "hasRegistry": true,
                "centralArchive": true,
                "status": true,
                "ldapPrefix": "dsad",
                "email": "dasd@jj.com",
                "mobile": "222",
                "referenceNumberPlanId": 1,
                "adminUserId": null,
                "managerId": null,
                "viceManagerId": null,
                "logo": null,
                "followupUsers": null,
                "outype": 167,
                "correspondenceTypeId": 1,
                "securitySchema": 42,
                "enableEscalation": true,
                "escalationProcess": null,
                "escalationNotifySender": true,
                "escalationNotifyReceiver": true,
                "deadlineReminder": 1,
                "enableSmsnotification": true,
                "enableEmailNotification": true,
                "sla": 2,
                "classificationList": null,
                "correspondenceSiteList": null,
                "documentFileList": null,
                "referencePlan": null,
                "errorCode": null,
                "errorMessage": null
            },
            {
                "id": 8,
                "code": "1",
                "arName": "ادارة التدقيق الداخلي",
                "enName": "Internal Audit Department",
                "description": "1",
                "parent": 2,
                "registryParentId": 8,
                "centralArchiveUnitId": 8,
                "hasRegistry": false,
                "centralArchive": false,
                "status": true,
                "ldapPrefix": "dsad",
                "email": "dasd@jj.com",
                "mobile": "222",
                "referenceNumberPlanId": 1,
                "adminUserId": null,
                "managerId": null,
                "viceManagerId": null,
                "logo": null,
                "followupUsers": null,
                "outype": 168,
                "correspondenceTypeId": 1,
                "securitySchema": 42,
                "enableEscalation": true,
                "escalationProcess": null,
                "escalationNotifySender": true,
                "escalationNotifyReceiver": true,
                "deadlineReminder": 1,
                "enableSmsnotification": true,
                "enableEmailNotification": true,
                "sla": 2,
                "classificationList": null,
                "correspondenceSiteList": null,
                "documentFileList": null,
                "referencePlan": null,
                "errorCode": null,
                "errorMessage": null
            },
            {
                "id": 9,
                "code": "1",
                "arName": "ادارة الشؤون المالية\r\nوالإدارية",
                "enName": "Financial and Administrative Affairs Department",
                "description": "1",
                "parent": 6,
                "registryParentId": null,
                "centralArchiveUnitId": 1,
                "hasRegistry": true,
                "centralArchive": true,
                "status": true,
                "ldapPrefix": "dsad",
                "email": "dasd@jj.com",
                "mobile": "222",
                "referenceNumberPlanId": 1,
                "adminUserId": null,
                "managerId": null,
                "viceManagerId": null,
                "logo": null,
                "followupUsers": null,
                "outype": 175,
                "correspondenceTypeId": 1,
                "securitySchema": 41,
                "enableEscalation": true,
                "escalationProcess": null,
                "escalationNotifySender": true,
                "escalationNotifyReceiver": true,
                "deadlineReminder": 1,
                "enableSmsnotification": true,
                "enableEmailNotification": true,
                "sla": 2,
                "classificationList": null,
                "correspondenceSiteList": null,
                "documentFileList": null,
                "referencePlan": null,
                "errorCode": null,
                "errorMessage": null
            },
            {
                "id": 10,
                "code": "1",
                "arName": "ادارة نظم المعلومات",
                "enName": "Information Systems Management",
                "description": "1",
                "parent": 6,
                "registryParentId": null,
                "centralArchiveUnitId": null,
                "hasRegistry": true,
                "centralArchive": true,
                "status": true,
                "ldapPrefix": "dsad",
                "email": "dasd@jj.com",
                "mobile": "222",
                "referenceNumberPlanId": 1,
                "adminUserId": null,
                "managerId": null,
                "viceManagerId": null,
                "logo": null,
                "followupUsers": null,
                "outype": 167,
                "correspondenceTypeId": 1,
                "securitySchema": 42,
                "enableEscalation": true,
                "escalationProcess": null,
                "escalationNotifySender": true,
                "escalationNotifyReceiver": true,
                "deadlineReminder": 1,
                "enableSmsnotification": true,
                "enableEmailNotification": true,
                "sla": 2,
                "classificationList": null,
                "correspondenceSiteList": null,
                "documentFileList": null,
                "referencePlan": null,
                "errorCode": null,
                "errorMessage": null
            },
            {
                "id": 11,
                "code": "1",
                "arName": "قسم الأرشيف\r\nالمركزي",
                "enName": "Department of Central Archives",
                "description": "1",
                "parent": 6,
                "registryParentId": 6,
                "centralArchiveUnitId": null,
                "hasRegistry": false,
                "centralArchive": true,
                "status": true,
                "ldapPrefix": "dsad",
                "email": "dasd@jj.com",
                "mobile": "222",
                "referenceNumberPlanId": 1,
                "adminUserId": null,
                "managerId": null,
                "viceManagerId": null,
                "logo": null,
                "followupUsers": null,
                "outype": 220,
                "correspondenceTypeId": 1,
                "securitySchema": 42,
                "enableEscalation": true,
                "escalationProcess": null,
                "escalationNotifySender": true,
                "escalationNotifyReceiver": true,
                "deadlineReminder": 1,
                "enableSmsnotification": true,
                "enableEmailNotification": true,
                "sla": 2,
                "classificationList": null,
                "correspondenceSiteList": null,
                "documentFileList": null,
                "referencePlan": null,
                "errorCode": null,
                "errorMessage": null
            },
            {
                "id": 12,
                "code": "1",
                "arName": "ادارة الموارد البشرية",
                "enName": "Human Resource Management\r\n",
                "description": "1",
                "parent": 6,
                "registryParentId": null,
                "centralArchiveUnitId": null,
                "hasRegistry": true,
                "centralArchive": true,
                "status": true,
                "ldapPrefix": "dsad",
                "email": "dasd@jj.com",
                "mobile": "222",
                "referenceNumberPlanId": 1,
                "adminUserId": null,
                "managerId": null,
                "viceManagerId": null,
                "logo": null,
                "followupUsers": null,
                "outype": 167,
                "correspondenceTypeId": 1,
                "securitySchema": 42,
                "enableEscalation": true,
                "escalationProcess": null,
                "escalationNotifySender": true,
                "escalationNotifyReceiver": true,
                "deadlineReminder": 1,
                "enableSmsnotification": true,
                "enableEmailNotification": true,
                "sla": 2,
                "classificationList": null,
                "correspondenceSiteList": null,
                "documentFileList": null,
                "referencePlan": null,
                "errorCode": null,
                "errorMessage": null
            },
            {
                "id": 13,
                "code": "1",
                "arName": "قسم الرواتب\r\nوالأجور",
                "enName": "Salaries and wages department",
                "description": "1",
                "parent": 12,
                "registryParentId": null,
                "centralArchiveUnitId": null,
                "hasRegistry": true,
                "centralArchive": true,
                "status": true,
                "ldapPrefix": "dsad",
                "email": "dasd@jj.com",
                "mobile": "222",
                "referenceNumberPlanId": 1,
                "adminUserId": null,
                "managerId": null,
                "viceManagerId": null,
                "logo": null,
                "followupUsers": null,
                "outype": 167,
                "correspondenceTypeId": 1,
                "securitySchema": 42,
                "enableEscalation": true,
                "escalationProcess": null,
                "escalationNotifySender": true,
                "escalationNotifyReceiver": true,
                "deadlineReminder": 1,
                "enableSmsnotification": true,
                "enableEmailNotification": true,
                "sla": 2,
                "classificationList": null,
                "correspondenceSiteList": null,
                "documentFileList": null,
                "referencePlan": null,
                "errorCode": null,
                "errorMessage": null
            },
            {
                "id": 14,
                "code": "1",
                "arName": "قسم الموارد البشرية",
                "enName": "Department of Human Resources",
                "description": "1",
                "parent": 12,
                "registryParentId": null,
                "centralArchiveUnitId": null,
                "hasRegistry": true,
                "centralArchive": true,
                "status": true,
                "ldapPrefix": "dsad",
                "email": "dasd@jj.com",
                "mobile": "222",
                "referenceNumberPlanId": 1,
                "adminUserId": null,
                "managerId": null,
                "viceManagerId": null,
                "logo": null,
                "followupUsers": null,
                "outype": 168,
                "correspondenceTypeId": 1,
                "securitySchema": 42,
                "enableEscalation": true,
                "escalationProcess": null,
                "escalationNotifySender": true,
                "escalationNotifyReceiver": true,
                "deadlineReminder": 1,
                "enableSmsnotification": true,
                "enableEmailNotification": true,
                "sla": 2,
                "classificationList": null,
                "correspondenceSiteList": null,
                "documentFileList": null,
                "referencePlan": null,
                "errorCode": null,
                "errorMessage": null
            },
            {
                "id": 15,
                "code": "1",
                "arName": "ادارة الشؤون المالية",
                "enName": "Financial Affairs Administration",
                "description": "1",
                "parent": 9,
                "registryParentId": null,
                "centralArchiveUnitId": null,
                "hasRegistry": true,
                "centralArchive": true,
                "status": true,
                "ldapPrefix": "dsad",
                "email": "dasd@jj.com",
                "mobile": "222",
                "referenceNumberPlanId": 17,
                "adminUserId": null,
                "managerId": null,
                "viceManagerId": null,
                "logo": null,
                "followupUsers": null,
                "outype": 166,
                "correspondenceTypeId": 1,
                "securitySchema": 42,
                "enableEscalation": true,
                "escalationProcess": null,
                "escalationNotifySender": true,
                "escalationNotifyReceiver": true,
                "deadlineReminder": 1,
                "enableSmsnotification": true,
                "enableEmailNotification": true,
                "sla": 2,
                "classificationList": null,
                "correspondenceSiteList": null,
                "documentFileList": null,
                "referencePlan": null,
                "errorCode": null,
                "errorMessage": null
            },
            {
                "id": 16,
                "code": "1",
                "arName": "ادارة الشؤون\r\nالإدارية",
                "enName": "Administrative Affairs Department",
                "description": "1",
                "parent": 9,
                "registryParentId": null,
                "centralArchiveUnitId": 16,
                "hasRegistry": true,
                "centralArchive": false,
                "status": true,
                "ldapPrefix": "dsad",
                "email": "dasd@jj.com",
                "mobile": "222",
                "referenceNumberPlanId": 1,
                "adminUserId": null,
                "managerId": null,
                "viceManagerId": null,
                "logo": null,
                "followupUsers": null,
                "outype": 168,
                "correspondenceTypeId": 1,
                "securitySchema": 41,
                "enableEscalation": true,
                "escalationProcess": null,
                "escalationNotifySender": true,
                "escalationNotifyReceiver": true,
                "deadlineReminder": 1,
                "enableSmsnotification": true,
                "enableEmailNotification": true,
                "sla": 2,
                "classificationList": null,
                "correspondenceSiteList": null,
                "documentFileList": null,
                "referencePlan": null,
                "errorCode": null,
                "errorMessage": null
            },
            {
                "id": 75,
                "code": "459659",
                "arName": "إدارة جديده جدا",
                "enName": "new department",
                "description": "asdlasfkl",
                "parent": 1,
                "registryParentId": null,
                "centralArchiveUnitId": null,
                "hasRegistry": true,
                "centralArchive": true,
                "status": true,
                "ldapPrefix": "4656675",
                "email": null,
                "mobile": null,
                "referenceNumberPlanId": 17,
                "adminUserId": 80,
                "managerId": 1,
                "viceManagerId": 12,
                "logo": null,
                "followupUsers": null,
                "outype": 169,
                "correspondenceTypeId": 1,
                "securitySchema": 42,
                "enableEscalation": false,
                "escalationProcess": 46,
                "escalationNotifySender": true,
                "escalationNotifyReceiver": true,
                "deadlineReminder": 1,
                "enableSmsnotification": true,
                "enableEmailNotification": true,
                "sla": 10,
                "classificationList": null,
                "correspondenceSiteList": null,
                "documentFileList": null,
                "referencePlan": null,
                "errorCode": null,
                "errorMessage": null
            }
        ];
        var response = new Response();

        // get all organizations
        $httpBackend
            .whenGET(urlService.organizations)
            .respond(function () {
                return [200, response.setResponse(organizations)];
            });

        // add new organization
        $httpBackend
            .whenPOST(urlService.organizations)
            .respond(function (method, url, data) {
                var organization = JSON.parse(data);
                // create new id for model
                organization.id = generator.createNewID(organizations, 'id');
                // push model to collections
                organizations.push(organization);
                return [200, response.setResponse(organization.id)];
            });

        // edit organization
        $httpBackend
            .whenPUT(urlService.organizations)
            .respond(function (method, url, data) {
                //var organization = new Organization(data);
                var organization = JSON.parse(data);

                for (var i = 0; i < organizations.length; i++) {
                    if (organizations[i].id === organization.id) {
                        organizations[i] = organizations;
                        break;
                    }
                }

                return [200, response.setResponse(organization)];
            });

        // delete organizations bulk
        $httpBackend.whenDELETE(urlService.organizations + '/bulk').respond(function (method, url, data) {
            var organizationsToDelete = JSON.parse(data);

            for (var i = 0; i < organizationsToDelete.length; i++) {
                for (var j = 0; j < organizations.length; j++) {
                    if (organizations[j].id === organizationsToDelete[i]) {
                        organizations.splice(j, 1);
                        break;
                    }
                }
            }
            return [200, response.setResponse(true)];
        });

        // delete organization single
        $httpBackend.whenDELETE(function (url) {
            return urlWithId.test(url);
        }).respond(function (method, url, data) {
            var id = url.split('/').pop();
            for (var i = 0; i < organizations.length; i++) {
                if (organizations[i].id === id) {
                    organizations.splice(i, 1);
                }
            }
            return [200, response.setResponse(true)];
        });

    });
};