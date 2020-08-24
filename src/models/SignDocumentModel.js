module.exports = function (app) {
    app.factory('SignDocumentModel', function (CMSModelInterceptor) {
        'ngInject';
        return function SignDocumentModel(model) {
            var self = this;
            self.bookVsid = null;
            self.signatureVsid = null;
            self.wobNum = null;
            self.authorizeAsComposite = false;
            self.pinCode = null;
            self.dueDate = null;
            self.comments = null;
            self.validateMultiSignature = true;
            self.seqWFId = null;

            // every model has required fields
            // if you don't need to make any required fields leave it as an empty array
            var requiredFields = [];

            if (model)
                angular.extend(this, model);

            /**
             * get all required fields
             * @return {Array|requiredFields}
             */
            SignDocumentModel.prototype.getRequiredFields = function () {
                return requiredFields;
            };
            /**
             * @description set signature for
             * @param workItem
             * @param signature
             * @returns {*}
             */
            SignDocumentModel.prototype.setSignature = function (workItem, signature) {
                var info = workItem.getInfo();
                return this
                    .setBookVsid(info.vsId)
                    .setWobNum(info.wobNumber)
                    .setSignatureVsid(signature);
            };

            SignDocumentModel.prototype.setIsComposite = function (value) {
                this.authorizeAsComposite = value;
                return this;
            };

            SignDocumentModel.prototype.setValidateMultiSignature = function (value) {
                this.validateMultiSignature = value;
                return this;
            };

            SignDocumentModel.prototype.setPinCode = function (value) {
                this.pinCode = value;
                return this;
            };

            SignDocumentModel.prototype.setBookVsid = function (bookVsid) {
                this.bookVsid = bookVsid;
                return this;
            };
            SignDocumentModel.prototype.setSignatureVsid = function (signatureVsid) {
                this.signatureVsid = signatureVsid && signatureVsid.hasOwnProperty('vsId') ? signatureVsid.vsId : signatureVsid;
                return this;
            };
            SignDocumentModel.prototype.setWobNum = function (wobNum) {
                this.wobNum = wobNum;
                return this;
            };

            SignDocumentModel.prototype.setDueDate = function (dueDate) {
                this.dueDate = dueDate;
                return this;
            };

            SignDocumentModel.prototype.setComments = function (comments) {
                this.comments = comments;
                return this;
            };

            SignDocumentModel.prototype.setSeqWFId = function (seqWFId) {
                this.seqWFId = seqWFId;
                return this;
            };
            // don't remove CMSModelInterceptor from last line
            // should be always at last thing after all methods and properties.
            CMSModelInterceptor.runEvent('SignDocumentModel', 'init', this);
        }
    })
};
