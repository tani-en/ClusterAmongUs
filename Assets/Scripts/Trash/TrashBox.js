// 指定の場所でごみを出すごみ箱。5つのごみ箱アイテムそれぞれに付ける。
// 場所の名前は、子のTextの文字(GameManager.js の TRASHBOX_NAMES と同じ名前にする)。
// 回収の記録・完了の判定は TrashManager がする。ここは、ごみを出して、捨てられたことを知らせるだけ。

const MAX_TRASHES = 3; // この場所で、同時に出しておけるごみの数

const TRASHROOM     = $.worldItemReference("trashRoom");
const TRASHTEMPLATE = new WorldItemTemplateId("trash");
const TRASHMANAGER  = $.worldItemReference("trashManager");

$.onStart(() => {
  $.state.trashes    = [];
  $.state.taskPlaces = {};  // { プレイヤーID: まだ回収していない場所の名前の配列 }

  const label = $.getUnityComponent("Text");
  $.state.place = label.unityProp.text;
});

$.onInteract((player) => {
  // 担当ではない、またはこの場所はもう回収済みなら、ごみは出ない
  const places = $.state.taskPlaces[player.id];
  if (!places || !places.includes($.state.place)) return;

  const trashes = $.state.trashes.filter(trash => trash.exists());
  if (trashes.length >= MAX_TRASHES) {
    $.state.trashes = trashes;
    return;
  }

  const markerPosition = $.getPosition();
  markerPosition.y += 3;
  const markerRotation = $.getRotation();

  const trashHandle = $.createItem(TRASHTEMPLATE, markerPosition, markerRotation);
  trashes.push(trashHandle);
  trashHandle.send("trashRoom", TRASHROOM);
  $.state.trashes = trashes;
});

$.onReceive((messageType, arg, sender) => {
  switch (messageType) {
    case "start": // from TrashManager. arg.taskPlaces: {playerId: ...places}
      $.state.trashes.forEach(trash => {
        if (trash.exists()) trash.send("start", null);
      });
      $.state.trashes = [];
      $.state.taskPlaces = arg.taskPlaces ?? {};
      break;

    case "sync": // from TrashManager. arg.taskPlaces: {playerId: ...places}
      $.state.taskPlaces = arg.taskPlaces ?? {};
      break;

    case "deleteTrash": { // from Trash. arg.player: 捨てたプレイヤー
      const player = arg && arg.player;
      if (!player) break;
      if (!$.state.trashes.some(trash => trash.id === sender.id)) break;
      $.state.trashes = $.state.trashes.filter(trash => trash.id !== sender.id);

      TRASHMANAGER.send("deleteTrash", { player: player, place: $.state.place });
      break;
    }
  }
});