'use strict';

/**
 * @ngdoc controller
 * @name hearth.controllers.BaseCtrl
 * @description
 */

angular.module('hearth.controllers').controller('BaseCtrl', [
	'$scope', '$location', '$route', 'Auth',

	function($scope, $location, $route, Auth) {
		var timeout;

		$scope.topArrowText = {};
		$scope.isScrolled = false;

		$scope.showUI = function(ui) {
			$scope.$broadcast('showUI', ui);
		};
		$scope.logout = function() {
			Auth.logout(function() {
				window.location = window.location.pathname;
			});
		};
		$scope.search = function(text) {

			$location.path('/search');
			$location.search('q=' + (text || ""));
		};
		$scope.top = function() {
			$('html, body').animate({
				scrollTop: 0
			}, 1000);
		};

		$scope.$watch('user', function() {
			var user = $scope.user.get_logged_in_user;
			if (user && user.avatar.normal) {
				$scope.avatarExtraStyle = {
					'background-image': 'url(' + user.avatar.normal + ')'
				};
			} else {
				$scope.avatarExtraStyle = {
					'background-image': 'url(' + $$config.defaultUserImage + ')'
				};
			}
		});

		$scope.$on('$includeContentLoaded', function() {
			if (timeout) {
				clearTimeout(timeout);
			}
			timeout = setTimeout(function() {
				$(document).foundation();
			}, 1000);
		});

		angular.element(window).bind('scroll', function() {
			if ($(window).scrollTop() > 0 !== $scope.isScrolled) {
				$('html').toggleClass('scrolled');
				$scope.isScrolled = !$scope.isScrolled;
			}
		});
	}
]);