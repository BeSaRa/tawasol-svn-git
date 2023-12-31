module.exports = function (app) {
    app.service('generator', function (_,
                                       CMSModelInterceptor,
                                       tableGeneratorService,
                                       listGeneratorService,
                                       moment,
                                       $location,
                                       $q,
                                       $timeout,
                                       $sce) {
        'ngInject';
        var self = this, dialog, langService, toast, rootEntity;
        //TODO: This property is just added to show/hide feature according for demo build. It will be removed soon.
        self.isDemoBuild = false;

        self.selectedSearchCtrl = null;

        var popupNumber = 0;

        self.addPopupNumber = function () {
            ++popupNumber;
        };

        self.removePopupNumber = function () {
            --popupNumber;
        };

        self.getPopupNumber = function () {
            return popupNumber;
        };

        var megaByteToBytesValue = 1000000;
        self.convertMBtoBytes = function (megaByteValue) {
            return !megaByteValue ? megaByteValue : (megaByteToBytesValue * megaByteValue);
        };

        self.convertBytesToMB = function (bytesValue) {
            return !bytesValue ? bytesValue : (bytesValue / megaByteToBytesValue);
        };


        var documentClassMap = {
            OUTGOING: 1,
            INCOMING: 2,
            INTERNAL: 4
        };

        self.defaultDateFormat = 'YYYY-MM-DD';
        self.defaultDateTimeFormat = 'YYYY-MM-DD hh:mm:ss A';


        self.dayHours = _.range(0, 24);
        self.calenderHours = [];

        _.map(self.dayHours, function (hour) {
            var h = hour.toString().length === 1 ? '0' + hour : "" + hour;
            var hh = h + ':30';
            var remainingHour = (hour === 0 || hour > 12) ? (12 - hour) : hour;

            var hourValue = Math.abs(remainingHour);
            var AMPM = hour < 12 ? ' AM' : ' PM';

            self.calenderHours.push({
                hour: hour,
                min: 0,
                label: hourValue + ":00" + AMPM,
                value: h + ':00',
                compareValue: self.calenderHours.length
            });

            self.calenderHours.push({
                hour: hour,
                min: 30,
                label: hourValue + ":30" + AMPM,
                value: hh,
                compareValue: self.calenderHours.length
            });

        });

        self.months = [
            {
                text: 'january',
                value: 1
            },
            {
                text: 'february',
                value: 2
            },
            {
                text: 'march',
                value: 3
            },
            {
                text: 'april',
                value: 4
            },
            {
                text: 'may',
                value: 5
            },
            {
                text: 'june',
                value: 6
            },
            {
                text: 'july',
                value: 7
            },
            {
                text: 'august',
                value: 8
            },
            {
                text: 'september',
                value: 9
            },
            {
                text: 'october',
                value: 10
            },
            {
                text: 'november',
                value: 11
            },
            {
                text: 'december',
                value: 12
            }
        ];

        self.documentStatusAndGridMap = {
            UNDER_RECEIVE: 1,
            /**
             * @description Status = 2; Prepare/Scan (Correspondence)
             */
            META_DATA_ONLY: 2,
            /**
             * @description Status = 3; Draft Outgoing/Internal (Correspondence)
             */
            DRAFT: 3,
            COMPLETED: 4,
            EDIT_AFTER_AUTHORIZED: 5,
            EDIT_AFTER_EXPORTED: 6,
            /**
             * @description Status = 7; Rejected Outgoing/Incoming/Internal (Correspondence)
             */
            SENT_TO_RE_AUDIT: 7/* Rejected Books*/,
            /**
             * @description Status = 8; Ready To Send Outgoing/Incoming/Internal (Correspondence)
             */
            ACCEPTED: 8/*Ready for Sent*/,
            REMOVED: 9,
            CONTENT_ADDED: 10,
            CONTENT_UPDATED: 11,
            META_DATA_UPDATED: 12,
            ARCHIVED: 21,
            /**
             * @description Status = 22; User inbox (WorkItem)
             */
            SENT: 22,
            /**
             * @description Status = 23; User inbox (WorkItem); Number of times signed is less than signature count
             */
            PARTIALLY_AUTHORIZED: 23,
            /**
             * @description Status = 24; Ready To Export (WorkItem)
             */
            FULLY_AUTHORIZED: 24,
            /**
             * @description Status = 25; Department Incoming/Returned (WorkItem)
             */
            EXPORTED: 25,
            PARTIALLY_EXPORTED: 26,
            REPLY_BOOK_CREATED: 27,
            SENT_TO_READY_TO_EXPORT: 28
        };
        self.setDialog = function (dialogPass) {
            dialog = dialogPass;
        };

        self.setLangService = function (langPass) {
            langService = langPass;
        };
        self.setToast = function (toastPass) {
            toast = toastPass;
        };

        /**
         * intercept instance of model.
         * @param modelName
         * @param event
         * @param instance
         * @return {*}
         */
        var interceptInstance = function (modelName, event, instance) {
            return CMSModelInterceptor.runEvent(modelName, event, instance);
        };
        /**
         * intercept collection of models.
         * @param modelName
         * @param event
         * @param collection
         * @return {*}
         */
        var interceptCollection = function (modelName, event, collection) {
            for (var i = 0; i < collection.length; i++) {
                collection[i] = interceptInstance(modelName, event, collection[i]);
            }
            return collection;
        };
        /**
         * intercept hashMap of models.
         * @param modelName
         * @param event
         * @param hashMap
         * @return {*}
         */
        var interceptHashMap = function (modelName, event, hashMap) {
            for (var i in hashMap) {
                hashMap[i] = interceptCollection(modelName, event, hashMap[i]);
            }
            return hashMap;
        };
        /**
         *
         * @param modelName
         * @param collection
         * @return {*}
         */
        self.interceptSendCollection = function (modelName, collection) {
            return interceptCollection(modelName, 'send', _.cloneDeep(collection));
        };

        self.interceptSendInstance = function (modelName, model) {
            return interceptInstance(modelName, 'send', _.cloneDeep(model));
        };

        self.interceptReceivedCollection = function (modelName, collection) {
            return interceptCollection(modelName, 'received', collection);
        };

        self.interceptReceivedHashMap = function (modelName, hashMap) {
            return interceptHashMap(modelName, 'received', hashMap);
        };

        self.interceptReceivedInstance = function (modelName, model) {
            return interceptInstance(modelName, 'received', model);
        };
        /**
         * generate collection of given model
         * @param collection
         * @param model
         * @param sharedMethods
         * @returns {*}
         */
        self.generateCollection = function (collection, model, sharedMethods) {
            if (!angular.isArray(collection))
                return [];

            for (var i = 0; i < collection.length; i++) {
                collection[i] = self.generateInstance(collection[i], model, sharedMethods);
            }
            return collection;
        };

        self.generateHashMap = function (hashMap, model, sharedMethods) {
            for (var i in hashMap) {
                hashMap[i] = self.generateCollection(hashMap[i], model, sharedMethods);
            }
            return hashMap;
        };
        /**
         * generate instance of given model
         * @param instance
         * @param model
         * @param sharedMethods
         * @returns {*}
         */
        self.generateInstance = function (instance, model, sharedMethods) {
            return sharedMethods ? angular.extend(new model(instance), sharedMethods) : new model(instance);
        };
        /**
         * generate the shared method from delete and update methods
         * @param deleteMethod
         * @param updateMethod
         * @returns {{delete: generator.delete, update: generator.update}}
         */
        self.generateSharedMethods = function (deleteMethod, updateMethod) {
            return {
                delete: function () {
                    if (deleteMethod)
                        return deleteMethod(this);
                    else return null;
                },
                update: function () {
                    if (updateMethod)
                        return updateMethod(this);
                    else return null;
                }
            }
        };
        /**
         * create a new id from any collection
         * @param collection
         * @param key
         * @returns {number}
         */
        self.createNewID = function (collection, key) {
            var id = 0;
            if (collection.length > 0) {
                var maxResult = _(collection).map(key).max();
                id = (maxResult ? Number(maxResult) : 0) + 1;
            } else
                id += 1;

            return id;
        };

        /**
         * @description Find the control by name in given form
         * @param form
         * @param controlName
         * @returns {null|*}
         */
        self.getFormControlByName = function (form, controlName) {
            if (!form || !controlName) {
                return null;
            }
            return _.find(form.$$controls, function (control) {
                return control.$name && control.$name.toLowerCase() === controlName.toLowerCase();
            });
        };

        function _checkIfSelectFormControl(control) {
            // 0 property in object $$element is the control itself
            if (!control || !control.$$element || !control.$$element.hasOwnProperty('0')) {
                return false;
            }
            return control.$$element[0].tagName === 'MD-SELECT';
        }

        /**
         * @description Find the md-select controls in given form
         * @param form
         * @param filterRequired
         * if true, filters the md-select controls with required attribute
         * @returns {null|*}
         */
        self.getSelectFormControls = function (form, filterRequired) {
            if (!form || form.$$controls.length === 0) {
                return null;
            }
            return _.filter(form.$$controls, function (control) {
                if (!_checkIfSelectFormControl(control)) {
                    return false;
                }
                if (!filterRequired) {
                    return true;
                }

                return control.hasOwnProperty('$validators') && control.$validators.hasOwnProperty('required')
                    && (control.$$attr.required && control.$$attr.required === true);
            });
        };

        self.validateRequiredSelectFields = function (form, setTouched) {
            var selectControls = self.getSelectFormControls(form, true);
            if (selectControls) {
                _.map(selectControls, function (control) {
                    self.validateRequiredFieldValue(control, true, setTouched);
                });
            }
        };

        self.validateRequiredFieldValue = function (field, isRequired, setTouched) {
            if (!field)
                return;

            if (!isRequired) {
                field.$setValidity('required', true);
                return;
            }

            field.$setValidity('required', (typeof field.$modelValue !== 'undefined' && field.$modelValue !== null && field.$valid));
            if (setTouched) {
                field.$setTouched();
            }
        };

        /**
         * @description Returns the value of property by checking hasOwnProperty value
         * @param value
         * @param hasOwnPropertyName
         * @returns {*}
         */
        self.getNormalizedValue = function (value, hasOwnPropertyName) {
            if (typeof value === 'undefined' || typeof value !== 'object' || value === null || !hasOwnPropertyName) {
                return value;
            }
            return self.getNestedPropertyValue(value, hasOwnPropertyName);
        };

        /**
         * @description Gets the error message from error object based on current language
         * @param error
         * @returns {*}
         */
        self.getTranslatedError = function (error) {
            var errorObj = error.data.eo;
            return langService.current === 'ar' ? errorObj.arName : errorObj.enName;
        };

        self.changeBlobToTrustedUrl = function (blob, returnPromise) {
            var urlObj = window.URL.createObjectURL(blob);
            if (returnPromise) {
                return $q.resolve($sce.trustAsResourceUrl(urlObj));
            }
            return $sce.trustAsResourceUrl(urlObj);
        };

        /**
         * get some value from given collection and return object each key will have the selected value
         * @param collection
         * @param key
         * @param value
         * @returns {{key:value}}
         */
        self.getKeyValueFromCollection = function (collection, key, value) {
            var result = {};
            _.map(collection, function (item) {
                if (item.hasOwnProperty(key)) {
                    result[item[key]] = typeof item[value] === 'function' ? item[value]() : item[value];
                }
            });
            return result;
        };
        /**
         * get result of collection after sum given key
         * @param collection
         * @param key
         * @returns {*}
         */
        self.getResultFromSelectedCollection = function (collection, key) {
            return _.reduce(collection, function (prev, current, index) {
                return prev + collection[index][key];
            }, 0);
        };
        /**
         * @description just to fix the document class lookupKey Number
         * @param collection
         * @returns {*}
         */
        self.getResultFromSelectedCollectionDocumentClass = function (collection) {
            return _.reduce(collection, function (prev, next, index) {
                return prev + documentClassMap[collection[index]['lookupStrKey'].toUpperCase()];
            }, 0);
        };
        /**
         * just to fix the document class lookupKey Number
         * @param collection
         * @param result
         * @param key
         * @returns {Array}
         */
        self.getSelectedCollectionFromResultDocumentClass = function (collection, result, key) {
            var selected = [];
            result = !result ? 0 : result;
            var copyCollection = angular.copy(collection);
            _.map(copyCollection, function (item, index) {
                copyCollection[index][key] = documentClassMap[item.lookupStrKey.toUpperCase()];
            });
            for (var i = 0; i < copyCollection.length; i++) {
                if (copyCollection[i][key] <= result)
                    if ((copyCollection[i][key] & result) === copyCollection[i][key]) {
                        selected.push(copyCollection[i]);
                    }
            }
            return selected;
        };
        /**
         * get selected collection from given result
         * @param collection
         * @param result
         * @param key
         * @returns {Array}
         */
        self.getSelectedCollectionFromResult = function (collection, result, key) {
            var selected = [];
            result = !result ? 0 : result;
            for (var i = 0; i < collection.length; i++) {
                if (collection[i][key] <= result)
                    if ((collection[i][key] & result) === collection[i][key]) {
                        selected.push(collection[i]);
                    }
            }
            return selected;
        };
        /**
         * this method to check if the given args has value or not
         * note the 0 not defined as no value this means if value equal to 0 will pass and return true
         * @param value
         * @return {boolean}
         */
        self.validRequired = function (value) {
            return (
                (typeof value === 'string') ? (value.trim() !== '') : (value !== null && typeof value !== 'undefined')
            );
        };
        self.validRequiredArray = function (value) {
            return !!value.length
        }
        /**
         * check validation of required fields
         * @param model
         * @return {Array}
         */
        self.checkRequiredFields = function (model) {
            var required = model.getRequiredFields(), result = [];
            _.map(required, function (property) {
                if (!self.validRequired(model[property]) ||
                    (angular.isArray(model[property]) && !self.validRequiredArray(model[property])))
                    result.push(property);
            });
            return result;
        };
        /**
         * to display  error messages for tabs
         * @param title
         * @param fields
         * @param fieldsPositions
         * @param defaultTab
         */
        self.generateTabsError = function (title, fields, fieldsPositions, defaultTab) {
            var translateFields = _.map(fields, function (field) {
                return [
                    langService.get(fieldsPositions.hasOwnProperty(field) ? fieldsPositions[field].lang : 'field'),
                    (fieldsPositions[field].hasOwnProperty('tab') ? langService.get(fieldsPositions[field].tab) : defaultTab)
                ];
            });
            var table = tableGeneratorService.createTable([langService.get('field'), langService.get('tab_location')], 'error-table');
            table.createTableRows(translateFields);
            dialog.validationErrorMessage(title, table.getTable(true));
        };
        /**
         * for display error messages that without tabs
         * @param title
         * @param fields
         * @param isLabelText
         */
        self.generateErrorFields = function (title, fields, isLabelText) {
            var list = listGeneratorService.createList('ul', 'error-list');
            _.map(fields, function (field) {
                if (isLabelText)
                    list.addItemToList(field);
                else
                    list.addItemToList(langService.get(field));
            });

            var titleTemplate = angular.element('<div><span class="validation-title">' + langService.get(title) + '</span></div>');
            titleTemplate.append(list.getList());
            dialog.errorMessage(titleTemplate.html());
        };

        /**
         * @description Displays error messages for failed bulk action
         * @param title
         * @param records
         */
        self.generateFailedBulkActionRecords = function (title, records) {
            var list = listGeneratorService.createList('ul', 'error-list');
            _.map(records, function (record) {
                list.addItemToList(record);
            });


            var titleTemplate = angular.element('<div><span class="validation-title">' + langService.get(title) + '</span></div>');
            titleTemplate.append(list.getList());
            dialog.errorMessage(titleTemplate.html());
        };

        /**
         * @description Gets the list of items which failed in bulk action
         * @param itemsList
         * @param resultCollection
         * @param bulkPropertyKey
         * @returns {[]}
         * @private
         */
        function _getFailedItems(itemsList, resultCollection, bulkPropertyKey) {
            var failureCollection = [], currentIndex = 0;

            if (!bulkPropertyKey) {
                _.map(resultCollection, function (value) {
                    if (!value)
                        failureCollection.push(itemsList[currentIndex]);
                    currentIndex++;
                });
            } else {
                _.map(resultCollection, function (value, key) {
                    if (!value) {
                        var failedItem = _.find(itemsList, function (item) {
                            var itemValueByProperty = self.getNormalizedValue(item, bulkPropertyKey);
                            if (!itemValueByProperty) {
                                return false;
                            }
                            return itemValueByProperty.toString() === key.toString();
                        });
                        failureCollection.push(failedItem);
                    }
                });
            }
            return failureCollection;
        }

        /**
         * @description Shows the response of bulk action.
         * @param  {Array.<*>} resultCollection
         * @param {Array.<*>} selectedItems
         * @param  {boolean} ignoreMessage
         * @param  {string} errorMessage
         * @param {string} successMessage
         * @param {string} failureSomeMessage
         * @returns {*}
         */
        self.getBulkActionResponse = function (resultCollection, selectedItems, ignoreMessage, errorMessage, successMessage, failureSomeMessage, bulkPropertyKey) {
            if (ignoreMessage) {
                return selectedItems;
            }

            resultCollection = resultCollection.hasOwnProperty('data') ? resultCollection.data.rs : resultCollection;

            var failureCollection = _getFailedItems(selectedItems, resultCollection, bulkPropertyKey);

            if (failureCollection.length === 0) {
                toast.success(langService.get(successMessage));
            } else {
                if (failureCollection.length === selectedItems.length) {
                    toast.error(langService.get(errorMessage));
                } else {
                    self.generateFailedBulkActionRecords(failureSomeMessage, _.map(failureCollection, function (item) {
                        return item.getTranslatedName();
                    }));
                }
            }
        };

        /**
         * @description Replaces the values of disabled fields in case user changes value of disable field
         * @param record
         * @param originalRecord
         * @param fields
         * @param setNull
         * @returns {record}
         */
        self.replaceWithOriginalValues = function (record, originalRecord, fields, setNull) {
            if (typeof fields === "string") {
                record[fields] = setNull ? null : originalRecord[fields];
            } else {
                for (var i = 0; i < fields.length; i++) {
                    record[fields[i]] = setNull ? null : originalRecord[fields[i]];
                }
            }
            return record;
        };

        self.preserveProperties = function (properties, current, override) {
            var attributes = {}, older = angular.copy(current), newer = angular.copy(override);
            var i = 0;
            // loop throw the current object and store the preserved properties to attributes.
            for (; i < properties.length; i++) {
                if (current.hasOwnProperty(properties[i]))
                    attributes[properties[i]] = angular.copy(older[properties[i]]);
            }
            i = 0;
            for (; i < properties.length; i++) {
                newer[properties[i]] = attributes[properties[i]];
            }
            return newer;
        };
        /**
         * @description Reset the model after making any changes
         * @param model
         * @param defaultModel
         */
        self.resetFields = function (model, defaultModel) {
            _.map(model, function (value, key) {
                model[key] = angular.copy(defaultModel[key]);
            });
        };
        /**
         * @description upper case first letter.
         * @param string
         * @returns {string}
         */
        self.ucFirst = function (string) {
            return string.charAt(0).toUpperCase() + string.slice(1);
        };
        /**
         * to check if the model has any changes or not
         * @param oldModel
         * @param newModel
         * @returns {boolean}
         */
        self.modelHasChanges = function (oldModel, newModel) {
            return !angular.equals(angular.toJson(oldModel), angular.toJson(newModel));
        };
        /**
         * to check duplicate itemOrder for any model
         * @param model
         * @param collection
         * @param edit
         * @returns {boolean}
         */
        self.checkDuplicateItemOrder = function (model, collection, edit) {
            var result = _.find(collection, function (item) {
                return Number(model.itemOrder) === Number(item.itemOrder)
            });

            return result ? !(edit && (result && result.id === model.id)) : false;
        };
        /**
         * to check the if fields ony number or not
         * @param model
         * @param fields
         * @returns {boolean}
         */
        self.checkNameNumbers = function (model, fields) {
            if (!angular.isArray(fields))
                fields = [fields];

            return _.some(_.map(fields, function (field) {
                return /^\d+$/.test(model[field]);
            }), function (item) {
                return item === true;
            });
        };

        /**
         * @description Compares the collections status(active/inactive) against the passed status value.
         * @param collection
         * Collection of records to check the status
         * @param status
         * Active/Inactive
         * @param statusField
         * The name of the field to check the status from record of collection. By default, it checks 'status' field
         * @returns {boolean}
         * Returns false, if the collection contains all records with same status.
         * Returns true, if the collection contains any record with different status
         */
        self.checkCollectionStatus = function (collection, status, statusField) {
            return _.some(_.map(collection, function (model) {
                return model[!statusField ? 'status' : statusField];
            }), function (item) {
                return item !== status;
            });
        };
        /**
         * @description get document class by document type number.
         * @param docType
         * @param reverse to get from document class name the int number
         * @return {*}
         */
        self.getDocumentClassName = function (docType, reverse) {
            var documentClass = {
                0: 'outgoing',
                1: 'incoming',
                2: 'internal'
            };
            return reverse ? Object.values(documentClass).indexOf(docType.toLowerCase()) : documentClass[Number(docType)];
        };


        /**
         * @description Get the sorting key for information or lookup model
         * @param property
         * @param modelType
         * @param overrideSortingKey
         * @returns {*}
         */
        self.getColumnSortingKey = function (property, modelType, overrideSortingKey) {
            modelType = modelType.toLowerCase();
            if (overrideSortingKey)
                return property + '.' + overrideSortingKey;
            else if (modelType === 'information' || modelType === 'adminresultrelation' || modelType === 'documenttype' || modelType === 'workflowaction' || modelType === 'senderinfo' ||
                modelType === 'attachmenttype' || modelType === 'organization' || modelType === 'correspondencesite' || modelType === 'wforganization')
                return property + '.' + (langService.current === 'ar' ? 'arName' : 'enName');
            else if (modelType === 'lookup')
                return property + '.' + (langService.current === 'ar' ? 'defaultArName' : 'defaultEnName');
            else if (modelType === 'lookupg2g')
                return property + '.' + (langService.current === 'ar' ? 'arvalue' : 'envalue');
            else if (modelType === 'applicationuser')
                return property + '.' + (langService.current === 'ar' ? 'arFullName' : 'enFullName');
            return property;
        };

        /**
         * @description Get the unique number
         * @returns {string}
         */
        self.getUniqueIdentifier = function () {
            return (new Date().valueOf()).toString();
        };

        /**
         * @description Change the passed time unit value to milliseconds
         * @param hours
         * @param minutes
         * @param seconds
         * @returns {number}
         */
        self.convertToMilliseconds = function (hours, minutes, seconds) {
            // if hours or minutes available, change to seconds
            hours = hours ? (hours * 60 * 60) : 0;
            minutes = minutes ? (minutes * 60) : 0;
            seconds = seconds || 0;
            return ((hours + minutes + seconds) * 1000);
        };

        /**
         * @description Gets the date in default format
         * @param timeStamp
         * @param dateAndTime
         * @returns {string | null}
         */
        self.getDateFromTimeStamp = function (timeStamp, dateAndTime) {
            if (timeStamp) {
                // in case of long numbers, they will be having L at last. so remove L and change timeStamp to moment date.
                timeStamp = Number(timeStamp.toString().split('L')[0]);
                return moment(timeStamp).format(dateAndTime ? self.defaultDateTimeFormat : self.defaultDateFormat);
            }
            return null;
        };

        /**
         * @description Gets the date in default format
         * @param timeStamp
         * @param startOfDay
         * @param endOfDay
         * @returns {Date | null }
         */
        self.getDateObjectFromTimeStamp = function (timeStamp, startOfDay, endOfDay) {
            /*if (timeStamp) {
                // in case of long numbers, they will be having L at last. so remove L and change timeStamp to moment date.
                timeStamp = Number(timeStamp.toString().split('L')[0]);
                return moment(timeStamp).format(dateAndTime ? self.defaultDateTimeFormat : self.defaultDateFormat);
            }
            return null;*/
            if (timeStamp) {
                if (!isNaN(timeStamp)) {
                    // in case of long numbers, they will be having L at last. so remove L and change timeStamp to moment date.
                    timeStamp = Number(timeStamp.toString().split('L')[0]);
                    if (endOfDay) {
                        return moment(timeStamp).endOf('day').toDate();
                    } else if (startOfDay) {
                        return moment(timeStamp).startOf('day').toDate();
                    }
                    return moment(timeStamp).toDate();
                }
                return timeStamp;
            }
            return null;
        };

        /**
         * @description Gets the time from timeStamp
         * @param timeStamp
         * @param isTwentyFourHour
         * @returns {string | null}
         */
        self.getTimeFromTimeStamp = function (timeStamp, isTwentyFourHour) {
            if (timeStamp) {
                // in case of long numbers, they will be having L at last. so remove L and change timeStamp to moment time.
                timeStamp = Number(timeStamp.toString().split('L')[0]);
                return moment(timeStamp).format(isTwentyFourHour ? 'HH:mm' : 'hh:mm A');
            }
            return null;
        };

        /**
         * @description Gets timeStamp from the provided date
         * @param date
         * @param addL
         * @returns {string | null}
         */
        self.getTimeStampFromDate = function (date, addL) {
            if (date) {
                date = moment(date, self.defaultDateFormat).valueOf();
                return addL ? date + 'L' : date;
            }
            return null;
        };

        /**
         * @description Converts the date to string using provided string format or default date format
         * @param date
         * @param format
         * @returns {string}
         */
        self.convertDateToString = function (date, format) {
            if (date) {
                date = typeof date === 'string' ? new Date(date) : date;
                format = format || self.defaultDateFormat;
                return moment(date).format(format);
            }
            return "";
        };

        /**
         * @description Gets the difference in days between given dates
         * @param date1
         * @param date2
         * If not given, date1 will be compared with today
         * @param skipTime
         * If true, dates will be compared regardless of time
         * @returns {string|number}
         */
        self.getNumberOfDays = function (date1, date2, skipTime) {
            if (!date1) {
                return '';
            }
            date1 = moment(date1);
            date2 = date2 ? moment(date2) : moment();
            if (skipTime) {
                date1 = date1.startOf('day');
                date2 = date2.startOf('day');
            }
            return -(date1.diff(date2, 'days'));
        };

        self.getFutureDate = function (daysToAdd) {
            var date = new Date();
            date.setDate(date.getDate() + ((daysToAdd ? Number(daysToAdd) : 0) || 0));
            return date;
        };

        /**
         * @description Deletes all the properties from the model which ends with given string
         * @param record
         * @param propertyEndsWith
         */
        self.deletePropertiesFromRecord = function (record, propertyEndsWith) {
            for (var property in record) {
                if (_.endsWith(property, propertyEndsWith)) {
                    delete record[property];
                }
            }
        };

        self.filterSecurityLevels = function (collection, available) {
            var lookupKeys = available ? _.map(available, 'lookupKey') : _.map(rootEntity.getGlobalSettings().securityLevels, 'lookupKey');
            return _.filter(collection, function (item) {
                return lookupKeys.indexOf(item.lookupKey) !== -1;
            });
        };
        self.setRootEntityService = function (service) {
            rootEntity = service;
            return this;
        };

        /**
         * @description Checks if the string is a valid json
         * @param str
         * @returns {boolean}
         */
        self.isJsonString = function (str) {
            try {
                JSON.parse(str);
            } catch (e) {
                return false;
            }
            return true;
        };

        /**
         * @description Deletes property/properties from the model
         * @param record
         * @param property
         */
        self.getNestedPropertyValue = function (record, property) {
            var recordCopy = angular.copy(record);
            return _getPropertyValue(recordCopy, property);
        };

        var _getPropertyValue = function (record, property) {
            if (!record)
                return null;

            if (property.indexOf('.') > -1) {
                var arr = property.split('.');
                for (var i = 0; i < arr.length; i++) {
                    var prop = arr.shift();
                    return self.getNestedPropertyValue(record[prop], arr.join('.'))
                }
            } else {
                if (typeof record === 'string' || typeof record === 'number')
                    return record;
                return record[property];
            }
        };

        /**
         * @description Checks if the browser popup is blocked
         * @param window
         */
        self.checkIfBrowserPopupBlocked = function (window) {
            // alert to user if popup is blocked in browser settings
            if (!window || window.closed || typeof window.closed == 'undefined') {
                var domain = $location.protocol() + "://" + $location.host() + ":" + $location.port() + "/";
                dialog.infoMessage("Popup is blocked. Please allow the popup in browser settings for <b>" + domain + "</b>");
            }
        };


        /**
         * @description Gets the message to display for book lock
         * @param workItem
         * @param error
         * @returns {*}
         */
        self.getBookLockMessage = function (workItem, error) {
            var message = langService.get('book_locked_by_user_date');
            if (!!workItem) {
                message = message.change({
                    user: workItem.getLockingUserInfo().getTranslatedName(),
                    date: workItem.getLockingUserDateTime()
                })
            } else {
                message = message.change({
                    user: error.data.eo.lockingUserInfo[langService.current + 'Name'],
                    date: self.getDateFromTimeStamp(error.data.eo.lockingTime, true)
                })
            }
            return message;
        };

        /**
         * @description Gets the extension of given file object.
         * Url will not work
         * @param file
         * @param includeDot
         * @returns {string|null}
         */
        self.getFileExtension = function (file, includeDot) {
            if (!file || !file.name) {
                return null;
            }
            var extension = file.name.split('.').pop().toLowerCase();
            if (includeDot) {
                extension = '.' + extension;
            }
            return extension;
        };


        /**
         * @description reselect rows when change page if table lazy loading
         * @param selectedRows
         * @param tableName
         * @param key
         * @param isMagazineView
         * @returns {boolean}
         */
        self.selectedRowsHandler = function (selectedRows, tableName, key, isMagazineView) {
            if (!tableName || !selectedRows || !selectedRows.length) {
                return false;
            }
            $timeout(function () {
                var rows = (isMagazineView) ?
                    document.querySelector('#' + tableName + ' div#magazineLayout').getElementsByClassName('magazine-item') :
                    document.querySelector('table#' + tableName).getElementsByTagName('tr');

                rows.forEach(item => {
                    var selectedIndex = _.findIndex(selectedRows, function (selectedItem) {
                        return self.getNestedPropertyValue(selectedItem, key).toString() === item.getAttribute('data-key');
                    });
                    if (selectedIndex !== -1) {
                        var md_checkbox = (isMagazineView) ?
                            item.getElementsByClassName('magazine-image')[0].getElementsByTagName('md-checkbox')[0] :
                            item.getElementsByTagName('td')[0].getElementsByTagName('md-checkbox')[0];
                        selectedRows.splice(selectedIndex, 1);
                        $(md_checkbox).click();
                    }
                });
            });
        }
    })
};
