const MAX_IMPOSTERS = 5;
const TEXTVIEW = $.subNode("Text");

$.onStart(() => {
  $.state.imposterNum = 1;
});

$.onInteract(player => {
  let imposterNum = $.state.imposterNum;
  imposterNum += 1;
  if(imposterNum > MAX_IMPOSTERS) imposterNum = 1;
  $.state.imposterNum = imposterNum;
  $.worldItemReference("gameManager").send("changeImposterNum", imposterNum);
  let requireNum = imposterNum*2 + 1;

  TEXTVIEW.setText("インポスターの人数: "+ imposterNum + "人\n" + requireNum + "人必要です");
});