const PIANO = $.worldItemReference("piano");

$.onInteract((player) => {
  PIANO.send("key", { player: player });
  // 音を鳴らす場合は、ここに追加する
});