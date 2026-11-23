// 声が聞こえる範囲を狭くする。空のオブジェクトに Item と Scriptable Item、Audio Configuration Set List を付けて、このスクリプトを置く。
//
// 準備(Unity側):
//   1. Audio Source を持つ Prefab を作る(例: VoiceNear)。Audio Source は次のようにする。
//        Spatial Blend = 1(3D)、Volume Rolloff = Linear(または Logarithmic)、
//        Min Distance = 1、Max Distance = 8 など(この距離より遠いと聞こえなくなる。壁の厚みに合わせて調整)
//   2. このアイテムの Audio Configuration Set List に、Id = "near" の要素を追加し、Audio Source に上のPrefabを入れる。
//
// 注意: このアイテムが消えると、適用した声の設定も消える。

const CONFIG_ID = "near";    // Audio Configuration Set List の Id と同じにする
const CHECK_INTERVAL = 1.0;  // 新しく入ってきた人を確認する間隔[秒]
const MAX_PER_TICK = 5;      // 1回の確認で設定する人数の上限(1秒に10回までの制限があるため)

$.onStart(() => {
  $.state.applied = [];  // 設定を済ませたプレイヤーのid
  $.state.timer = 0;
});

$.onUpdate(deltaTime => {
  $.state.timer += deltaTime;
  if ($.state.timer < CHECK_INTERVAL) return;
  $.state.timer = 0;

  const players = $.getPlayersNear($.getPosition(), Infinity);
  const alive = new Set(players.map(p => p.id));
  // 退室した人は記録から外す(同じidで戻ってきたときに、もう一度設定できるように)
  let applied = $.state.applied.filter(id => alive.has(id));

  let count = 0;
  for (const p of players) {
    if (applied.includes(p.id)) continue;
    if (count >= MAX_PER_TICK) break;
    p.setVoiceConfiguration(CONFIG_ID);
    applied = [...applied, p.id];
    count++;
  }
  $.state.applied = applied;
});