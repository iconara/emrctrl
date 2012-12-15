;(function () {
  var TIMES_AGO = [
    [60,                  "seconds ago",            0               , "round"],
    [60 *   5,            "minutes ago",            0               , "round"],
    [60 *  50,            "%d minutes ago",        60               , "round"],
    [60 *  80,            "about an hour ago",      0               , "round"],
    [60 * 120,            "more than an hour ago",  0               , "round"],
    [60 *  60 * 18,       "about %d hours ago",    60 * 60          , "round"],
    [60 *  60 * 26,       "about a day ago",        0               , "round"],
    [60 *  60 * 40,       "yesterday",              0               , "round"],
    [60 *  60 * 24 *   6, "%d days ago",           60 * 60 * 24     , "round"],
    [60 *  60 * 24 *  10, "about a week ago",       0               , "round"],
    [60 *  60 * 24 *  14, "more than a week ago",   0               , "round"],
    [60 *  60 * 24 *  25, "%d weeks ago",          60 * 60 * 24 *  7,  "ceil"],
    [60 *  60 * 24 *  40, "about a month ago",      0               ,  "ceil"],
    [60 *  60 * 24 * 340, "%d months ago",         60 * 60 * 24 * 30,  "ceil"],
    [60 *  60 * 24 * 380, "about a year ago",       0               ,  "ceil"],
    [Infinity,            "in the distant past",    0               ,  "ceil"]
  ]

  var module = angular.module("emrctrl.formatting", [])

  module.filter("timeAgo", function () {
    return function (input, reference) {
      if (input == null) return ""
      reference = reference || new Date()
      var diff = (reference.getTime() - input.getTime())/1000
      var e = _(TIMES_AGO).find(function (e) { return diff < e[0] })
      var text = e[1]
      var period = e[2]
      var rounding = e[3]
      return _.str.sprintf(text, Math[rounding](diff/period))
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