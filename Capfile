# encoding: utf-8

require 'bundler/setup'

load 'deploy'

require 'bundler/capistrano'
require 'rvm/capistrano'
require 'capistrano_colors'


SHARED_PATHS = %w[log run]
PID_PATH = 'run/server.pid'
PORT = 9999

server 'tools.byburt.com', :server

default_run_options[:pty] = true

set :application, 'emrctrl'
set :repository, %(git@github.com:iconara/#{application}.git)
set :scm, 'git'
set :user, 'burt'
set :use_sudo, false
set :deploy_to, %(/home/#{user}/apps/#{application})
set :rvm_type, :system
set :rvm_ruby_string, ENV['GEM_HOME'].gsub(/^.*\//, '')
set :ssh_options, {:forward_agent => true}
set :deploy_via, :remote_cache

namespace :deploy do
  task :start do
    run %(cd #{current_path} && nohup ./bin/server --pidfile #{PID_PATH} --port #{PORT} && mv nohup.out log/server.log)
  end

  task :stop do
    run %(cd #{current_path} && kill $(cat #{PID_PATH}) || :)
  end

  task :restart do
    stop
    start
  end

  task :symlink_shared, :except => {:no_release => true} do
    SHARED_PATHS.each do |path|
      run "ln -nfs #{shared_path}/#{path} #{release_path}/#{path}"
    end
  end
  before 'deploy:create_symlink', 'deploy:symlink_shared'

  task :setup_shared, :except => {:no_release => true} do
    run "mkdir -p #{SHARED_PATHS.map { |d| "#{shared_path}/#{d}" }.join(' ')}"
  end
  after 'deploy:setup', 'deploy:setup_shared'

  namespace :rvm do
    task :trust_rvmrc do
      run "rvm rvmrc trust #{current_path}"
    end
  end
  before 'deploy:start', 'rvm:trust_rvmrc'
end
