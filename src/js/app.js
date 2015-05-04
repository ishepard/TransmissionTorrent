var UI = require('ui');
var Vector2 = require('vector2');
var ajax = require('ajax');
// localStorage.clear();
var xhr = new XMLHttpRequest();
var XTransmissionSessionId = localStorage.getItem('X-Transmission-Session-Id');
var items_downloading = [];
var items_seeding = [];
var items_paused = [];
var choice = [];
var protocol;
var server = localStorage.getItem('server');
var port_number = localStorage.getItem('port_number');
var username = localStorage.getItem('username');
var password = localStorage.getItem('password');
var base64_string = localStorage.getItem('base64_string');
var URL = localStorage.getItem('URL');
var timeouts = [];
var timeline_token;

// Create a Card with title and subtitle
// Construct Menu to show to user
var menu_downloading = new UI.Menu({
  sections: [{
    title: 'Downloading',
    items: items_downloading
  },{
    title: 'Seeding',
    items: items_seeding
  },{
    title: 'Paused',
    items: items_paused
  }],
});

var errorCard = new UI.Card({
  title: "Error!",
  body: "Server is not reachable! Check your configuration.",
  scrollable: true
});

var completeForm = new UI.Card({
  title: "",
  subtitle: "",
  body: "Complete the form with all the requested value on the mobile phone",
  scrollable: true
});

completeForm.on('click', 'back', function(){
  // console.log('do nothing...');
});


var splashWindow = new UI.Card({
  title: "Contacting transmission...",
  scrollable: true
});

splashWindow.on('click', 'back', function(){
  // console.log('do nothing...');
});

var detail_window = new UI.Window();
var rect = new UI.Rect({ size: new Vector2(144, 168) });
var title_window = new UI.Text({
  position: new Vector2(0, 5),
  size: new Vector2(144, 89),
  font: 'gothic-24-bold',
  text: '',
  textAlign: 'center',
  color:'black',
  backgroundColor:'white'
});
var label_download = new UI.Text({
  position: new Vector2(0, 87),
  size: new Vector2(144, 25),
  font: 'gothic-18',
  text: 'Downloading:',
  textAlign: 'left',
  color:'black',
  backgroundColor:'white'
});
var label_upload = new UI.Text({
  position: new Vector2(0, 108),
  size: new Vector2(144, 25),
  font: 'gothic-18',
  text: 'Uploading:',
  textAlign: 'left',
  color:'black',
  backgroundColor:'white'
});
var label_availability = new UI.Text({
  position: new Vector2(0, 129),
  size: new Vector2(144, 25),
  font: 'gothic-18',
  text: 'Progress:',
  textAlign: 'left',
  color:'black',
  backgroundColor:'white'
});
var value_download = new UI.Text({
  position: new Vector2(80, 87),
  size: new Vector2(64, 25),
  font: 'gothic-18',
  text: '',
  textAlign: 'right',
  color:'black',
  backgroundColor:'white'
});
var value_upload = new UI.Text({
  position: new Vector2(80, 108),
  size: new Vector2(64, 25),
  font: 'gothic-18',
  text: '',
  textAlign: 'right',
  color:'black',
  backgroundColor:'white'
});
var value_availability = new UI.Text({
  position: new Vector2(80, 129),
  size: new Vector2(64, 25),
  font: 'gothic-18',
  text: '',
  textAlign: 'right',
  color:'black',
  backgroundColor:'white'
});
detail_window.add(rect);
detail_window.add(title_window);
detail_window.add(label_download);
detail_window.add(label_upload);
detail_window.add(label_availability);
detail_window.add(value_download);
detail_window.add(value_upload);
detail_window.add(value_availability);
detail_window.fullscreen = true;


////////////////////////////////////////////////////////////////////////
var protocol = "http";
username = "transmission";
password = "ingdottdott";
base64_string = base64_encode(username + ":" + password);
server = "shikataganai.no-ip.biz";
port_number = 9092;
URL = protocol + "://" + server + ":" + port_number + "/transmission/rpc/";

