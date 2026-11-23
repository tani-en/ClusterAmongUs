// ワイン室の、樽(WineBarrel.js)と GameManager の橋渡し。
// 樽から "glassDone"(1杯、成功)が届くと、そのプレイヤーの杯数を数える。GLASSES 杯で完了。
//
// 設定:
//   World Item Reference List に: gameManager、wineBarrel0〜wineBarrel4(樽5つ)
//   GameManager の World Item Reference List に: wineManager(このアイテム)
//
// 流れ:
//   GameManager → ここ : "start"
//   樽 → ここ          : "glassDone" { player }
//   ここ → GameManager : "wineProgress" { taskId, player, count } / "taskStep" { taskId, step, player }

const TASK_ID = "pour";  // GameManager.js の TASK_DEFS の id
const STEP = 0;
const GLASSES = 3;       // 注ぐグラスの数(GameManager.js の WINE_GLASSES と同じにする)

const GAMEMANAGER = $.worldItemReference("gameManager");
const BARRELS = [0, 1, 2, 3, 4].map(i => $.worldItemReference("wineBarrel" + i));

$.onStart(() => {
  $.state.counts = {}; // { プレイヤーID: 注いだ杯数 }
});

$.onReceive((messageType, arg, sender) => {
  switch (messageType) {
    case "start": // from GameManager
      $.state.counts = {};
      BARRELS.forEach(barrel => barrel.send("start", null));
      break;

    case "glassDone": { // from WineBarrel
      if (!(sender instanceof ItemHandle)) break;
      if (!BARRELS.some(b => b.id === sender.id)) break;
      const player = arg && arg.player;
      if (!player) break;

      const counts = $.state.counts;
      const now = counts[player.id] ?? 0;
      if (now >= GLASSES) break; // もう完了している
      counts[player.id] = now + 1;
      $.state.counts = counts;

      GAMEMANAGER.send("wineProgress", { taskId: TASK_ID, player: player, count: now + 1 });
      if (now + 1 >= GLASSES) {
        GAMEMANAGER.send("taskStep", { taskId: TASK_ID, step: STEP, player: player });
      }
      break;
    }
  }
});