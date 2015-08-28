var platform = require('platform');
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
var protocol = localStorage.getItem('protocol');
var server = localStorage.getItem('server');
var port_number = localStorage.getItem('port_number');
var username = localStorage.getItem('username');
var password = localStorage.getItem('password');
var base64_string = localStorage.getItem('base64_string');
var URL = localStorage.getItem('URL');
var timeouts = [];
var timeline_token;


if (platform.version() === "basalt"){
  var colors_dict = {
    backgroundColor:'black',
    textColor:'white',
    highlightBackgroundColor: 'blue',
    highlightTextColor: 'white',
    backgroundColorCard: 'black',
    titleColorCard: 'white',
    colorTitleWindow:'vividCerulean',
    backgroundColorTitleWindow:'black',
    colorLabel:'white',
    backgroundColorLabel:'black',
    backgroundColorRect: 'black'
  };
} else {
  var colors_dict = {
    backgroundColor:'white',
    textColor:'black',
    highlightBackgroundColor: 'black',
    highlightTextColor: 'white',
    backgroundColorCard: 'white',
    titleColorCard: 'black',
    colorTitleWindow:'black',
    backgroundColorTitleWindow:'white',
    colorLabel:'black',
    backgroundColorLabel:'white',
    backgroundColorRect: 'white'
  };
}

