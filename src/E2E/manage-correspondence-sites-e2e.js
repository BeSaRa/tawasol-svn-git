module.exports = function (app) {
    app.run(function ($httpBackend, _, Response, urlService) {
        'ngInject';
        var sites = [
            {
                "id": 10000001,
                "exactId": 1,
                "parent": null,
                "isGlobal": true,
                "arName": "وزارة المواصلات والإتصالات",
                "enName": "Ministry of Transport and Communications",
                "status": true,
                "arDisplayName": "وزارة المواصلات والإتصالات",
                "enDisplayName": "Ministry of Transport and Communications",
                "sourceType": 1,
                "ouId": null,
                "code": "1",
                "correspondenceSiteTypeId": 1
            },
            {
                "id": 10000002,
                "exactId": 2,
                "parent": 10000001,
                "isGlobal": true,
                "arName": "إدارة التخطيط والجوده",
                "enName": "Planning and Quality Management",
                "status": true,
                "arDisplayName": "إدارة التخطيط والجوده",
                "enDisplayName": "Planning and Quality Management",
                "sourceType": 1,
                "ouId": null,
                "code": "1",
                "correspondenceSiteTypeId": 1
            },
            {
                "id": 10000001,
                "exactId": 5,
                "parent": 10000001,
                "isGlobal": true,
                "arName": "مكتب وزير المواصلات والاتصالات",
                "enName": "Office of the Minister of Transport and Communications",
                "status": true,
                "arDisplayName": "مكتب وزير المواصلات والاتصالات",
                "enDisplayName": "Office of the Minister of Transport and Communications",
                "sourceType": 1,
                "ouId": null,
                "code": "89564",
                "correspondenceSiteTypeId": 1
            },
            {
                "id": 10000006,
                "exactId": 6,
                "parent": 10000001,
                "isGlobal": true,
                "arName": "مكتب الوكيل المساعد للشؤن الادارية",
                "enName": "Office of the Assistant Undersecretary for Common Services",
                "status": true,
                "arDisplayName": "مكتب الوكيل المساعد للشؤن الادارية",
                "enDisplayName": "Office of the Assistant Undersecretary for Common Services",
                "sourceType": 1,
                "ouId": null,
                "code": "1",
                "correspondenceSiteTypeId": 1
            },
            {
                "id": 10000007,
                "exactId": 7,
                "parent": 10000002,
                "isGlobal": true,
                "arName": "مكتب مستشار يالوزير",
                "enName": "Office of Counselors of the Minister",
                "status": true,
                "arDisplayName": "مكتب مستشار يالوزير",
                "enDisplayName": "Office of Counselors of the Minister",
                "sourceType": 1,
                "ouId": null,
                "code": "1",
                "correspondenceSiteTypeId": 1
            },
            {
                "id": 10000008,
                "exactId": 8,
                "parent": 10000001,
                "isGlobal": true,
                "arName": "ادارة التدقيق الداخلي",
                "enName": "Internal Audit Department",
                "status": true,
                "arDisplayName": "ادارة التدقيق الداخلي",
                "enDisplayName": "Internal Audit Department",
                "sourceType": 1,
                "ouId": null,
                "code": "1",
                "correspondenceSiteTypeId": 1
            },
            {
                "id": 10000009,
                "exactId": 9,
                "parent": 10000001,
                "isGlobal": true,
                "arName": "إدارة الشؤن المالية والادراية",
                "enName": "Financial and Administrative Affairs Department",
                "status": true,
                "arDisplayName": "إدارة الشؤن المالية والادراية",
                "enDisplayName": "Financial and Administrative Affairs Department",
                "sourceType": 1,
                "ouId": null,
                "code": "1",
                "correspondenceSiteTypeId": 1
            },
            {
                "id": 10000011,
                "exactId": 11,
                "parent": 10000006,
                "isGlobal": true,
                "arName": "قسم الأرشيف\r\nالمركزي",
                "enName": "Department of Central Archives",
                "status": true,
                "arDisplayName": "قسم الأرشيف\r\nالمركزي",
                "enDisplayName": "Department of Central Archives",
                "sourceType": 1,
                "ouId": null,
                "code": "1",
                "correspondenceSiteTypeId": 1
            },
            {
                "id": 10000012,
                "exactId": 12,
                "parent": 10000005,
                "isGlobal": true,
                "arName": "ادارة الموارد البشرية",
                "enName": "Human Resource Managements",
                "status": true,
                "arDisplayName": "ادارة الموارد البشرية",
                "enDisplayName": "Human Resource Managements",
                "sourceType": 1,
                "ouId": null,
                "code": "1",
                "correspondenceSiteTypeId": 1
            },
            {
                "id": 10000013,
                "exactId": 13,
                "parent": 10000012,
                "isGlobal": true,
                "arName": "قسم الرواتب\r\nوالأجور",
                "enName": "Salaries and wages department",
                "status": true,
                "arDisplayName": "قسم الرواتب\r\nوالأجور",
                "enDisplayName": "Salaries and wages department",
                "sourceType": 1,
                "ouId": null,
                "code": "1",
                "correspondenceSiteTypeId": 1
            },
            {
                "id": 10000014,
                "exactId": 14,
                "parent": 10000012,
                "isGlobal": true,
                "arName": "قسم الموارد البشرية",
                "enName": "Department of Human Resources",
                "status": true,
                "arDisplayName": "قسم الموارد البشرية",
                "enDisplayName": "Department of Human Resources",
                "sourceType": 1,
                "ouId": null,
                "code": "1",
                "correspondenceSiteTypeId": 1
            },
            {
                "id": 10000015,
                "exactId": 15,
                "parent": 10000009,
                "isGlobal": true,
                "arName": "ادارة الشؤون المالية",
                "enName": "Financial Affairs Administration",
                "status": true,
                "arDisplayName": "ادارة الشؤون المالية",
                "enDisplayName": "Financial Affairs Administration",
                "sourceType": 1,
                "ouId": null,
                "code": "1",
                "correspondenceSiteTypeId": 1
            },
            {
                "id": 10000016,
                "exactId": 16,
                "parent": 10000009,
                "isGlobal": true,
                "arName": "ادارة الشؤون\r\nالإدارية",
                "enName": "Administrative Affairs Department",
                "status": true,
                "arDisplayName": "ادارة الشؤون\r\nالإدارية",
                "enDisplayName": "Administrative Affairs Department",
                "sourceType": 1,
                "ouId": null,
                "code": "1",
                "correspondenceSiteTypeId": 1
            },
            {
                "id": 10000075,
                "exactId": 75,
                "parent": 10000008,
                "isGlobal": true,
                "arName": "إدارة التعاون الدولى",
                "enName": "Department of International Cooperation",
                "status": true,
                "arDisplayName": "إدارة التعاون الدولى",
                "enDisplayName": "Department of International Cooperation",
                "sourceType": 1,
                "ouId": null,
                "code": "459659",
                "correspondenceSiteTypeId": 1
            },
            {
                "id": 10000076,
                "exactId": 76,
                "parent": 10000001,
                "isGlobal": true,
                "arName": "إدارة التدقيق الداخلى",
                "enName": "Internal Audit Department",
                "status": true,
                "arDisplayName": "إدارة التدقيق الداخلى",
                "enDisplayName": "Internal Audit Department",
                "sourceType": 1,
                "ouId": null,
                "code": "test101",
                "correspondenceSiteTypeId": 1
            },
            {
                "id": 10000078,
                "exactId": 78,
                "parent": 10000008,
                "isGlobal": true,
                "arName": "إدارة الشوؤن القانونية",
                "enName": "Department of Legal Affairs",
                "status": true,
                "arDisplayName": "إدارة الشوؤن القانونية",
                "enDisplayName": "Department of Legal Affairs",
                "sourceType": 1,
                "ouId": null,
                "code": "5685",
                "correspondenceSiteTypeId": 1
            },
            {
                "id": 10000079,
                "exactId": 79,
                "parent": 10000008,
                "isGlobal": true,
                "arName": "إدارة العلاقات العامة والاتصالات",
                "enName": "Department of Public Relations and Communications",
                "status": true,
                "arDisplayName": "إدارة العلاقات العامة والاتصالات",
                "enDisplayName": "Department of Public Relations and Communications",
                "sourceType": 1,
                "ouId": null,
                "code": "5946",
                "correspondenceSiteTypeId": 1
            },
            {
                "id": 10000080,
                "exactId": 80,
                "parent": 10000008,
                "isGlobal": true,
                "arName": "إدارة الشؤن الفنية",
                "enName": "Technical Affairs Department",
                "status": true,
                "arDisplayName": "إدارة الشؤن الفنية",
                "enDisplayName": "Technical Affairs Department",
                "sourceType": 1,
                "ouId": null,
                "code": "5598",
                "correspondenceSiteTypeId": 1
            },
            {
                "id": 10000081,
                "exactId": 81,
                "parent": 10000076,
                "isGlobal": true,
                "arName": "تجربة جديدة",
                "enName": "New Test",
                "status": true,
                "arDisplayName": "تجربة جديدة",
                "enDisplayName": "New Test",
                "sourceType": 1,
                "ouId": null,
                "code": "6565",
                "correspondenceSiteTypeId": 1
            },
            {
                "id": 10000083,
                "exactId": 83,
                "parent": 10000076,
                "isGlobal": true,
                "arName": "تجربة جديدة",
                "enName": "New Test",
                "status": true,
                "arDisplayName": "تجربة جديدة",
                "enDisplayName": "New Test",
                "sourceType": 1,
                "ouId": null,
                "code": "6565",
                "correspondenceSiteTypeId": 1
            },
            {
                "id": 20000001,
                "exactId": 1,
                "parent": null,
                "isGlobal": true,
                "arName": "وزارة الداخلية بريد آلي",
                "enName": "Ministry of Interior\r\n",
                "status": true,
                "arDisplayName": "وزارة الداخلية بريد آلي",
                "enDisplayName": "Ministry of Interior\r\n",
                "sourceType": 2,
                "ouId": null,
                "code": null,
                "correspondenceSiteTypeId": 305
            },
            {
                "id": 20000031,
                "exactId": 31,
                "parent": 20000001,
                "isGlobal": true,
                "arName": "اللجنة الأولمبية",
                "enName": "Olympic committee",
                "status": true,
                "arDisplayName": "اللجنة الأولمبية",
                "enDisplayName": "Olympic committee",
                "sourceType": 2,
                "ouId": null,
                "code": null,
                "correspondenceSiteTypeId": 305
            },
            {
                "id": 20000032,
                "exactId": 32,
                "parent": 20000001,
                "isGlobal": true,
                "arName": "إدارة نظم المعلومات",
                "enName": "Information Systems Management\r\n",
                "status": true,
                "arDisplayName": "إدارة نظم المعلومات",
                "enDisplayName": "Information Systems Management\r\n",
                "sourceType": 2,
                "ouId": null,
                "code": null,
                "correspondenceSiteTypeId": 305
            },
            {
                "id": 20000033,
                "exactId": 33,
                "parent": 20000001,
                "isGlobal": true,
                "arName": "وزارة العدل",
                "enName": "MOJ",
                "status": true,
                "arDisplayName": "وزارة العدل",
                "enDisplayName": "MOJ",
                "sourceType": 2,
                "ouId": null,
                "code": null,
                "correspondenceSiteTypeId": 218
            },
            {
                "id": 20000053,
                "exactId": 53,
                "parent": null,
                "isGlobal": true,
                "arName": "المراكز",
                "enName": "Centers",
                "status": true,
                "arDisplayName": "المراكز",
                "enDisplayName": "Centers",
                "sourceType": 2,
                "ouId": null,
                "code": null,
                "correspondenceSiteTypeId": 305
            },
            {
                "id": 20000057,
                "exactId": 57,
                "parent": 20000053,
                "isGlobal": true,
                "arName": "مركز الشفلح",
                "enName": "Shafala7 Center",
                "status": true,
                "arDisplayName": "مركز الشفلح",
                "enDisplayName": "Shafala7 Center",
                "sourceType": 2,
                "ouId": null,
                "code": null,
                "correspondenceSiteTypeId": 305
            },
            {
                "id": 30000001,
                "exactId": 1,
                "parent": 30000001,
                "isGlobal": true,
                "arName": "1",
                "enName": "1",
                "status": true,
                "arDisplayName": "as",
                "enDisplayName": "ev",
                "sourceType": 3,
                "ouId": null,
                "code": null,
                "correspondenceSiteTypeId": 305
            }
        ];

        var searchInsideMain = new RegExp(urlService.correspondenceViews.replace(/\./g, '\\.') + '\\?search-type=main&correspondenceSiteTypeId=(\\d+)?&q=(\\D+|\\S+|\\W+)?$', 'u');
        var searchInsideSub = new RegExp(urlService.correspondenceViews.replace(/\./g, '\\.') + '\\?search-type=sub&correspondenceSiteTypeId=(\\d+)?&parent=(\\d+)?&q=(\\D+|\\S+|\\W+)?$', 'u');
        var response = new Response();

        function _checkType(site, type) {
            return (site.correspondenceSiteTypeId) === Number(type);
        }

        function _checkName(site, text) {
            var arabic = site.arName.toLowerCase();
            var english = site.enName.toLowerCase();
            var arDisplay = site.arDisplayName.toLowerCase();
            var enDisplay = site.enDisplayName.toLowerCase();
            text = text.toLowerCase();
            return (
                arabic.indexOf(text) !== -1 ||
                english.indexOf(text) !== -1 ||
                arDisplay.indexOf(text) !== -1 ||
                enDisplay.indexOf(text) !== -1
            );
        }

        function _getMainCorrespondence(type, text) {
            return _.filter(sites, function (site) {
                if (type) {
                    return _checkType(site, type) && _checkName(site, text) && !site.parent;
                } else {
                    return _checkName(site, text) && !site.parent;
                }
            });
        }

        function _checkParent(site, parent, equality) {
            if (equality)
                return Number(site.parent) === Number(parent);
            return !!site.parent;
        }

        function _getParent(site) {
            site.parentCorrespondenceSite = _.find(sites, function (crossSite) {
                return Number(crossSite.id) === Number(site.parent);
            });
            return site;
        }

        function _getSubCorrespondence(parent, text) {
            return _.map(_.filter(sites, function (site) {
                if (parent) {
                    return _checkParent(site, parent, true) && _checkName(site, text);
                } else {
                    return _checkParent(site) && _checkName(site, text);
                }
            }), _getParent);
        }

        $httpBackend
            .whenGET(function (url) {
                return searchInsideMain.test(url);
            })
            .respond(function (method, url, data, headers, params) {
                var type = params.correspondenceSiteTypeId;
                var query = params.q;

                return [200, response.setResponse(_getMainCorrespondence(type, query))];
            });

        $httpBackend
            .whenGET(function (url) {
                return searchInsideSub.test(url)
            })
            .respond(function (method, url, data, headers, params) {
                var type = params.correspondenceSiteTypeId;
                var query = params.q;
                return [200, response.setResponse(_getSubCorrespondence(type, query))];
            })


    });
};