const VOICEIDS = ["suspicious", "taskfinish", "comewithme", "helpme"];
const VOICES   = ["あやしい", "タスク終わった", "一緒に来て", "助けて"];
const VOLUME = 2.0; // 音量(0〜2.5。標準は1)

$.onStart(() => {
  $.state.index = 0;
});

$.onUse((isDown, player) => {
  if (isDown) {
    const audio = $.audio(VOICEIDS[$.state.index]);
    audio.volume = VOLUME;
    audio.play();
  }
});


$.onReceive((messageType, arg) => {
  switch (messageType) {
    case "change": {
      $.state.index = arg;
      break;
    }
  }
});