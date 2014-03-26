'use strict';

angular.module('hearth.controllers').controller('CommunityRegisterCtrl', [
	'$scope', '$window', 'CommunityService', 'ResponseErrors', '$location', '$timeout', 'ipCookie',
	function($scope, $window, CommunityService, ResponseErrors, $location, $timeout, ipCookie) {
		$scope.community = {};
		$scope.createCommunity = function($event) {
			if (!$scope.createCommunityForm.$invalid) {
				return CommunityService.add($scope.community).then(function(data) {
					ipCookie('newCommunityCreated', true);
					return $timeout(function() {
						return $window.location.reload();
					});
				}, function(err) {
					$scope.errors = new ResponseErrors(err);
					return $scope.errors;
				});
			}
		};
		return $scope.createCommunity;
	}
]);