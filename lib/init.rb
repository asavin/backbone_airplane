Dir['./lib/isolate*/lib'].each do |dir|
  $: << dir
end

require "rubygems"
require "isolate/now"

require "sinatra"
require "sinatra/cross_origin"

module Sinatra
  register CrossOrigin
end

configure do
  enable :cross_origin
end
