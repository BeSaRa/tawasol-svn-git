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
            .resolveToState('login', 'MUST_LOGGED_IN', function (ssoService, tokenService, rootEntity, employeeService, dialog, $timeout, $q, $state) {
                'ngInject';
                var defer = $q.defer();
                return ssoService.promise.then(function () {
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
                });
            })
            .bulkResolveToState('app.administration.classifications', {
                classifications: function (classificationService, organizations) {
                    'ngInject';
                    return classificationService.loadClassificationsWithLimit(150);
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
            .bulkResolveToState('app.administration.document-stamps', {
                organizations: function (organizationService, _) {
                    'ngInject';
                    return organizationService.loadOrganizations()
                        .then(function (result) {
                            return _.filter(result, function (organization) {
                                return organization.hasRegistry;
                            })
                        });
                },
                documentStamps: function (documentStampService, selectedRegOU) {
                    'ngInject';
                    return documentStampService.loadDocumentStamps(selectedRegOU, null);
                },
                selectedRegOU: function (employeeService) {
                    'ngInject';
                    return employeeService.isAdminUser() ? -1 : employeeService.getEmployee().organization.ouRegistryID;
                }
            })
            .bulkResolveToState('app.administration.sequential-workflows', {
                organizations: function (organizationService, employeeService, ouApplicationUserService, $q, _) {
                    'ngInject';
                    return organizationService.getOrganizationsForSeqWF();
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
                organizations: function (organizationService) {
                    'ngInject';
                    return organizationService.loadAllOrganizationsStructureView();
                },
                //Load the jobTitles, ranks, themes, roles, permissions to use in application user popup
                viewLookups: function (applicationUserService, jobTitleService, rankService, roleService, themeService) {
                    'ngInject';
                    return applicationUserService.loadViewLookups()
                        .then(function (result) {
                            jobTitleService.jobTitles = result.jobTitleList;
                            rankService.ranks = result.rankList;
                            themeService.themes = result.themeList;
                            roleService.roles = result.customRoleList;
                            roleService.permissionListFromAppUserView = result.permissionList;
                            return result;
                        });
                }
            })
            .bulkResolveToState('app.outgoing.add', {
                organizations: function (organizationService) {
                    'ngInject';
                    return organizationService.loadOrganizations(true);
                },
                replyTo: function ($timeout, $stateParams, correspondenceService) {
                    'ngInject';
                    var vsId = $stateParams.vsId, wobNum = $stateParams.wobNum, action = $stateParams.action,
                        createAsAttachment = $stateParams.createAsAttachment === "true",
                        sourceDocClass = $stateParams.sourceDocClass, targetDocClass = 'outgoing',
                        addMethod = $stateParams.addMethod,
                        versionNumber = $stateParams.versionNumber;

                    if (action !== 'reply')
                        return $timeout(function () {
                            return false;
                        });

                    if (wobNum || vsId) {
                        return correspondenceService.createReplyForDocument(sourceDocClass, targetDocClass, wobNum, vsId, createAsAttachment, versionNumber)
                            .then(function (outgoing) {
                                if (!createAsAttachment) {
                                    outgoing.linkedDocs = [outgoing.linkedDocList[0]];
                                } else {
                                    outgoing.linkedAttachmenstList[0].createReplyDisableDelete = true;
                                    outgoing.attachments = [outgoing.linkedAttachmenstList[0]];
                                }

                                outgoing.docDate = new Date();
                                outgoing.createdOn = new Date();
                                outgoing.addMethod = Number(addMethod);
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
                    var vsId = $stateParams.vsId, workItem = $stateParams.wobNum, action = $stateParams.action;
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
                    var vsId = $stateParams.vsId, workItem = $stateParams.wobNum, action = $stateParams.action;
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
                },
                isInternal: function ($q) {
                    'ngInject';
                    return $q.resolve(false);
                }
            })
            .bulkResolveToState('app.outgoing.add-internal', {
                organizations: function (organizationService) {
                    'ngInject';
                    return organizationService.loadOrganizations(true);
                },
                replyTo: function ($timeout, $stateParams, correspondenceService) {
                    'ngInject';
                    var vsId = $stateParams.vsId, wobNum = $stateParams.wobNum, action = $stateParams.action,
                        createAsAttachment = $stateParams.createAsAttachment === "true",
                        sourceDocClass = $stateParams.sourceDocClass, targetDocClass = 'outgoing',
                        addMethod = $stateParams.addMethod,
                        versionNumber = $stateParams.versionNumber;

                    if (action !== 'reply')
                        return $timeout(function () {
                            return false;
                        });

                    if (wobNum || vsId) {
                        return correspondenceService.createReplyForDocument(sourceDocClass, targetDocClass, wobNum, vsId, createAsAttachment, versionNumber)
                            .then(function (outgoing) {
                                if (!createAsAttachment) {
                                    outgoing.linkedDocs = [outgoing.linkedDocList[0]];
                                } else {
                                    outgoing.linkedAttachmenstList[0].createReplyDisableDelete = true;
                                    outgoing.attachments = [outgoing.linkedAttachmenstList[0]];
                                }

                                outgoing.docDate = new Date();
                                outgoing.createdOn = new Date();
                                outgoing.addMethod = Number(addMethod);
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
                    var vsId = $stateParams.vsId, workItem = $stateParams.wobNum, action = $stateParams.action;
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
                    var vsId = $stateParams.vsId, workItem = $stateParams.wobNum, action = $stateParams.action;
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
                },
                isInternal: function ($q) {
                    'ngInject';
                    return $q.resolve(true);
                }
            })
            .bulkResolveToState('app.outgoing.simple-add', {
                organizations: function (organizationService) {
                    'ngInject';
                    return organizationService.loadOrganizations(true);
                },
                replyTo: function ($timeout, $stateParams, correspondenceService) {
                    'ngInject';
                    var vsId = $stateParams.vsId, wobNum = $stateParams.wobNum, action = $stateParams.action,
                        createAsAttachment = $stateParams.createAsAttachment === "true",
                        sourceDocClass = $stateParams.sourceDocClass, targetDocClass = 'outgoing',
                        addMethod = $stateParams.addMethod,
                        versionNumber = $stateParams.versionNumber;

                    if (action !== 'reply')
                        return $timeout(function () {
                            return false;
                        });

                    if (wobNum || vsId) {
                        return correspondenceService.createReplyForDocument(sourceDocClass, targetDocClass, wobNum, vsId, createAsAttachment, versionNumber)
                            .then(function (outgoing) {
                                if (!createAsAttachment) {
                                    outgoing.linkedDocs = [outgoing.linkedDocList[0]];
                                } else {
                                    outgoing.linkedAttachmenstList[0].createReplyDisableDelete = true;
                                    outgoing.attachments = [outgoing.linkedAttachmenstList[0]];
                                }
                                outgoing.docDate = new Date();
                                outgoing.createdOn = new Date();
                                outgoing.addMethod = Number(addMethod);
                                outgoing.sitesInfoTo = angular.copy(outgoing.sitesToList); //[result.site];
                                outgoing.classDescription = 'Outgoing';
                                outgoing.isComposite = false;
                                return outgoing;
                            });
                    } else {
                        return $timeout(function () {
                            return false;
                        })
                    }
                },
                editAfterApproved: function ($timeout, $stateParams, correspondenceStorageService, correspondenceService) {
                    'ngInject';
                    var vsId = $stateParams.vsId, workItem = $stateParams.wobNum, action = $stateParams.action;
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
                    var vsId = $stateParams.vsId, workItem = $stateParams.wobNum, action = $stateParams.action;
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
                },
                simpleEdit: function ($timeout, $stateParams, correspondenceStorageService) {
                    'ngInject';
                    var vsId = $stateParams.vsId, workItem = $stateParams.wobNum, action = $stateParams.action;
                    if (action !== 'simpleEdit') {
                        return $timeout(function () {
                            return false;
                        })
                    }

                    return correspondenceStorageService
                        .getCorrespondence('simpleEdit')
                        .catch(function () {
                            return $timeout(function () {
                                return false;
                            });
                        });
                },
                isInternal: function ($q) {
                    'ngInject';
                    return $q.resolve(false);
                }
            })
            .bulkResolveToState('app.outgoing.simple-add-internal', {
                organizations: function (organizationService) {
                    'ngInject';
                    return organizationService.loadOrganizations(true);
                },
                replyTo: function ($timeout, $stateParams, correspondenceService) {
                    'ngInject';
                    var vsId = $stateParams.vsId, wobNum = $stateParams.wobNum, action = $stateParams.action,
                        createAsAttachment = $stateParams.createAsAttachment === "true",
                        sourceDocClass = $stateParams.sourceDocClass, targetDocClass = 'outgoing',
                        addMethod = $stateParams.addMethod,
                        versionNumber = $stateParams.versionNumber;

                    if (action !== 'reply')
                        return $timeout(function () {
                            return false;
                        });

                    if (wobNum || vsId) {
                        return correspondenceService.createReplyForDocument(sourceDocClass, targetDocClass, wobNum, vsId, createAsAttachment, versionNumber)
                            .then(function (outgoing) {
                                if (!createAsAttachment) {
                                    outgoing.linkedDocs = [outgoing.linkedDocList[0]];
                                } else {
                                    outgoing.linkedAttachmenstList[0].createReplyDisableDelete = true;
                                    outgoing.attachments = [outgoing.linkedAttachmenstList[0]];
                                }
                                outgoing.docDate = new Date();
                                outgoing.createdOn = new Date();
                                outgoing.addMethod = Number(addMethod);
                                outgoing.sitesInfoTo = angular.copy(outgoing.sitesToList); //[result.site];
                                outgoing.classDescription = 'Outgoing';
                                outgoing.isComposite = false;
                                return outgoing;
                            });
                    } else {
                        return $timeout(function () {
                            return false;
                        })
                    }
                },
                editAfterApproved: function ($timeout, $stateParams, correspondenceStorageService, correspondenceService) {
                    'ngInject';
                    var vsId = $stateParams.vsId, workItem = $stateParams.wobNum, action = $stateParams.action;
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
                    var vsId = $stateParams.vsId, workItem = $stateParams.wobNum, action = $stateParams.action;
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
                },
                simpleEdit: function ($timeout, $stateParams, correspondenceStorageService) {
                    'ngInject';
                    var vsId = $stateParams.vsId, workItem = $stateParams.wobNum, action = $stateParams.action;
                    if (action !== 'simpleEdit') {
                        return $timeout(function () {
                            return false;
                        })
                    }

                    return correspondenceStorageService
                        .getCorrespondence('simpleEdit')
                        .catch(function () {
                            return $timeout(function () {
                                return false;
                            });
                        });
                },
                isInternal: function ($q) {
                    'ngInject';
                    return $q.resolve(true);
                }
            })
            .bulkResolveToState('app.incoming.add', {
                organizations: function (organizationService) {
                    'ngInject';
                    return organizationService.loadOrganizations(true);
                },
                receive: function (correspondenceService, rootEntity, $stateParams, $timeout, $q, dialog, $state, langService) {
                    'ngInject';
                    var action = $stateParams.action, workItem = $stateParams.wobNum;
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
                centralArchives: function ($q, organizations, employeeService, _, organizationService) {
                    'ngInject';
                    var currentOU = employeeService.getEmployee().userOrganization;

                    return employeeService.isCentralArchive() ? (organizationService.centralArchiveOrganizations().then(function (organizations) {
                        if (employeeService.isCentralArchiveHasRegistry() && organizations && (_.map(organizations, 'id').indexOf(currentOU.id) === -1)) {
                            organizations ? organizations.push(currentOU) : $q.resolve(false);
                        }
                        return organizations;
                    })) : $q.resolve(false);
                }
            })
            .bulkResolveToState('app.incoming.simple-add', {
                organizations: function (organizationService) {
                    'ngInject';
                    return organizationService.loadOrganizations(true);
                },
                receive: function (correspondenceService, $stateParams, $timeout) {
                    'ngInject';
                    var action = $stateParams.action, workItem = $stateParams.wobNum;
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
                centralArchives: function ($q, organizations, employeeService, organizationService, receiveG2G, receive, _) {
                    'ngInject';
                    var currentOU = employeeService.getEmployee().userOrganization;

                    return employeeService.isCentralArchive() ? (organizationService.centralArchiveOrganizations().then(function (organizations) {
                        if (employeeService.isCentralArchiveHasRegistry() && (_.map(organizations, 'id').indexOf(currentOU.id) === -1)) {
                            organizations ? organizations.push(currentOU) : $q.resolve(false);
                        }
                        return organizations;
                    })) : $q.resolve(false);
                },
                simpleEdit: function ($timeout, $stateParams, correspondenceStorageService) {
                    'ngInject';
                    var vsId = $stateParams.vsId, workItem = $stateParams.wobNum, action = $stateParams.action;
                    if (action !== 'simpleEdit') {
                        return $timeout(function () {
                            return false;
                        })
                    }

                    return correspondenceStorageService
                        .getCorrespondence('simpleEdit')
                        .catch(function () {
                            return $timeout(function () {
                                return false;
                            });
                        });
                }
            })
            .bulkResolveToState('app.internal.add', {
                organizations: function (organizationService) {
                    'ngInject';
                    return organizationService.loadOrganizations(true);
                },
                replyTo: function ($timeout, $stateParams, correspondenceService) {
                    'ngInject';
                    var vsId = $stateParams.vsId, wobNum = $stateParams.wobNum, action = $stateParams.action,
                        createAsAttachment = $stateParams.createAsAttachment === "true",
                        sourceDocClass = $stateParams.sourceDocClass, targetDocClass = 'internal',
                        addMethod = $stateParams.addMethod,
                        versionNumber = $stateParams.versionNumber;

                    if (action !== 'reply')
                        return $timeout(function () {
                            return false;
                        });

                    if (wobNum || vsId) {
                        return correspondenceService.createReplyForDocument(sourceDocClass, targetDocClass, wobNum, vsId, createAsAttachment, versionNumber)
                            .then(function (internal) {
                                if (!createAsAttachment) {
                                    internal.linkedDocs = [internal.linkedDocList[0]];
                                } else {
                                    internal.linkedAttachmenstList[0].createReplyDisableDelete = true;
                                    internal.attachments = [internal.linkedAttachmenstList[0]];
                                }
                                internal.docDate = new Date();
                                internal.createdOn = new Date();
                                internal.addMethod = Number(addMethod);
                                internal.classDescription = 'Internal';
                                return internal;
                            });
                    } else {
                        return $timeout(function () {
                            return false;
                        })
                    }
                },
                editAfterApproved: function ($timeout, $stateParams, correspondenceStorageService, correspondenceService) {
                    'ngInject';
                    var vsId = $stateParams.vsId, workItem = $stateParams.wobNum, action = $stateParams.action;
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
                    var vsId = $stateParams.vsId, wobNum = $stateParams.wobNum, action = $stateParams.action,
                        createAsAttachment = $stateParams.createAsAttachment === "true",
                        sourceDocClass = $stateParams.sourceDocClass, targetDocClass = 'internal',
                        addMethod = $stateParams.addMethod,
                        versionNumber = $stateParams.versionNumber;

                    if (action !== 'reply')
                        return $timeout(function () {
                            return false;
                        });

                    if (wobNum || vsId) {
                        return correspondenceService.createReplyForDocument(sourceDocClass, targetDocClass, wobNum, vsId, createAsAttachment, versionNumber)
                            .then(function (internal) {
                                if (!createAsAttachment) {
                                    internal.linkedDocs = [internal.linkedDocList[0]];
                                } else {
                                    internal.linkedAttachmenstList[0].createReplyDisableDelete = true;
                                    internal.attachments = [internal.linkedAttachmenstList[0]];
                                }
                                internal.docDate = new Date();
                                internal.createdOn = new Date();
                                internal.addMethod = Number(addMethod);
                                internal.classDescription = 'Internal';
                                return internal;
                            });
                    } else {
                        return $timeout(function () {
                            return false;
                        })
                    }
                },
                editAfterApproved: function ($timeout, $stateParams, correspondenceStorageService, correspondenceService) {
                    'ngInject';
                    var vsId = $stateParams.vsId, workItem = $stateParams.wobNum, action = $stateParams.action;
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
                simpleEdit: function ($timeout, $stateParams, correspondenceStorageService) {
                    'ngInject';
                    var vsId = $stateParams.vsId, workItem = $stateParams.wobNum, action = $stateParams.action;
                    if (action !== 'simpleEdit') {
                        return $timeout(function () {
                            return false;
                        })
                    }

                    return correspondenceStorageService
                        .getCorrespondence('simpleEdit')
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
                },
                loadPSPDFLanguages: function (PDFService) {
                    'ngInject';
                    return PDFService.PSPDFLanguages.load();
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
            .bulkResolveToState('app.search-screen', {
                lookups: function (correspondenceService) {
                    'ngInject';
                    return correspondenceService.loadCorrespondenceLookups('common', true);
                },
                registryOrganizations: function (employeeService, langService, $q, _, organizationService) {
                    'ngInject';

                    function _sortResultByCurrentLang(result) {
                        return _.sortBy(result, function (item) {
                            return item[langService.current + 'Name'].toLowerCase();
                        });
                    }

                    // if user has permission to search in all ou load all organizations and ignore role security
                    if (employeeService.hasPermissionTo('SEARCH_IN_ALL_OU')) {
                        return organizationService.loadOrganizations(employeeService.hasPermissionTo('SEARCH_IN_ALL_OU'))
                            .then(function (result) {
                                // to sort registry organizations after retrieve
                                return _sortResultByCurrentLang(_.filter(result, function (organization) {
                                    return organization.hasRegistry;
                                }));
                            });
                    } else {
                        return organizationService.getUserViewPermissionOusByUserId(employeeService.getEmployee().id)
                            .then(function (result) {
                                return _sortResultByCurrentLang(_.filter(result, function (organization) {
                                    return organization.hasRegistry;
                                }));
                            });
                    }
                },
                propertyConfigurations: function ($q, propertyConfigurationService) {
                    'ngInject';
                    return propertyConfigurationService
                        .loadAllPropertyConfigurations();
                },
                approvers: function (ouApplicationUserService, employeeService, registryOrganizations) {
                    'ngInject';
                    return ouApplicationUserService
                        .searchByCriteria({
                            regOu: employeeService.getEmployee().organization.ouRegistryID
                        });
                },
                availableRegistryOrganizations: function (_, employeeService, registryOrganizations, organizationService) {
                    'ngInject';
                    return employeeService.hasPermissionTo('SEARCH_IN_ALL_OU') ? angular.copy(registryOrganizations) : (organizationService.loadOrganizations(true)
                        .then(function (organizations) {
                            return _.filter(organizations, 'hasRegistry');
                        }));
                },
                emailItem: function (correspondenceService, $stateParams) {
                    'ngInject';
                    var action = $stateParams.action, source = $stateParams['document-class'],
                        vsId = $stateParams['vsid'];
                    return vsId && source ? correspondenceService.loadCorrespondenceByVsIdClass(vsId, source) : false;
                }
            })
            .bulkResolveToState('app.intelligence-search', {
                lookups: function (correspondenceService) {
                    'ngInject';
                    return correspondenceService.loadCorrespondenceLookups('common', true);
                },
                registryOrganizations: function (employeeService, langService, $q, _, organizationService) {
                    'ngInject';

                    function _sortResultByCurrentLang(result) {
                        return _.sortBy(result, function (item) {
                            return item[langService.current + 'Name'].toLowerCase();
                        });
                    }

                    // if user has permission to search in all ou load all organizations and ignore role security
                    if (employeeService.hasPermissionTo('SEARCH_IN_ALL_OU')) {
                        return organizationService.loadOrganizations(employeeService.hasPermissionTo('SEARCH_IN_ALL_OU'))
                            .then(function (result) {
                                // to sort registry organizations after retrieve
                                return _sortResultByCurrentLang(_.filter(result, function (organization) {
                                    return organization.hasRegistry;
                                }));
                            });
                    } else {
                        return organizationService.getUserViewPermissionOusByUserId(employeeService.getEmployee().id)
                            .then(function (result) {
                                return _sortResultByCurrentLang(_.filter(result, function (organization) {
                                    return organization.hasRegistry;
                                }));
                            });
                    }
                }
            })
            .bulkResolveToState('app.administration.serials-screen', {
                registryOrganizations: function (organizationService, _) {
                    'ngInject';
                    return organizationService.loadOrganizations().then(function (organizations) {
                        return _.filter(organizations, 'hasRegistry');
                    });
                }
            })
            .bulkResolveToState('app.inbox.my-followup', {
                folders: function (followUpUserService) {
                    'ngInject';
                    return followUpUserService.loadFollowupFolders(true);
                }
            })
            .bulkResolveToState('app.inbox.user-followup', {
                folders: function (followUpUserService) {
                    'ngInject';
                    return followUpUserService.loadFollowupFolders();
                },
                followUpOrganizations: function (organizationService) {
                    'ngInject';
                    return organizationService.getFollowUpOrganizations();
                }
            })
            .bulkResolveToState('app.administration.external-data-sources', {
                externalDataSources: function (externalDataSourceService) {
                    'ngInject';
                    return externalDataSourceService.loadExternalDataSources();
                }
            })
            .registerResolver();
    });
};
