const MeetingStartPos = new Vector3(0, 0, 0);
const MeetingFinishPos = new Vector3(0, 100, 0);


$.onStart(() => {
    $.setPosition(MeetingFinishPos);
});


$.onReceive((messageType) => {
  switch(messageType){
    case "blockPos":
      $.setPosition(MeetingStartPos);
      break;

    case "hidePos":
      $.setPosition(MeetingFinishPos);
      break;
  }
});