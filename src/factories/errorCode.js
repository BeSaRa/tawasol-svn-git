module.exports = function (app) {
    app.factory('errorCode', function ($q) {
        'ngInject';

        var errorCodes = {
            EMPTY_RESULT: 2014,
            CAN_NOT_DELETE_LOOKUP: 3014,
            WORK_ITEM_NOT_FOUND: 2043,
            ENTITY_NOT_FOUND: 12000,
            AUTHORIZE_FAILED: 3008,
            ROOT_ENTITY_NOT_FOUND: 1001,
            FILE_NOT_ALLOWED: 2041,
            SIZE_EXTENSION_NOT_ALLOWED: 2006,
            DUPLICATE_ENTRY: 1008,
            INACTIVE_USER_ENTITY: 9016,
            PASSWORD_EMPTY: 9017,
            NO_USER_TO_BROADCAST: 3018,
            PRINT_BARCODE_ERROR_NO_BARCODE_ELEMENT: 3019,
            CANNOT_RECALL_OPENED_BOOK: 3031,
            CANNOT_RECALL_NON_EXISTING_BOOK: 2016,
            CANNOT_ADD_SUBSCRIPTION_SAME_USER_SAME_BOOK: 3032,
            G2G_BOOK_PROPERTIES_CAN_NOT_BE_EMPTY: 14000,
            G2G_USER_NOT_AUTHORIZED_TO_RECALL: 14001,
            G2G_ERROR_WHILE_RECALLING: 14002,
            G2G_ERROR_WHILE_RETURNING_TO_SENDER: 14003,
            G2G_ERROR_WHILE_RECEIVING: 14004
        };

        return {
            checkIf: function (error, errorCode, callback) {
                var code = error.hasOwnProperty('data') ? error.data.ec : error;
                if (code === errorCodes[errorCode]) {
                    if (callback)
                        return callback();
                    return true;
                }
                return $q.reject(error);
            }
        }
    })
};