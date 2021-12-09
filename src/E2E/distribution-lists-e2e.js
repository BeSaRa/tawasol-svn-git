module.exports = function (app) {
    app.run(function ($httpBackend, urlService, generator, Response, DistributionList, _, correspondenceSiteService) {
        'ngInject';
        var urlWithId = new RegExp(urlService.distributionLists + '\/(\\d+)');
        var ouURLWithId = new RegExp(urlService.distributionLists + '\/(\\d+)');
        var urlActivateWithId = new RegExp(urlService.distributionLists + '/activate' + '\/(\\d+)');
        var urlDeactivateWithId = new RegExp(urlService.distributionLists + '/deactivate' + '\/(\\d+)');

        var distributionLists = [
            {
                "id": 19,
                "global": false,
                "arName": "ضصضصض",
                "enName": "wqwqwqwqwq",
                "status": true,
                "distributionListMembers": [
                    {
                        "id": 90,
                        "site": {
                            "id": 39,
                            "correspondenceTypeId": 218,
                            "relatedOus": null,
                            "correspondenceSiteType": null,
                            "parent": 38,
                            "isGlobal": true,
                            "arName": "شقشلاهؤ 701 سعلا",
                            "enName": "en 701 sub",
                            "status": false,
                            "arDisplayName": null,
                            "enDisplayName": null
                        }
                    }
                ],
                "relatedOus": null
            },
            {
                "id": 21,
                "global": true,
                "arName": "فثسف901",
                "enName": "test901",
                "status": true,
                "distributionListMembers": [
                    {
                        "id": 39,
                        "correspondenceTypeId": 218,
                        "relatedOus": null,
                        "correspondenceSiteType": null,
                        "parent": 38,
                        "isGlobal": true,
                        "arName": "شقشلاهؤ 701 سعلا",
                        "enName": "en 701 sub",
                        "status": false,
                        "arDisplayName": null,
                        "enDisplayName": null
                    }
                ],
                "relatedOus": null
            },
            {
                "id": 22,
                "global": true,
                "arName": "فثسف902",
                "enName": "test902",
                "status": true,
                "distributionListMembers": [
                    {
                        "id": 39,
                        "correspondenceTypeId": 218,
                        "relatedOus": null,
                        "correspondenceSiteType": null,
                        "parent": 38,
                        "isGlobal": true,
                        "arName": "شقشلاهؤ 701 سعلا",
                        "enName": "en 701 sub",
                        "status": false,
                        "arDisplayName": null,
                        "enDisplayName": null
                    }
                ],
                "relatedOus": null
            },
            {
                "id": 23,
                "global": true,
                "arName": "فثسف222",
                "enName": "test222",
                "status": true,
                "distributionListMembers": [
                    {
                        "id": 39,
                        "correspondenceTypeId": 218,
                        "relatedOus": null,
                        "correspondenceSiteType": null,
                        "parent": 38,
                        "isGlobal": true,
                        "arName": "شقشلاهؤ 701 سعلا",
                        "enName": "en 701 sub",
                        "status": false,
                        "arDisplayName": null,
                        "enDisplayName": null
                    }
                ],
                "relatedOus": null
            },
            {
                "id": 24,
                "global": true,
                "arName": "فثسف121",
                "enName": "test121",
                "status": false,
                "distributionListMembers": [
                    {
                        "id": 39,
                        "correspondenceTypeId": 218,
                        "relatedOus": null,
                        "correspondenceSiteType": null,
                        "parent": 38,
                        "isGlobal": true,
                        "arName": "شقشلاهؤ 701 سعلا",
                        "enName": "en 701 sub",
                        "status": false,
                        "arDisplayName": null,
                        "enDisplayName": null
                    }
                ],
                "relatedOus": null
            },
            {
                "id": 25,
                "global": true,
                "arName": "فثسف888",
                "enName": "test888",
                "status": true,
                "distributionListMembers": [
                    {
                        "id": 39,
                        "correspondenceTypeId": 218,
                        "relatedOus": null,
                        "correspondenceSiteType": null,
                        "parent": 38,
                        "isGlobal": true,
                        "arName": "شقشلاهؤ 701 سعلا",
                        "enName": "en 701 sub",
                        "status": false,
                        "arDisplayName": null,
                        "enDisplayName": null
                    }
                ],
                "relatedOus": null
            }
        ];
        var ouDistributionLists = [
            {
                "id": 93,
                "distributionList": {
                    "id": 24,
                    "global": true,
                    "arName": "فثسف121",
                    "enName": "test121",
                    "status": false,
                    "distributionListMembers": [
                        {
                            "id": 99,
                            "site": {
                                "id": 39,
                                "correspondenceTypeId": 218,
                                "relatedOus": null,
                                "correspondenceSiteType": null,
                                "parent": 38,
                                "isGlobal": true,
                                "arName": "شقشلاهؤ 701 سعلا",
                                "enName": "en 701 sub",
                                "status": false,
                                "arDisplayName": null,
                                "enDisplayName": null
                            }
                        },
                        {
                            "id": 98,
                            "site": {
                                "id": 46,
                                "correspondenceTypeId": 218,
                                "relatedOus": null,
                                "correspondenceSiteType": null,
                                "parent": 42,
                                "isGlobal": false,
                                "arName": "سعلا1",
                                "enName": "sub1",
                                "status": true,
                                "arDisplayName": null,
                                "enDisplayName": null
                            }
                        }
                    ],
                    "relatedOus": null
                },
                "ouid": 1
            },
            {
                "id": 100,
                "distributionList": {
                    "id": 24,
                    "global": true,
                    "arName": "فثسف121",
                    "enName": "test121",
                    "status": false,
                    "distributionListMembers": [
                        {
                            "id": 99,
                            "site": {
                                "id": 39,
                                "correspondenceTypeId": 218,
                                "relatedOus": null,
                                "correspondenceSiteType": null,
                                "parent": 38,
                                "isGlobal": true,
                                "arName": "شقشلاهؤ 701 سعلا",
                                "enName": "en 701 sub",
                                "status": false,
                                "arDisplayName": null,
                                "enDisplayName": null
                            }
                        },
                        {
                            "id": 98,
                            "site": {
                                "id": 46,
                                "correspondenceTypeId": 218,
                                "relatedOus": null,
                                "correspondenceSiteType": null,
                                "parent": 42,
                                "isGlobal": false,
                                "arName": "سعلا1",
                                "enName": "sub1",
                                "status": true,
                                "arDisplayName": null,
                                "enDisplayName": null
                            }
                        }
                    ],
                    "relatedOus": null
                },
                "ouid": 1
            },
            {
                "id": 104,
                "distributionList": {
                    "id": 30,
                    "global": true,
                    "arName": "فثسف1013",
                    "enName": "test1013",
                    "status": true,
                    "distributionListMembers": [
                        {
                            "id": 105,
                            "site": {
                                "id": 39,
                                "correspondenceTypeId": 218,
                                "relatedOus": null,
                                "correspondenceSiteType": null,
                                "parent": 38,
                                "isGlobal": true,
                                "arName": "شقشلاهؤ 701 سعلا",
                                "enName": "en 701 sub",
                                "status": false,
                                "arDisplayName": null,
                                "enDisplayName": null
                            }
                        }
                    ],
                    "relatedOus": null
                },
                "ouid": 1
            },
            {
                "id": 113,
                "distributionList": {
                    "id": 19,
                    "global": true,
                    "arName": "ضصضصض",
                    "enName": "wqwqwqwqwq",
                    "status": true,
                    "distributionListMembers": [
                        {
                            "id": 90,
                            "site": {
                                "id": 39,
                                "correspondenceTypeId": 218,
                                "relatedOus": null,
                                "correspondenceSiteType": null,
                                "parent": 38,
                                "isGlobal": true,
                                "arName": "شقشلاهؤ 701 سعلا",
                                "enName": "en 701 sub",
                                "status": false,
                                "arDisplayName": null,
                                "enDisplayName": null
                            }
                        }
                    ],
                    "relatedOus": null
                },
                "ouid": 1
            }
        ];

        var correspondenceSites = [];
        correspondenceSiteService.loadCorrespondenceSites().then(function (value) {
            correspondenceSites = value;
        });

        /*var correspondenceSites = [
            {
                "id": 1,
                "correspondenceTypeId": 218,
                "relatedOus": null,
                "correspondenceSiteType": null,
                "parent": 1,
                "isGlobal": true,
                "arName": "11",
                "enName": "ss",
                "status": true,
                "arDisplayName": null,
                "enDisplayName": null
            },
            {
                "id": 31,
                "correspondenceTypeId": 218,
                "relatedOus": null,
                "correspondenceSiteType": null,
                "parent": 1,
                "isGlobal": true,
                "arName": "11",
                "enName": "ss",
                "status": true,
                "arDisplayName": null,
                "enDisplayName": null
            },
            {
                "id": 32,
                "correspondenceTypeId": 218,
                "relatedOus": null,
                "correspondenceSiteType": null,
                "parent": 1,
                "isGlobal": true,
                "arName": "11",
                "enName": "ss",
                "status": true,
                "arDisplayName": null,
                "enDisplayName": null
            },
            {
                "id": 33,
                "correspondenceTypeId": 218,
                "relatedOus": null,
                "correspondenceSiteType": null,
                "parent": 1,
                "isGlobal": true,
                "arName": "11",
                "enName": "ss",
                "status": true,
                "arDisplayName": null,
                "enDisplayName": null
            },
            {
                "id": 38,
                "correspondenceTypeId": 218,
                "relatedOus": null,
                "correspondenceSiteType": null,
                "parent": null,
                "isGlobal": true,
                "arName": "شقشلاهؤ ىشةث701",
                "enName": "en name 701",
                "status": true,
                "arDisplayName": null,
                "enDisplayName": null
            },
            {
                "id": 39,
                "correspondenceTypeId": 218,
                "relatedOus": null,
                "correspondenceSiteType": null,
                "parent": 38,
                "isGlobal": true,
                "arName": "شقشلاهؤ 701 سعلا",
                "enName": "en 701 sub",
                "status": false,
                "arDisplayName": null,
                "enDisplayName": null
            },
            {
                "id": 40,
                "correspondenceTypeId": 218,
                "relatedOus": null,
                "correspondenceSiteType": null,
                "parent": null,
                "isGlobal": false,
                "arName": "شسشسشس",
                "enName": "sasasasasa",
                "status": false,
                "arDisplayName": null,
                "enDisplayName": null
            },
            {
                "id": 41,
                "correspondenceTypeId": 218,
                "relatedOus": null,
                "correspondenceSiteType": null,
                "parent": null,
                "isGlobal": false,
                "arName": "شسشسشسش",
                "enName": "asasasasasa",
                "status": true,
                "arDisplayName": null,
                "enDisplayName": null
            },
            {
                "id": 42,
                "correspondenceTypeId": 218,
                "relatedOus": null,
                "correspondenceSiteType": null,
                "parent": null,
                "isGlobal": false,
                "arName": "ءؤءؤءؤءؤ",
                "enName": "zxzxzxz",
                "status": true,
                "arDisplayName": null,
                "enDisplayName": null
            },
            {
                "id": 43,
                "correspondenceTypeId": 218,
                "relatedOus": null,
                "correspondenceSiteType": null,
                "parent": null,
                "isGlobal": true,
                "arName": "فقفقفقف",
                "enName": "rtrtrtrt",
                "status": true,
                "arDisplayName": null,
                "enDisplayName": null
            },
            {
                "id": 44,
                "correspondenceTypeId": 218,
                "relatedOus": null,
                "correspondenceSiteType": null,
                "parent": null,
                "isGlobal": true,
                "arName": "فغفغفغفغف",
                "enName": "tytytytytyt",
                "status": true,
                "arDisplayName": null,
                "enDisplayName": null
            },
            {
                "id": 45,
                "correspondenceTypeId": 218,
                "relatedOus": null,
                "correspondenceSiteType": null,
                "parent": null,
                "isGlobal": true,
                "arName": "يبيبيبيبيبيب",
                "enName": "dfdfdfdfdf",
                "status": true,
                "arDisplayName": null,
                "enDisplayName": null
            },
            {
                "id": 46,
                "correspondenceTypeId": 218,
                "relatedOus": null,
                "correspondenceSiteType": null,
                "parent": 42,
                "isGlobal": false,
                "arName": "سعلا1",
                "enName": "sub1",
                "status": true,
                "arDisplayName": null,
                "enDisplayName": null
            }
        ];*/

        var response = new Response();

        // get all distributionLists
        $httpBackend
            .whenGET(urlService.distributionLists)
            .respond(function () {
                return [200, response.setResponse(distributionLists)];
            });

        // add new distributionList
        $httpBackend
            .whenPOST(urlService.distributionLists)
            .respond(function (method, url, data) {
                var distributionList = JSON.parse(data);
                // create new id for model
                distributionList.id = generator.createNewID(distributionLists, 'id');

                var distributionListMembers = distributionList.distributionListMembers;
                distributionList.distributionListMembers = [];

                angular.forEach(distributionListMembers, function (value, key) {
                    if (value.site) {
                        var correspondenceSite = _.filter(correspondenceSites, function (correspondenceSite) {
                            return correspondenceSite.id === value.site.id;
                        })[0];
                        distributionList.distributionListMembers.push({"site": correspondenceSite});
                    }
                });

                // push model to collections
                distributionLists.push(distributionList);
                return [200, response.setResponse(distributionList.id)];
            });

        // edit distributionList
        $httpBackend.whenPUT(urlService.distributionLists)
            .respond(function (method, url, data) {
                var distributionList = new DistributionList(JSON.parse(data));

                var distributionListMembers = distributionList.distributionListMembers;
                distributionList.distributionListMembers = [];

                angular.forEach(distributionListMembers, function (value, key) {
                    if (value.site) {
                        var correspondenceSite = _.filter(correspondenceSites, function (correspondenceSite) {
                            return correspondenceSite.id === value.site.id;
                        })[0];
                        distributionList.distributionListMembers.push({"id": null, "site": correspondenceSite});
                    }
                });

                for (var i = 0; i < distributionLists.length; i++) {
                    if (distributionLists[i].id === distributionList.id) {
                        distributionLists[i] = distributionList;
                        break;
                    }
                }

                return [200, response.setResponse(distributionList)];
            });

        // delete distributionList bulk
        $httpBackend.whenDELETE(urlService.distributionLists + '/bulk').respond(function (method, url, data) {
            var distributionListsToDelete = JSON.parse(data);

            for (var i = 0; i < distributionListsToDelete.length; i++) {
                for (var j = 0; j < distributionLists.length; j++) {
                    if (distributionLists[j].id === distributionListsToDelete[i]) {
                        distributionLists.splice(j, 1);
                        break;
                    }
                }
            }
            return [200, response.setResponse(true)];
        });

        // delete distributionList single
        $httpBackend.whenDELETE(function (url) {
            return urlWithId.test(url);
        }).respond(function (method, url, data) {
            var id = url.split('/').pop();
            for (var i = 0; i < distributionLists.length; i++) {
                if (distributionLists[i].id === id) {
                    distributionLists.splice(i, 1);
                }
            }
            return [200, response.setResponse(true)];
        });

        // get all distributionLists OU
        $httpBackend
            .whenGET(urlService.ouDistributionLists)
            .respond(function () {
                return [200, response.setResponse(ouDistributionLists)];
            });

        // add new distributionLists organization
        $httpBackend
            .whenPOST(urlService.ouDistributionLists)
            .respond(function (method, url, data) {
                var ouDistributionList = JSON.parse(data);
                // create new id for model
                ouDistributionList.id = generator.createNewID(ouDistributionLists, 'id');
                // push model to collections
                ouDistributionLists.push(ouDistributionList);

                return [200, response.setResponse(ouDistributionList.id)];
            });

        // add new distributionLists organization
        $httpBackend
            .whenPUT(urlService.ouDistributionLists)
            .respond(function (method, url, data) {
                var ouDistributionList = JSON.parse(data);
                // create new id for model
                ouDistributionList.id = generator.createNewID(ouDistributionLists, 'id');
                // push model to collections
                ouDistributionLists.push(ouDistributionList);

                return [200, response.setResponse(ouDistributionList.id)];
            });

        // add bulk distributionLists organization
        $httpBackend
            .whenPOST(urlService.ouDistributionLists + '/bulk')
            .respond(function (method, url, data) {
                var ouDistributionListIDs = JSON.parse(data);
                var newOUIds = [];
                for (var i = 0; i < ouDistributionListIDs.length; i++) {
                    ouDistributionListIDs[i].id = generator.createNewID(ouDistributionLists, 'id');
                    ouDistributionLists.push(ouDistributionListIDs[i]);
                    newOUIds.push(ouDistributionLists[i].id);
                }
                return [200, response.setResponse(newOUIds)];
            });

        // delete single distribution List OU
        $httpBackend.whenDELETE(function (url) {
            return ouURLWithId.test(url);
        }).respond(function (method, url, data) {
            var id = url.split('/').pop();
            for (var i = 0; i < ouDistributionLists.length; i++) {
                if (ouDistributionLists[i].id === id) {
                    ouDistributionLists.splice(i, 1);
                }
            }
            return [200, response.setResponse(true)];
        });

        // delete bulk Distribution List OU
        $httpBackend.whenDELETE(urlService.ouDistributionLists + '/bulk').respond(function (method, url, data) {
            var distributionListsOUToDelete = JSON.parse(data);

            for (var i = 0; i < distributionListsOUToDelete.length; i++) {
                for (var j = 0; j < ouDistributionLists.length; j++) {
                    if (ouDistributionLists[j].id === distributionListsOUToDelete[i]) {
                        ouDistributionLists.splice(j, 1);
                        break;
                    }
                }
            }
            return [200, response.setResponse(true)];
        });

        // activate Distribution List status single
        $httpBackend.whenPUT(function (url) {
            return urlActivateWithId.test(url);
        }).respond(function (method, url, data) {
            var id = url.split('/').pop();

            var distributionList = distributionLists.filter(function (e) {
                return e.id === parseInt(id);
            })[0];

            distributionList.status = true;

            return [200, response.setResponse(true)];
        });

        // deactivate distributionList status single
        $httpBackend.whenPUT(function (url) {
            return urlDeactivateWithId.test(url);
        }).respond(function (method, url, data) {
            var id = url.split('/').pop();

            var distributionList = distributionLists.filter(function (e) {
                return e.id === parseInt(id);
            })[0];

            distributionList.status = false;

            return [200, response.setResponse(true)];
        });

        // activate distributionList status bulk
        $httpBackend.whenPUT((urlService.distributionLists + '/activate/bulk')).respond(function (method, url, data) {
            var distributionListsToActivate = JSON.parse(data);
            for (var i = 0; i < distributionListsToActivate.length; i++) {
                for (var j = 0; j < distributionLists.length; j++) {
                    if (distributionLists[j].id === distributionListsToActivate[i]) {
                        distributionLists[j].status = true;
                        break;
                    }
                }
            }
            return [200, response.setResponse(true)];
        });

        // Deactivate distributionList status bulk
        $httpBackend.whenPUT((urlService.distributionLists + '/deactivate/bulk')).respond(function (method, url, data) {
            var distributionListsToActivate = JSON.parse(data);
            for (var i = 0; i < distributionListsToActivate.length; i++) {
                for (var j = 0; j < distributionLists.length; j++) {
                    if (distributionLists[j].id === distributionListsToActivate[i]) {
                        distributionLists[j].status = false;
                        break;
                    }
                }
            }
            return [200, response.setResponse(true)];
        });

    });
};