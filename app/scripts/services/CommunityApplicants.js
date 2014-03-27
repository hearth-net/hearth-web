'use strict';

angular.module('hearth.services').factory('CommunityApplicants', [
	'$resource',
	function($resource) {
		return $resource($$config.apiPath + '/communities/:communityId/applicants/:applicantId', {
			communityId: '@communityId',
			applicantId: '@applicantId'
		}, {
			add: {
				method: 'POST'
			},
			show: {
				method: 'GET'
			},
			remove: {
				method: 'DELETE'
			},
			query: {
				method: 'GET',
				isArray: true,
				params: {
					sort: '-createdAt',
					r: Math.random()
				}
			}
		});
	}
]);