# encoding: utf-8

module Emrctrl
  class Flows
    def initialize(emr)
      @emr = emr
    end

    def flows
      @emr.job_flows.map { |f| render_flow(f) }
    end

    def flow(id)
      render_flow(@emr.job_flows[id])
    end

  private

    def render_flow(flow)
      properties.each_with_object({}) do |property, obj|
        obj[property] = flow.send(property)
        if obj[property] && date_time?(property)
          obj[property] = obj[property].to_i
        end
      end
    end

    def date_time?(property)
      DATE_TIME_PROPERTIES.include?(property)
    end

    SUMMARY_PROPERTIES = [
      :job_flow_id,
      :name,
      :state,
      :created_at,
      :ended_at,
      :ready_at,
      :started_at,
    ].freeze

    ALL_PROPERTIES = SUMMARY_PROPERTIES + [
      :last_state_change_reason,
      :instance_count,
      :normalized_instance_hours,
      :log_uri,
      :ec2_key_name,
      :termination_protected,
      :keep_job_flow_alive_when_no_steps,
      :availability_zone_name,
      :master_instance_id,
      :master_instance_type,
      :master_public_dns_name,
      :bootstrap_actions,
      :step_details,
      :supported_products,
      :instance_group_details,
    ].freeze

    DATE_TIME_PROPERTIES = [
      :created_at,
      :ended_at,
      :ready_at,
      :started_at,
    ].to_set.freeze
  end
end