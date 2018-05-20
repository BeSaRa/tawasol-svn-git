module.exports = function (app) {
    app.factory('LinkedObject', function (CMSModelInterceptor,
                                          langService,
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
            // ['name', 'mobileNumber', 'description', 'email', 'address', 'typeId'];
            // every model has required fields
            // if you don't need to make any required fields leave it as an empty array
            var requiredFields = [],
                linkedTypes = {
                    EXTERNAL_USER: {
                        typeId: {
                            required: true
                        },
                        fullNameAr: {
                            required: true
                        },
                        fullNameEn: {
                            required: true
                        },
                        qid: {
                            required: true
                        },
                        nationality: {
                            required: false
                        },
                        mobileNumber: {
                            required: true
                        },
                        description: {
                            required: false
                        },
                        email: {
                            required: false
                        },
                        address: {
                            required: false
                        }
                    },
                    EMPLOYEE: {
                        typeId: {
                            required: true
                        },
                        fullNameAr: {
                            required: true
                        },
                        fullNameEn: {
                            required: true
                        },
                        qid: {
                            required: true
                        },
                        employeeNum: {
                            required: true,
                            customValidation: {
                                type: 'number',
                                message: 'numberonly'
                            }
                        },
                        mobileNumber: {
                            required: true,
                            customValidation: {
                                type: 'number',
                                message: 'numberonly'
                            }
                        },
                        description: {
                            required: false
                        },
                        email: {
                            required: false,
                            customValidation: {
                                type: 'email',
                                message: 'invalid_email'
                            }
                        },
                        address: {
                            required: false
                        }
                    },
                    COMPANY: {
                        typeId: {
                            required: true
                        },
                        name: {
                            required: true
                        },
                        crNumber: {
                            required: true
                        },
                        mobileNumber: {
                            required: true,
                            customValidation: {
                                type: 'number',
                                message: 'numberonly'
                            }
                        },
                        description: {
                            required: false
                        },
                        email: {
                            required: false
                        },
                        address: {
                            required: false
                        }
                    },
                    OTHER: {
                        typeId: {
                            required: true
                        },
                        name: {
                            required: true
                        },
                        mobileNumber: {
                            required: true
                        },
                        description: {
                            required: false
                        },
                        email: {
                            required: false
                        },
                        address: {
                            required: false
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

            // don't remove CMSModelInterceptor from last line
            // should be always at last thing after all methods and properties.
            CMSModelInterceptor.runEvent('LinkedObject', 'init', this);
        }
    })
};