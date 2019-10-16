module.exports = function (app) {
    app.run(function (viewDocumentService, employeeService) {
        'ngInject';

        viewDocumentService
            .getPageName(
                'draftOutgoing',
                function (model) {
                    return !employeeService.hasPermissionTo(employeeService.getPermissionForDocumentClass(model).properties);
                }, function (model) {
                    return !employeeService.hasPermissionTo("MANAGE_DESTINATIONS");
                }, function (model) {
                    return false
                })
            .getPageNameOverride('reviewOutgoing', 'draftOutgoing')
            .getPageNameOverride('readyToSendOutgoing', 'draftOutgoing')
            .getPageNameOverride('rejectedOutgoing', 'draftOutgoing')
            // Incoming
            .getPageNameOverride('reviewIncoming', 'draftOutgoing')
            .getPageNameOverride('readyToSendIncoming', 'draftOutgoing')
            .getPageNameOverride('rejectedIncoming', 'draftOutgoing')
            // Internal
            .getPageNameOverride('draftInternal', 'draftOutgoing')
            .getPageNameOverride('reviewInternal', 'draftOutgoing')
            .getPageNameOverride('readyToSendInternal', 'draftOutgoing')
            .getPageNameOverride('rejectedInternal', 'draftOutgoing')
            .getPageNameOverride('approvedInternal', 'draftOutgoing', {
                disableProperties: function (model) {
                    return true;
                },
                disableSites: function (model) {
                    return true;
                }
            })
            // Search
            .getPageNameOverride('searchOutgoing', 'draftOutgoing', {
                disableProperties: function () {
                    return true;
                },
                disableSites: function (model) {
                    var info = model.getInfo();
                    return !(employeeService.hasPermissionTo("MANAGE_DESTINATIONS") && info.docStatus < 25);
                }
            })
            .getPageNameOverride('searchIncoming', 'draftOutgoing', {
                disableProperties: function () {
                    return true;
                }
            })
            .getPageNameOverride('searchInternal', 'draftOutgoing', {
                disableProperties: function () {
                    return true;
                },
                disableSites: function () {
                    return true;
                }
            })
            .getPageNameOverride('searchGeneral', 'draftOutgoing', {
                disableProperties: function () {
                    return true;
                },
                disableSites: function (model) {
                    var info = model.getInfo();
                    var hasPermission = employeeService.hasPermissionTo("MANAGE_DESTINATIONS");
                    var allowedByDocClass = (info.documentClass === 'outgoing') ? (info.docStatus < 25) : (info.documentClass === 'incoming');
                    var allowed = (hasPermission && info.documentClass !== "internal") && allowedByDocClass;
                    return !allowed
                }
            })
            .getPageNameOverride('searchOutgoingIncoming', 'draftOutgoing', {
                disableProperties: function () {
                    return true;
                },
                disableSites: function (model) {
                    var info = model.getInfo();
                    var hasPermission = employeeService.hasPermissionTo("MANAGE_DESTINATIONS");
                    var allowedByDocClass = (info.documentClass === 'outgoing') ? (info.docStatus < 25) : (info.documentClass === 'incoming');
                    var allowed = (hasPermission && info.documentClass !== "internal") && allowedByDocClass;
                    return !allowed
                }
            })
            .getPageNameOverride('quickSearch', 'draftOutgoing', {
                disableProperties: function () {
                    return true;
                },
                disableSites: function () {
                    return true;
                }
            })
            // User Inbox
            .getPageNameOverride('proxyMail', 'draftOutgoing', {
                disableProperties: function (model) {
                    var info = model.getInfo();
                    var hasPermission = false;
                    if (info.documentClass === "internal") {
                        //If approved internal electronic, don't allow to edit
                        if (info.docStatus >= 24 && !info.isPaper)
                            hasPermission = false;
                        else
                            hasPermission = employeeService.hasPermissionTo("EDIT_INTERNAL_PROPERTIES");
                    } else if (info.documentClass === "incoming")
                        hasPermission = employeeService.hasPermissionTo("EDIT_INCOMING’S_PROPERTIES");
                    else if (info.documentClass === "outgoing") {
                        //If approved outgoing electronic, don't allow to edit
                        if (info.docStatus >= 24 && !info.isPaper)
                            hasPermission = false;
                        else
                            hasPermission = employeeService.hasPermissionTo("EDIT_OUTGOING_PROPERTIES");
                    }
                    return !hasPermission;
                },
                disableSites: function (model) {
                    var info = model.getInfo();
                    var hasPermission = employeeService.hasPermissionTo("MANAGE_DESTINATIONS");
                    return !(hasPermission && info.documentClass !== "internal");
                }
            })
            .getPageNameOverride('userInbox', 'draftOutgoing', {
                disableProperties: function (model) {
                    var info = model.getInfo();
                    var hasPermission = false;
                    if (info.documentClass === "internal") {
                        //If approved internal electronic, don't allow to edit
                        if (info.docStatus >= 24 && !info.isPaper)
                            hasPermission = false;
                        else
                            hasPermission = employeeService.hasPermissionTo("EDIT_INTERNAL_PROPERTIES");
                    } else if (info.documentClass === "incoming")
                        hasPermission = employeeService.hasPermissionTo("EDIT_INCOMING’S_PROPERTIES");
                    else if (info.documentClass === "outgoing") {
                        //If approved outgoing electronic, don't allow to edit
                        if (info.docStatus >= 24 && !info.isPaper)
                            hasPermission = false;
                        else
                            hasPermission = employeeService.hasPermissionTo("EDIT_OUTGOING_PROPERTIES");
                    }
                    return !hasPermission;
                },
                disableSites: function (model) {
                    var info = model.getInfo();
                    var hasPermission = employeeService.hasPermissionTo("MANAGE_DESTINATIONS");
                    return !(hasPermission && info.documentClass !== "internal");
                },
                disableAll: function (model) {
                    var info = model.getInfo();
                    return (info.docStatus >= 24 && !info.isPaper);
                }
            })
            .getPageNameOverride('followupEmployeeInbox', 'draftOutgoing', {
                disableProperties: function () {
                    return true;
                },
                disableSites: function () {
                    return true;
                }
            })
            .getPageNameOverride('favoriteDocument', 'draftOutgoing', {
                disableProperties: function (model) {
                    var info = model.getInfo();
                    var hasPermission = false;
                    if (info.documentClass === "internal") {
                        //If approved internal electronic, don't allow to edit
                        if (info.docStatus >= 24 && !info.isPaper)
                            hasPermission = false;
                        else
                            hasPermission = employeeService.hasPermissionTo("EDIT_INTERNAL_PROPERTIES");
                    } else if (info.documentClass === "incoming")
                        hasPermission = employeeService.hasPermissionTo("EDIT_INCOMING’S_PROPERTIES");
                    else if (info.documentClass === "outgoing") {
                        //If approved outgoing electronic, don't allow to edit
                        if (info.docStatus >= 24 && !info.isPaper)
                            hasPermission = false;
                        else
                            hasPermission = employeeService.hasPermissionTo("EDIT_OUTGOING_PROPERTIES");
                    }
                    return !hasPermission;
                },
                disableSites: function () {
                    return true;
                }
            })
            .getPageNameOverride('groupMail', 'draftOutgoing', {
                disableProperties: function (model) {
                    var info = model.getInfo();
                    var hasPermission = false;
                    if (info.documentClass === "internal") {
                        //If approved internal electronic, don't allow to edit
                        if (info.docStatus >= 24 && !info.isPaper)
                            hasPermission = false;
                        else
                            hasPermission = employeeService.hasPermissionTo("EDIT_INTERNAL_PROPERTIES");
                    } else if (info.documentClass === "incoming")
                        hasPermission = employeeService.hasPermissionTo("EDIT_INCOMING’S_PROPERTIES");
                    else if (info.documentClass === "outgoing") {
                        //If approved outgoing electronic, don't allow to edit
                        if (info.docStatus >= 24 && !info.isPaper)
                            hasPermission = false;
                        else
                            hasPermission = employeeService.hasPermissionTo("EDIT_OUTGOING_PROPERTIES");
                    }
                    return !hasPermission || model.isBroadcasted();
                },
                disableSites: function (model) {
                    var info = model.getInfo();
                    var hasPermission = employeeService.hasPermissionTo("MANAGE_DESTINATIONS");
                    return !(hasPermission && info.documentClass !== "internal");
                }
            })
            .getPageNameOverride('sentItem', 'draftOutgoing')
            .getPageNameOverride('folder', 'draftOutgoing', {
                disableProperties: function (model) {
                    var info = model.getInfo();
                    var hasPermission = false;
                    if (info.documentClass === "internal") {
                        //If approved internal electronic, don't allow to edit
                        if (info.docStatus >= 24 && !info.isPaper)
                            hasPermission = false;
                        else
                            hasPermission = employeeService.hasPermissionTo("EDIT_INTERNAL_PROPERTIES");
                    } else if (info.documentClass === "incoming")
                        hasPermission = employeeService.hasPermissionTo("EDIT_INCOMING’S_PROPERTIES");
                    else if (info.documentClass === "outgoing") {
                        //If approved outgoing electronic, don't allow to edit
                        if (info.docStatus >= 24 && !info.isPaper)
                            hasPermission = false;
                        else
                            hasPermission = employeeService.hasPermissionTo("EDIT_OUTGOING_PROPERTIES");
                    }
                    return !hasPermission || model.isBroadcasted();
                },
                disableSites: function (model) {
                    var info = model.getInfo();
                    var hasPermission = employeeService.hasPermissionTo("MANAGE_DESTINATIONS");
                    return !(hasPermission && info.documentClass !== "internal");
                }
            })
            // Central Archive
            .getPageNameOverride('centralArchiveReadyToExport', 'draftOutgoing', {
                disableProperties: function (model) {
                    var info = model.getInfo();
                    var hasPermission = (employeeService.hasPermissionTo("EDIT_OUTGOING_PROPERTIES") || employeeService.hasPermissionTo("EDIT_OUTGOING_CONTENT"));
                    var allowed = hasPermission && info.isPaper;// && info.docStatus < 24
                    return !allowed;
                },
                disableSites: function (model) {
                    return !(employeeService.hasPermissionTo("MANAGE_DESTINATIONS"));
                }
            })
            // Department Inbox
            .getPageNameOverride('departmentIncoming', 'draftOutgoing', {
                disableProperties: function (model) {
                    return !model.isTransferredDocument();
                },
                disableSites: function (model) {
                    return true;
                },
                disableAll: function (model) {
                    return !model.generalStepElm.isReassigned && !model.isTransferredDocument() ;
                }
            })
            .getPageNameOverride('departmentReturned', 'draftOutgoing', {
                disableProperties: function (model) {
                    var info = model.getInfo();
                    var hasPermission = (employeeService.hasPermissionTo("EDIT_OUTGOING_PROPERTIES") || employeeService.hasPermissionTo("EDIT_OUTGOING_CONTENT"));
                    return !(hasPermission && info.isPaper);// && info.docStatus < 24
                },
                disableSites: function (model) {
                    return true;
                }
            })
            .getPageNameOverride('departmentSentItem', 'draftOutgoing', {
                disableProperties: function (model) {
                    return true;
                },
                disableSites: function (model) {
                    return true;
                }
            })
            .getPageNameOverride('g2gPending', 'draftOutgoing', {
                disableProperties: function (model) {
                    return true;
                },
                disableSites: function (model) {
                    return true;
                },
                disableAll: function (model) {
                    return true;
                }
            })
            .getPageNameOverride('departmentReadyToExport', 'draftOutgoing', {
                disableProperties: function (model) {
                    var info = model.getInfo();
                    var hasPermission = (employeeService.hasPermissionTo("EDIT_OUTGOING_PROPERTIES") || employeeService.hasPermissionTo("EDIT_OUTGOING_CONTENT"));
                    return !(hasPermission && info.isPaper);// && info.docStatus < 24
                },
                disableSites: function (model) {
                    return !(employeeService.hasPermissionTo("MANAGE_DESTINATIONS"));
                }
            })
            // G2G
            .getPageNameOverride('g2gIncoming', 'draftOutgoing', {
                disableAll: function (model) {
                    return true;
                }
            })
            .getPageNameOverride('g2gSentItem', 'draftOutgoing', {
                disableAll: function (model) {
                    return true;
                }
            })
            .getPageNameOverride('g2gReturned', 'draftOutgoing', {
                disableAll: function (model) {
                    return true;
                }
            });
    })
};
