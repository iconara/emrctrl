;(function () {
  moment.calendar = {
    lastDay : "[Yesterday at] HH:mm",
    sameDay : "[Today at] HH:mm",
    nextDay : "[Tomorrow at] HH:mm",
    lastWeek : "[last] dddd [at] HH:mm",
    nextWeek : "dddd [at] HH:mm",
    sameElse : "YYYY-MM-DD HH:mm"
  }
})()

;(function () {
  var module = angular.module("emrctrl.formatting", [])

  module.filter("timeAgo", function () {
    return function (input) {
      if (input) {
        return moment(input).calendar()
      } else {
        return null
      }
    }
  })

  module.filter("isoDateTime", function () {
    return function (input) {
      if (input) {
        return moment(input).format("YYYY-MM-DD HH:mm")
      } else {
        return null
      }
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

  module.factory("flows", function ($http, $q, $log) {
    var self = {}
    var flows = []

    var calculateElapsedTime = function (flow) {
      if (flow.started_at == null) {
        return 0
      } else {
        var start = flow.started_at.getTime()
        var end = (flow.ended_at == null ? new Date() : flow.ended_at).getTime()
        return end - start
      }
    }

    var prepareFlow = function (flow) {
      flow.created_at = new Date(flow.created_at * 1000)
      flow.ready_at = flow.ready_at == null ? null : new Date(flow.ready_at * 1000)
      flow.started_at = flow.started_at == null ? null : new Date(flow.started_at * 1000)
      flow.ended_at = flow.ended_at == null ? null : new Date(flow.ended_at * 1000)
      flow.elapsed_time = calculateElapsedTime(flow)
      return flow
    }

    var descendingCreationOrder = function (a, b) {
      return b.created_at.getTime() - a.created_at.getTime()
    }

    var stateFilter = function (state) {
      return function (flow) { return flow.state == state }
    }

    var loadFlowData = function (flow) {
      var url = "/v1/flows/" + flow.job_flow_id
      return $http.get(url).then(function (response) {
        return prepareFlow(response.data)
      }).then(function (loadedFlow) {
        flows[flows.indexOf(flow)] = loadedFlow
        return loadedFlow
      })
    }

    self.loadFlows = function () {
      var url = "/v1/flows"
      return $http.get(url).then(function (response) {
        flows = response.data
        flows.forEach(prepareFlow)
        flows.sort(descendingCreationOrder)
        flows.filter(stateFilter("RUNNING")).forEach(loadFlowData)
        return self
      })
    }

    self.loadFlow = function (flow) {
      return loadFlowData(flow)
    }

    self.flows = function () {
      return flows
    }

    return self
  })

  module.controller("AppController", function ($scope, flows, $log) {
    $scope.flows = []
    $scope.selectedFlow = null
    $scope.loading = false

    $scope.reload = function () {
      $scope.loading = true

      flows.loadFlows().then(function () {
        $scope.loading = false
        $scope.flows = flows.flows()
      })
    }

    $scope.selectFlow = function (flow) {
      flows.loadFlow(flow).then(function (flow) {
        $scope.flows = flows.flows()
        $scope.selectedFlow = flow
      })
    }

    $scope.reload().then(function () {
      $timeout($scope.reload, 30000).then(arguments.callee)
    })
  })
})()