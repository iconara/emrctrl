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
      obj = ALL_PROPERTIES.each_with_object({}) do |property, obj|
        obj[property] = flow.send(property)
      end
      times_to_timestamps!(obj)
      obj[:step_details].each { |sd| times_to_timestamps!(sd[:execution_status_detail]) if sd[:execution_status_detail] } if obj[:step_details]
      obj[:instance_group_details].each { |igd| times_to_timestamps!(igd) } if obj[:instance_group_details]
      obj
    end

    def times_to_timestamps!(obj)
      obj.each_key do |k|
        if obj[k] && date_time?(k)
          obj[k] = obj[k].to_i
        end
      end
    end

    def date_time?(property)
      DATE_TIME_PROPERTIES.include?(property)
    end

    DATE_TIME_PROPERTIES = [
      :created_at,
      :ended_at,
      :started_at,
      :ready_at,
      :creation_date_time,
      :start_date_time,
      :end_date_time,
      :ready_date_time,
    ].to_set.freeze

    ALL_PROPERTIES = [
      :job_flow_id,
      :name,
      :state,
      :created_at,
      :ended_at,
      :ready_at,
      :started_at,
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
  end
end