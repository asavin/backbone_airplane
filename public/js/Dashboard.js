// Backbone app

(function($) {
  
  //
  // Common telemetry model for both speed and altitude
  //
  
  window.Telemetry = Backbone.Model.extend({
    defaults: {
      'min' : '',
      'max' : '',
      'average': 0,
      'current': 0
    },
  
    initialize: function() {
     this.on('change:current', this.calculateValues, this);
    },
  
    // Calculating min, max and avg values
    calculateValues: function() {  
      var current = this.get('current');
      var dataArray = this.get('dataArray');
    
      // Updating tracked speed array with the latest value
      this.attributes.dataArray.push(current);
    
      // Calculating average speed based on the tracked speed
      var dataSum = 0;
      for (var i in dataArray) { 
        dataSum += dataArray[i];
      }
    
      // Now calculating the average speed
      average = dataSum / dataArray.length;
      this.set('average', average);
      console.log(average);
    
      // Updating min speed value
      if (this.get('min') != '') {
        if (current < this.get('min')) this.set('min', current);
      } else {
        this.set('min', current);
      }
    
      //Updating max speed value
      if (this.get('max') != '') {
        if (current > this.get('max')) this.set('max', current);
      } else {
        this.set('max', current);
      }
    }
  });
  
  
  //
  // Speed related view
  //
  window.Speed = Telemetry.extend({
  });
  
  window.SpeedView = Backbone.View.extend({
    id: 'speed-container',
    
    initialize: function(){
      _.bindAll(this, 'render');
      this.model.bind('change', this.render);
      this.template = _.template($('#speed-template').html());
    },
    
    render: function() {
      var renderedContent = this.template(this.model.toJSON());
      $(this.el).html(renderedContent);
      return this;
    }
  });
  
  // Creating actual objects for Speed model and view
  window.speed = new Speed({});
  
  // Initialize separate data array for this telemetry object
  speed.set('dataArray', []);
  
  window.speedView = new SpeedView({model: speed});
  
  //
  // Altitude related model and view
  //
  
  window.Altitude = Telemetry.extend({
  });
  
  window.AltitudeView = Backbone.View.extend({
    id: 'altitude-container',
    
    initialize: function(){
      _.bindAll(this, 'render');
      this.model.bind('change', this.render);
      this.template = _.template($('#altitude-template').html());
    },
    
    render: function() {
      var renderedContent = this.template(this.model.toJSON());
      $(this.el).html(renderedContent);
      return this;
    }
  });
  
  // Creating actual objects for Altitude model and view
  window.altitude = new Altitude({});
  
  // Initialize separate data array for this telemetry object
  altitude.set('dataArray', []);
  
  window.altitudeView = new AltitudeView({model: altitude});
  
  
  //
  // Main router
  //
  
  window.Dashboard = Backbone.Router.extend({
    routes: {
      '' : 'home'
    },
    
    initialize: function() {
    },
    
    home: function() {
      var $container = $('#container');
      $container.empty();
      $container.append(speedView.render().el);
      $container.append(altitudeView.render().el);
    }
  });
  
  $(function() {
    window.App = new Dashboard();
    Backbone.history.start({pushState: true});
  });


  //
  // Websockets logic
  //
  
  window.initSockets = function() {
    if ("WebSocket" in window)
    {  
       // Updating connection indicator to 'connecting' state
       $('#connection_indicator').removeClass();
       $('#connection_indicator').addClass('connecting');
       $('#connection_state_text').text('Connecting');
       
       // Let us open a web socket
       var ws = new WebSocket("ws://ec2-79-125-71-146.eu-west-1.compute.amazonaws.com:8888/telemetry");
       ws.onopen = function()
       {
         // Update connection indicator
         $('#connection_indicator').removeClass();
         $('#connection_indicator').addClass('online');
         $('#connection_state_text').text('Online');
         
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
          $('#connection_state_text').text('Offline');
          
          // Renewing connection to the server
          //initSockets();
       };
    }
    else
    {
       // The browser doesn't support WebSocket
       console.log("WebSockets are not supported by your browser :(");
    }    
  };
  
  //
  // Utility methods
  //
  
  // Adapter method for accepting and validating input data
  // Basically this method is abstracting the data protocol.
  // If Websockets are replaced with something else, just add
  // appropriate protocol handler method, and call this adapter method
  // with received data
  var dataAdaptation = function(data) {
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
        
        if (parsed_objects.telemetry.hasOwnProperty('altitude')) {
          if (validateAltitude(parsed_objects.telemetry.altitude)) {
            var current = parsed_objects.telemetry.altitude;
            altitude.set('current',  current);
          }
        }
      }
    }
    catch (err) {
      console.log('Invalid data detected');
    }
    
  };
  
  // Validating value of speed in knots
  var validateSpeed = function(value) {
    var maxSpeed = 420;
    var minSpeed = 0;
    var maxDifferenceToPreviousValue = 200; // safe assumptions here
    
    // Check if value is not a number
    if (isNaN(value))
      return false;
    
    // Filtering out values with too big difference to the previous value
    var previousValue = _.last(speed.get('dataArray'));
    if (Math.abs(value - previousValue) > maxDifferenceToPreviousValue)
      return false;

    return (value >= minSpeed && value <= maxSpeed);
  };
  
  // Validating new value of altitude in feet
  var validateAltitude = function(value) {
    var maxAltitude = 40000; // safe to assume that our plane is not climbing altitudes over 12km
    var minAltitude = 0;
    var maxDifferenceToPreviousValue = 5000;
    
    // Check if value is not a number
    if (isNaN(value))
      return false;
    
    // Filtering out values with too big difference to the previous value
    var previousValue = _.last(altitude.get('dataArray'));
    if (Math.abs(value - previousValue) > maxDifferenceToPreviousValue)
      return false;
    
    return (value >= minAltitude && value <= maxAltitude);
  };

})(Zepto);