if (Pebble.getTimelineToken){
  console.log("You have a Pebble Timeline! I'm getting the token...");
  Pebble.getTimelineToken(
    function (token) {
      timeline_token = token;
      console.log('The timeline token is ' + token);
      subscribe();
    },
    function (error) { 
      console.log('Error getting timeline token: ' + error);
    }
  );
}
///////////////////////////////////////////////////////////////////////


function connect_to_transmission(){
  var request = { "arguments": { "fields": [ "id", "name", "percentDone", "status", "rateDownload", "rateUpload", "eta", "doneDate", "hashString"] }, "method": "torrent-get", "tag": 39693 };
  var authorization = 'Basic ' + base64_string;
  ajax(
    {
      url: URL,
      type: 'json',
      method: 'POST',
      data: request,
      headers: {
        'Authorization': authorization,
        'X-Transmission-Session-Id': XTransmissionSessionId
      },
    },
    function (data, status, req){
      data.arguments.torrents.forEach(function(e){
        // console.log(JSON.stringify(e));
        var id = e.id;
        // console.log("id: " + id);
        var name = e.name;
        // console.log("name: " + name);
        var status = e.status;
        // console.log("status: " + status);
        var down = convert_value_with_unit(e.rateDownload);
        // console.log("download: " + down);
        var upload = convert_value_with_unit(e.rateUpload);
        // console.log("upload: " + upload);
        var percent = Math.round(e.percentDone * 100);
        // console.log("percentDone: " + percent);
        var sub = "Down: " + down + " Up: " + upload;
        // console.log("Eta is " + e.eta);
        // console.log("doneDate is " + e.doneDate);
        update_value(status, name, sub, upload, down, percent + "%", id);
      });

      for (var i = 0; i < 3; i++){
        check_queue(menu_downloading.state.sections[i].items, data.arguments.torrents, i);
      }

      errorCard.hide();
      splashWindow.hide();
      completeForm.hide();
    },
    function (body, status, req){
      if (status == 409){
        console.log('Failed fetching data!');
        XTransmissionSessionId = req.getResponseHeader('X-Transmission-Session-Id');
        localStorage.setItem('X-Transmission-Session-Id', XTransmissionSessionId);
      } else {
        console.log("Can not reach the server!");
        errorCard.show();
        completeForm.hide();
      }
    }
    );
    // myTimeout = setTimeout(function(){
    //   console.log("Timeout! Can not reach the server!");
    //   errorCard.on('click', 'back', function(){
    //   });
    //   errorCard.show();
    //   completeForm.hide();
    // },
    // 10000);
    // timeouts.push(myTimeout);
}

function convert_value_with_unit(value){
  var result = 0;
  var val_kbyte = 1024;
  var val_mbyte = val_kbyte * val_kbyte;
  var val_gbyte = val_mbyte * val_kbyte;

  if (value < val_kbyte){
    result = value + "B/s";
  }
  if (value >= val_kbyte && value < val_mbyte){
    result = Math.round(value / val_kbyte) + "KB/s";
  } else if (value >= val_mbyte && value < val_gbyte){
    result = Math.round((value / val_mbyte) * 100) / 100;
    result = result + "MB/s";
  } else if (value >= val_gbyte){
    result = Math.round((value / val_gbyte) * 100) / 100;
    result = result + "GB/s";
  }
  return result;
}

function check_queue(source_queue, dest_queue, sectionIndex){
  var to_eliminate = 0;
  source_queue.forEach(function(source){
    to_eliminate = 0;
    dest_queue.forEach(function(dest){
      if (source.id == dest.id){
        to_eliminate = 1;
        if (source.status != dest.status){
          var index = source_queue.indexOf(source);
          menu_downloading.deleteItem(sectionIndex, index);
          detail_window.hide();
        }
      }
    });
    if (to_eliminate === 0){
      menu_downloading.deleteItem(sectionIndex, source_queue.indexOf(source));
      detail_window.hide();
    }
  });
}

