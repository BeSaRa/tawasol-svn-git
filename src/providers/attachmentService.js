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
         * @param _
         * @param $sce
         * @param rootEntity
         * @param correspondenceService
         * @param fileTypeService
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
                                  _,
                                  $sce,
                                  rootEntity,
                                  correspondenceService,
                                  fileTypeService) {
            'ngInject';
            var self = this;
            self.serviceName = 'attachmentService';

            self.attachments = [];

            /**
             * @description generate attachment url for add and update
             * @param document
             * @return {*}
             * @private
             */
            function _generateAttachmentUrl(document) {
                var documentClass = (document.hasOwnProperty('docClassName') ? document.docClassName : documentClass).toLowerCase();
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
                    var updateActionStatus = attachment.updateActionStatus.hasOwnProperty('lookupKey') ? attachment.updateActionStatus.lookupKey : attachment.updateActionStatus;
                    if (updateActionStatus === 0 || updateActionStatus === 2) {
                        attachment.isDeletable = true;
                    }
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
             * add attachment without
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
             * @description make an update for given attachment.
             * @param attachment
             * @return {Promise|Attachment}
             */
            self.updateAttachment = function (attachment) {
                return $http
                    .put(urlService.attachments,
                        generator.interceptSendInstance('Attachment', attachment))
                    .then(function () {
                        return generator.generateInstance(attachment, Attachment, self._sharedMethods);
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

            /* self.viewAttachment = function (attachment, $event) {
                 dialog.showDialog({
                     template: cmsTemplate.getPopup('view-attachment'),
                     targetEvent: $event || false,
                     locals: {
                         attachment: attachment
                     },
                     controller: 'viewAttachmentPopCtrl',
                     controllerAs: 'ctrl'
                 });
             };*/


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
                    if (groupName === 'userSignature')
                        allowedExtensions = provider.getExtensionGroup(groupName);
                    else
                        allowedExtensions = _.map(rootEntity.getGlobalSettings().fileType, function (allowed) {
                            return _.find(allFileTypes, function (fileType) {
                                return fileType.id === allowed;
                            }).extension;
                        });

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
                            if (!item.startsWith("."))
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
             * @description open drag and drop dialog to upload files with drag&drop.
             * @param correspondence
             * @param $event
             * @return {promise}
             */
            self.dragDropDialog = function (correspondence, $event) {
                return dialog.showDialog({
                    template: cmsTemplate.getPopup('drag-drop-files'),
                    controller: 'dragDropPopCtrl',
                    controllerAs: 'ctrl',
                    targetEvent: $event || null,
                    locals: {
                        correspondence: correspondence
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
                                template: cmsTemplate.getPopup('view-document-readonly'),
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
             * @description load attchemnt by vsId and documentClass.
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
                        template: cmsTemplate.getPopup('attachment-thumbnail'),
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
             * to get Service provider itself
             * @return {*}
             */
            self.getProvider = function () {
                return provider;
            };

            _prepareExtensionGroups();
            return self;

        };


    });
};
