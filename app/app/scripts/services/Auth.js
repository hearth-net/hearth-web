'use strict';

/**
 * @ngdoc service
 * @name hearth.services.Auth
 * @description
 */

angular.module('hearth.services').factory('Auth', [
	'$session', '$http', '$rootScope', '$q', 'LanguageSwitch', '$location',
	function($session, $http, $rootScope, $q, LanguageSwitch, $location) {
		var TOKEN_NAME = "authToken";

		return {
			init: function(callback) {
				$rootScope.user = {
					name: '',
					loggedIn: false
				};
				return $session.then(function(session) {
					if (session._id) {
						$rootScope.user = session;
						$rootScope.user.loggedIn = true;
						$rootScope.$broadcast('onUserLogin');
					}
					else {
						$rootScope.$broadcast('unathorizedUserLogin');
					}
					$rootScope.$broadcast('authorize');
					return callback();
				});
			},
			login: function(credentials, cb) {
				return $http.post($$config.apiPath + '/login', credentials, {nointercept: true}).then(cb, cb);
			},
			logout: function(cb) {
				return $session.then(function(session) {
					if (session._id) {
						delete session._id
					}
					$http.post($$config.apiPath + '/logout').success(cb).error(cb);
				}, function() {
					$http.post($$config.apiPath + '/logout').success(cb).error(cb);
				});
			},
			setToken: function (token) {
				$.cookie(TOKEN_NAME, token, { expires: 30 * 12 * 30 });
			},
			destroyLogin: function () {
				$.removeCookie(TOKEN_NAME);
				$rootScope.user.loggedIn = false;
			},
			isLoggedIn: function() {
				return $rootScope.user.loggedIn;
			},
			changePassword: function(password, success) {
				return $http.post($$config.apiPath + '/change-password', {
					password: password
				}).success(function(data) {
					return success(data);
				});
			},
			getCredentials: function() {
				return $rootScope.user.get_logged_in_user || {
					_id: null
				};
			},
			getCommunityCredentials: function() {
				return $rootScope.user.active_identity || null;
			},
			getBaseCredentials: function() {
				if ($rootScope.user._id) {
					return {
						_id: $rootScope.user._id,
						name: $rootScope.user.name
					};
				} else {
					return null;
				}
			},
			getSessionInfo: function() {
				return {
                    loggedUser: this.getCredentials(),
                    loggedEntity: this.getBaseCredentials(),
				}
			},
			confirmRegistration: function(hash, success, err) {
				return $http.post($$config.apiPath + '/users/confirm_registration', {
					'hash': hash
				}).success(function(data) {
					return success(data);
				}).error(function(data) {
					return err(data);
				});
			},
			completeTwitterRegistration: function(data, success, err) {
				return $http.put($$config.apiPath + '/users/email_for_twitter_users', data);
				// .success(success).error(err);
			},
			requestPasswordReset: function(email) {
				return $http.post($$config.apiPath + '/reset_password', {
					email: email
				});
			},
			checkResetPasswordToken: function(token, cb) {
				return $http.get($$config.apiPath + '/users/check_reset_password_token?token='+token).success(function(res) {
					return cb(res);
				}).error(function(res) {
					return cb(res);
				});
			},
			resetPassword: function(token, password, success, err) {
				return $http.put($$config.apiPath + '/reset_password', {
					token: token,
					password: password,
					confirm: password
				}).success(function(data) {
					return success(data);
				}).error(function(data) {
					return err(data);
				});
			},
			switchIdentity: function(identity) {
				var defer;
				defer = $q.defer();
				$http.post($$config.apiPath + '/session/switch_identity/', {id: identity}).success(function(data) {
					return defer.resolve(data);
				}).error(function(data) {
					return defer.reject(data);
				});
				return defer.promise;
			},
			processLoginResponse: function(data) {
				if(data.facebook_token)
					return $location.path('/fill-email/'+data.facebook_token);
				
				// when user logged, use his language configured on API
	            if(data.language)
	                LanguageSwitch.setCookie(data.language);

	            if(data.api_token) {
	                this.setToken(data.api_token);
	            }

	            window.location = window.location.pathname;
			},
			switchIdentityBack: function() {
				var defer;
				defer = $q.defer();
				$http.post($$config.apiPath + '/session/leave_identity').success(function(data) {
					return defer.resolve(data);
				}).error(function(data) {
					return defer.reject(data);
				});
				return defer.promise;
			},
			getTwitterAuthUrl: function() {
				var fillEmailUrl = $$config.appUrl +'#!/fill-email/%{token}';
				var twitterSuccessUrl  = $$config.appUrl +'#!/token-login/%{token}';
				return $$config.apiPath + '/users/auth/twitter?success_url='+encodeURIComponent(twitterSuccessUrl)+'&email_url='+encodeURIComponent(fillEmailUrl);
			},
		};
	}
]);