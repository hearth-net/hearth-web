'use strict';

angular.module('hearth.services').factory('UserRatings', [
	'$resource',
	function($resource) {
		return $resource($$config.apiPath + '/users/:userId/ratings', {
			userId: '@id'
		}, {
			add: {
				method: 'POST'
			},
			get: {
				method: 'GET',
				isArray: true,
				params: {
					limit: 10,
					offset: 0,
					sort: '-createdAt',
					r: Math.random()
				}
			}
		});
	}
]);