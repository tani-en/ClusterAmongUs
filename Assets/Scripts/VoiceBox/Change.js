const TEXTVIEW = $.subNode("Text");
const VOICES   = ["あやしい", "タスク終わった", "一緒に来て", "助けて"];

$.onStart(() => {
  $.state.index = 0;
  TEXTVIEW.setText(VOICES[0]);
});

$.onInteract(() => {
  let index = $.state.index;
  index = (index + 1) % VOICES.length;
  TEXTVIEW.setText(VOICES[index]);
  $.state.index = index;
  $.worldItemReference("voice").send("change", index);
});