function update_value(status, name, sub, upload, download, percendDone, id){
  var substitute = 0;
  var length = 0;
  var i;
  var item;
  if (status === 4){
    item = { title: name, subtitle: sub, upload: upload, download: download, icon: "images/arrow_download.png", id: id, status: status, percendDone: percendDone};
    length = items_downloading.length;
    for (i = 0; i < length; i++){
      if (items_downloading[i].id == id){
        add_item(0, i, item);
        substitute = 1;
      }
    }
    if (substitute === 0){
      add_item(0, length, item);

    }
  }
  if (status === 6 || status === 8){
    item = { title: name, subtitle: sub, upload: upload, download: download, icon: "IMAGES_ICON_CHECK_PNG", id: id, status: status, percendDone: percendDone};
    length = items_seeding.length;
    for (i = 0; i < length; i++){
      if (items_seeding[i].id == id){
        add_item(1, i, item);
        substitute = 1;
      }
    }
    if (substitute === 0){
      add_item(1, length, item);
    }
  }
  if (status === 0){
    item = { title: name, subtitle: sub, upload: upload, download: download, icon: "images/pause.png", id: id, status: status, percendDone: percendDone};
    length = items_paused.length;
    for (i = 0; i < length; i++){
      if (items_paused[i].id == id){
        add_item(2, i, item);
        substitute = 1;
      }
    }
    if (substitute === 0){
      add_item(2, length, item);
    }
  }
  if (title_window.text() == name){
    value_download.text(download);
    value_upload.text(upload);
    value_availability.text(percendDone);
  }
}

function set_info_color(value){
  var color = "black";
  switch(value){
    case 0:
      color = "lightgray";
      break;
    case 4:
      color = "vividcerulean";
      break;
    case 6:
      color = "green";
      break;
  }
  title_window.color(color);
  value_download.color(color);
  value_upload.color(color);
  value_availability.color(color);
  label_download.color(color);
  label_upload.color(color);
  label_availability.color(color);
}

menu_downloading.on('select', function(e) {
  title_window.text(e.item.title);
  value_download.text(e.item.download);
  value_upload.text(e.item.upload);
  value_availability.text(e.item.percendDone);
  // if (e.item.status === 0){
  //   set_info_color(0);
  // } else if (e.item.status === 6 || e.item.status === 8){
  //   set_info_color(6);
  // } else if (e.item.status === 4){
  //   set_info_color(4);
  // }
  detail_window.show();
});

menu_downloading.on('longSelect', function(e) {
  select_choice(e);
});

function add_item(section_index, item_index, item){
  menu_downloading.item(section_index, item_index, item);
}

function select_choice(e){

  if (e.item.status === 0){
    choice = [{title: "Start"}, {title: "Remove"}];
  }
  if (e.item.status == 4 || e.item.status == 6){
    choice = [{title: "Pause"}, {title: "Remove"}];
  }
  var menu_choice = new UI.Menu({
    sections: [{
      title: "Action",
      items: choice
    }]
  });

  menu_choice.show();

  menu_choice.on('select', function(element){
    console.log("Selected " + e.item.id);
    complete_action(element.item.title, e.item.id);
    menu_choice.hide();
  });
}

