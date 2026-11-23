const textViews = {"bath": $.subNode("bath"), "conservatory": $.subNode("conservatory"), "winecellar": $.subNode("winecellar"), "boiler": $.subNode("boiler"),
                   "servants": $.subNode("servants"), "dining": $.subNode("dining"), "study": $.subNode("study"), "lab": $.subNode("lab"), "kitchen": $.subNode("kitchen"),
                  "library": $.subNode("library"), "bedroomA": $.subNode("bedroomA"), "parlor": $.subNode("parlor"), "bedroomB": $.subNode("bedroomB"), "music": $.subNode("music"), "hall": $.subNode("hall")};

$.onStart(() =>{
    $.state.room = {"bath": 0, "conservatory1": 0, "conservatory2": 0, "winecellar": 0, "boiler1": 0, "boiler2": 0, "servants": 0, "dining": 0, "study": 0, "lab": 0, "kitchen": 0,
                  "library": 0, "bedroomA": 0, "parlor": 0, "bedroomB": 0, "music1": 0, "music2": 0, "hall": 0};
});

$.onReceive((messageType, arg) => {
  switch (messageType) {
    case "room_collider":{
      let room = $.state.room;
      room[arg.room] = arg.num_player;
      $.state.room = room;
      setMonitor(arg.room, arg.num_player);
      break;
    }
  }
});

function setMonitor(room, num_player){
  let num = 0;
  if (room.includes("boiler")){
    num = $.state.room["boiler1"] + $.state.room["boiler2"];
    showMonitor("boiler", num);
  }else if(room.includes("conservatory")){
    num = $.state.room["conservatory1"] + $.state.room["conservatory2"];
    showMonitor("conservatory", num);
  }else if(room.includes("music")){
    num = $.state.room["music1"] + $.state.room["music2"];
    showMonitor("music", num);
  }else{
  showMonitor(room, num_player);
  }
}

function showMonitor(room, num_player){
  if(num_player === 0) {
    textViews[room].setText("");
  }else{
    textViews[room].setText(num_player);
  }
};