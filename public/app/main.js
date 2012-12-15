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

var AppController = function ($scope, $http, $q, $log) {
  $scope.flows = []
  $scope.loading = false

  $scope.reload = function () {
    $scope.loading = true
    var request = $http.get("/v1/flows")
    request.success(function (data) {
      $scope.loading = false
      $scope.flows = data
      $scope.flows
        .map(prepareFlow)
        .sort(descendingCreationOrder)

      $scope.flows
        .filter(function (flow) { return flow.state == "RUNNING" })
        .forEach(loadAdditionalData)
    })
    request.error(function(data, status, headers, config) {
      $log.error("BLURGH")
      $scope.loading = false
    })
  }

  $scope.reload()

  var loadAdditionalData = function (flow) {
    var request = $http.get("/v1/flows/" + flow.job_flow_id)
    request.success(function (data) {
      $scope.flows[$scope.flows.indexOf(flow)] = prepareFlow(data)
    })
  }

  var prepareFlow = function (flow) {
    flow.elapsed_time = flow.started_at == 0 ? 0 : (flow.ended_at - flow.started_at) * 1000
    flow.created_at = new Date(flow.created_at * 1000)
    flow.ready_at = new Date(flow.ready_at * 1000)
    flow.started_at = new Date(flow.started_at * 1000)
    flow.ended_at = new Date(flow.ended_at * 1000)
    return flow
  }

  var descendingCreationOrder = function (a, b) {
    return b.created_at.getTime() - a.created_at.getTime()
  }
}