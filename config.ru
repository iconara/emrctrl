# encoding: utf-8

$: << File.expand_path('../lib', __FILE__)

require 'bundler/setup'
require 'emrctrl/app'
require 'rack/contrib/try_static'


use Rack::TryStatic, :root => 'public', :urls => %w[/], :try => %w[.html index.html /index.html]
run Emrctrl::App