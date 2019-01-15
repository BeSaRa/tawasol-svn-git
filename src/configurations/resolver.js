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
                            $state.go('app.landing-page', {identifier: rootEntity.getRootEntityIdentifier()});
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
                    return organizationService.getOrganizations();
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
                    return organizationService.loadOrganizations();
                }
            })
            .bulkResolveToState('app.outgoing.add', {
                organizations: function (organizationService) {
                    'ngInject';
                    return organizationService.getOrganizations();
                },
                replyTo: function ($timeout, $stateParams, correspondenceService) {
                    'ngInject';
                    var vsId = $stateParams.vsId, workItem = $stateParams.workItem, action = $stateParams.action;
                    if (action !== 'reply')
                        return $timeout(function () {
                            return false;
                        });

                    if (vsId) {
                        return correspondenceService
                            .createReplyFromCorrespondence('incoming', vsId, 'outgoing', {})
                            .then(function (outgoing) {
                                return correspondenceService
                                    .loadCorrespondenceByVsIdClass(outgoing.linkedDocs[0], 'incoming')
                                    .then(function (result) {
                                        outgoing.linkedDocs = [result];
                                        outgoing.docDate = new Date();
                                        outgoing.createdOn = new Date();
                                        outgoing.addMethod = 0;
                                        outgoing.sitesInfoTo = [result.site];
                                        outgoing.classDescription = 'Outgoing';
                                        return outgoing;
                                    });
                            })
                    } else if (workItem) {
                        return correspondenceService
                            .createReplyFromWorkItem('incoming', workItem, 'outgoing', {})
                            .then(function (outgoing) {
                                return correspondenceService
                                    .loadCorrespondenceByVsIdClass(outgoing.linkedDocs[0], 'incoming')
                                    .then(function (result) {
                                        outgoing.linkedDocs = [result];
                                        outgoing.docDate = new Date();
                                        outgoing.createdOn = new Date();
                                        outgoing.addMethod = 0;
                                        outgoing.sitesInfoTo = [result.site];
                                        outgoing.classDescription = 'Outgoing';
                                        return outgoing
                                    });
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
                }
            })
            .bulkResolveToState('app.outgoing.simple-add', {
                organizations: function (organizationService) {
                    'ngInject';
                    return organizationService.getOrganizations();
                },
                replyTo: function ($timeout, $stateParams, correspondenceService) {
                    'ngInject';
                    var vsId = $stateParams.vsId, workItem = $stateParams.workItem, action = $stateParams.action;
                    if (action !== 'reply')
                        return $timeout(function () {
                            return false;
                        });

                    if (vsId) {
                        return correspondenceService
                            .createReplyFromCorrespondence('incoming', vsId, 'outgoing', {})
                            .then(function (outgoing) {
                                return correspondenceService
                                    .loadCorrespondenceByVsIdClass(outgoing.linkedDocs[0], 'incoming')
                                    .then(function (result) {
                                        outgoing.linkedDocs = [result];
                                        outgoing.docDate = new Date();
                                        outgoing.createdOn = new Date();
                                        outgoing.addMethod = 0;
                                        outgoing.classDescription = 'Outgoing';
                                        return outgoing
                                    });
                            })
                    } else if (workItem) {
                        return correspondenceService
                            .createReplyFromWorkItem('incoming', workItem, 'outgoing', {})
                            .then(function (outgoing) {
                                return correspondenceService
                                    .loadCorrespondenceByVsIdClass(outgoing.linkedDocs[0], 'incoming')
                                    .then(function (result) {
                                        outgoing.linkedDocs = [result];
                                        outgoing.docDate = new Date();
                                        outgoing.createdOn = new Date();
                                        outgoing.addMethod = 0;
                                        outgoing.sitesInfoTo = [result.site];
                                        outgoing.classDescription = 'Outgoing';
                                        return outgoing
                                    });
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
                    return organizationService.getOrganizations();
                },
                receive: function (correspondenceService, $stateParams, $timeout, $q, dialog, $state, langService) {
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
                        dialog.alertMessage(langService.get('error_while_receiving_document'));
                        $state.go('app.department-inbox.incoming');
                        return false;
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
                    return employeeService.isCentralArchive() ? organizationService.centralArchiveOrganizations() : $q.resolve(false);
                }
            })
            .bulkResolveToState('app.incoming.simple-add', {
                organizations: function (organizationService) {
                    'ngInject';
                    return organizationService.getOrganizations();
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
                    return organizationService.getOrganizations();
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
                    return organizationService.getOrganizations();
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
