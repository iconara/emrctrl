# encoding: utf-8

module Emrctrl
  class Stats
    def initialize(*args)
      @ec2, @cloud_watch = args
    end

    def cpu(job_flow_id)
      query = @cloud_watch.metrics.filter('namespace', 'AWS/EC2').filter('metric_name', 'CPUUtilization')
      stats_filter = {start_time: Time.now - 60 * 60 * 5, end_time: Time.now, statistics: %w[Sum]}
      instances = @ec2.instances.tagged('aws:elasticmapreduce:job-flow-id').tagged_values(job_flow_id)
      cpu_by_role = Hash.new { |h, k| h[k] = [] }
      instances.each do |instance|
        role = instance.tags['aws:elasticmapreduce:instance-group-role']
        $stderr.puts("Loading CPU utilization for #{instance.instance_id} (#{role})")
        q = query.filter('dimensions', [{name: 'InstanceId', value: instance.instance_id}])
        cpu_by_role[role] << q.first.statistics(stats_filter).to_a
      end
      cpu_by_role
    end
  end
end