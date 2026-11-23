// GameManager と 5つのごみ箱(TrashBox.js)の橋渡し役。空のオブジェクトに Item と Scriptable Item を付けて、このスクリプトを置く。
// World Item Reference List に "trashManager" として登録する(GameManagerとごみ箱の両方から見えるように)。
//
// 役割:
//   GameManager → ここ : "start"  { taskPlaces: { プレイヤーID: [回収する場所の名前] } }
//   ごみ箱 → ここ      : "deleteTrash" { player, place }  (ごみがゴミ捨て場に捨てられた)
//   ここ → ごみ箱      : "start" / "sync" { taskPlaces }   (まだ回収していない場所の最新)
//   ここ → GameManager : "trashProgress" { taskId, player, count: まだ回収していない場所の配列 }
//                        "taskStep"      { taskId, step, player }  (全部回収したとき)

const TASK_ID = "trash";

const GAMEMANAGER = $.worldItemReference("gameManager");
const TRASHBOXES = [
  $.worldItemReference("trashBox"),
  $.worldItemReference("trashBox1"),
  $.worldItemReference("trashBox2"),
  $.worldItemReference("trashBox3"),
  $.worldItemReference("trashBox4"),
];

$.onStart(() => {
  $.state.taskPlaces = {}; // { プレイヤーID: まだ回収していない場所の名前の配列 }
  $.state.done = [];       // タスクを終えたプレイヤーのid
});

$.onReceive((messageType, arg, sender) => {
  switch (messageType) {
    case "start": { // from GameManager. arg.taskPlaces: {playerId: ...places}
      $.state.taskPlaces = arg.taskPlaces ?? {};
      $.state.done = [];
      sendToBoxes("start");
      break;
    }

    case "deleteTrash": { // from TrashBox. arg.player: 捨てたプレイヤー, arg.place: 捨てた場所
      const player = arg && arg.player;
      if (!player) break;
      if ($.state.done.includes(player.id)) break;

      const places = $.state.taskPlaces[player.id];
      if (!places) break;               // 担当ではない
      if (!places.includes(arg.place)) break; // 担当外の場所、または回収済み

      const left = places.filter(p => p !== arg.place);
      $.state.taskPlaces = { ...$.state.taskPlaces, [player.id]: left };

      sendToBoxes("sync");
      GAMEMANAGER.send("trashProgress", { taskId: TASK_ID, player: player, count: left });

      if (left.length === 0) {
        $.state.done = [...$.state.done, player.id];
        GAMEMANAGER.send("taskStep", { taskId: TASK_ID, player: player });
      }
      break;
    }
  }
});

function sendToBoxes(messageType) {
  for (const box of TRASHBOXES) {
    box.send(messageType, { taskPlaces: $.state.taskPlaces });
  }
}