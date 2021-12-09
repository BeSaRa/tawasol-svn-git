module.exports = function (app) {
    app.factory('Validation', function ($q, $timeout) {
        'ngInject';
        /**
         * Validation
         * @param name
         * @param validationArray
         * @constructor
         */
        return function Validation(name, validationArray) {

            this.name = name;
            this.id = (validationArray.length + 1);
            this.steps = [];
            this.defer = $q.defer();
            this.promisesValue = {};
            this.currentStep = 0;
            /**
             * the default validation success
             * @param result
             * @returns {boolean}
             */
            Validation.prototype.defaultSuccess = function (result) {
                return result.error === false;
            };
            /**
             * add step to validation object
             * @param name
             * @param require
             * @param callback
             * @param args
             * @param success
             * @param arrayOfArgs
             * @returns {Validation}
             */
            Validation.prototype.addStep = function (name, require, callback, args, success, arrayOfArgs) {

                this.steps.push({
                    name: name,
                    require: require,
                    callback: callback,
                    args: args,
                    success: success || this.defaultSuccess,
                    arrayOfArgs: arrayOfArgs || false
                });
                return this;
            };

            /**
             * run the current validation
             */
            Validation.prototype.resolveTheCurrentStep = function () {
                var me = this;
                // get the current step validation
                var step = this.steps[me.currentStep];
                // get the next step validation if found
                var nextStep = me.steps[me.currentStep + 1] || false;
                // get the args
                // if args is function then the user don't provide args.
                if (typeof step.args === 'function') {
                    step.success = step.args;
                    step.args = null;
                }


                var callback = me.steps[me.currentStep].callback;

                // if callback function
                if (typeof callback === 'function') {
                    callback = callback.apply(me, step.arrayOfArgs ? step.args : [step.args]);
                }

                // if callback  after fired not a promise
                if (!callback || typeof callback.then !== 'function') {
                    callback = $q.when(callback);
                }

                // start call the current call back validation
                callback.then(function (result) {
                    if (step.require && !step.success(result, me.promisesValue)) {
                        // fail and require

                        me.promisesValue[step.name] = result;
                        step.result = result;

                        if (step.wehnFailure) {
                            step.wehnFailure(step, result, me.promisesValue, me.defer);
                        }

                        me.defer.reject({
                            result: me.promisesValue,
                            step: step
                        });

                    } else if (!step.require && !step.success(result, me.promisesValue)) {
                        // fail but not require
                        me.promisesValue[step.name] = result;

                        if (step.wehnFailure) {
                            step.wehnFailure(step, result, me.promisesValue, me.defer);
                        }

                        if (!nextStep) {
                            me.defer.resolve(me.promisesValue);
                        } else {
                            ++me.currentStep;
                            me.resolveTheCurrentStep();
                        }
                    } else {
                        // success
                        me.promisesValue[step.name] = result;

                        if (step.whenSuccess) {
                            step.whenSuccess(step, result, me.promisesValue, me.defer);
                        }

                        if (!nextStep) {
                            me.defer.resolve(me.promisesValue);
                        } else {
                            ++me.currentStep;
                            me.resolveTheCurrentStep();
                        }
                    }
                });
            };

            /**
             * start validate steps
             * @param steps
             */
            Validation.prototype.validateSteps = function (steps) {
                if (!steps.length) {
                    this.defer.reject({
                        step: null,
                        reason: 'NO_STEPS_FOUND_TO_VALIDATE'
                    });
                }
                this.resolveTheCurrentStep();
            };

            Validation.prototype.notify = function (successFun, failFunction) {
                var step = this.steps[this.steps.length - 1];

                if (typeof successFun === 'function') {
                    step.whenSuccess = successFun;
                }

                if (typeof failFunction === 'function') {
                    step.wehnFailure = failFunction;
                }
                return this;
            };
            /**
             * notify when step success
             * @param successFun
             * @returns {Validation}
             */
            Validation.prototype.notifySuccess = function (successFun) {
                this.notify(successFun);
                return this;
            };
            /**
             * notify when step Failure
             * @param failureFunc
             * @returns {Validation}
             */
            Validation.prototype.notifyFailure = function (failureFunc) {
                this.notify(null, failureFunc);
                return this;
            };
            /**
             *  start run the validation
             * @returns {*}
             */
            Validation.prototype.validate = function () {
                var me = this;
                $timeout(function () {
                    me.validateSteps(me.steps);
                });
                return this.defer.promise;
            };
        }
    })
};