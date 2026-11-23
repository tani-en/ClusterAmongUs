$.onStart(() => {
  const label = $.getUnityComponent("Text");
  $.state.keyValue = label.unityProp.text;
});


$.onInteract(player => {
  $.worldItemReference("keyBoard").send("pushKey", {keyValue: $.state.keyValue, player: player});
});


//　沈み込む挙動つける？