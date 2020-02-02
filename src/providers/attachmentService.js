module.exports = function (app) {
    app.provider('attachmentService', function () {
            'ngInject';
            var provider = this, extensionGroups = {};

            /**
             * start prepare the extension groups
             */
            function _prepareExtensionGroups() {
                var groups = provider.getAllExtensionGroups();
                _.map(groups, function (extensions, group) {
                    extensions = _.map(extensions, function (extension) {
                        return extension.toLowerCase();
                    });
                    groups[group] = extensions;
                });
                provider.setAllExtensionGroups(groups);

                /*for (var group in groups) {
                    groups[group] = groups[group].map(v => v.toLowerCase());
                }
                provider.setAllExtensionGroups(groups);*/
            }

            /**
             * add new extension group or append to the current if exists .
             * @param groupName
             * @param extensions
             * @return {*}
             */
            this.addExtensionGroup = function (groupName, extensions) {
                // check if no group or no extensions return the provider it self.
                if (!groupName) {
                    return this;
                }
                // check if no extensions for the given group return the provider it self and log
                if (!angular.isArray(extensions) || !extensions || !extensions.length) {
                    return this;
                }


                // check if the given groupName exists
                if (extensionGroups.hasOwnProperty(groupName)) {
                    extensionGroups[groupName] = extensionGroups[groupName].concat(extensions.filter(function (item) {
                        return extensionGroups[groupName].indexOf(item) === -1;
                    }));
                } else {
                    extensionGroups[groupName] = extensions;
                }

                return this;
            };

            this.addExtensionGroupWithExtend = function (groupName, extendsGroups, more) {
                var extensions = [];
                if (angular.isArray(extendsGroups)) {
                    for (var i = 0; i < extendsGroups.length; i++) {
                        extensions = extensions.concat(this.getExtensionGroup(extendsGroups[i]))
                    }
                } else {
                    extensions = extensions.concat(this.getExtensionGroup(extendsGroups));
                }
                if (more && angular.isArray(more))
                    extensions = extensions.concat(more);

                return this.addExtensionGroup(groupName, extensions);
            };
            /**
             * get the extension group for given name.
             * @param groupName
             * @return {Array}
             */
            this.getExtensionGroup = function (groupName) {
                return extensionGroups.hasOwnProperty(groupName) ? extensionGroups[groupName] : [];
            };

            this.getAllExtensionGroups = function () {
                return extensionGroups;
            };

            this.setAllExtensionGroups = function (groups) {
                extensionGroups = groups;
            };

            this.prepareExtensions = function () {
                _prepareExtensionGroups();
                return this;
            };

            /**
             * attachment service
             * @param urlService
             * @param $http
             * @param dialog
             * @param cmsTemplate
             * @param $q
             * @param generator
             * @param $timeout
             * @param Attachment
             * @param employeeService
             * @param _
             * @param $sce
             * @param rootEntity
             * @param correspondenceService
             * @param fileTypeService
             * @param tokenService
             * @param langService
             * @return {provider}
             */
            provider.$get = function (urlService,
                                      $http,
                                      dialog,
                                      cmsTemplate,
                                      $q,
                                      generator,
                                      $timeout,
                                      Attachment,
                                      employeeService,
                                      _,
                                      $sce,
                                      rootEntity,
                                      correspondenceService,
                                      fileTypeService,
                                      tokenService,
                                      langService) {
                'ngInject';
                var self = this;
                self.serviceName = 'attachmentService';

                self.attachments = [];

                var _getEmployeeDomainName = function () {
                    return employeeService.getEmployee().domainName;
                };

                /**
                 * @description generate attachment url for add and update
                 * @param document
                 * @return {*}
                 * @private
                 */
                function _generateAttachmentUrl(document) {
                    var documentClass = (document.hasOwnProperty('docClassName') ? document.docClassName : (document.hasOwnProperty('documentClass') ? document.documentClass : document.getInfo().documentClass)).toLowerCase();
                    var vsId = document.hasOwnProperty('vsId') ? document.vsId : false;
                    var url = null;
                    if (vsId && documentClass) {
                        url = urlService.attachments.replace('{{vsId}}', vsId).replace('{{documentClass}}', documentClass);
                    } else {
                        url = urlService.attachments.replace('/{{vsId}}', '').replace('{{documentClass}}', documentClass);
                    }
                    return url;
                }

                /**
                 * @description load attachments from server.
                 * @returns {Promise|attachments}
                 */
                self.loadDocumentAttachmentsByVsId = function (document) {
                    var url = _generateAttachmentUrl(document);
                    return $http.get(url).then(function (result) {
                        self.attachments = generator.generateCollection(result.data.rs, Attachment, self._sharedMethods);
                        self.attachments = generator.interceptReceivedCollection('Attachment', self.attachments);
                        return self.attachments;
                    });
                };
                /**
                 * load attachments for the document
                 * @param vsId
                 * @param documentClass
                 * @return {Promise|attachments}
                 */
                self.loadDocumentAttachments = function (vsId, documentClass) {
                    var document = {
                        vsId: vsId,
                        docClassName: documentClass
                    };
                    return self.loadDocumentAttachmentsByVsId(document);
                };

                self.loadG2GDocumentAttachmentsByActionId = function (g2gActionID) {
                    return $http.get(urlService.g2gAttachments.replace('{g2gActionID}', g2gActionID)).then(function (result) {
                        self.attachments = generator.generateCollection(result.data.rs, Attachment, self._sharedMethods);
                        self.attachments = generator.interceptReceivedCollection('Attachment', self.attachments);
                        return self.attachments;
                    });
                };

                self.checkAttachmentIsDeletable = function (documentInfo, attachment) {
                    // if create reply as attachment
                    if (attachment.createReplyDisableDelete) {
                        return false;
                    }
                    // if no vsId for document, means, document is not added yet. so user can edit/delete
                    else if (!documentInfo.vsId) {
                        return true;
                    }
                    return attachment.isDeletable;
                    /*var updateActionStatus = attachment.updateActionStatus;
                    if (attachment.updateActionStatus.hasOwnProperty('lookupKey')) {
                        updateActionStatus = updateActionStatus.lookupKey;
                    }
                    // if attachment is free to edit or edit by author of attachment, allow delete and edit
                    if (updateActionStatus === 0 || (updateActionStatus === 2 && attachment.createdBy === _getEmployeeDomainName())) {
                        return true;
                    }
                    var isApproved = !!(documentInfo.isPaper || documentInfo.docStatus >= 24);
                    return (updateActionStatus === 1 && !isApproved);*/
                };

                /**
                 * @description add new attachment to service
                 * @param document
                 * @param attachment
                 * @param callback
                 * @return {Promise|Attachment}
                 */
                self.addAttachment = function (document, attachment, callback) {
                    var url = _generateAttachmentUrl(document);
                    return $http({
                        url: url,
                        method: 'POST',
                        data: generator.interceptSendInstance('Attachment', attachment),
                        headers: {'Content-Type': undefined},
                        uploadEventHandlers: {
                            progress: function (e) {
                                if (callback) {
                                    callback(Math.floor((e.loaded * 100 / e.total)))
                                }
                            }
                        }
                    }).then(function (result) {
                        attachment.vsId = result.data.rs;
                        attachment.createdBy = _getEmployeeDomainName();
                        attachment.isDeletable = self.checkAttachmentIsDeletable(document, attachment);
                        attachment = generator.generateInstance(attachment, Attachment, self._sharedMethods);
                        attachment = generator.interceptReceivedInstance('Attachment', attachment);
                        return attachment;//generator.generateInstance(attachment, Attachment, self._sharedMethods);
                    })
                        .catch(function (error) {
                            return $q.reject(error);
                        });
                };
                /**
                 * add attachment to exists document
                 * @param vsId
                 * @param documentClass
                 * @param attachment
                 * @param callback
                 * @return {Promise|Attachment}
                 */
                self.addAttachmentWithVsId = function (vsId, documentClass, attachment, callback) {
                    // mock the document
                    var document = {
                        vsId: vsId,
                        docClassName: documentClass
                    };
                    return self.addAttachment(document, attachment, callback);
                };

                /**
                 * add attachment without vsId
                 * @param documentClass
                 * @param attachment
                 * @param callback
                 * @return {Promise|Attachment}
                 */
                self.addAttachmentWithOutVsId = function (documentClass, attachment, callback) {
                    var document = {
                        vsId: null,
                        docClassName: documentClass
                    };
                    return self.addAttachment(document, attachment, callback);
                };

                /**
                 * update current attachments keys for document
                 * @param vsId
                 * @param documentClass
                 * @param attachments
                 */
                self.updateAttachmentsByVsId = function (vsId, documentClass, attachments) {
                    var document = {
                        vsId: vsId,
                        docClassName: documentClass
                    };
                    var url = (_generateAttachmentUrl(document) + '/replace');
                    return $http.put(url, _.map(attachments, 'vsId')).then(function () {
                        return generator.generateCollection(attachments, Attachment, self._sharedMethods);
                    });
                };

                /**
                 * @description update attachment for existing document
                 * @param vsId
                 * @param documentClass
                 * @param attachment
                 * @param callback
                 * @return {Promise|Attachment}
                 */
                self.updateAttachmentForDocWithVsId = function (vsId, documentClass, attachment, callback) {
                    // mock the document
                    var document = {
                        vsId: vsId,
                        docClassName: documentClass
                    };
                    return self.updateAttachment(document, attachment, callback);
                };
                /**
                 * @description updates attachment for document without vsId
                 * @param documentClass
                 * @param attachment
                 * @param callback
                 * @return {Promise|Attachment}
                 */
                self.updateAttachmentForDocWithoutVsId = function (documentClass, attachment, callback) {
                    var document = {
                        vsId: null,
                        docClassName: documentClass
                    };
                    return self.updateAttachment(document, attachment, callback);
                };

                /**
                 * @description make an update for given attachment.
                 * @param document
                 * @param attachment
                 * @param callback
                 * @return {Promise|Attachment}
                 */
                self.updateAttachment = function (document, attachment, callback) {
                    var url = _generateAttachmentUrl(document) + '/update';
                    return $http({
                        url: url,
                        method: 'POST',
                        data: generator.interceptSendInstance('Attachment', attachment),
                        headers: {'Content-Type': undefined},
                        uploadEventHandlers: {
                            progress: function (e) {
                                if (callback) {
                                    callback(Math.floor((e.loaded * 100 / e.total)))
                                }
                            }
                        }
                    }).then(function (result) {
                        attachment.isDeletable = self.checkAttachmentIsDeletable(document, attachment);
                        attachment = generator.generateInstance(attachment, Attachment, self._sharedMethods);
                        attachment = generator.interceptReceivedInstance('Attachment', attachment);
                        return attachment;
                    })
                        .catch(function (error) {
                            return $q.reject(error);
                        });
                };
                /**
                 * @description delete given classification.
                 * @param vsId
                 * @param documentClass
                 * @param attachment
                 * @return {Promise}
                 */
                self.deleteAttachment = function (vsId, documentClass, attachment) {
                    return $http({
                        method: 'DELETE',
                        url: _generateAttachmentUrl({
                            vsId: vsId,
                            docClassName: documentClass
                        }) + '/delete',
                        data: generator.interceptSendInstance('AttachmentDelete', attachment),
                        headers: {
                            'Content-Type': 'application/json'
                        }
                    })
                };
                /**
                 * @description delete given classification.
                 * @return {Promise}
                 * @param vsId
                 * @param documentClass
                 * @param attachments
                 */
                self.deleteBulkAttachments = function (vsId, documentClass, attachments) {
                    return $http({
                        method: 'DELETE',
                        url: _generateAttachmentUrl({
                            vsId: vsId,
                            docClassName: documentClass
                        }) + '/delete/bulk',
                        data: generator.interceptSendCollection('AttachmentDelete', attachments),
                        headers: {
                            'Content-Type': 'application/json'
                        }
                    })
                };
                /**
                 * @description create the shred method to the model.
                 * @type {{delete: generator.delete, update: generator.update}}
                 * @private
                 */
                self._sharedMethods = generator.generateSharedMethods(self.deleteAttachment, self.updateAttachment);

                var _resolveFile = function (defer, file) {
                    $timeout(function () {
                        defer.resolve(file);
                    });
                };
                var rejectFile = function (defer, allowedExtensions) {
                    $timeout(function () {
                        defer.reject(allowedExtensions);
                    });
                };

                /**
                 * @description validate before upload extensions
                 * @param groupName
                 * @param file
                 * @param getResult
                 */
                self.validateBeforeUpload = function (groupName, file, getResult) {
                    var deferFileType = $q.defer();
                    fileTypeService.getDocumentFileTypes().then(function (result) {
                        deferFileType.resolve(result);
                    });
                    return deferFileType.promise.then(function (allFileTypes) {
                        var allowedExtensions = [];
                        if (groupName === 'scannerImport') {
                            allowedExtensions = provider.getExtensionGroup(groupName);
                        } else if (groupName === 'userSignature')
                            allowedExtensions = provider.getExtensionGroup(groupName);
                        else {
                            allowedExtensions = _.map(rootEntity.getGlobalSettings().fileType, function (allowed) {
                                var type = _.find(allFileTypes, function (fileType) {
                                    return fileType.id === allowed;
                                });
                                return type ? type.extension : null;
                            });
                            allowedExtensions = _.filter(allowedExtensions);
                        }
                        var extension = file.name.split('.').pop().toLowerCase();
                        var position = _.findIndex(allowedExtensions, function (ext) {
                            // I removed startsWith because not supported in IE 11 .
                            // Please Don't use it again in any where.
                            if (ext.indexOf('.') === 0)
                                ext = ext.split('.').pop();
                            return ext === extension;
                        });

                        if (getResult) {
                            return position !== -1;
                        }

                        var extensionDefer = $q.defer();
                        if (position !== -1) {
                            _resolveFile(extensionDefer, file);
                        } else {
                            rejectFile(extensionDefer, allowedExtensions.map(function (item) {
                                if (item.indexOf(".") !== 0)
                                    item = '.' + item;
                                return item
                            }));
                        }
                        return extensionDefer.promise;
                    });

                    /* var allowedExtensions = provider.getExtensionGroup(groupName), result = false;
                     var defer = $q.defer();

                     var extension = '.' + file.name.split('.').pop().toLowerCase();

                     var position = _.findIndex(allowedExtensions, function (item) {
                         return item === extension;
                     });

                     if (getResult) {
                         return position !== -1;
                     }

                     if (position !== -1) {
                         _resolveFile(defer, file);
                     } else {
                         rejectFile(defer, allowedExtensions);
                     }
                     return defer.promise;*/
                };

                /**
                 * @description validate bulk files before upload extensions
                 * @param groupName
                 * @param files
                 */
                self.validateBeforeUploadBulk = function (groupName, files) {
                    return fileTypeService.getDocumentFileTypes()
                        .then(function (allFileTypes) {
                            var allowedExtensions = [], allowedExtensionsWithDot = [], bulkResult = [], extension, position;
                            if (groupName === 'userSignature') {
                                allowedExtensions = provider.getExtensionGroup(groupName);
                            } else {
                                allowedExtensions = _.map(rootEntity.getGlobalSettings().fileType, function (allowed) {
                                    return _.find(allFileTypes, function (fileType) {
                                        return fileType.id === allowed;
                                    }).extension;
                                });
                            }
                            allowedExtensionsWithDot = allowedExtensions.map(function (item) {
                                if (item.indexOf(".") !== 0)
                                    item = '.' + item;
                                return item
                            });

                            for (var i = 0; i < files.length; i++) {
                                extension = files[i].name.split('.').pop().toLowerCase();
                                position = _.findIndex(allowedExtensions, function (ext) {
                                    if (ext.indexOf('.') === 0)
                                        ext = ext.split('.').pop();
                                    return ext === extension;
                                });
                                bulkResult.push(position !== -1);
                            }
                            return {result: bulkResult, allowedExtensions: allowedExtensionsWithDot};
                        });
                };

                /**
                 * @description open drag and drop dialog to upload files with drag&drop.
                 * @param correspondence
                 * @param attachment
                 * @param $event
                 * @return {promise}
                 */
                self.dragDropDialog = function (correspondence, attachment, $event) {
                    return dialog.showDialog({
                        templateUrl: cmsTemplate.getPopup('drag-drop-files'),
                        controller: 'dragDropPopCtrl',
                        controllerAs: 'ctrl',
                        targetEvent: $event || null,
                        locals: {
                            correspondence: correspondence,
                            attachment: attachment && attachment.vsId ? attachment : null,
                            attachmentCopy: angular.copy(attachment)
                        }
                    })
                };


                /**
                 * @description to create the url schema depend on document class and vsId if found.
                 * @param vsId
                 * @param documentClass
                 * @param extension
                 * @return {string}
                 * @private
                 */
                function _createUrlSchema(vsId, documentClass, extension) {
                    var url = [urlService.correspondence];
                    vsId = (vsId ? vsId : null);
                    documentClass = documentClass ? documentClass.toLowerCase() : null;
                    if (documentClass)
                        url.push(documentClass);
                    if (vsId)
                        url.push(vsId);
                    if (extension)
                        url.push(extension);
                    return url.join('/');
                }

                /**
                 * @description view attachment
                 * @param attachmentVsId
                 * @param documentClass
                 * @param justUrl
                 */
                self.viewAttachment = function (attachmentVsId, documentClass, justUrl) {
                    var vsId = attachmentVsId instanceof Attachment ? attachmentVsId.vsId : attachmentVsId;
                    /*return $http.get(_createUrlSchema(vsId, documentClass, 'attachment/with-content'))
                        .then(function (result) {
                            result.data.rs.metaData = generator.generateInstance(result.data.rs.metaData, Attachment);
                            return result.data.rs;
                        })*/
                    return self.loadAttachment(vsId, documentClass)
                        .then(function (attachment) {
                            return justUrl ? attachment.content.viewURL :
                                dialog.showDialog({
                                    templateUrl: cmsTemplate.getPopup('view-document-readonly'),
                                    controller: 'viewDocumentReadOnlyPopCtrl',
                                    controllerAs: 'ctrl',
                                    bindToController: true,
                                    escapeToCancel: false,
                                    locals: {
                                        document: attachment.metaData,
                                        content: attachment.content
                                    }
                                });
                        });
                };
                /**
                 * @description load attachment by vsId and documentClass.
                 * @param attachmentVsId
                 * @param documentClass
                 * @return {*}
                 */
                self.loadAttachment = function (attachmentVsId, documentClass) {
                    var vsId = attachmentVsId instanceof Attachment ? attachmentVsId.vsId : attachmentVsId;
                    return $http.get(_createUrlSchema(vsId, documentClass, 'attachment/with-content'))
                        .then(function (result) {
                            result.data.rs.metaData = generator.generateInstance(result.data.rs.metaData, Attachment);
                            result.data.rs.content.viewURL = $sce.trustAsResourceUrl(result.data.rs.content.viewURL);
                            return result.data.rs;
                        });
                };

                self.showAttachmentWithThumbnails = function (workItem, selectedImage, $event) {
                    return dialog
                        .showDialog({
                            controller: 'attachmentThumbnailPopCtrl',
                            templateUrl: cmsTemplate.getPopup('attachment-thumbnail'),
                            controllerAs: 'ctrl',
                            targetEvent: $event,
                            locals: {
                                thumbnails: workItem.thumbnails,
                                correspondence: workItem,
                                selectedThumb: selectedImage
                            },
                            resolve: {
                                attachment: function () {
                                    return self.loadAttachment(selectedImage.vsId, workItem.getInfo().documentClass);
                                }
                            }
                        });
                };

                /**
                 * @description Opens the dialog to select search template and fill mandatory information
                 * @param correspondence
                 * @param defaultAttachmentName
                 * @param $event
                 * @returns {promise}
                 */
                self.openIcnAttachmentOptionsDialog = function (correspondence, defaultAttachmentName, $event) {
                    return dialog
                        .showDialog({
                            controller: 'icnAttachmentOptionsPopCtrl',
                            templateUrl: cmsTemplate.getPopup('icn-attachment-options'),
                            controllerAs: 'ctrl',
                            targetEvent: $event,
                            locals: {
                                correspondence: correspondence,
                                defaultAttachmentName: defaultAttachmentName
                            },
                            resolve: {
                                icnSearchTemplates: function (dynamicMenuItemService) {
                                    'ngInject';
                                    return dynamicMenuItemService.loadUserMenuItemsByMenuType(dynamicMenuItemService.dynamicMenuItemsTypes.icnSearchTemplate)
                                        .then(function (result) {
                                            return _.filter(result, function (menu) {
                                                return !!menu.menuItem.status;
                                            })
                                        });
                                }
                            }
                        });
                };

                /**
                 * @description Opens the dialog with icn search template form
                 * @param correspondence
                 * @param attachment
                 * @param $event
                 * @returns {promise}
                 */
                self.openICNAttachmentDialog = function (correspondence, attachment, $event) {
                    var securityLevel = attachment.securityLevel && attachment.securityLevel.hasOwnProperty('lookupKey') ? attachment.securityLevel.lookupKey : attachment.securityLevel,
                        attachmentType = attachment.attachmentType && attachment.attachmentType.hasOwnProperty('lookupKey') ? attachment.attachmentType.lookupKey : attachment.attachmentType,
                        searchTemplate = attachment.searchTemplate.menuItem,
                        searchTemplateUrl = searchTemplate.hasOwnProperty('menuItem') ? searchTemplate.menuItem : searchTemplate,
                        updateActionStatus = attachment.updateActionStatus && attachment.updateActionStatus.hasOwnProperty('lookupKey') ? attachment.updateActionStatus.lookupKey : attachment.updateActionStatus;

                    securityLevel = securityLevel.hasOwnProperty('id') ? securityLevel.id : securityLevel;
                    searchTemplateUrl = searchTemplateUrl && searchTemplateUrl.hasOwnProperty('url') ? searchTemplateUrl.url : searchTemplateUrl;

                    //var variables = '%2C:token%2C:vsId%2C:attachmentType%2C:securityLevel%2C:attachmentName%2C:updateActionStatus%2C:locale'.change({
                    var variables = ['', 'token', 'vsId', 'attachmentType', 'securityLevel', 'attachmentName', 'updateActionStatus', 'locale'].join('%2C:').change({
                        token: tokenService.getToken(),
                        vsId: correspondence.getInfo().vsId,
                        attachmentType: attachmentType,
                        securityLevel: securityLevel,
                        attachmentName: attachment.documentTitle ? attachment.documentTitle : '',
                        locale: langService.current,
                        updateActionStatus: updateActionStatus
                    });
                    searchTemplateUrl = searchTemplateUrl.replace('&mimeType', variables + '&mimeType');

                    return dialog
                        .showDialog({
                            controller: 'icnAttachmentPopCtrl',
                            templateUrl: cmsTemplate.getPopup('icn-attachment'),
                            controllerAs: 'ctrl',
                            bindToController: true,
                            targetEvent: $event,
                            locals: {
                                correspondence: correspondence,
                                searchTemplateUrl: searchTemplateUrl
                            },
                            resolve: {
                                credentials: function (authenticationService) {
                                    'ngInject';
                                    return authenticationService.getUserData();
                                }
                            }
                        });
                };

                /**
                 * to get Service provider itself
                 * @return {*}
                 */
                self.getProvider = function () {
                    return provider;
                };
                /**
                 * download any document content by VsId
                 * @param vsId
                 * @returns {*}
                 */
                self.downloadDocumentContent = function (vsId) {
                    return $http
                        .get(urlService.downloadDocumentContent.replace('{vsId}', vsId), {
                            responseType: 'blob'
                        })
                        .then(function (result) {
                            return result.data;
                        });
                };

                _prepareExtensionGroups();
                return self;

            };


        }
    );
};
