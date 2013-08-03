// Backbone app

(function($) {
  window.Speed = Backbone.Model.extend({
    defaults: {
      'average': 0,
      'current': 0,
      'airspeedArray': []
    },
    
    initialize: function() {
     this.on('change:current', this.calculateValues, this);
    },
    
    // Calculating min, max and avg values
    calculateValues: function() {  
      var current = this.get('current');
      var airspeedArray = this.get('airspeedArray');
      
      // Updating tracked speed array with the latest value
      this.attributes.airspeedArray.push(current);
      
      // Calculating average speed based on the tracked speed
      var speedSum = 0;
      for (var i in airspeedArray) { 
        speedSum += airspeedArray[i];
      }
      
      // Now calculating the average speed
      average = speedSum / airspeedArray.length;
      this.set('average', average);
      console.log(average);
      
      // Updating min speed value
      if (this.attributes.hasOwnProperty('min')) {
        if (current < this.get('min')) this.set('min', current);
      } else {
        this.set('min', current);
      }
      
      //Updating max speed value
      if (this.attributes.hasOwnProperty('max')) {
        if (current > this.get('max')) this.set('max', current);
      } else {
        this.set('max', current);
      }
      
      
      console.log('Event in speed model!');
    }
  });
  
  window.SpeedView = Backbone.View.extend({
    className: 'current_speed',
    
    initialize: function(){
      _.bindAll(this, 'render');
      this.model.bind('change', this.render);
      this.template = _.template($('#test-template').html());
    },
    
    render: function() {
      var renderedContent = this.template(this.model.toJSON());
      $(this.el).html(renderedContent);
      return this;
    }
  });
  
  window.speed = new Speed({});
  //speed.on('change:current', this.calculateValues, this);
  
  window.speedView = new SpeedView({model: speed});
  
  window.Dashboard = Backbone.Router.extend({
    routes: {
      '' : 'home'
    },
    
    initialize: function() {
    },
    
    home: function() {
      var $container = $('#speed_container');
      $container.empty();
      $container.append(speedView.render().el);
    }
  });
  
  $(function() {
    window.App = new Dashboard();
    Backbone.history.start({pushState: true});
  });

  // Websockets logic
  window.initSockets = function() {
    if ("WebSocket" in window)
    {
       console.log("WebSocket is supported by your Browser!");
       
       // Updating connection indicator to 'connecting' state
       $('#connection_indicator').removeClass();
       $('#connection_indicator').addClass('connecting');
       
       // Let us open a web socket
       var ws = new WebSocket("ws://ec2-79-125-71-146.eu-west-1.compute.amazonaws.com:8888/telemetry");
       ws.onopen = function()
       {
         // Update connection indicator
         $('#connection_indicator').removeClass();
         $('#connection_indicator').addClass('online');
         
          // Web Socket is connected, send data using send()
          ws.send("Message to send");
          console.log("Message is sent...");
       };
       ws.onmessage = function (evt) 
       { 
          var received_msg = evt.data;
          dataAdaptation(received_msg);
          
          console.log("Message is received...");
          console.log(received_msg);
          
       };
       ws.onerror = function(err) {
         console.log('Websocket error detected');
         console.log(err);
       };
       ws.onclose = function()
       { 
          // websocket is closed
          console.log("Connection is closed..."); 
          // Update connection indicator
          $('#connection_indicator').removeClass();
          $('#connection_indicator').addClass('offline');
          
          // TODO: need to renew connection to the server
       };
    }
    else
    {
       // The browser doesn't support WebSocket
       console.log("WebSocket NOT supported by your browser :(");
    }    
  };
  
  // Adapter method for accepting and validating input data
  // Basically this method is abstracting the data protocol.
  // If Websockets are replaced with something else, just add
  // appropriate protocol handler method, and call this adapter method
  // with received data
  var dataAdaptation = function(data) {
    // First try to parse the data into objects
    var parsed_objects;
    try {
      parsed_objects = eval("(" + data + ")");
      
      // Set new values to the models, but only if the data is
      // present and valid
      if (parsed_objects.hasOwnProperty('telemetry')) {
        if (parsed_objects.telemetry.hasOwnProperty('airspeed')) {
          if (validateSpeed(parsed_objects.telemetry.airspeed)) {
            var current = parsed_objects.telemetry.airspeed;
            speed.set('current',  current);
          }
        }
      }
    }
    catch (err) {
      console.log('Invalid data detected');
    }
    
  };
  
  // Validating the value of speed in knots
  var validateSpeed = function(value) {
    var maxSpeed = 420;
    var minSpeed = 0;
    
    // Check if value is not a number
    if (isNaN(value)) {
      return false;
    }
    return (value >= minSpeed && value <= maxSpeed);
  }

})(Zepto);
