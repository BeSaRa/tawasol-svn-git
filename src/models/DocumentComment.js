module.exports = function (app) {
    app.factory('DocumentComment', function (CMSModelInterceptor,
                                             moment,
                                             _,
                                             generator,
                                             langService) {
        'ngInject';
        return function DocumentComment(model) {
            var self = this, documentCommentService,
                exportData = {
                    comments_description: 'description',
                    created_by: function () {
                        return this.createorInfo.getTranslatedName();
                    },
                    comments_creation_date: function () {
                        return generator.getDateFromTimeStamp(this.creationDate)
                    },
                    document_subject: function () {
                        return this.correspondence.title
                    },
                    serial_number: function () {
                        return this.correspondence.docFullSerial
                    },
                    comment_date: function () {
                        return moment(this.correspondence.createdOn).format('YYYY-MM-DD');
                    }
                };

            self.id = null;
            self.shortDescription = null;
            self.description = null;
            self.documentVSID = null;
            self.creationDate = null;
            self.creator = null;
            self.documentVersion = '';
            self.isGlobal = true; // default value
            self.isPrivate = false; // default value
            self.withSubOUs = false; // default value
            self.isPerOU = false; // default value
            self.includedIDs = [];
            self.excludedIDs = [];
            self.includedList = [];
            self.excludedList = [];

            // every model has required fields
            // if you don't need to make any required fields leave it as an empty array
            var requiredFields = [
                'shortDescription',
                'description',
                'documentVSID',
                'isGlobal',
                'isPrivate',
                'withSubOUs',
                'isPerOU'
            ];

            if (model)
                angular.extend(this, model);


            DocumentComment.prototype.setDocumentCommentService = function (service) {
                documentCommentService = service;
                return this;
            };
            /**
             * get all required fields
             * @return {Array|requiredFields}
             */
            DocumentComment.prototype.getRequiredFields = function () {
                return requiredFields;
            };
            /*DocumentComment.prototype.commentPrivate = function () {
                return !this.isGlobal && this.isPrivate;
            };
            DocumentComment.prototype.commentGlobal = function () {
                return this.isGlobal && !this.isPrivate;
            };*/
            DocumentComment.prototype.commentPrivate = function () {
                return this.isPrivate;
            };
            DocumentComment.prototype.commentGlobal = function () {
                return this.isGlobal;
            };

            DocumentComment.prototype.commentCustomize = function () {
                return !this.isPrivate && !this.isGlobal;
            };

            // DocumentComment.prototype.setPrivacy = function (privacy) {
            //     var properties = ['isGlobal', 'isPrivate'];
            //     var self = this;
            //     privacy = ('is' + privacy.charAt(0).toUpperCase() + privacy.substr(1));
            //     _.map(properties, function (property) {
            //         self[property] = (property === privacy);
            //     });
            //     return this;
            // };
            // DocumentComment.prototype.setGlobal = function () {
            //     return this.setPrivacy('global');
            // };
            // DocumentComment.prototype.setPrivate = function () {
            //     return this.setPrivacy('private');
            // };
            // DocumentComment.prototype.togglePrivacy = function () {
            //     return this.commentGlobal() ? this.setPrivate() : this.commentGlobal();
            // };
            DocumentComment.prototype.getPrivacyStatus = function () {
                return this.commentPrivate() ? langService.get('yes') : langService.get('no');
            };
            DocumentComment.prototype.getGlobalizationStatus = function () {
                return this.commentGlobal() ? langService.get('yes') : langService.get('no');
            };
            DocumentComment.prototype.setCreator = function (creator) {
                this.creator = creator;
                return this;
            };
            DocumentComment.prototype.setCreationDate = function () {
                this.creationDate = moment().valueOf();
                return this;
            };
            DocumentComment.prototype.setVsId = function (vsId) {
                this.documentVSID = vsId;
                return this;
            };
            DocumentComment.prototype.setDescription = function (description){
                this.description = description;
                return this;
            }
            DocumentComment.prototype.setShortDescription = function (shortDescription){
                this.shortDescription = shortDescription;
                return this;
            }
            DocumentComment.prototype.getPerOUStatus = function () {
                return this.isPerOU ? langService.get('comments_organizations') : langService.get('comments_users');
            };

            DocumentComment.prototype.update = function () {
                return documentCommentService.updateDocumentComment(this);
            };

            DocumentComment.prototype.delete = function () {
                return documentCommentService.deleteDocumentComment(this);
            };

            DocumentComment.prototype.getExportedData = function () {
                return exportData;
            };

            // don't remove CMSModelInterceptor from last line
            // should be always at last thing after all methods and properties.
            CMSModelInterceptor.runEvent('DocumentComment', 'init', this);
        }
    })
};
