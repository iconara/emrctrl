# encoding: utf-8

require 'java'
`hadoop classpath`.chop!.split(':').each { |path| $CLASSPATH << File.expand_path(path) }

module Hadoop
  include_package 'org.apache.hadoop'
  module Conf
    include_package 'org.apache.hadoop.conf'
  end
  module Mapred
    include_package 'org.apache.hadoop.mapred'
  end
end
