require "./lib/init"

module Sinatra
  register CrossOrigin
end

configure do
  enable :cross_origin
end

disable :logging
set :root, File.dirname(__FILE__) + "/../"
set :allow_origin, :any

get "/" do
  send_file "public/index.html"
end

get "/blank" do
  send_file "public/index.html"
end

get "/favicon.ico" do
  ""
end

