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

  module.filter("fraction", function () {
    return function (input) {
      if (input) {
        return Math.round(100*input) + "%"
      } else {
        return null
      }
    }
  })

  module.filter("percentage", function () {
    return function (input) {
      if (input) {
        return Math.round(input) + "%"
      } else {
        return null
      }
    }
  })
})()

;(function () {
  var module = angular.module("emrctrl", ["emrctrl.formatting"])

  module.factory("flows", function ($http, $q, $log) {
    var self = {}
    var flows = []

    var DATE_TIME_PROPERTIES = {
      "created_at": true,
      "ended_at": true,
      "started_at": true,
      "ready_at": true,
      "creation_date_time": true,
      "start_date_time": true,
      "end_date_time": true,
      "ready_date_time": true
    }

    var calculateElapsedTime = function (obj) {
      var start = obj.started_at || obj.start_date_time
      var end = obj.ended_at || obj.end_date_time || new Date()
      if (start && end) {
        return end.getTime() - start.getTime()
      } else {
        return 0
      }
    }

    var timestampsToDates = function (obj) {
      for (var key in obj) {
        if (key in DATE_TIME_PROPERTIES) {
          obj[key] = obj[key] == null ? null : new Date(obj[key] * 1000)
        }
      }
      return obj
    }

    var prepareStepDetails = function (stepDetails) {
      timestampsToDates(stepDetails.execution_status_detail)
      stepDetails.execution_status_detail.elapsed_time = calculateElapsedTime(stepDetails.execution_status_detail)
      return stepDetails
    }

    var prepareFlow = function (flow) {
      timestampsToDates(flow)
      flow.elapsed_time = calculateElapsedTime(flow)
      flow.step_details.forEach(prepareStepDetails)
      return flow
    }

    var descendingCreationOrder = function (a, b) {
      return b.created_at.getTime() - a.created_at.getTime()
    }

    var stateFilter = function (state) {
      return function (flow) { return flow.state == state }
    }

    var loadFlowData = function (flow) {
      var url = "v1/flows/" + flow.job_flow_id
      return $http.get(url).then(function (response) {
        return prepareFlow(response.data)
      }).then(function (loadedFlow) {
        flows[flows.indexOf(flow)] = loadedFlow
        return loadedFlow
      })
    }

    self.loadFlows = function () {
      var url = "v1/flows"
      return $http.get(url).then(function (response) {
        flows = response.data.slice(0, 10)
        flows.forEach(prepareFlow)
        flows.sort(descendingCreationOrder)
        return self
      })
    }

    self.loadFlowStats = function (flow) {
      var url = "v1/flows/" + flow.job_flow_id + "/tracker"
      return $http.get(url, {timeout: 10000}).then(function (response) {
        return response.data;
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

  module.controller("ToolbarController", function ($scope) { })
  
  module.controller("FlowListController", function ($scope) { })
  
  module.controller("FlowDetailsController", function ($scope, flows) {
    $scope.$watch("selectedFlow", function (newFlow, oldFlow) {
      if (newFlow == null || oldFlow == null || newFlow.job_flow_id != oldFlow.job_flow_id) {
        $scope.logUrl = null
        $scope.tracker = null
      }
      if (newFlow) {
        if (newFlow.state == 'RUNNING') {
          flows.loadFlowStats(newFlow).then(function (tracker) {
            $scope.tracker = tracker
          })
        }
      }
    })

    $scope.viewLog = function (step, logName) {
      $scope.logUrl =  "v1/flows/logs/" + [$scope.selectedFlow.job_flow_id, step.step_config.name, logName].join("/")
    }
  })

  module.controller("AppController", function ($scope, $timeout, $window, flows, $log) {
    $scope.flows = []
    $scope.selectedFlow = null
    $scope.loading = false

    $scope.reload = function () {
      if ($scope.loading) return
      $scope.loading = true
      return flows.loadFlows().then(function () {
        $scope.loading = false
        $scope.flows = flows.flows()
        if ($scope.selectedFlow) {
          var found = $scope.flows.filter(function (flow) {
            return flow.job_flow_id == $scope.selectedFlow.job_flow_id
          })
          if (found.length > 0) {
            $scope.selectedFlow = found[0]
          }
        }
      })
    }

    $scope.selectFlow = function (flow) {
      $scope.selectedFlow = flow
    }

    $scope.reload().then(function () {
      $timeout($scope.reload, 30000).then(arguments.callee)
    })
  })
})()