function complete_action(action, id){
  var method;
  if (action == "Remove"){
    method = "torrent-remove";
  } else if (action == "Pause"){
    method = "torrent-stop";
  } else if (action == "Start"){
    method = "torrent-start";
  }

  var request_action = { "arguments": { "ids": [id] }, "method": method, "tag": 39693 };
  console.log("REQUEST: " + JSON.stringify(request_action));
  var authorization = 'Basic ' + base64_string;
  ajax(
    {
      url: URL,
      type: 'json',
      method: 'POST',
      data: request_action,
      headers: {
        'Authorization': authorization,
        'X-Transmission-Session-Id': XTransmissionSessionId
      },
    },
    function (data, status, req){
      console.log("Torrent eliminated correctly!");
      connect_to_transmission();
    },
    function (error, status, req){
      console.log('Failed eliminating item in action!');
      console.log("Status is " + status);
      XTransmissionSessionId = xhr.getResponseHeader('X-Transmission-Session-Id');
      localStorage.setItem('X-Transmission-Session-Id', XTransmissionSessionId);
      complete_action(action, id);
    }
    );
}

Pebble.addEventListener('webviewclosed',
  function(e) {
    var configuration = JSON.parse(decodeURIComponent(e.response));
    protocol = "http";
    if (configuration.https) {
      protocol = "https";
    } 

    username = configuration.username;
    password = configuration.password;
    base64_string = base64_encode(username + ":" + password);
    server = configuration.server;
    port_number = configuration.port_number;
    URL = protocol + "://" + server + ":" + port_number + "/transmission/rpc/";
    
    localStorage.setItem('username', username);
    localStorage.setItem('password', password);
    localStorage.setItem('base64_string', base64_string);
    localStorage.setItem('server', server);
    localStorage.setItem('port_number', port_number);
    localStorage.setItem('URL', URL);
    clearInterval(timer);
    timer = setInterval(function(){ connect_to_transmission(); }, 3000);
    console.log("Retrieved all values correctly...starting the connection to the server");

    if (Pebble.getTimelineToken){
      console.log("You have a Pebble Timeline! I'm getting the token...");
      Pebble.getTimelineToken(
        function (token) {
          timeline_token = token;
          console.log('The timeline token is ' + token);
          subscribe();
        },
        function (error) { 
          console.log('Error getting timeline token: ' + error);
        }
      );
    }
    
    connect_to_transmission();
  }
);

Pebble.addEventListener('showConfiguration', function(e) {
  var obj = {
    server: server,
    port_number: port_number,
    protocol: protocol,
    username: username,
    password: password
  };
  Pebble.openURL('http://www.davidespadini.it/form.html?' + encodeURIComponent(JSON.stringify(obj)));
});

function base64_encode(data) {
  var b64 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=';
  var o1, o2, o3, h1, h2, h3, h4, bits, i = 0,
    ac = 0,
    enc = '',
    tmp_arr = [];

  if (!data) {
    return data;
  }

  do { // pack three octets into four hexets
    o1 = data.charCodeAt(i++);
    o2 = data.charCodeAt(i++);
    o3 = data.charCodeAt(i++);

    bits = o1 << 16 | o2 << 8 | o3;

    h1 = bits >> 18 & 0x3f;
    h2 = bits >> 12 & 0x3f;
    h3 = bits >> 6 & 0x3f;
    h4 = bits & 0x3f;

    // use hexets to index into b64, and append result to encoded string
    tmp_arr[ac++] = b64.charAt(h1) + b64.charAt(h2) + b64.charAt(h3) + b64.charAt(h4);
  } while (i < data.length);

  enc = tmp_arr.join('');

  var r = data.length % 3;

  return (r ? enc.slice(0, r - 3) : enc) + '==='.slice(r || 3);
}

function subscribe(){
  ajax(
    {
      url: 'http://transmissionupdate.herokuapp.com/subscription',
      // url: 'http://localhost:5000/subscription',
      method: 'POST',
      data: {
        token: timeline_token,
        url: URL,
        username: username,
        password: password,
      },
      type: 'json'
    },
    function(data, status, request) {
      console.log('Subscribed correctly!');
    },
    function(error, status, request) {
      console.log('The ajax request failed: ' + error);
    }
  );
}


var timer = setInterval(function(){ connect_to_transmission(); }, 3000);
menu_downloading.show();

if (username === null) {
  completeForm.show();
} else {
  splashWindow.show();
}
