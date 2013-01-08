# encoding: utf-8

require 'hadoop'

module Emrctrl
  class Tracker
    def initialize(emr)
      @emr = emr
    end

    def status(flow_id)
      with_client(flow_id) do |client|
        {
          status: render_status(client.cluster_status),
          jobs: client.all_jobs.map { |job_status| render_job(client.get_job(job_status.job_id)) },
        }
      end
    end

    private

    def render_status(status)
      {
        map_tasks: status.map_tasks,
        max_map_tasks: status.max_map_tasks,
        reduce_tasks: status.reduce_tasks,
        max_reduce_tasks: status.max_reduce_tasks,
      }
    end

    def render_job(job)
      {
        id: job.id.to_s,
        name: job.job_name,
        run_state: Hadoop::Mapred::JobStatus.get_job_run_state(job.job_state),
        progress: {
          setup: job.setup_progress,
          map: job.map_progress,
          copy: [job.reduce_progress * 3, 1].min,
          sort: [[0, job.reduce_progress * 3 - 1].max, 1].min,
          reduce: [0, job.reduce_progress * 3 - 2].max,
          cleanup: job.cleanup_progress,
        }
      }
    end

    def with_client(flow_id)
      if (job_flow = @emr.job_flows[flow_id]) && job_flow.state == "RUNNING" &&
          listening?(job_flow.master_public_dns_name, 9001)
        conf = Hadoop::Conf::Configuration.new
        conf.set('mapred.job.tracker', "#{job_flow.master_public_dns_name}:9001")
        conf.set('fs.default.name', "hdfs://#{job_flow.master_public_dns_name}:9000/")
        job_conf = Hadoop::Mapred::JobConf.new(conf)
        yield Hadoop::Mapred::JobClient.new(job_conf)
      end
    end

    def listening?(host, port)
      socket = java.net.Socket.new
      begin
        socket.connect(java.net.InetSocketAddress.new(host, port), 10_000)
        socket.close
        true
      rescue java.net.SocketTimeoutException => e
        false
      end
    end
  end
end