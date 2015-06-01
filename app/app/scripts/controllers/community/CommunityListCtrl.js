'use strict';

/**
 * @ngdoc controller
 * @name hearth.controllers.CommunityListCtrl
 * @description 
 */
 
angular.module('hearth.controllers').controller('CommunityListCtrl', [
	'$scope', '$rootScope', 'CommunityMemberships', 'Community', 'UnauthReload',
	function($scope, $rootScope, CommunityMemberships, Community, UnauthReload) {
		$scope.randomCommunities = [];
		$scope.loaded = false;
		// my communities are loaded already in BaseCtrl for top navigation

		$scope.fetchRandomCommunities = function() {
			
			Community.suggested({}, function(res) {
				$scope.randomCommunities = res;
				$scope.loaded = true;
			});
		};

		$scope.toggleForm = function() {
			$(".community-list-add-button").slideToggle();
			$(".community-list-add-form").toggle();
		};

		$scope.init = function() {

			UnauthReload.check();
			$scope.fetchRandomCommunities();
		};

		$scope.$on('initFinished', $scope.init);
		$rootScope.initFinished && $scope.init();
	}
]);