const TEXTVIEW = $.subNode("TextView");

$.onStart(() => {
  $.state.text    = "";
  $.state.isUpper = true;
});

$.onReceive((messageType, arg) => {
  switch (messageType) {
    case "pushKey":
      let text = $.state.text;
      switch (arg.keyValue) {
        case "Enter":
          enterText(text, arg.player);
          text = "";
          break;

        case "BackSpace":
          text = text.slice(0, -1);
          break;

        case "Space":
          text += " ";
          break;
        
        case "Trans":
          let isUpper = $.state.isUpper;
          $.state.isUpper  = !isUpper;
          break;

        default:
          if(!$.state.isUpper){ arg.keyValue = arg.keyValue.toLowerCase(); }
          text += arg.keyValue;
          break;
      }
      TEXTVIEW.setText(text);
      $.state.text = text;
      break;
  
    case "start":
      $.state.text = "";
      break;
  }
});

function enterText(text, player){
  $.worldItemReference("task").send("Enter", {text: text, player: player});
}