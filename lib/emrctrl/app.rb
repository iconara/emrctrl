# encoding: utf-8

require 'grape'
require 'aws'
require 'set'

require 'emrctrl/flows'
require 'emrctrl/stats'


module Emrctrl
  class App < Grape::API
    version 'v1', :using => :path
    format :json

    helpers do
      def emr
        @emr ||= AWS::EMR.new(emr_endpoint: 'eu-west-1.elasticmapreduce.amazonaws.com')
      end

      def cloud_watch
        @cloud_watch ||= AWS::CloudWatch.new(cloud_watch_endpoint: 'monitoring.eu-west-1.amazonaws.com')
      end

      def ec2
        @ec2 ||= AWS::EC2.new(ec2_endpoint: 'ec2.eu-west-1.amazonaws.com')
      end

      def s3
        @s3 ||= AWS::S3.new
      end

      def flows
        @flows ||= Flows.new(emr)
      end

      def stats
        @stats ||= Stats.new(ec2, cloud_watch)
      end
    end

    before do
      AWS.start_memoizing
    end

    after do
      AWS.stop_memoizing
    end

    resource :flows do
      desc 'Lists all flows'
      get '/' do
        flows.flows
      end

      desc 'Data about a specific flow'
      params do
        requires :id, type: String, desc: 'Job flow ID'
      end
      get '/:id' do
        flows.flow(params[:id])
      end

      desc 'Get CPU usage for each node in the cluster'
      params do
        requires :id, type: String, desc: 'Job flow ID'
      end
      get '/:id/cpu' do
        stats.cpu(params[:id])
      end

      resource :logs do
        desc 'Redirect to logs'
        params do
          requires :flow_id, type: String, desc: 'Job flow ID'
          requires :step_name, type: String, desc: 'Step name'
          requires :log_name, type: String, desc: 'Log name (one of controller, stderr, stdout, syslog)'
        end
        get '/:flow_id/:step_name/:log_name' do
          flow = flows.flow(params[:flow_id])
          bucket_name, path = flow[:log_uri].scan(%r{^s3n://([^/]+)/(.+)$}).flatten
          step_index = flow[:step_details].index { |step| step[:step_config][:name] == params[:step_name] } + 1
          log_path = "#{path}#{flow[:job_flow_id]}/steps/#{step_index}/#{params[:log_name]}"
          signed_uri = s3.buckets[bucket_name].objects[log_path].url_for(:read).to_s
          redirect signed_uri
        end
      end
    end
  end
end