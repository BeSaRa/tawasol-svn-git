module.exports = function (app) {
    app.service('generator', function (_,
                                       CMSModelInterceptor,
                                       tableGeneratorService,
                                       listGeneratorService,
                                       moment) {
        'ngInject';
        var self = this, dialog, langService, toast;
        var documentClassMap = {
            OUTGOING: 1,
            INCOMING: 2,
            INTERNAL: 4
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
            if (collection.length > 0)
                id = _(collection).map(key).max() + 1;
            else
                id += 1;

            return id;
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
                return prev + documentClassMap[collection[index]['lookupStrKey']];
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
                copyCollection[index][key] = documentClassMap[item.lookupStrKey];
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
        /**
         * check validation of required fields
         * @param model
         * @return {Array}
         */
        self.checkRequiredFields = function (model) {
            var required = model.getRequiredFields(), result = [];
            _.map(required, function (property) {
                if (!self.validRequired(model[property]))
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
                    langService.get(fieldsPositions[field].lang),
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
        /*
         /!**
         * @description Displays error messages for failed bulk delete records
         * @param title
         * @param records
         *!/
         self.generateFailedToDeletedRecords = function (title, records) {
         var list = listGeneratorService.createList('ul', 'error-list');
         _.map(records, function (record) {
         list.addItemToList(record);
         });


         var titleTemplate = angular.element('<div><span class="validation-title">' + langService.get(title) + '</span></div>');
         titleTemplate.append(list.getList());
         dialog.errorMessage(titleTemplate.html());
         };*/

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
         * @description Shows the response of bulk action.
         * @param  {Array.<*>} resultCollection
         * @param {Array.<*>} selectedItems
         * @param  {boolean} ignoreMessage
         * @param  {string} errorMessage
         * @param {string} successMessage
         * @param {string} failureSomeMessage
         * @returns {*}
         */
        self.getBulkActionResponse = function (resultCollection, selectedItems, ignoreMessage, errorMessage, successMessage, failureSomeMessage) {
            resultCollection = resultCollection.hasOwnProperty('data') ? resultCollection.data.rs : resultCollection;
            var failureCollection = [];
            var currentIndex = 0;
            _.map(resultCollection, function (value) {
                if (!value)
                    failureCollection.push(selectedItems[currentIndex]);
                currentIndex++;
            });

            if (!ignoreMessage) {
                if (failureCollection.length === selectedItems.length) {
                    toast.error(langService.get(errorMessage));
                } else if (failureCollection.length) {
                    self.generateFailedBulkActionRecords(failureSomeMessage, _.map(failureCollection, function (item) {
                        return item.getTranslatedName();
                    }));
                } else {
                    toast.success(langService.get(successMessage));
                }
            }
            return selectedItems;
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
            }
            else {
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
                model[key] = defaultModel[key];
            });
            //console.log("RESET MODEL");
        };
        /**
         * @description upper case first letter.
         * @param string
         * @returns {string}
         */
        self.ucFirst = function (string) {
            return string.charAt(0).toUpperCase() + string.slice(1).toLowerCase();
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

        self.checkCollectionStatus = function (collection, status, field) {
            return _.some(_.map(collection, function (model) {
                return model[!field ? 'status' : field];
            }), function (item) {
                return item !== status;
            });
        };
        /**
         * @description get document class by document type number.
         * @param docType
         * @return {*}
         */
        self.getDocumentClassName = function (docType) {
            var documentClass = {
                0: 'outgoing',
                1: 'incoming',
                2: 'internal'
            };
            return documentClass[Number(docType)];
        };


        /**
         * @description Get the sorting key for information or lookup model
         * @param property
         * @param modelType
         * @returns {*}
         */
        self.getColumnSortingKey = function (property, modelType) {
            modelType = modelType.toLowerCase();
            if (modelType === 'information' || modelType === 'documenttype' || modelType === 'workflowaction' || modelType === 'senderinfo')
                return property + '.' + (langService.current === 'ar' ? 'arName' : 'enName');
            else if (modelType === 'lookup')
                return property + '.' + (langService.current === 'ar' ? 'defaultArName' : 'defaultEnName');
            return property;
        };

        self.defaultDateFormat = 'YYYY-MM-DD';
        /**
         * @description Gets the date in default format
         * @param timestamp
         * @returns {string | null}
         */
        self.getDateFromTimeStamp = function (timestamp) {
            if (timestamp) {
                // in case of long numbers, they will be having L at last. so remove L and change timestamp to moment date.
                timestamp = Number(timestamp.toString().split('L')[0]);
                return moment(timestamp).format(self.defaultDateFormat);
            }
            return null;
        };

        /**
         * @description Gets timestamp from the provided date
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
    })
};