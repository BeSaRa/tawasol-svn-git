module.exports = function (app) {
    app.run(function ($httpBackend, urlService, generator, Response, WorkflowGroup, applicationUserService) {
        'ngInject';
        var urlWithId = new RegExp(urlService.workflowGroups + '\/(\\d+)');
        var urlActivateWithId = new RegExp(urlService.workflowGroups + '/activate' + '\/(\\d+)');
        var urlDeactivateWithId = new RegExp(urlService.workflowGroups + '/deactivate' + '\/(\\d+)');

        var workflowGroups = [
            {
                "id": 1,
                "arName": "dsssadas",
                "enName": "ssss",
                "status": true,
                "global": true,
                "groupMembers": [{
                    "id": 111,
                    "member": {
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
                    }
                }]
            }, {
                "id": 18,
                "arName": "فثسف102",
                "enName": "workflow group 102",
                "status": true,
                "global": true,
                "groupMembers": [{
                    "id": 109,
                    "member": {
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
                }, {
                    "id": 110,
                    "member": {
                        "id": 78,
                        "arFullName": "testingUser",
                        "loginName": "testingUserQW",
                        "enFullName": "testingUser",
                        "employeeNo": 11212121,
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
                        "email": "testingUser@dfdf.com",
                        "deadlineEmailPriority": null,
                        "deadlineSmspriority": null,
                        "reminderEmailPriority": null,
                        "reminderSmsPriority": null,
                        "reminderEmailDays": null,
                        "reminderSmsdays": null,
                        "mobile": "3434343434",
                        "gender": 1,
                        "inboxRefreshInterval": null,
                        "defaultOUID": 2,
                        "defaultThemeID": null,
                        "classificationPermisssions": null,
                        "actions": null
                    }
                }]
            }, {
                "id": 19,
                "arName": "ثقثقثقثسثق",
                "enName": "workflow group 103",
                "status": true,
                "global": true,
                "groupMembers": [{
                    "id": 94,
                    "member": {
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
                    }
                }]
            }, {
                "id": 20,
                "arName": "قثقثقثقثقث",
                "enName": "workflow group 105",
                "status": false,
                "global": false,
                "groupMembers": [{
                    "id": 107,
                    "member": {
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
                    }
                }]
            }, {
                "id": 21,
                "arName": "workflow group 107",
                "enName": "workflow group 107",
                "status": true,
                "global": true,
                "groupMembers": [{
                    "id": 95,
                    "member": {
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
                    }
                }, {
                    "id": 96,
                    "member": {
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
                }, {
                    "id": 97,
                    "member": {
                        "id": 67,
                        "arFullName": "testingUser",
                        "loginName": "testingUserqqq",
                        "enFullName": "testingUser",
                        "employeeNo": 12345678,
                        "qid": "12345678900",
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
                        "email": "testingUser@dfsdf.com",
                        "deadlineEmailPriority": null,
                        "deadlineSmspriority": null,
                        "reminderEmailPriority": null,
                        "reminderSmsPriority": null,
                        "reminderEmailDays": null,
                        "reminderSmsdays": null,
                        "mobile": "1212121212",
                        "gender": 1,
                        "inboxRefreshInterval": null,
                        "defaultOUID": 2,
                        "defaultThemeID": null,
                        "classificationPermisssions": null,
                        "actions": null
                    }
                }, {
                    "id": 98,
                    "member": {
                        "id": 78,
                        "arFullName": "testingUser",
                        "loginName": "testingUserQW",
                        "enFullName": "testingUser",
                        "employeeNo": 11212121,
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
                        "email": "testingUser@dfdf.com",
                        "deadlineEmailPriority": null,
                        "deadlineSmspriority": null,
                        "reminderEmailPriority": null,
                        "reminderSmsPriority": null,
                        "reminderEmailDays": null,
                        "reminderSmsdays": null,
                        "mobile": "3434343434",
                        "gender": 1,
                        "inboxRefreshInterval": null,
                        "defaultOUID": 2,
                        "defaultThemeID": null,
                        "classificationPermisssions": null,
                        "actions": null
                    }
                }, {
                    "id": 99,
                    "member": {
                        "id": 79,
                        "arFullName": "testingUserQW",
                        "loginName": "testingUserQ",
                        "enFullName": "testingUserQW",
                        "employeeNo": 12121221,
                        "qid": "12121221221",
                        "domainName": "testingUserQW",
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
                        "reminderEmailNotify": true,
                        "reminderSmsnotify": true,
                        "newItemEmailPriority": null,
                        "newItemSmspriority": null,
                        "email": "testingUser@dfdfdfdf.com",
                        "deadlineEmailPriority": null,
                        "deadlineSmspriority": null,
                        "reminderEmailPriority": null,
                        "reminderSmsPriority": null,
                        "reminderEmailDays": 1,
                        "reminderSmsdays": 5,
                        "mobile": "1212112112",
                        "gender": 1,
                        "inboxRefreshInterval": null,
                        "defaultOUID": 2,
                        "defaultThemeID": null,
                        "classificationPermisssions": null,
                        "actions": null
                    }
                }]
            }, {
                "id": 22,
                "arName": "workflow group 108",
                "enName": "workflow group 108",
                "status": false,
                "global": true,
                "groupMembers": []
            }, {
                "id": 23,
                "arName": "workflow group 109",
                "enName": "workflow group 109",
                "status": false,
                "global": true,
                "groupMembers": []
            }, {
                "id": 24,
                "arName": "شسشسشسشس",
                "enName": "asdsdwqwqwq",
                "status": true,
                "global": false,
                "groupMembers": [{
                    "id": 108,
                    "member": {
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
                    }
                }]
            }];

        var response = new Response();

        var applicationUsers = [];
        applicationUserService.loadApplicationUsers().then(function (value) {
            applicationUsers = value;
        });

        // get all workflowGroups
        $httpBackend
            .whenGET(urlService.workflowGroups)
            .respond(function () {
                return [200, response.setResponse(workflowGroups)];
            });

        // add new workflow Group
        $httpBackend
            .whenPOST(urlService.workflowGroups)
            .respond(function (method, url, data) {
                var workflowGroup = JSON.parse(data);
                // create new id for model
                workflowGroup.id = generator.createNewID(workflowGroups, 'id');

                var selectedGroupMembers = [];

                for (var index = 0; index < workflowGroup.groupMembers.length; index++) {
                    var getAppUser = applicationUsers.filter(function (user) {
                        return workflowGroup.groupMembers[index].member.id == user.id;
                    })[0];
                    if (getAppUser) {
                        selectedGroupMembers.push(getAppUser);
                    }
                }

                workflowGroup.groupMembers = [];
                for (var index = 0; index < selectedGroupMembers.length; index++) {
                    workflowGroup.groupMembers.push({"id": index, "member": selectedGroupMembers[index]});
                }

                // push model to collections
                workflowGroups.push(workflowGroup);
                return [200, response.setResponse(workflowGroup.id)];
            });

        // edit workflow Group
        $httpBackend.whenPUT(urlService.workflowGroups)
            .respond(function (method, url, data) {
                var workflowGroup = new WorkflowGroup(JSON.parse(data));

                var selectedGroupMembers = [];

                for (var index = 0; index < workflowGroup.groupMembers.length; index++) {
                    var getAppUser = applicationUsers.filter(function (user) {
                        return workflowGroup.groupMembers[index].member.id == user.id;
                    })[0];
                    if (getAppUser) {
                        selectedGroupMembers.push(getAppUser);
                    }
                }

                workflowGroup.groupMembers = [];
                for (var index = 0; index < selectedGroupMembers.length; index++) {
                    workflowGroup.groupMembers.push({"id": index, "member": selectedGroupMembers[index]});
                }

                for (var i = 0; i < workflowGroups.length; i++) {
                    if (workflowGroups[i].id === workflowGroup.id) {
                        workflowGroups[i] = workflowGroup;
                        break;
                    }
                }

                return [200, response.setResponse(workflowGroup)];
            });

        // delete workflowGroups bulk
        $httpBackend.whenDELETE(urlService.workflowGroups + '/bulk').respond(function (method, url, data) {
            var workflowGroupsToDelete = JSON.parse(data);

            for (var i = 0; i < workflowGroupsToDelete.length; i++) {
                for (var j = 0; j < workflowGroups.length; j++) {
                    if (workflowGroups[j].id === workflowGroupsToDelete[i]) {
                        workflowGroups.splice(j, 1);
                        break;
                    }
                }
            }
            return [200, response.setResponse(true)];
        });

        // delete workflowGroup single
        $httpBackend.whenDELETE(function (url) {
            return urlWithId.test(url);
        }).respond(function (method, url, data) {
            var id = url.split('/').pop();
            for (var i = 0; i < workflowGroups.length; i++) {
                if (workflowGroups[i].id === parseInt(id)) {
                    workflowGroups.splice(i, 1);
                }
            }
            return [200, response.setResponse(true)];
        });

        // activate workflowGroup status single
        $httpBackend.whenPUT(function (url) {
            return urlActivateWithId.test(url);
        }).respond(function (method, url, data) {
            var id = url.split('/').pop();

            var workflowGroup = workflowGroups.filter(function (e) {
                return e.id === parseInt(id);
            })[0];

            workflowGroup.status = true;

            return [200, response.setResponse(true)];
        });

        // deactivate workflowGroup status single
        $httpBackend.whenPUT(function (url) {
            return urlDeactivateWithId.test(url);
        }).respond(function (method, url, data) {
            var id = url.split('/').pop();

            var workflowGroup = workflowGroups.filter(function (e) {
                return e.id === parseInt(id);
            })[0];

            workflowGroup.status = false;

            return [200, response.setResponse(true)];
        });

        // activate workflowGroup status bulk
        $httpBackend.whenPUT((urlService.workflowGroups + '/activate/bulk')).respond(function (method, url, data) {
            var workflowGroupsToActivate = JSON.parse(data);
            for (var i = 0; i < workflowGroupsToActivate.length; i++) {
                for (var j = 0; j < workflowGroups.length; j++) {
                    if (workflowGroups[j].id === workflowGroupsToActivate[i]) {
                        workflowGroups[j].status = true;
                        break;
                    }
                }
            }
            return [200, response.setResponse(true)];
        });

        // Deactivate workflowGroup status bulk
        $httpBackend.whenPUT((urlService.workflowGroups + '/deactivate/bulk')).respond(function (method, url, data) {
            var workflowGroupsToActivate = JSON.parse(data);
            for (var i = 0; i < workflowGroupsToActivate.length; i++) {
                for (var j = 0; j < workflowGroups.length; j++) {
                    if (workflowGroups[j].id === workflowGroupsToActivate[i]) {
                        workflowGroups[j].status = false;
                        break;
                    }
                }
            }
            return [200, response.setResponse(true)];
        });


    })
};
