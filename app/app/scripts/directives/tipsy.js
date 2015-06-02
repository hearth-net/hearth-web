'use strict';
/**
 * @ngdoc directive
 * @name hearth.directives.tipsy
 * @description Cool tool for tool tips
 * @restrict A
 */
angular.module('hearth.directives').directive('tipsy', [
    '$timeout',
    function($timeout) {
        return {
            link: function($scope, element, attrs) {
                var el = null;
                $timeout(function() {
                    el = $(element);

                    el.tipsy({gravity: 's'});
                    el.mouseleave(function() {
                        console.log('LEAVE');
                        el.tipsy("hide");
                    });
                });

                $scope.$on('$destroy', function() {
                    el.unbind('mouseleave');
                });
            }
        }
    }
]);
