const TASK_ID = "pour";
const GLASSES = 3;       // 注ぐグラスの数(GameManager.js の WINE_GLASSES と同じにする)

const GAMEMANAGER = $.worldItemReference("gameManager");
const BARRELS = [0, 1, 2, 3, 4].map(i => $.worldItemReference("wineBarrel" + i));

$.onStart(() => {
  $.state.counts = {}; // { プレイヤーID: 注いだ杯数 }
});

$.onReceive((messageType, arg, sender) => {
  switch (messageType) {
    case "start": // from GameManager.
      $.state.counts = {};
      BARRELS.forEach(barrel => barrel.send("start", null));
      break;

    case "glassDone": { // from WineBarrel.
      if (!(sender instanceof ItemHandle)) break;
      if (!BARRELS.some(b => b.id === sender.id)) break;
      const player = arg && arg.player;
      if (!player) break;

      const counts = $.state.counts;
      const now = counts[player.id] ?? 0;
      if (now >= GLASSES) break; // もう完了している
      counts[player.id] = now + 1;
      $.state.counts = counts;

      GAMEMANAGER.send("wineProgress", { taskId: TASK_ID, player: player, count: now + 1 }); //途中経過
      if (now + 1 >= GLASSES) {
        GAMEMANAGER.send("taskStep", { taskId: TASK_ID, player: player }); //タスク完了
      }
      break;
    }
  }
});