// Create a Card with title and subtitle
// Construct Menu to show to user
var menu_downloading = new UI.Menu({
  backgroundColor: colors_dict.backgroundColor,
  textColor: colors_dict.textColor,
  highlightBackgroundColor: colors_dict.highlightBackgroundColor,
  highlightTextColor: colors_dict.highlightTextColor,
  fullscreen: true,
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

var no_torrents_card = new UI.Card({
  fullscreen: true,
  backgroundColor: colors_dict.backgroundColorCard,
  titleColor: colors_dict.titleColorCard,
  title: "You have no torrents",
  scrollable: true
});

no_torrents_card.on('click', 'back', function(){
  // console.log('do nothing...');
});

var errorCard = new UI.Card({
  fullscreen: true,
  backgroundColor: colors_dict.backgroundColorCard,
  titleColor: colors_dict.titleColorCard,
  bodyColor: colors_dict.titleColorCard,
  title: "Error!",
  body: "Server is not reachable! Check your configuration.",
  scrollable: true
});

errorCard.on('click', 'back', function(){
  // console.log('do nothing...');
});


var completeForm = new UI.Card({
  backgroundColor: colors_dict.backgroundColorCard,
  bodyColor: colors_dict.titleColorCard,
  fullscreen: true,
  title: "",
  subtitle: "",
  body: "Complete the form with all the requested value on the mobile phone",
  scrollable: true
});

completeForm.on('click', 'back', function(){
  // console.log('do nothing...');
});

var splashWindow = new UI.Card({
  fullscreen: true,
  backgroundColor: colors_dict.backgroundColorCard,
  titleColor: colors_dict.titleColorCard,
  title: "Contacting transmission...",
  scrollable: true
});

splashWindow.on('click', 'back', function(){
  // console.log('do nothing...');
});

var detail_window = new UI.Window({
  fullscreen: true
});
var rect = new UI.Rect({
  position: new Vector2(0, 0),
  size: new Vector2(144, 168),
  backgroundColor: colors_dict.backgroundColorRect
});
var title_window = new UI.Text({
  position: new Vector2(0, 0),
  size: new Vector2(144, 80),
  font: 'gothic-24-bold',
  text: '',
  textAlign: 'center',
  color: colors_dict.colorTitleWindow,
  backgroundColor: colors_dict.backgroundColorTitleWindow
});
var label_download = new UI.Text({
  position: new Vector2(0, 75),
  size: new Vector2(144, 25),
  font: 'gothic-18',
  text: 'Downloading:',
  textAlign: 'left',
  color: colors_dict.colorLabel,
  backgroundColor: colors_dict.backgroundColorLabel
});
var label_upload = new UI.Text({
  position: new Vector2(0, 96),
  size: new Vector2(144, 25),
  font: 'gothic-18',
  text: 'Uploading:',
  textAlign: 'left',
  color: colors_dict.colorLabel,
  backgroundColor: colors_dict.backgroundColorLabel
});
var label_availability = new UI.Text({
  position: new Vector2(0, 117),
  size: new Vector2(144, 25),
  font: 'gothic-18',
  text: 'Progress:',
  textAlign: 'left',
  color: colors_dict.colorLabel,
  backgroundColor: colors_dict.backgroundColorLabel
});
var label_peers = new UI.Text({
  position: new Vector2(0, 138),
  size: new Vector2(144, 25),
  font: 'gothic-18',
  text: 'Total Peers:',
  textAlign: 'left',
  color: colors_dict.colorLabel,
  backgroundColor: colors_dict.backgroundColorLabel
});
var value_download = new UI.Text({
  position: new Vector2(80, 75),
  size: new Vector2(64, 25),
  font: 'gothic-18',
  text: '',
  textAlign: 'right',
  color: colors_dict.colorLabel,
  backgroundColor: colors_dict.backgroundColorLabel
});
var value_upload = new UI.Text({
  position: new Vector2(80, 96),
  size: new Vector2(64, 25),
  font: 'gothic-18',
  text: '',
  textAlign: 'right',
  color: colors_dict.colorLabel,
  backgroundColor: colors_dict.backgroundColorLabel
});
var value_availability = new UI.Text({
  position: new Vector2(80, 117),
  size: new Vector2(64, 25),
  font: 'gothic-18',
  text: '',
  textAlign: 'right',
  color: colors_dict.colorLabel,
  backgroundColor: colors_dict.backgroundColorLabel
});
var value_peers = new UI.Text({
  position: new Vector2(80, 138),
  size: new Vector2(64, 25),
  font: 'gothic-18',
  text: '',
  textAlign: 'right',
  color: colors_dict.colorLabel,
  backgroundColor: colors_dict.backgroundColorLabel
});

detail_window.add(rect);
detail_window.add(title_window);
detail_window.add(label_download);
detail_window.add(label_upload);
detail_window.add(label_availability);
detail_window.add(label_peers);
detail_window.add(value_download);
detail_window.add(value_upload);
detail_window.add(value_availability);
detail_window.add(value_peers);

function connect_to_transmission(){
  var request = { "arguments": { "fields": [ "id", "name", "percentDone", "status", "rateDownload", "rateUpload", "eta", "doneDate", "hashString", "peersConnected"] }, "method": "torrent-get", "tag": 39693 };
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
      var torrent_list  = data.arguments.torrents;
      if (torrent_list.length === 0){
        // console.log("There is not torrents!");
        no_torrents_card.show();
      } else {
        torrent_list.forEach(function(e){
          var down = convert_value_with_unit(e.rateDownload);
          var upload = convert_value_with_unit(e.rateUpload);
          var percent = Math.round(e.percentDone * 100);
          var sub = "Down: " + down + " Up: " + upload;
          update_value(e.status, e.name, sub, upload, down, percent + "%", e.id, e.peersConnected);
        });

        for (var i = 0; i < 3; i++){
          check_queue(menu_downloading.state.sections[i].items, data.arguments.torrents, i);
        }
        no_torrents_card.hide();
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

function update_value(status, name, sub, upload, download, percendDone, id, peers){
  var substitute = 0;
  var length = 0;
  var i;
  var item;
  if (status === 4){
    item = { title: name, subtitle: sub, upload: upload, download: download, icon: "images/arrow_download.png", id: id, status: status, percendDone: percendDone, peers: peers};
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
    item = { title: name, subtitle: sub, upload: upload, download: download, icon: "IMAGES_ICON_CHECK_PNG", id: id, status: status, percendDone: percendDone, peers: peers};
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
    item = { title: name, subtitle: sub, upload: upload, download: download, icon: "images/pause.png", id: id, status: status, percendDone: percendDone, peers: peers};
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
    value_peers.text(peers);
  }
}

menu_downloading.on('select', function(e) {
  title_window.text(e.item.title);
  value_download.text(e.item.download);
  value_upload.text(e.item.upload);
  value_availability.text(e.item.percendDone);
  value_peers.text(e.item.peers);

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
    backgroundColor: colors_dict.backgroundColor,
    textColor: colors_dict.textColor,
    highlightBackgroundColor: colors_dict.highlightBackgroundColor,
    highlightTextColor: colors_dict.highlightTextColor,
  fullscreen: true,
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
    if (configuration.port_number === ""){
      port_number = 9091;
    } else {
      port_number = configuration.port_number;
    }
    URL = protocol + "://" + server + ":" + port_number + "/transmission/rpc/";
    console.log("URL is " + URL);
    
    localStorage.setItem('username', username);
    localStorage.setItem('password', password);
    localStorage.setItem('base64_string', base64_string);
    localStorage.setItem('server', server);
    localStorage.setItem('port_number', port_number);
    localStorage.setItem('URL', URL);
    localStorage.setItem('protocol', protocol);
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
