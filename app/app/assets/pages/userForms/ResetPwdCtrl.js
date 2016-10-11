'use strict';

/**
 * @ngdoc controller
 * @name hearth.controllers.ResetPwdCtrl
 * @description 
 */

angular.module('hearth.controllers').controller('ResetPwdCtrl', [
	'$scope', 'Auth', '$location', 'Notify',
	function($scope, Auth, $location, Notify) {
		$scope.token = true;
		$scope.sent = false;
		$scope.tokenVerified = false;

		$scope.data = {
			password: '',
			password2: '',
		};

		$scope.showError = {
			topError: false,
			password: false,
			password2: false,
			passwordMatch: false
		};

		$scope.validateData = function(data) {
			var invalid = false;

			if ($scope.resetPasswordForm.password.$invalid) {
				invalid = $scope.showError.password = true;
			}

			if ($scope.resetPasswordForm.password2.$invalid) {
				invalid = $scope.showError.password2 = true;
			} else if (data.password !== data.password2) {
				$scope.showError.password2 = true;
				invalid = $scope.showError.passwordMatch = true;
			}

			return !invalid;
		};


		/**
		 * This will reset users password, throw notify and refresh him on /login page
		 */
		$scope.resetPassword = function(data) {
			$scope.showError.topError = false;
			if (!$scope.validateData(data))
				return false;

			function onSuccess() {
				Notify.addSingleTranslate('NOTIFY.NEW_PASS_SUCCESS', Notify.T_SUCCESS);
				$location.url("/login");
			}

			return Auth.resetPassword($scope.token, data.password, onSuccess);
		};

		/**
		 * Check on api if given token is valid
		 */
		$scope.validateToken = function(token) {

			// if token is not given, then show message
			if (!token)
				return $scope.tokenVerified = true;
			else {

				// if token is given, check api
				Auth.checkResetPasswordToken(token, function(res) {
					if (!res.ok) {
						// if not valid, set him to false
						$scope.token = false;
					}
					$scope.tokenVerified = true;
				});
			}
		}

		// check token code if is valid
		$scope.init = function() {
			$scope.token = $location.search().hash;
			$scope.validateToken($scope.token);
		};

		$scope.init();
	}
]);