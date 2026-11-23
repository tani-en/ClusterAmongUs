// ワールドにいる全員に PlayerScript を、1人につき1回だけ割り当てる。
// $.setPlayerScript は 10[回/秒] を超えられないので、順番待ち(キュー)に入れて 0.1秒ごとに1人ずつ割り当てる。

const FORGET_SECONDS = 10;   // この秒数、検知できなかったプレイヤーは「退室した」とみなして記録を消す

$.onStart(() => {
  // PlayerScriptを与えたプレイヤーの記録 { プレイヤーID: 検知できなかった秒数 }
  $.state.registered = {};

  // 順番待ち(プレイヤーのリスト)
  $.state.queue = [];
  $.state.time = 0;
});

$.onUpdate(deltaTime => {
  // プレイヤーの入室状況を確認する
  checkPlayer(deltaTime);

  // キューにプレイヤーが残っている場合
  const queue = $.state.queue;
  if (queue.length > 0) {
    let t = ($.state.time ?? 0) + deltaTime;
    if (t > 0.1) {
      t -= 0.1;

      // キューの先頭にいるプレイヤーに、PlayerScriptを割り当てる
      const player = queue.shift();
      if (player) $.setPlayerScript(player);
      $.state.queue = queue;
    }
    $.state.time = t;
  }
});

// 新規入室したプレイヤーがいないか確認する
function checkPlayer(deltaTime) {
  const registered = $.state.registered;
  const queue = $.state.queue;
  let changed = false;

  // ワールド全体のプレイヤーを検知する
  const detected = $.getPlayersNear($.getPosition(), Infinity);
  const detectedIds = new Set();

  for (const player of detected) {
    detectedIds.add(player.id);

    if (!(player.id in registered)) {
      // 初めて見たプレイヤー: 記録して、キューに入れる(IDで判定するので、二重には入らない)
      queue.push(player);
      changed = true;
    }
    if (registered[player.id] !== 0) {
      registered[player.id] = 0;
      changed = true;
    }
  }

  // 検知できなかったプレイヤーは、少しの間は覚えておく(一瞬見えなくなっただけで、再割り当てしないため)
  for (const id of Object.keys(registered)) {
    if (detectedIds.has(id)) continue;
    registered[id] += deltaTime;
    if (registered[id] > FORGET_SECONDS) delete registered[id];
    changed = true;
  }

  if (changed) {
    $.state.registered = registered;
    $.state.queue = queue;
  }
}