module.exports = function (app) {
    app.config(function (resolverProvider, $stateProvider) {
        'ngInject';
        resolverProvider
            .setStateProvider($stateProvider)
            .resolveToState('loading', 'A_LANGUAGE', function (langService,
                                                               errorCode,
                                                               $q,
                                                               $stateParams,
                                                               rootEntity,
                                                               lookupService,
                                                               generator,
                                                               dialog,
                                                               $http,
                                                               toast,
                                                               application,
                                                               $rootScope,
                                                               $timeout) {
                'ngInject';
                langService.getCurrentLang();
                lookupService.setHttpService($http);
                langService.setRequireServices(dialog, toast);
                generator.setDialog(dialog);
                generator.setLangService(langService);
                generator.setToast(toast);
                generator.setRootEntityService(rootEntity);
                // first get the rootEntity information.
                $timeout(function () {
                    rootEntity
                        .getInformation($stateParams.identifier)
                        .then(function () {
                            // get load languages
                           langService.setEntityCurrentLang();
                            $timeout(function () {
                                return application.setReadyStatus();
                            }, 1000);
                        })
                        .catch(function (error) {
                            $rootScope.lang = langService.getCurrentTranslate();
                            return errorCode.checkIf(error, 'ROOT_ENTITY_NOT_FOUND', function () {
                                dialog.errorMessage(langService.get('root_entity_not_found'));
                                return $q.reject();
                            });
                        });
                });
                return true;
            })
            .resolveToState('login', 'MUST_LOGGED_IN', function (tokenService, rootEntity, employeeService, dialog, $timeout, $q, $state) {
                'ngInject';
                var defer = $q.defer();
                tokenService
                    .tokenRefresh()
                    .then(function () {
                        if (!employeeService.isAdminUser()) {
                            if (employeeService.hasPermissionTo('LANDING_PAGE'))
                                $state.go('app.landing-page', {identifier: rootEntity.getRootEntityIdentifier()});
                            else
                                $state.go('app.inbox.user-inbox', {identifier: rootEntity.getRootEntityIdentifier()});
                        } else {
                            $state.go('app.administration.entities', {identifier: rootEntity.getRootEntityIdentifier()});
                        }
                    })
                    .catch(function (error) {
                        defer.resolve(true);
                        dialog.cancel();
                    });
                return defer.promise;
            })
            .bulkResolveToState('app.administration.classifications', {
                classifications: function (classificationService, organizations) {
                    'ngInject';
                    return classificationService.loadClassificationsWithLimit(50);
                },
                organizations: function (organizationService) {
                    'ngInject';
                    return organizationService.getOrganizations();
                }
            })
            .bulkResolveToState('app.administration.correspondence-sites', {
                correspondenceSites: function (correspondenceSiteService, correspondenceTypes, organizations) {
                    'ngInject';
                    return correspondenceSiteService.loadCorrespondenceSitesWithLimit();
                },
                correspondenceTypes: function (correspondenceSiteTypeService) {
                    'ngInject';
                    return correspondenceSiteTypeService.loadCorrespondenceSiteTypes();
                },
                organizations: function (organizationService) {
                    'ngInject';
                    return organizationService.loadOrganizations(true);
                }
            })
            .bulkResolveToState('app.administration.organizations', {
                escalationProcess: function (lookupService) {
                    'ngInject';
                    return lookupService.getLookups(lookupService.escalationProcess);
                },
                workflowSecurity: function (lookupService) {
                    'ngInject';
                    return lookupService.getLookups(lookupService.workflowSecurity);
                },
                securitySchema: function (lookupService) {
                    'ngInject';
                    return lookupService.getLookups(lookupService.securitySchema);
                },
                referencePlanNumbers: function (referencePlanNumberService) {
                    'ngInject';
                    return referencePlanNumberService.getReferencePlanNumbers();
                    // return [];
                },
                organizationTypes: function (organizationTypeService) {
                    'ngInject';
                    return organizationTypeService.getOrganizationTypes();
                },
                applicationUsers: function (applicationUserService) {
                    'ngInject';
                    return applicationUserService.loadApplicationUsers();
                },
                customRoles: function (roleService) {
                    'ngInject';
                    return roleService.loadRoles();
                },
                correspondenceSiteTypes: function (correspondenceSiteTypeService) {
                    'ngInject';
                    return correspondenceSiteTypeService.loadCorrespondenceSiteTypes();
                },
                organizations: function (organizationService, correspondenceSiteTypes, applicationUsers, organizationTypes, referencePlanNumbers, escalationProcess) {
                    'ngInject';
                    return organizationService.loadAllOrganizationsStructure();
                }
            })
            .bulkResolveToState('app.outgoing.add', {
                organizations: function (organizationService) {
                    'ngInject';
                    return organizationService.loadOrganizations(true);
                },
                replyTo: function ($timeout, $stateParams, correspondenceService) {
                    'ngInject';
                    var vsId = $stateParams.vsId, workItem = $stateParams.workItem, action = $stateParams.action,
                        createAsAttachment = $stateParams.createAsAttachment === "true";
                    if (action !== 'reply')
                        return $timeout(function () {
                            return false;
                        });

                    if (vsId) {
                        return correspondenceService
                            .createReplyFromCorrespondence('incoming', vsId, 'outgoing', {createAsAttachment: createAsAttachment})
                            .then(function (outgoing) {
                                if (!createAsAttachment) {
                                    outgoing.linkedDocs = [outgoing.linkedDocList[0]];
                                } else {
                                    outgoing.linkedAttachmenstList[0].createReplyDisableDelete = true;
                                    outgoing.attachments = [outgoing.linkedAttachmenstList[0]];
                                }
                                outgoing.docDate = new Date();
                                outgoing.createdOn = new Date();
                                outgoing.addMethod = 0;
                                outgoing.sitesInfoTo = angular.copy(outgoing.sitesToList); //[result.site];
                                outgoing.classDescription = 'Outgoing';
                                return outgoing;
                            })
                    } else if (workItem) {
                        return correspondenceService
                            .createReplyFromWorkItem('incoming', workItem, 'outgoing', {createAsAttachment: createAsAttachment})
                            .then(function (outgoing) {
                                if (!createAsAttachment) {
                                    outgoing.linkedDocs = [outgoing.linkedDocList[0]];
                                } else {
                                    outgoing.linkedAttachmenstList[0].createReplyDisableDelete = true;
                                    outgoing.attachments = [outgoing.linkedAttachmenstList[0]];
                                }

                                outgoing.docDate = new Date();
                                outgoing.createdOn = new Date();
                                outgoing.addMethod = 0;
                                outgoing.sitesInfoTo = angular.copy(outgoing.sitesToList); //[result.site];
                                outgoing.classDescription = 'Outgoing';
                                return outgoing
                            });
                    } else {
                        return $timeout(function () {
                            return false;
                        })
                    }
                },
                editAfterApproved: function ($timeout, $stateParams, correspondenceStorageService, correspondenceService) {
                    'ngInject';
                    var vsId = $stateParams.vsId, workItem = $stateParams.workItem, action = $stateParams.action;
                    if (action !== 'editAfterApproved') {
                        return $timeout(function () {
                            return false;
                        })
                    }
                    return correspondenceStorageService
                        .getCorrespondence('approved')
                        .catch(function () {
                            return $timeout(function () {
                                return false;
                            });
                        });
                },
                editAfterExport: function ($timeout, $stateParams, correspondenceStorageService) {
                    'ngInject';
                    var vsId = $stateParams.vsId, workItem = $stateParams.workItem, action = $stateParams.action;
                    if (action !== 'editAfterExport') {
                        return $timeout(function () {
                            return false;
                        })
                    }
                    return correspondenceStorageService
                        .getCorrespondence('export')
                        .catch(function () {
                            return $timeout(function () {
                                return false;
                            });
                        });
                },
                duplicateVersion: function ($timeout, $stateParams, correspondenceStorageService) {
                    'ngInject';
                    var action = $stateParams.action;
                    if (action !== 'duplicateVersion') {
                        return $timeout(function () {
                            return false;
                        })
                    }
                    return correspondenceStorageService
                        .getCorrespondence('duplicate')
                        .catch(function () {
                            return $timeout(function () {
                                return false;
                            });
                        });
                },
                centralArchives: function ($q, organizations, employeeService, organizationService) {
                    'ngInject';
                    return employeeService.isCentralArchive() ? organizationService.centralArchiveOrganizations() : $q.resolve(false);
                },
                editAfterReturnG2G: function ($q, $timeout, $stateParams, correspondenceStorageService) {
                    'ngInject';
                    var action = $stateParams.action;

                    var actions = ['recallAndForwardG2G', 'editAfterReturnG2G'];
                    if (actions.indexOf(action) === -1) {
                        return $timeout(function () {
                            return false;
                        });
                    }

                    return correspondenceStorageService
                        .getCorrespondence(action)
                        .catch(function () {
                            return $timeout(function () {
                                return false;
                            });
                        });
                }
            })
            .bulkResolveToState('app.outgoing.simple-add', {
                organizations: function (organizationService) {
                    'ngInject';
                    return organizationService.loadOrganizations(true);
                },
                replyTo: function ($timeout, $stateParams, correspondenceService) {
                    'ngInject';
                    var vsId = $stateParams.vsId, workItem = $stateParams.workItem, action = $stateParams.action,
                        createAsAttachment = $stateParams.createAsAttachment === "true";

                    if (action !== 'reply')
                        return $timeout(function () {
                            return false;
                        });

                    if (vsId) {
                        return correspondenceService
                            .createReplyFromCorrespondence('incoming', vsId, 'outgoing', {createAsAttachment: createAsAttachment})
                            .then(function (outgoing) {
                                debugger;
                                if (!createAsAttachment) {
                                    outgoing.linkedDocs = [outgoing.linkedDocList[0]];
                                } else {
                                    outgoing.linkedAttachmenstList[0].createReplyDisableDelete = true;
                                    outgoing.attachments = [outgoing.linkedAttachmenstList[0]];
                                }
                                outgoing.docDate = new Date();
                                outgoing.createdOn = new Date();
                                outgoing.addMethod = 0;
                                outgoing.sitesInfoTo = angular.copy(outgoing.sitesToList); //[result.site];
                                outgoing.classDescription = 'Outgoing';
                                return outgoing;
                            });
                    } else if (workItem) {
                        return correspondenceService
                            .createReplyFromWorkItem('incoming', workItem, 'outgoing', {createAsAttachment: createAsAttachment})
                            .then(function (outgoing) {
                                debugger
                                if (!createAsAttachment) {
                                    outgoing.linkedDocs = [outgoing.linkedDocList[0]];
                                } else {
                                    outgoing.linkedAttachmenstList[0].createReplyDisableDelete = true;
                                    outgoing.attachments = [outgoing.linkedAttachmenstList[0]];
                                }

                                outgoing.docDate = new Date();
                                outgoing.createdOn = new Date();
                                outgoing.addMethod = 0;
                                outgoing.sitesInfoTo = angular.copy(outgoing.sitesToList); //[result.site];
                                outgoing.classDescription = 'Outgoing';
                                return outgoing
                            });
                    } else {
                        return $timeout(function () {
                            return false;
                        })
                    }
                },
                editAfterApproved: function ($timeout, $stateParams, correspondenceStorageService, correspondenceService) {
                    'ngInject';
                    var vsId = $stateParams.vsId, workItem = $stateParams.workItem, action = $stateParams.action;
                    if (action !== 'editAfterApproved') {
                        return $timeout(function () {
                            return false;
                        })
                    }
                    return correspondenceStorageService
                        .getCorrespondence('approved')
                        .catch(function () {
                            return $timeout(function () {
                                return false;
                            });
                        });
                },
                editAfterExport: function ($timeout, $stateParams, correspondenceStorageService, correspondenceService) {
                    'ngInject';
                    var vsId = $stateParams.vsId, workItem = $stateParams.workItem, action = $stateParams.action;
                    if (action !== 'editAfterExport') {
                        return $timeout(function () {
                            return false;
                        })
                    }
                    return correspondenceStorageService
                        .getCorrespondence('export')
                        .catch(function () {
                            return $timeout(function () {
                                return false;
                            });
                        });
                },
                centralArchives: function ($q, organizations, employeeService, organizationService) {
                    'ngInject';
                    return employeeService.isCentralArchive() ? organizationService.centralArchiveOrganizations() : $q.resolve(false);
                }
            })
            .bulkResolveToState('app.incoming.add', {
                organizations: function (organizationService) {
                    'ngInject';
                    return organizationService.loadOrganizations(true);
                },
                receive: function (correspondenceService, rootEntity, $stateParams, $timeout, $q, dialog, $state, langService) {
                    'ngInject';
                    var action = $stateParams.action, workItem = $stateParams.workItem;
                    /*, vsId = $stateParams.vsId;*/
                    var defer = $q.defer();
                    if (action === 'receive') {
                        correspondenceService.prepareReceiveIncoming(workItem)
                            .then(function (result) {
                                defer.resolve(result);
                            })
                            .catch(function (error) {
                                //$timeout(function () {
                                defer.reject(false);
                                //});
                            });
                    } else {
                        $timeout(function () {
                            defer.resolve(false);
                        });
                    }
                    return defer.promise.then(function (response) {
                        return response;
                    }).catch(function (error) {
                        dialog.errorMessage(langService.get('workitem_not_exists').change({workItem: workItem}));
                        $state.go('app.department-inbox.incoming', {identifier: rootEntity.getRootEntityIdentifier()});
                        return $q.reject();
                    })
                },
                receiveG2G: function (correspondenceService, $stateParams, $timeout) {
                    'ngInject';
                    var action = $stateParams.action, vsId = $stateParams.vsId;
                    if (action === 'receiveg2g') {
                        return correspondenceService.prepareReceiveIncomingByVsId(vsId)
                            .catch(function (error) {
                                return $timeout(function () {
                                    return false;
                                });
                            });
                    } else {
                        return $timeout(function () {
                            return false;
                        });
                    }
                },
                duplicateVersion: function ($timeout, $stateParams, correspondenceStorageService) {
                    'ngInject';
                    var action = $stateParams.action;
                    if (action !== 'duplicateVersion') {
                        return $timeout(function () {
                            return false;
                        })
                    }
                    return correspondenceStorageService
                        .getCorrespondence('duplicate')
                        .catch(function () {
                            return $timeout(function () {
                                return false;
                            });
                        });
                },
                centralArchives: function ($q, organizations, employeeService, organizationService) {
                    'ngInject';
                    return !employeeService.isCentralArchiveHasRegistry() ? organizationService.centralArchiveOrganizations() : $q.resolve(false);
                }
            })
            .bulkResolveToState('app.incoming.simple-add', {
                organizations: function (organizationService) {
                    'ngInject';
                    return organizationService.loadOrganizations(true);
                },
                receive: function (correspondenceService, $stateParams, $timeout) {
                    'ngInject';
                    var action = $stateParams.action, workItem = $stateParams.workItem;
                    if (action === 'receive') {
                        return correspondenceService.prepareReceiveIncoming(workItem)
                            .catch(function (error) {
                                return $timeout(function () {
                                    return false;
                                });
                            });
                    } else {
                        return $timeout(function () {
                            return false;
                        });
                    }
                },
                receiveG2G: function (correspondenceService, $stateParams, $timeout) {
                    'ngInject';
                    var action = $stateParams.action, vsId = $stateParams.vsId;
                    if (action === 'receiveg2g') {
                        return correspondenceService.prepareReceiveIncomingByVsId(vsId)
                            .catch(function (error) {
                                return $timeout(function () {
                                    return false;
                                });
                            });
                    } else {
                        return $timeout(function () {
                            return false;
                        });
                    }
                },
                centralArchives: function ($q, organizations, employeeService, organizationService) {
                    'ngInject';
                    return employeeService.isCentralArchive() ? organizationService.centralArchiveOrganizations() : $q.resolve(false);
                }
            })
            .bulkResolveToState('app.internal.add', {
                organizations: function (organizationService) {
                    'ngInject';
                    return organizationService.loadOrganizations(true);
                },
                replyTo: function ($timeout, $stateParams, correspondenceService) {
                    'ngInject';
                    var vsId = $stateParams.vsId, workItem = $stateParams.workItem, action = $stateParams.action,
                        createAsAttachment = $stateParams.createAsAttachment === "true";
                    if (action !== 'reply')
                        return $timeout(function () {
                            return false;
                        });

                    if (vsId) {
                        return correspondenceService
                            .createReplyFromCorrespondence('incoming', vsId, 'internal', {createAsAttachment: createAsAttachment})
                            .then(function (internal) {
                                if (!createAsAttachment) {
                                    internal.linkedDocs = [internal.linkedDocList[0]];
                                } else {
                                    internal.linkedAttachmenstList[0].createReplyDisableDelete = true;
                                    internal.attachments = [internal.linkedAttachmenstList[0]];
                                }
                                internal.docDate = new Date();
                                internal.createdOn = new Date();
                                internal.addMethod = 0;
                                internal.classDescription = 'Internal';
                                return internal;
                            })
                    } else if (workItem) {
                        return correspondenceService
                            .createReplyFromWorkItem('incoming', workItem, 'internal', {createAsAttachment: createAsAttachment})
                            .then(function (internal) {
                                if (!createAsAttachment) {
                                    internal.linkedDocs = [internal.linkedDocList[0]];
                                } else {
                                    internal.linkedAttachmenstList[0].createReplyDisableDelete = true;
                                    internal.attachments = [internal.linkedAttachmenstList[0]];
                                }

                                internal.docDate = new Date();
                                internal.createdOn = new Date();
                                internal.addMethod = 0;
                                internal.classDescription = 'Internal';
                                return internal
                            });
                    } else {
                        return $timeout(function () {
                            return false;
                        })
                    }
                },
                editAfterApproved: function ($timeout, $stateParams, correspondenceStorageService, correspondenceService) {
                    'ngInject';
                    var vsId = $stateParams.vsId, workItem = $stateParams.workItem, action = $stateParams.action;
                    if (action !== 'editAfterApproved') {
                        return $timeout(function () {
                            return false;
                        })
                    }
                    return correspondenceStorageService
                        .getCorrespondence('approved')
                        .catch(function () {
                            return $timeout(function () {
                                return false;
                            });
                        });
                },
                duplicateVersion: function ($timeout, $stateParams, correspondenceStorageService) {
                    'ngInject';
                    var action = $stateParams.action;
                    if (action !== 'duplicateVersion') {
                        return $timeout(function () {
                            return false;
                        })
                    }
                    return correspondenceStorageService
                        .getCorrespondence('duplicate')
                        .catch(function () {
                            return $timeout(function () {
                                return false;
                            });
                        });
                }
            })
            .bulkResolveToState('app.internal.simple-add', {
                organizations: function (organizationService) {
                    'ngInject';
                    return organizationService.loadOrganizations(true);
                },
                replyTo: function ($timeout, $stateParams, correspondenceService) {
                    'ngInject';
                    var vsId = $stateParams.vsId, workItem = $stateParams.workItem, action = $stateParams.action,
                        createAsAttachment = $stateParams.createAsAttachment === "true";
                    if (action !== 'reply')
                        return $timeout(function () {
                            return false;
                        });

                    if (vsId) {
                        return correspondenceService
                            .createReplyFromCorrespondence('incoming', vsId, 'internal', {createAsAttachment: createAsAttachment})
                            .then(function (internal) {
                                if (!createAsAttachment) {
                                    internal.linkedDocs = [internal.linkedDocList[0]];
                                } else {
                                    internal.linkedAttachmenstList[0].createReplyDisableDelete = true;
                                    internal.attachments = [internal.linkedAttachmenstList[0]];
                                }
                                internal.docDate = new Date();
                                internal.createdOn = new Date();
                                internal.addMethod = 0;
                                internal.classDescription = 'Internal';
                                return internal;
                            })
                    } else if (workItem) {
                        return correspondenceService
                            .createReplyFromWorkItem('incoming', workItem, 'internal', {createAsAttachment: createAsAttachment})
                            .then(function (internal) {
                                if (!createAsAttachment) {
                                    internal.linkedDocs = [internal.linkedDocList[0]];
                                } else {
                                    internal.linkedAttachmenstList[0].createReplyDisableDelete = true;
                                    internal.attachments = [internal.linkedAttachmenstList[0]];
                                }

                                internal.docDate = new Date();
                                internal.createdOn = new Date();
                                internal.addMethod = 0;
                                internal.classDescription = 'Internal';
                                return internal
                            });
                    } else {
                        return $timeout(function () {
                            return false;
                        })
                    }
                },
                editAfterApproved: function ($timeout, $stateParams, correspondenceStorageService, correspondenceService) {
                    'ngInject';
                    var vsId = $stateParams.vsId, workItem = $stateParams.workItem, action = $stateParams.action;
                    if (action !== 'editAfterApproved') {
                        return $timeout(function () {
                            return false;
                        })
                    }
                    return correspondenceStorageService
                        .getCorrespondence('approved')
                        .catch(function () {
                            return $timeout(function () {
                                return false;
                            });
                        });
                }
            })
            .bulkResolveToState('app', {
                loadMenus: function (sidebarService) {
                    'ngInject';
                    return sidebarService.loadMenuItems();
                },
                language: function (employeeService, $timeout, langService) {
                    'ngInject';
                    $timeout(function () {
                        langService.setSelectedLanguageById(employeeService.getEmployee().defaultDisplayLang);
                    }, 1000);
                    return true;
                }
            })
            .bulkResolveToState('app.inbox.folders', {
                folders: function (userFolderService) {
                    'ngInject';
                    return userFolderService.getUserFoldersForApplicationUser();
                }
            })
            .bulkResolveToState('app.inbox.group-inbox', {
                workItems: function (correspondenceService) {
                    'ngInject';
                    return correspondenceService.loadGroupInbox();
                },
                emailItem: function (workItems, langService, dialog, _, $stateParams) {
                    'ngInject';
                    var action = $stateParams.action, source = $stateParams.source,
                        wobNumber = $stateParams['wob-num'], item;

                    if (action && action === 'open' && source && source === 'email' && wobNumber) {
                        item = _.find(workItems, function (workItem) {
                            return workItem.generalStepElm.workObjectNumber === wobNumber;
                        });

                        return !item ? (dialog.errorMessage(langService.get('work_item_not_found').change({
                            wobNumber: wobNumber
                        })).then(function () {
                            return false;
                        })) : item;
                    }
                    return false;
                }
            })
            .bulkResolveToState('app.central-archive.ready-to-export', {
                workItems: function (correspondenceService) {
                    'ngInject';
                    return correspondenceService.loadCentralArchiveWorkItems();
                }
            })
            .bulkResolveToState('app.administration.menu-items', {
                dynamicMenuItems: function (dynamicMenuItemService) {
                    'ngInject';
                    return dynamicMenuItemService.loadParentDynamicMenuItems();
                }
            })
            .registerResolver();
    });
};
