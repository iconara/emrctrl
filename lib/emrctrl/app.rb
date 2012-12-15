# encoding: utf-8

require 'grape'
require 'aws'
require 'oj'
require 'set'

require 'emrctrl/flows'


module Emrctrl
  class App < Grape::API
    version 'v1', :using => :path
    format :json

    helpers do
      def emr
        @emr ||= AWS::EMR.new(emr_endpoint: 'eu-west-1.elasticmapreduce.amazonaws.com')
      end

      def flows
        @flows ||= Flows.new(emr)
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
        requires :id, :type => String, :desc => 'Job flow ID'
      end
      get '/:id' do
        flows.flow(params[:id])
      end
    end
  end
end