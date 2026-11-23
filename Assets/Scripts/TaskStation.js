// タスクステーション(タスクの1工程ぶんの場所)
// 部屋に置くアイテムごとに、下の2つだけ書き換えて使う。
// 対応表は task_stations.md を参照。
const TASK_ID = "tea"; // GameManager.js の TASK_DEFS の id
const STEP = 0;        // 何番目の工程か(0始まり。1工程だけのタスクは0)

// プレイヤーがインタラクトしたら、GameManagerに工程完了を申告する。
// 担当かどうか・順番どおりかの判定は、GameManager側で行う。
$.onInteract(player => {
  $.worldItemReference("gameManager").send("taskStep", {
    taskId: TASK_ID,
    step: STEP,
    player: player
  });
});