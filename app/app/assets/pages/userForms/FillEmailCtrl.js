'use strict';

/**
 * @ngdoc controller
 * @name hearth.controllers.FillEmailCtrl
 * @description 
 */

angular.module('hearth.controllers').controller('FillEmailCtrl', [
	'$scope', 'Auth', '$location', 'ResponseErrors', 'Email', 'Notify', '$stateParams',
	function($scope, Auth, $location, ResponseErrors, Email, Notify, $stateParams) {
		$scope.twitter_token = false;
		$scope.data = {
			email: '',
			language: preferredLanguage
		};
		$scope.showError = {
			email: false
		};

		$scope.errors = new ResponseErrors();

		$scope.testEmailExists = function(email, form, inputName, cb) {

			$scope[form][inputName].$error.used = false;
			// dont check when email is blank
			if (!email) return false;

			// Check if email is in our DB
			Email.exists({
				email: email
			}, function(res) {
				if (res.ok) {
					// show error when email does not exist
					$scope.showError.email = true;
					$scope[form][inputName].$error.used = true;
				}
				// call callbeck
				cb && cb(res.ok);
			}, function(res) {
				if (res.ok) {
					$scope.showError.email = true;
					$scope[form][inputName].$error.used = true;
					return cb && cb(true);
				}

				cb && cb(false);
			});
		};

		$scope.validateEmail = function(form, cb) {
			$scope.showError.email = true;
			$scope.fillEmailForm.email.$error.used = false;

			// if form is not valid, return false
			if ($scope.fillEmailForm.email.$error.email) {
				cb && cb(true);
			} else {
				// else test if email exists
				$scope.testEmailExists(form.email, 'fillEmailForm', 'email', cb);
			}
		};

		$scope.fillEmail = function() {
			if ($scope.sending)
				return false;
			$scope.sending = true;

			// is email valid?
			$scope.validateEmail($scope.data, function(res) {
				if (res) {
					return $scope.sending = false;
				}

				return Auth.completeEmailForRegistration($scope.data, function() { // success
					$scope.sending = false;
					Notify.addSingleTranslate('NOTIFY.COMPLETE_TWITTER_REGISTRATION_SUCCESS', Notify.T_SUCCESS);
					$scope.hideForm();

				}, function(err, status) { // error
					$scope.sending = false;
					$scope.errors = new ResponseErrors({
						status: status,
						data: err
					});

					if ($scope.errors.email) {

						$scope.fillEmailForm.email.$error.used = true;
						$scope.showError.email = true;
					}
				});
			});
		};

		$scope.hideForm = function() {
			$(".register-login-form").slideUp('slow', function() {});
			$(".register-successful").slideDown('slow', function() {});
		};


		$scope.data.email_token = $stateParams.token;
	}
]);