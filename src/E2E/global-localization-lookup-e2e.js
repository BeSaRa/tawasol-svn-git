module.exports = function (app) {
    app.run(function ($httpBackend, Response, urlService) {
        'ngInject';
        var globalLocalizations = {
            "fileSize": [
                {
                    "id": 35,
                    "category": 3,
                    "lookupKey": 0,
                    "lookupStrKey": "5MB",
                    "defaultArName": "5MB",
                    "defaultEnName": "5MB",
                    "status": true,
                    "itemOrder": 1,
                    "parent": null,
                    "globalLocalization": null
                },
                {
                    "id": 36,
                    "category": 3,
                    "lookupKey": 1,
                    "lookupStrKey": "10MB",
                    "defaultArName": "10MB",
                    "defaultEnName": "10MB",
                    "status": true,
                    "itemOrder": 2,
                    "parent": null,
                    "globalLocalization": null
                },
                {
                    "id": 37,
                    "category": 3,
                    "lookupKey": 2,
                    "lookupStrKey": "15MB",
                    "defaultArName": "15MB",
                    "defaultEnName": "15MB",
                    "status": true,
                    "itemOrder": 3,
                    "parent": null,
                    "globalLocalization": null
                }
            ],
            "workflowSecurity": [
                {
                    "id": 43,
                    "category": 7,
                    "lookupKey": 1,
                    "lookupStrKey": null,
                    "defaultArName": "المستخدم يستطيع الإرسال لجميع المستخدمين",
                    "defaultEnName": "User can send the document to all organization users",
                    "status": true,
                    "itemOrder": 0,
                    "parent": null,
                    "globalLocalization": null
                },
                {
                    "id": 44,
                    "category": 7,
                    "lookupKey": 2,
                    "lookupStrKey": null,
                    "defaultArName": "المستخدم يستطيع أن يرسل للإدراته و الإدرات التابعه لها",
                    "defaultEnName": "User can sent the document to all ",
                    "status": true,
                    "itemOrder": 1,
                    "parent": null,
                    "globalLocalization": null
                },
                {
                    "id": 45,
                    "category": 7,
                    "lookupKey": 4,
                    "lookupStrKey": null,
                    "defaultArName": "المستخدم يسطتيع أن يرسل لإدرات رئيسية و جميع إدراتها الفرعية",
                    "defaultEnName": "User can send the document to any user in the same unit",
                    "status": true,
                    "itemOrder": 2,
                    "parent": null,
                    "globalLocalization": null
                }
            ],
            "refrenceNumberPlanElement": [
                {
                    "id": 48,
                    "category": 10,
                    "lookupKey": 0,
                    "lookupStrKey": "Classification",
                    "defaultArName": "التصنيف",
                    "defaultEnName": "Classification",
                    "status": true,
                    "itemOrder": null,
                    "parent": null,
                    "globalLocalization": null
                },
                {
                    "id": 49,
                    "category": 10,
                    "lookupKey": 1,
                    "lookupStrKey": "Classification",
                    "defaultArName": "كود التصنيف",
                    "defaultEnName": "Classification Code",
                    "status": true,
                    "itemOrder": null,
                    "parent": null,
                    "globalLocalization": null
                },
                {
                    "id": 50,
                    "category": 10,
                    "lookupKey": 2,
                    "lookupStrKey": "FileCode",
                    "defaultArName": "كود الملف",
                    "defaultEnName": "File Code",
                    "status": true,
                    "itemOrder": null,
                    "parent": null,
                    "globalLocalization": null
                },
                {
                    "id": 64,
                    "category": 10,
                    "lookupKey": 1,
                    "lookupStrKey": null,
                    "defaultArName": "كود القسم",
                    "defaultEnName": "Department Code",
                    "status": true,
                    "itemOrder": null,
                    "parent": null,
                    "globalLocalization": null
                },
                {
                    "id": 65,
                    "category": 10,
                    "lookupKey": 1,
                    "lookupStrKey": null,
                    "defaultArName": "معرف القسم",
                    "defaultEnName": "Department Identifier ",
                    "status": true,
                    "itemOrder": null,
                    "parent": null,
                    "globalLocalization": null
                },
                {
                    "id": 66,
                    "category": 10,
                    "lookupKey": 1,
                    "lookupStrKey": null,
                    "defaultArName": "التصفيف الرئيسي",
                    "defaultEnName": "Main Classification ID",
                    "status": true,
                    "itemOrder": null,
                    "parent": null,
                    "globalLocalization": null
                },
                {
                    "id": 68,
                    "category": 10,
                    "lookupKey": 1,
                    "lookupStrKey": null,
                    "defaultArName": "التصنيف الفرعي",
                    "defaultEnName": "Sub Classification ID",
                    "status": true,
                    "itemOrder": null,
                    "parent": null,
                    "globalLocalization": null
                },
                {
                    "id": 69,
                    "category": 10,
                    "lookupKey": 1,
                    "lookupStrKey": null,
                    "defaultArName": "نوع التصنيف",
                    "defaultEnName": "Correspondence Site Type ID ",
                    "status": true,
                    "itemOrder": null,
                    "parent": null,
                    "globalLocalization": null
                },
                {
                    "id": 71,
                    "category": 10,
                    "lookupKey": 1,
                    "lookupStrKey": null,
                    "defaultArName": "الجهه الرئيسية",
                    "defaultEnName": "Main Correspondence Site ID",
                    "status": true,
                    "itemOrder": null,
                    "parent": null,
                    "globalLocalization": null
                },
                {
                    "id": 72,
                    "category": 10,
                    "lookupKey": 1,
                    "lookupStrKey": null,
                    "defaultArName": "الجهه الفرعيه",
                    "defaultEnName": "Sub Correspondence Site ID",
                    "status": true,
                    "itemOrder": null,
                    "parent": null,
                    "globalLocalization": null
                },
                {
                    "id": 74,
                    "category": 10,
                    "lookupKey": 1,
                    "lookupStrKey": null,
                    "defaultArName": "رقم الملف",
                    "defaultEnName": "File Number",
                    "status": true,
                    "itemOrder": null,
                    "parent": null,
                    "globalLocalization": null
                },
                {
                    "id": 75,
                    "category": 10,
                    "lookupKey": 1,
                    "lookupStrKey": null,
                    "defaultArName": "السنه",
                    "defaultEnName": "Year ",
                    "status": true,
                    "itemOrder": null,
                    "parent": null,
                    "globalLocalization": null
                },
                {
                    "id": 76,
                    "category": 10,
                    "lookupKey": 1,
                    "lookupStrKey": null,
                    "defaultArName": "المتسلسل",
                    "defaultEnName": "Serial",
                    "status": true,
                    "itemOrder": null,
                    "parent": null,
                    "globalLocalization": null
                },
                {
                    "id": 77,
                    "category": 10,
                    "lookupKey": 1,
                    "lookupStrKey": null,
                    "defaultArName": "نوع الملف",
                    "defaultEnName": "Document Class ",
                    "status": true,
                    "itemOrder": null,
                    "parent": null,
                    "globalLocalization": null
                }
            ],
            "securitySchema": [
                {
                    "id": 41,
                    "category": 6,
                    "lookupKey": 0,
                    "lookupStrKey": null,
                    "defaultArName": "صلاحيات عل مستوى الهيكل التنظيمي",
                    "defaultEnName": "Security per Organization Hierarchy",
                    "status": true,
                    "itemOrder": 1,
                    "parent": null,
                    "globalLocalization": null
                },
                {
                    "id": 42,
                    "category": 6,
                    "lookupKey": 1,
                    "lookupStrKey": null,
                    "defaultArName": "صلاحيات على مستوى الهيكل التنظيمي المحدود",
                    "defaultEnName": "Security per Limited Organization Hierarchy",
                    "status": true,
                    "itemOrder": 2,
                    "parent": null,
                    "globalLocalization": null
                }
            ],
            "gender": [
                {
                    "id": 78,
                    "category": 19,
                    "lookupKey": 1,
                    "lookupStrKey": "MALE",
                    "defaultArName": "ذكر",
                    "defaultEnName": "Male",
                    "status": true,
                    "itemOrder": null,
                    "parent": null,
                    "globalLocalization": null
                },
                {
                    "id": 80,
                    "category": 19,
                    "lookupKey": 2,
                    "lookupStrKey": "FEMALE",
                    "defaultArName": "انثى",
                    "defaultEnName": "Female",
                    "status": true,
                    "itemOrder": null,
                    "parent": null,
                    "globalLocalization": null
                }
            ],
            "themeKey": [
                {
                    "id": 55,
                    "category": 18,
                    "lookupKey": 1,
                    "lookupStrKey": "SIDEBAR",
                    "defaultArName": "الشريط الجانبى",
                    "defaultEnName": "Sidebar",
                    "status": true,
                    "itemOrder": null,
                    "parent": null,
                    "globalLocalization": null
                },
                {
                    "id": 56,
                    "category": 18,
                    "lookupKey": 1,
                    "lookupStrKey": "TOOLBAR",
                    "defaultArName": "الشريط العلوي",
                    "defaultEnName": "Toolbar",
                    "status": true,
                    "itemOrder": null,
                    "parent": null,
                    "globalLocalization": null
                },
                {
                    "id": 57,
                    "category": 18,
                    "lookupKey": 1,
                    "lookupStrKey": "SIDEBAR_ICONS",
                    "defaultArName": "أيقونات الشريط الجانبى",
                    "defaultEnName": "Sidebar Icons",
                    "status": true,
                    "itemOrder": null,
                    "parent": null,
                    "globalLocalization": null
                },
                {
                    "id": 58,
                    "category": 18,
                    "lookupKey": 1,
                    "lookupStrKey": "TOOLBAR_ICONS",
                    "defaultArName": "أيقونات الشريط العلوي",
                    "defaultEnName": "Toolbar Icons",
                    "status": true,
                    "itemOrder": null,
                    "parent": null,
                    "globalLocalization": null
                },
                {
                    "id": 59,
                    "category": 18,
                    "lookupKey": 1,
                    "lookupStrKey": "PAGE_BACKGROUND",
                    "defaultArName": "خلفية الصفحة",
                    "defaultEnName": "Page Background",
                    "status": true,
                    "itemOrder": null,
                    "parent": null,
                    "globalLocalization": null
                },
                {
                    "id": 60,
                    "category": 18,
                    "lookupKey": 1,
                    "lookupStrKey": "LOGIN_BACKGROUND",
                    "defaultArName": "خلفية تسجيل الدخول",
                    "defaultEnName": "Login Background",
                    "status": true,
                    "itemOrder": null,
                    "parent": null,
                    "globalLocalization": null
                },
                {
                    "id": 61,
                    "category": 18,
                    "lookupKey": 1,
                    "lookupStrKey": "LOGIN_TOOLBAR",
                    "defaultArName": "الشريط العلوي لتسجل الدخول",
                    "defaultEnName": "Login Toolbar",
                    "status": true,
                    "itemOrder": null,
                    "parent": null,
                    "globalLocalization": null
                },
                {
                    "id": 62,
                    "category": 18,
                    "lookupKey": 1,
                    "lookupStrKey": "LOGIN_BOX_TOOLBAR",
                    "defaultArName": "الشريط العلوي لمربع تسجيل الدخول",
                    "defaultEnName": "Login Box Toolbar",
                    "status": true,
                    "itemOrder": null,
                    "parent": null,
                    "globalLocalization": null
                },
                {
                    "id": 63,
                    "category": 18,
                    "lookupKey": 1,
                    "lookupStrKey": "LOGIN_BOX",
                    "defaultArName": "مربع تسجيل الدخول",
                    "defaultEnName": "Login Box",
                    "status": true,
                    "itemOrder": null,
                    "parent": null,
                    "globalLocalization": null
                }
            ],
            "language": [
                {
                    "id": 53,
                    "category": 13,
                    "lookupKey": 2,
                    "lookupStrKey": "en",
                    "defaultArName": "اللغة الإنجليزية",
                    "defaultEnName": "English",
                    "status": true,
                    "itemOrder": null,
                    "parent": null,
                    "globalLocalization": null
                },
                {
                    "id": 54,
                    "category": 13,
                    "lookupKey": 1,
                    "lookupStrKey": "ar",
                    "defaultArName": "اللغة العربية",
                    "defaultEnName": "Arabic",
                    "status": true,
                    "itemOrder": null,
                    "parent": null,
                    "globalLocalization": null
                }
            ],
            "escalationProcess": [
                {
                    "id": 46,
                    "category": 9,
                    "lookupKey": 0,
                    "lookupStrKey": null,
                    "defaultArName": "قم بإرجاع المعاملة للمرسل",
                    "defaultEnName": "Return the workflow item back to the sender",
                    "status": true,
                    "itemOrder": 0,
                    "parent": null,
                    "globalLocalization": null
                },
                {
                    "id": 47,
                    "category": 9,
                    "lookupKey": 1,
                    "lookupStrKey": null,
                    "defaultArName": "قم بإرجاع الكتاب للمدير المباشر",
                    "defaultEnName": "Assign the workflow item to the direct manager",
                    "status": true,
                    "itemOrder": 0,
                    "parent": null,
                    "globalLocalization": null
                }
            ],
            "documentClass": [
                {
                    "id": 38,
                    "category": 5,
                    "lookupKey": 1,
                    "lookupStrKey": "INCOMING",
                    "defaultArName": "وارد",
                    "defaultEnName": "Incoming",
                    "status": true,
                    "itemOrder": 1,
                    "parent": null,
                    "globalLocalization": null
                },
                {
                    "id": 39,
                    "category": 5,
                    "lookupKey": 2,
                    "lookupStrKey": "OUTGOING",
                    "defaultArName": "صادر خارجي",
                    "defaultEnName": "Outgoing",
                    "status": true,
                    "itemOrder": 2,
                    "parent": null,
                    "globalLocalization": null
                },
                {
                    "id": 40,
                    "category": 5,
                    "lookupKey": 4,
                    "lookupStrKey": "INTERNAL",
                    "defaultArName": "صادر داخلي",
                    "defaultEnName": "Internal",
                    "status": true,
                    "itemOrder": 3,
                    "parent": null,
                    "globalLocalization": null
                }
            ],
            "priorityLevel": [
                {
                    "id": 29,
                    "category": 1,
                    "lookupKey": 1,
                    "lookupStrKey": "NORMAL",
                    "defaultArName": "عادي",
                    "defaultEnName": "Normal",
                    "status": true,
                    "itemOrder": 1,
                    "parent": null,
                    "globalLocalization": null
                },
                {
                    "id": 30,
                    "category": 1,
                    "lookupKey": 2,
                    "lookupStrKey": "URGENT",
                    "defaultArName": "عاجل",
                    "defaultEnName": "Urgent",
                    "status": true,
                    "itemOrder": 2,
                    "parent": null,
                    "globalLocalization": null
                },
                {
                    "id": 31,
                    "category": 1,
                    "lookupKey": 4,
                    "lookupStrKey": "TOP_URGENT",
                    "defaultArName": "عاجل جدا",
                    "defaultEnName": "Top Urgent",
                    "status": true,
                    "itemOrder": 3,
                    "parent": null,
                    "globalLocalization": null
                }
            ],
            "securityLevel": [
                {
                    "id": 24,
                    "category": 0,
                    "lookupKey": 1,
                    "lookupStrKey": null,
                    "defaultArName": "عادي",
                    "defaultEnName": "Normal",
                    "status": true,
                    "itemOrder": 1,
                    "parent": null,
                    "globalLocalization": null
                },
                {
                    "id": 25,
                    "category": 0,
                    "lookupKey": 2,
                    "lookupStrKey": null,
                    "defaultArName": "سري",
                    "defaultEnName": "Confidential",
                    "status": true,
                    "itemOrder": 2,
                    "parent": null,
                    "globalLocalization": null
                },
                {
                    "id": 26,
                    "category": 0,
                    "lookupKey": 4,
                    "lookupStrKey": null,
                    "defaultArName": "خاص",
                    "defaultEnName": "Private",
                    "status": true,
                    "itemOrder": 3,
                    "parent": null,
                    "globalLocalization": null
                },
                {
                    "id": 27,
                    "category": 0,
                    "lookupKey": 8,
                    "lookupStrKey": null,
                    "defaultArName": "سري",
                    "defaultEnName": "Secret",
                    "status": true,
                    "itemOrder": 4,
                    "parent": null,
                    "globalLocalization": null
                },
                {
                    "id": 28,
                    "category": 0,
                    "lookupKey": 16,
                    "lookupStrKey": null,
                    "defaultArName": "سري جدا",
                    "defaultEnName": "Top Secret",
                    "status": true,
                    "itemOrder": 5,
                    "parent": null,
                    "globalLocalization": null
                }
            ],
            "permissionGroup": [
                {
                    "id": 51,
                    "category": 11,
                    "lookupKey": 0,
                    "lookupStrKey": null,
                    "defaultArName": "مجموعة المستخدمين المدراء",
                    "defaultEnName": "Admin Groups",
                    "status": true,
                    "itemOrder": null,
                    "parent": null,
                    "globalLocalization": null
                },
                {
                    "id": 52,
                    "category": 11,
                    "lookupKey": 1,
                    "lookupStrKey": null,
                    "defaultArName": "مجموعة مدراء الإدرات",
                    "defaultEnName": "OU Admin Groups",
                    "status": true,
                    "itemOrder": null,
                    "parent": null,
                    "globalLocalization": null
                },
                {
                    "id": 81,
                    "category": 11,
                    "lookupKey": 1,
                    "lookupStrKey": null,
                    "defaultArName": "Administration ",
                    "defaultEnName": "Administration ",
                    "status": true,
                    "itemOrder": null,
                    "parent": null,
                    "globalLocalization": null
                },
                {
                    "id": 82,
                    "category": 11,
                    "lookupKey": 2,
                    "lookupStrKey": null,
                    "defaultArName": "Incoming",
                    "defaultEnName": "Incoming",
                    "status": true,
                    "itemOrder": null,
                    "parent": null,
                    "globalLocalization": null
                },
                {
                    "id": 83,
                    "category": 11,
                    "lookupKey": 3,
                    "lookupStrKey": null,
                    "defaultArName": "Outgoing",
                    "defaultEnName": "Outgoing",
                    "status": true,
                    "itemOrder": null,
                    "parent": null,
                    "globalLocalization": null
                },
                {
                    "id": 84,
                    "category": 11,
                    "lookupKey": 4,
                    "lookupStrKey": null,
                    "defaultArName": "Internal",
                    "defaultEnName": "Internal",
                    "status": true,
                    "itemOrder": null,
                    "parent": null,
                    "globalLocalization": null
                },
                {
                    "id": 85,
                    "category": 11,
                    "lookupKey": 5,
                    "lookupStrKey": null,
                    "defaultArName": "Correspondence Workflow",
                    "defaultEnName": "Correspondence Workflow",
                    "status": true,
                    "itemOrder": null,
                    "parent": null,
                    "globalLocalization": null
                },
                {
                    "id": 86,
                    "category": 11,
                    "lookupKey": 6,
                    "lookupStrKey": null,
                    "defaultArName": "Department Inbox",
                    "defaultEnName": "Department Inbox",
                    "status": true,
                    "itemOrder": null,
                    "parent": null,
                    "globalLocalization": null
                },
                {
                    "id": 87,
                    "category": 11,
                    "lookupKey": 7,
                    "lookupStrKey": null,
                    "defaultArName": "Search",
                    "defaultEnName": "Search",
                    "status": true,
                    "itemOrder": null,
                    "parent": null,
                    "globalLocalization": null
                },
                {
                    "id": 88,
                    "category": 11,
                    "lookupKey": 8,
                    "lookupStrKey": null,
                    "defaultArName": "Reports and Dashboard",
                    "defaultEnName": "Reports and Dashboard",
                    "status": true,
                    "itemOrder": null,
                    "parent": null,
                    "globalLocalization": null
                },
                {
                    "id": 89,
                    "category": 11,
                    "lookupKey": 9,
                    "lookupStrKey": null,
                    "defaultArName": "Other",
                    "defaultEnName": "Other",
                    "status": true,
                    "itemOrder": null,
                    "parent": null,
                    "globalLocalization": null
                }
            ],
            "followupStatus": [
                {
                    "id": 32,
                    "category": 2,
                    "lookupKey": 0,
                    "lookupStrKey": "NEED_REPLY",
                    "defaultArName": "يحتاج للرد",
                    "defaultEnName": "Need Reply",
                    "status": true,
                    "itemOrder": 1,
                    "parent": null,
                    "globalLocalization": null
                },
                {
                    "id": 33,
                    "category": 2,
                    "lookupKey": 1,
                    "lookupStrKey": "WITHOUT_REPLY",
                    "defaultArName": "لا يحتاج للرد",
                    "defaultEnName": "Without Reply",
                    "status": true,
                    "itemOrder": 2,
                    "parent": null,
                    "globalLocalization": null
                },
                {
                    "id": 34,
                    "category": 2,
                    "lookupKey": 2,
                    "lookupStrKey": "REPLIED",
                    "defaultArName": "تم الرد",
                    "defaultEnName": "Replied",
                    "status": true,
                    "itemOrder": 3,
                    "parent": null,
                    "globalLocalization": null
                }
            ]
        };
        var response = new Response();
        $httpBackend
            .whenGET(urlService.globalLocalizationLookups)
            .respond(function () {
                console.log("HI");
                return [200, response.setResponse(globalLocalizations)];
            });

    });
};
