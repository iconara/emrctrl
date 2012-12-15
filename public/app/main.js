;(function () {
  moment.calendar = {
    lastDay : '[Yesterday at] HH:mm',
    sameDay : '[Today at] HH:mm',
    nextDay : '[Tomorrow at] HH:mm',
    lastWeek : '[last] dddd [at] HH:mm',
    nextWeek : 'dddd [at] HH:mm',
    sameElse : 'YYYY-MM-DD HH:mm'
  }
})()

;(function () {
  var module = angular.module("emrctrl.formatting", [])

  module.filter("timeAgo", function () {
    return function (input) {
      return moment(input).calendar()
    }
  })

  module.filter("isoDateTime", function () {
    return function (input) {
      return moment(input).format("YYYY-MM-DD HH:mm")
    }
  })

  module.filter("elapsedTime", function () {
    return function (input) {
      return Math.ceil(input/(1000 * 60)) + " minutes"
    }
  })

  module.filter("naIfNull", function () {
    return function (input) {
      if (!input) {
        return "n/a"
      } else {
        return input
      }
    }
  })
})()

;(function () {
  var module = angular.module("emrctrl", ["emrctrl.formatting"])
})()

var AppController = function ($scope, $http, $log) {
  $scope.flows = []
  $scope.loading = false

  $scope.reload = function () {
    $scope.loading = true
    var request = $http.get('http://localhost:9292/v1/flows')
    request.success(function (data) {
      $scope.flows = sortFlows(prepareFlows(data))
      $scope.loading = false
    })
    request.error(function(data, status, headers, config) {
      $log.error("BLURGH")
      $scope.loading = false
    })
  }

  $scope.reload()

  var prepareFlows = function (flows) {
    return flows.map(function (flow) {
      flow.created_at = new Date(flow.created_at * 1000)
      flow.ready_at = new Date(flow.ready_at * 1000)
      flow.started_at = new Date(flow.started_at * 1000)
      flow.ended_at = new Date(flow.ended_at * 1000)
      return flow
    })
  }

  var sortFlows = function (flows) {
    return flows.sort(function (a, b) {
      return b.created_at - a.created_at
    })
  }
}