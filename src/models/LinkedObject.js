module.exports = function (app) {
    app.factory('LinkedObject', function (CMSModelInterceptor,
                                          langService,
                                          rootEntity,
                                          _) {
        'ngInject';
        return function LinkedObject(model) {
            var self = this;
            self.name = null;
            self.mobileNumber = null;
            self.description = null;
            self.email = null;
            self.address = null;
            self.qid = null;
            self.fullNameAr = null;
            self.fullNameEn = null;
            self.nationality = null;
            self.employeeNum = null;
            self.crNumber = null;

            self.typeId = null;
            // will be used by backend but will not be returned
            self.xsendSMS = rootEntity.getGlobalSettings().isLegacySMSCorNotification();
            self.xsmsTemplateId = null;
            self.xJobRank = null;
            self.xJobTitle = null;
            self.xOU = null;

            // ['name', 'mobileNumber', 'description', 'email', 'address', 'typeId'];
            // every model has required fields
            // if you don't need to make any required fields leave it as an empty array
            var requiredFields = [],
                linkedTypes = {
                    EXTERNAL_USER: {
                        typeId: {
                            required: true,
                            fieldIdentifier: 'typeId'
                        },
                        qid: {
                            required: true,
                            customValidation: {
                                type: 'number',
                                message: 'numberonly'
                            },
                            fieldIdentifier: 'qid'
                        },
                        fullNameAr: {
                            required: true,
                            customValidation: {
                                type: 'AN_DOT_DASH',
                                message: 'one_arabic_number_space'
                            },
                            fieldIdentifier: 'arabicName'
                        },
                        fullNameEn: {
                            required: true,
                            customValidation: {
                                type: 'EN_DOT_DASH',
                                message: 'one_english_number_space'
                            },
                            fieldIdentifier: 'englishName'
                        },
                        nationality: {
                            required: false,
                            customValidation: {
                                type: 'AES',
                                message: 'arabic_english_space'
                            },
                            fieldIdentifier: 'nationality'
                        },
                        mobileNumber: {
                            required: true,
                            customValidation: {
                                type: 'number',
                                message: 'numberonly'
                            },
                            fieldIdentifier: 'mobile'
                        },
                        description: {
                            required: false,
                            fieldIdentifier: 'description'
                        },
                        email: {
                            required: false,
                            customValidation: {
                                type: 'email',
                                message: 'invalid_email'
                            },
                            fieldIdentifier: 'email'
                        },
                        address: {
                            required: false,
                            fieldIdentifier: 'address'
                        },
                        xsendSMS: {
                            required: false,
                            fieldIdentifier: 'xsendSMS',
                            manualDisplay: true
                        },
                        xsmsTemplateId: {
                            required: false,
                            fieldIdentifier: 'xsmsTemplateId',
                            manualDisplay: true
                        }
                    },
                    EMPLOYEE: {
                        typeId: {
                            required: true,
                            fieldIdentifier: 'typeId'
                        },
                        fullNameAr: {
                            required: true,
                            customValidation: {
                                type: 'AN_DOT_DASH',
                                message: 'one_arabic_number_space'
                            },
                            fieldIdentifier: 'arabicName'
                        },
                        fullNameEn: {
                            required: false,
                            customValidation: {
                                type: 'EN_DOT_DASH',
                                message: 'one_english_number_space'
                            },
                            fieldIdentifier: 'englishName'
                        },
                        qid: {
                            required: false,
                            customValidation: {
                                type: 'number',
                                message: 'numberonly'
                            },
                            fieldIdentifier: 'qid'
                        },
                        employeeNum: {
                            required: true,
                            customValidation: {
                                type: 'EN',
                                message: 'english_number'
                            },
                            fieldIdentifier: 'employeeNumber'
                        },
                        mobileNumber: {
                            required: false,
                            customValidation: {
                                type: 'number',
                                message: 'numberonly'
                            },
                            fieldIdentifier: 'mobile'
                        },
                        description: {
                            required: false,
                            fieldIdentifier: 'description'
                        },
                        email: {
                            required: false,
                            customValidation: {
                                type: 'email',
                                message: 'invalid_email'
                            },
                            fieldIdentifier: 'email'
                        },
                        address: {
                            required: false,
                            fieldIdentifier: 'address'
                        },
                        xJobRank: {
                            required: false,
                            fieldIdentifier: 'jobRank'
                        },
                        xJobTitle: {
                            required: false,
                            fieldIdentifier: 'jobTitle'
                        },
                        xOU: {
                            required: false,
                            fieldIdentifier: 'ou'
                        }
                    },
                    COMPANY: {
                        typeId: {
                            required: true,
                            fieldIdentifier: 'typeId'
                        },
                        name: {
                            required: true,
                            customValidation: {
                                type: 'AE_DOT_DASH',
                                message: 'arabic_english'
                            },
                            fieldIdentifier: 'name'
                        },
                        crNumber: {
                            required: true,
                            customValidation: {
                                type: 'number',
                                message: 'numberonly'
                            },
                            fieldIdentifier: 'crNumber'
                        },
                        mobileNumber: {
                            required: true,
                            customValidation: {
                                type: 'number',
                                message: 'numberonly'
                            },
                            fieldIdentifier: 'mobile'
                        },
                        description: {
                            required: false,
                            fieldIdentifier: 'description'
                        },
                        email: {
                            required: false,
                            customValidation: {
                                type: 'email',
                                message: 'invalid_email'
                            },
                            fieldIdentifier: 'email'
                        },
                        address: {
                            required: false,
                            fieldIdentifier: 'address'
                        }
                    },
                    OTHER: {
                        typeId: {
                            required: true,
                            fieldIdentifier: 'typeId'
                        },
                        name: {
                            required: true,
                            customValidation: {
                                type: 'AE_DOT_DASH',
                                message: 'arabic_english'
                            },
                            fieldIdentifier: 'name'
                        },
                        mobileNumber: {
                            required: true,
                            customValidation: {
                                type: 'number',
                                message: 'numberonly'
                            },
                            fieldIdentifier: 'mobile'
                        },
                        description: {
                            required: false,
                            fieldIdentifier: 'description'
                        },
                        email: {
                            required: false,
                            customValidation: {
                                type: 'email',
                                message: 'invalid_email'
                            },
                            fieldIdentifier: 'email'
                        },
                        address: {
                            required: false,
                            fieldIdentifier: 'address'
                        }
                    }
                },
                defaultTypes = [
                    'EXTERNAL_USER',
                    'EMPLOYEE',
                    'COMPANY'
                ];

            if (model)
                angular.extend(this, model);

            /**
             * get all required fields
             * @return {Array|requiredFields}
             */
            LinkedObject.prototype.getRequiredFields = function () {
                return requiredFields;
            };

            LinkedObject.prototype.getLinkedTypeFields = function (linkedType) {
                var type = this.getType(linkedType);
                return defaultTypes.indexOf(type) === -1 ? linkedTypes.OTHER : linkedTypes[type];
            };

            LinkedObject.prototype.preparedType = function () {
                var self = this;
                var properties = this.getLinkedTypeFields(this.typeId);
                var array = Object.keys(properties);
                _.map(self, function (item, key) {
                    if (array.indexOf(key) === -1 && typeof self[key] !== 'function') {
                        delete self[key];
                    }
                });
                return this;
            };

            LinkedObject.prototype.getType = function (linkedType) {
                return linkedType.hasOwnProperty('lookupStrKey') ? linkedType.lookupStrKey : linkedType;
            };

            LinkedObject.prototype.getTranslatedName = function () {
                var position = defaultTypes.indexOf(this.getType(this.typeId));
                var self = this;
                var currentLang = langService.current === 'ar' ? 'Ar' : 'En', name = null;
                switch (position) {
                    case 0:
                    case 1:
                        name = self['fullName' + currentLang];
                        break;
                    default:
                        name = self.name;
                        break;
                }
                return name;
            };

            /**
             * @description Gets the name of the linked object in any language
             * @returns {*}
             */
            LinkedObject.prototype.getName = function () {
                var position = defaultTypes.indexOf(this.getType(this.typeId));
                var self = this;
                var currentLang = langService.current === 'ar' ? 'Ar' : 'En',
                    currentLangReverse = langService.current === 'ar' ? 'En' : 'Ar',
                    name = null;
                switch (position) {
                    case 0:
                    case 1:
                        name = self['fullName' + currentLang] || self['fullName' + currentLangReverse];
                        break;
                    default:
                        name = self.name;
                        break;
                }
                return name;
            };

            LinkedObject.prototype.isEmployeeType = function () {
                var typeId = this.typeId.hasOwnProperty('lookupKey') ? this.typeId.lookupKey : this.typeId;

                return typeId === 0;
            }

            // don't remove CMSModelInterceptor from last line
            // should be always at last thing after all methods and properties.
            CMSModelInterceptor.runEvent('LinkedObject', 'init', this);
        }
    })
};
