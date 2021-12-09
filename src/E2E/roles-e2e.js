module.exports = function (app) {
    app.run(function ($httpBackend, urlService, generator, Response, Role) {
        'ngInject';
        var urlWithId = new RegExp(urlService.roles + '\/(\\d+)');
        var urlWithMemberId = new RegExp(urlService.roles + '\/(\\d+)'+ '/members');
        var urlActivateWithId = new RegExp(urlService.roles + '/activate' + '\/(\\d+)');
        var urlDeactivateWithId = new RegExp(urlService.roles + '/deactivate' + '\/(\\d+)');

        var roles = [
            {
                "id": 5,
                "arName": "iyad",
                "enName": "enName",
                "status": false,
                "description": "description",
                "customRolePermission": [
                    {
                        "id": 89,
                        "permissionId": 1,
                        "permission": {
                            "id": 1,
                            "permissionKey": "a",
                            "groupId": 1,
                            "arName": "dsad",
                            "enName": "dasd",
                            "status": true,
                            "description": "dsad"
                        }
                    },
                    {
                        "id": 90,
                        "permissionId": 2,
                        "permission": {
                            "id": 2,
                            "permissionKey": "s",
                            "groupId": 1,
                            "arName": "dasd",
                            "enName": "22",
                            "status": true,
                            "description": null
                        }
                    }
                ]
            },
            {
                "id": 8,
                "arName": "iyad212",
                "enName": "enName212",
                "status": false,
                "description": "description",
                "customRolePermission": [
                    {
                        "id": 94,
                        "permissionId": 1,
                        "permission": {
                            "id": 1,
                            "permissionKey": "a",
                            "groupId": 1,
                            "arName": "dsad",
                            "enName": "dasd",
                            "status": true,
                            "description": "dsad"
                        }
                    },
                    {
                        "id": 95,
                        "permissionId": 2,
                        "permission": {
                            "id": 2,
                            "permissionKey": "s",
                            "groupId": 1,
                            "arName": "dasd",
                            "enName": "22",
                            "status": true,
                            "description": null
                        }
                    }
                ]
            },
            {
                "id": 35,
                "arName": "سبسيبس",
                "enName": "sdfsdfsdf",
                "status": false,
                "description": "asasfsdfsdf",
                "customRolePermission": [
                    {
                        "id": 99,
                        "permissionId": 1,
                        "permission": {
                            "id": 1,
                            "permissionKey": "a",
                            "groupId": 1,
                            "arName": "dsad",
                            "enName": "dasd",
                            "status": true,
                            "description": "dsad"
                        }
                    },
                    {
                        "id": 100,
                        "permissionId": 2,
                        "permission": {
                            "id": 2,
                            "permissionKey": "s",
                            "groupId": 1,
                            "arName": "dasd",
                            "enName": "22",
                            "status": true,
                            "description": null
                        }
                    }
                ]
            },
            {
                "id": 40,
                "arName": "ضصضصضص",
                "enName": "qwqwqwqw",
                "status": false,
                "description": "wqwqwqwq",
                "customRolePermission": [
                    {
                        "id": 103,
                        "permissionId": 1,
                        "permission": {
                            "id": 1,
                            "permissionKey": "a",
                            "groupId": 1,
                            "arName": "dsad",
                            "enName": "dasd",
                            "status": true,
                            "description": "dsad"
                        }
                    }
                ]
            },
            {
                "id": 43,
                "arName": "فقسف405",
                "enName": "test405",
                "status": true,
                "description": "test405",
                "customRolePermission": [
                    {
                        "id": 116,
                        "permissionId": 1,
                        "permission": {
                            "id": 1,
                            "permissionKey": "a",
                            "groupId": 1,
                            "arName": "dsad",
                            "enName": "dasd",
                            "status": true,
                            "description": "dsad"
                        }
                    },
                    {
                        "id": 117,
                        "permissionId": 2,
                        "permission": {
                            "id": 2,
                            "permissionKey": "s",
                            "groupId": 1,
                            "arName": "dasd",
                            "enName": "22",
                            "status": true,
                            "description": null
                        }
                    }
                ]
            },
            {
                "id": 44,
                "arName": "ضصضصضصضص",
                "enName": "qwwqwqw",
                "status": true,
                "description": "wqwqw",
                "customRolePermission": [
                    {
                        "id": 118,
                        "permissionId": 1,
                        "permission": {
                            "id": 1,
                            "permissionKey": "a",
                            "groupId": 1,
                            "arName": "dsad",
                            "enName": "dasd",
                            "status": true,
                            "description": "dsad"
                        }
                    },
                    {
                        "id": 119,
                        "permissionId": 2,
                        "permission": {
                            "id": 2,
                            "permissionKey": "s",
                            "groupId": 1,
                            "arName": "dasd",
                            "enName": "22",
                            "status": true,
                            "description": null
                        }
                    }
                ]
            },
            {
                "id": 45,
                "arName": "iyad99",
                "enName": "enName99",
                "status": true,
                "description": "description99",
                "customRolePermission": [
                    {
                        "id": 120,
                        "permissionId": 1,
                        "permission": {
                            "id": 1,
                            "permissionKey": "a",
                            "groupId": 1,
                            "arName": "dsad",
                            "enName": "dasd",
                            "status": true,
                            "description": "dsad"
                        }
                    },
                    {
                        "id": 121,
                        "permissionId": 1,
                        "permission": {
                            "id": 1,
                            "permissionKey": "a",
                            "groupId": 1,
                            "arName": "dsad",
                            "enName": "dasd",
                            "status": true,
                            "description": "dsad"
                        }
                    },
                    {
                        "id": 122,
                        "permissionId": 1,
                        "permission": {
                            "id": 1,
                            "permissionKey": "a",
                            "groupId": 1,
                            "arName": "dsad",
                            "enName": "dasd",
                            "status": true,
                            "description": "dsad"
                        }
                    }
                ]
            },
            {
                "id": 46,
                "arName": "قثقفثقفقث",
                "enName": "retertetretr",
                "status": false,
                "description": "eertetertret",
                "customRolePermission": [
                    {
                        "id": 127,
                        "permissionId": 1,
                        "permission": {
                            "id": 1,
                            "permissionKey": "a",
                            "groupId": 1,
                            "arName": "dsad",
                            "enName": "dasd",
                            "status": true,
                            "description": "dsad"
                        }
                    }
                ]
            },
            {
                "id": 47,
                "arName": "ثقثقثقثقثق",
                "enName": "eerereere",
                "status": false,
                "description": "erereerere",
                "customRolePermission": [
                    {
                        "id": 124,
                        "permissionId": 1,
                        "permission": {
                            "id": 1,
                            "permissionKey": "a",
                            "groupId": 1,
                            "arName": "dsad",
                            "enName": "dasd",
                            "status": true,
                            "description": "dsad"
                        }
                    }
                ]
            }];

        var customRolePermissions = [
            {
                "id": 1,
                "permissionKey": "a",
                "groupId": 1,
                "arName": "dsad",
                "enName": "dasd",
                "status": true,
                "description": "dsad"
            },
            {
                "id": 2,
                "permissionKey": "s",
                "groupId": 1,
                "arName": "dasd",
                "enName": "22",
                "status": true,
                "description": null
            }
        ];

        var customRoleMembers = [
            {
                "id": 1,
                "arFullName": "أحمد مصطفى ابراهيم",
                "loginName": "BeSaRa",
                "enFullName": "Ahmed Mostafa Ebrahem",
                "employeeNo": 332247,
                "qid": "12345678900",
                "domainName": "p8admin",
                "rank": null,
                "jobTitle": 65,
                "subscriptionsmsNotify": true,
                "newItemEmailNotify": true,
                "newsmsEmailNotify": true,
                "deadlineEmailNotify": true,
                "defaultDisplayLang": 1,
                "searchAmountLimit": 1,
                "subscriptionEmailNotify": true,
                "deadlinesmsNotify": true,
                "reminderEmailNotify": true,
                "reminderSmsnotify": true,
                "newItemEmailPriority": 1,
                "newItemSmspriority": 1,
                "email": "ss@ff.com",
                "deadlineEmailPriority": 1,
                "deadlineSmspriority": 1,
                "reminderEmailPriority": 1,
                "reminderSmsPriority": 1,
                "reminderEmailDays": 222,
                "reminderSmsdays": 1111,
                "mobile": "222888888",
                "gender": 1,
                "inboxRefreshInterval": 20,
                "defaultOUID": 1,
                "defaultThemeID": 1,
                "classificationPermisssions": null,
                "actions": null
            },
            {
                "id": 12,
                "arFullName": "اياد",
                "loginName": "iyad_iyad",
                "enFullName": "user1",
                "employeeNo": 33225666,
                "qid": "28276900256",
                "domainName": "user_user",
                "rank": null,
                "jobTitle": 108,
                "subscriptionsmsNotify": true,
                "newItemEmailNotify": true,
                "newsmsEmailNotify": true,
                "deadlineEmailNotify": true,
                "defaultDisplayLang": 1,
                "searchAmountLimit": 20,
                "subscriptionEmailNotify": true,
                "deadlinesmsNotify": true,
                "reminderEmailNotify": true,
                "reminderSmsnotify": true,
                "newItemEmailPriority": 1,
                "newItemSmspriority": 1,
                "email": "iyad@eblacorp.com",
                "deadlineEmailPriority": 1,
                "deadlineSmspriority": 1,
                "reminderEmailPriority": 1,
                "reminderSmsPriority": 1,
                "reminderEmailDays": 222,
                "reminderSmsdays": 1111,
                "mobile": "666388476666",
                "gender": 1,
                "inboxRefreshInterval": 20,
                "defaultOUID": 1,
                "defaultThemeID": 1,
                "classificationPermisssions": null,
                "actions": null
            },
            {
                "id": 29,
                "arFullName": "اياد123",
                "loginName": "iyad3",
                "enFullName": "user12123",
                "employeeNo": 33225288,
                "qid": "28276900299",
                "domainName": "ihanouneh",
                "rank": null,
                "jobTitle": 108,
                "subscriptionsmsNotify": true,
                "newItemEmailNotify": true,
                "newsmsEmailNotify": false,
                "deadlineEmailNotify": true,
                "defaultDisplayLang": 1,
                "searchAmountLimit": 20,
                "subscriptionEmailNotify": true,
                "deadlinesmsNotify": true,
                "reminderEmailNotify": true,
                "reminderSmsnotify": true,
                "newItemEmailPriority": 1,
                "newItemSmspriority": 1,
                "email": "iyad@eblacorp.com",
                "deadlineEmailPriority": 1,
                "deadlineSmspriority": 1,
                "reminderEmailPriority": 1,
                "reminderSmsPriority": 1,
                "reminderEmailDays": 222,
                "reminderSmsdays": 1111,
                "mobile": "+97466638845",
                "gender": 1,
                "inboxRefreshInterval": 20,
                "defaultOUID": 1,
                "defaultThemeID": null,
                "classificationPermisssions": null,
                "actions": null
            },
            {
                "id": 30,
                "arFullName": "hussam2",
                "loginName": "hussam2",
                "enFullName": "test22",
                "employeeNo": 33226299,
                "qid": "28276900299",
                "domainName": "test22",
                "rank": null,
                "jobTitle": 108,
                "subscriptionsmsNotify": true,
                "newItemEmailNotify": true,
                "newsmsEmailNotify": true,
                "deadlineEmailNotify": true,
                "defaultDisplayLang": 1,
                "searchAmountLimit": 20,
                "subscriptionEmailNotify": true,
                "deadlinesmsNotify": true,
                "reminderEmailNotify": true,
                "reminderSmsnotify": true,
                "newItemEmailPriority": 1,
                "newItemSmspriority": 1,
                "email": "iyadrr@eblacorp.com",
                "deadlineEmailPriority": 1,
                "deadlineSmspriority": 1,
                "reminderEmailPriority": 1,
                "reminderSmsPriority": 1,
                "reminderEmailDays": 222,
                "reminderSmsdays": 1111,
                "mobile": "66638847888",
                "gender": 1,
                "inboxRefreshInterval": 20,
                "defaultOUID": 1,
                "defaultThemeID": null,
                "classificationPermisssions": null,
                "actions": null
            },
            {
                "id": 52,
                "arFullName": "testingUser",
                "loginName": "testingUser",
                "enFullName": "testingUser",
                "employeeNo": 12121212,
                "qid": "12121212121",
                "domainName": "testingUser",
                "rank": null,
                "jobTitle": 65,
                "subscriptionsmsNotify": false,
                "newItemEmailNotify": false,
                "newsmsEmailNotify": false,
                "deadlineEmailNotify": false,
                "defaultDisplayLang": 2,
                "searchAmountLimit": null,
                "subscriptionEmailNotify": false,
                "deadlinesmsNotify": false,
                "reminderEmailNotify": false,
                "reminderSmsnotify": false,
                "newItemEmailPriority": null,
                "newItemSmspriority": null,
                "email": "testingUser@testinguser.com",
                "deadlineEmailPriority": null,
                "deadlineSmspriority": null,
                "reminderEmailPriority": null,
                "reminderSmsPriority": null,
                "reminderEmailDays": null,
                "reminderSmsdays": null,
                "mobile": "1234567890",
                "gender": 1,
                "inboxRefreshInterval": null,
                "defaultOUID": 1,
                "defaultThemeID": null,
                "classificationPermisssions": null,
                "actions": null
            }
        ];

        var response = new Response();

        // get all permissions
        $httpBackend
            .whenGET(urlService.rolePermissions)
            .respond(function () {
                return [200, response.setResponse(customRolePermissions)];
            });

        // show role members
        $httpBackend.whenGET(function (url) {
            return urlWithMemberId.test(url);
        }).respond(function (method, url, data) {
            return [200, response.setResponse(customRoleMembers)];
        });

        // get all roles
        $httpBackend
            .whenGET(urlService.roles + '/composite')
            .respond(function () {
                return [200, response.setResponse(roles)];
            });

        // add new role
        $httpBackend
            .whenPOST(urlService.roles)
            .respond(function (method, url, data) {
                var role = JSON.parse(data);
                // create new id for model
                role.id = generator.createNewID(roles, 'id');

                var selectedCustomRolePermissions = role.customRolePermission;
                role.customRolePermission = [];
                for (var i = 0; i < selectedCustomRolePermissions.length; i++) {
                    var permission = _.filter(customRolePermissions, function (e) {
                        return e.id === selectedCustomRolePermissions[i].permissionId;
                    })[0];
                    role.customRolePermission.push({
                        "id": null,
                        "permissionId": selectedCustomRolePermissions[i].permissionId,
                        "permission": permission
                    })
                }

                // push model to collections
                roles.push(role);
                return [200, response.setResponse(role.id)];
            });

        // edit role
        $httpBackend.whenPUT(urlService.roles)
            .respond(function (method, url, data) {
                var role = new Role(JSON.parse(data));

                var selectedCustomRolePermissions = role.customRolePermission;
                role.customRolePermission = [];
                for (var i = 0; i < selectedCustomRolePermissions.length; i++) {
                    var permission = _.filter(customRolePermissions, function (e) {
                        return e.id === selectedCustomRolePermissions[i].permissionId;
                    })[0];
                    role.customRolePermission.push({
                        "id": null,
                        "permissionId": selectedCustomRolePermissions[i].permissionId,
                        "permission": permission
                    })
                }

                for (var i = 0; i < roles.length; i++) {
                    if (roles[i].id === role.id) {
                        roles[i] = role;
                        break;
                    }
                }

                return [200, response.setResponse(role)];
            });

        // delete roles bulk
        $httpBackend.whenDELETE(urlService.roles + '/bulk').respond(function (method, url, data) {
            var rolesToDelete = JSON.parse(data);

            for (var i = 0; i < rolesToDelete.length; i++) {
                for (var j = 0; j < roles.length; j++) {
                    if (roles[j].id === rolesToDelete[i]) {
                        roles.splice(j, 1);
                        break;
                    }
                }
            }
            return [200, response.setResponse(true)];
        });

        // delete role single
        $httpBackend.whenDELETE(function (url) {
            return urlWithId.test(url);
        }).respond(function (method, url, data) {
            var id = url.split('/').pop();
            for (var i = 0; i < roles.length; i++) {
                if (roles[i].id === id) {
                    roles.splice(i, 1);
                }
            }
            return [200, response.setResponse(true)];
        });

        // activate role status single
        $httpBackend.whenPUT(function (url) {
            return urlActivateWithId.test(url);
        }).respond(function (method, url, data) {
            var id = url.split('/').pop();

            var role = roles.filter(function (e) {
                return e.id === parseInt(id);
            })[0];

            role.status = true;

            return [200, response.setResponse(true)];
        });

        // deactivate role status single
        $httpBackend.whenPUT(function (url) {
            return urlDeactivateWithId.test(url);
        }).respond(function (method, url, data) {
            var id = url.split('/').pop();

            var role = roles.filter(function (e) {
                return e.id === parseInt(id);
            })[0];

            role.status = false;

            return [200, response.setResponse(true)];
        });

        // activate role status bulk
        $httpBackend.whenPUT((urlService.roles + '/activate/bulk')).respond(function (method, url, data) {
            var rolesToActivate = JSON.parse(data);
            for (var i = 0; i < rolesToActivate.length; i++) {
                for (var j = 0; j < roles.length; j++) {
                    if (roles[j].id === rolesToActivate[i]) {
                        roles[j].status = true;
                        break;
                    }
                }
            }
            return [200, response.setResponse(true)];
        });

        // Deactivate role status bulk
        $httpBackend.whenPUT((urlService.roles + '/deactivate/bulk')).respond(function (method, url, data) {
            var rolesToActivate = JSON.parse(data);
            for (var i = 0; i < rolesToActivate.length; i++) {
                for (var j = 0; j < roles.length; j++) {
                    if (roles[j].id === rolesToActivate[i]) {
                        roles[j].status = false;
                        break;
                    }
                }
            }
            return [200, response.setResponse(true)];
        });


    })
};