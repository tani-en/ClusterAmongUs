// 「プレイヤーは入れないが、アイテムは通れる」空間。サイコロを投げ込む場所に置く。
// アイテムには、Trigger に設定した Collider(Is Trigger にオン)を付ける。物理的には何も止めない(アイテムは、そのまま通れる)。
//
// 仕組み(空間の大きさの数値は、要らない):
//   ・空間の近くにいるプレイヤーの位置を、空間に重なっていない間、ずっと記録しておく(=「最後に外にいた場所」)。
//   ・プレイヤーが空間に重なったら、その「最後に外にいた場所」に、すぐ戻す。
//   ・記録がない・古すぎるとき(いきなり中に現れたなど)は、空間の中心から外向きに、FALLBACK_RADIUS の距離へ出す。
//
// 設定:
//   Collider の高さは、プレイヤーより高くする(ジャンプで、上から入られないように)。

const SCAN_RADIUS = 8;          // 空間の中心から、この距離にいるプレイヤーを、記録の対象にする[m]
const MAX_SAFE_DISTANCE = 4;    // 「最後に外にいた場所」が、いまの位置から、これより遠いときは、使わない[m]
const FALLBACK_RADIUS = 3;      // 記録がないときに、中心から出す距離[m](Collider の半分より大きくする)
const CHECK_INTERVAL = 0.05;    // 何秒おきに調べるか
const PUSH_INTERVAL = 0.15;     // 同じプレイヤーを、続けて押し戻す間隔[秒]。setPosition の回数制限(rate limit)に当たらないようにする

$.onStart(() => {
  $.state.timer = 0;
  $.state.safe = {};        // { プレイヤーID: { x, y, z } } 最後に外にいた場所
  $.state.cool = {};        // { プレイヤーID: 次に押し戻せるまでの残り秒数 }
});

$.onUpdate(deltaTime => {
  const timer = $.state.timer + deltaTime;
  if (timer < CHECK_INTERVAL) { $.state.timer = timer; return; }
  $.state.timer = 0;

  const center = $.getPosition();
  const overlaps = $.getOverlaps();
  const overlapIds = new Set(overlaps.map(o => o.handle).filter(h => h && h.type === "player").map(h => h.id));

  const nearby = $.getPlayersNear(center, SCAN_RADIUS);
  const safe = $.state.safe;
  const cool = $.state.cool;
  for (const id of Object.keys(cool)) cool[id] = Math.max(0, cool[id] - CHECK_INTERVAL);
  const nearbyIds = new Set();

  for (const player of nearby) {
    nearbyIds.add(player.id);
    const pos = player.getPosition();
    if (!pos) continue;

    if (!overlapIds.has(player.id)) {
      // 外にいる: この場所を、「最後に外にいた場所」として記録する
      safe[player.id] = { x: pos.x, y: pos.y, z: pos.z };
      continue;
    }

    // 空間の中にいる: 外に戻す(続けて呼びすぎないよう、PUSH_INTERVAL を空ける)
    if ((cool[player.id] ?? 0) > 0) continue;
    const s = safe[player.id];
    let target;
    if (s && Math.hypot(pos.x - s.x, pos.z - s.z) <= MAX_SAFE_DISTANCE) {
      target = new Vector3(s.x, pos.y, s.z); // 高さは、いまのまま(ジャンプ中に、急に動かさない)
    } else {
      // 記録がない: 中心から外向きに出す
      let dx = pos.x - center.x;
      let dz = pos.z - center.z;
      const len = Math.hypot(dx, dz);
      if (len < 0.01) { dx = 1; dz = 0; } else { dx /= len; dz /= len; }
      target = new Vector3(center.x + dx * FALLBACK_RADIUS, pos.y, center.z + dz * FALLBACK_RADIUS);
    }
    try {
      player.setPosition(target);
      cool[player.id] = PUSH_INTERVAL;
    } catch (e) {
      // 回数制限に当たった場合も、ほかのプレイヤーの処理と、記録の保存は続ける
      cool[player.id] = PUSH_INTERVAL;
    }
  }

  // 近くにいなくなったプレイヤーの記録は、消す(古い記録で、戻さないため)
  for (const id of Object.keys(safe)) {
    if (!nearbyIds.has(id)) { delete safe[id]; delete cool[id]; }
  }
  $.state.safe = safe;
  $.state.cool = cool;
});