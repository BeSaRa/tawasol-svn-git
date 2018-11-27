module.exports = function (app) {
    app.factory('errorCode', function ($q) {
        'ngInject';

        var errorCodes = {
            EMPTY_RESULT: 2014,
            CAN_NOT_DELETE_LOOKUP: 3014,
            WORK_ITEM_NOT_FOUND: 2043,
            FAILED_DELETE_DOCUMENT: 2034,
            ITEM_LOCKED: 2058,
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
            CANNOT_EDIT_AFTER_EXPORT_DUE_TO_RECEIVED_G2G_INTERNAL_G2G_OLD_SYSTEM_CORRESPONDENCE_SITES: 3023,
            CANNOT_RECALL_OPENED_BOOK: 3031,
            CANNOT_RECALL_NON_EXISTING_BOOK: 2016,
            CANNOT_ADD_SUBSCRIPTION_SAME_USER_SAME_BOOK: 3032,
            G2G_ERROR_FETCH_SENT_OR_RETURN_BOOK: 14001,
            G2G_USER_NOT_AUTHENTICATED: 14002,
            G2G_CAN_NOT_RECEIVE_RECALLED_DOCUMENT: 14003,
            G2G_CANNOT_RECALL_FROM_THIS_SITE_BECAUSE_THE_STATUS_IS_NOT_PENDING_OR_SENT: 14004,
            G2G_CANNOT_REMOVE_TRANSACTION_FOR_THIS_SITE_BECAUSE_THE_STATUS_IS_NOT_REJECTED_OR_RETURNED: 14005,
            G2G_BOOK_PROPERTIES_CAN_NOT_BE_EMPTY: 14010,
            G2G_USER_NOT_AUTHORIZED: 14013,
            G2G_ERROR_WHILE_SENDING: 14015,
            G2G_ERROR_WHILE_RECEIVING: 14016,
            G2G_ERROR_WHILE_RETURNING_TO_SENDER: 14026,
            G2G_ERROR_WHILE_RECALLING: 14027,
            G2G_ERROR_WHILE_TERMINATE: 14028,
            NO_DOCUMENT_SECURITY: 13006,
            FAIL_DUPLICATION: 2053,
            INVALID_REFERENCE_FORMAT: 3025,
            // entity connection errors
            SEC_LDAP_ADDING_ENTITY: 13008,
            SEC_LDAP_OU_NOT_AVAILABLE: 13009,
            SEC_LDAP_INVALID_SERVER_ADDRESS: 13010,
            SEC_LDAP_INVALID_OP: 13011,
            SEC_ERROR_USER_UN_AUHTORIZED_FOR_SERVICE: 13012
            // entity connection errors end
        };

        return {
            checkIf: function (error, errorCode, callback) {
                var code = error.hasOwnProperty('data') && error.data ? error.data.ec : error;
                if (code === errorCodes[errorCode]) {
                    if (callback)
                        return callback();
                    return true;
                }
                return $q.reject(error);
            },
            /**
             * @description to check if the error code exists or not
             * @param error
             * @return {boolean}
             */
            hasErrorCode: function (error) {
                var code = error.hasOwnProperty('data') && error.data ? error.data.ec : error;
                return Object.values(errorCodes).indexOf(code) !== -1;
            }
        }
    })
};