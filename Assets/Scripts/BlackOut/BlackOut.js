// 追従しながら、停電を直す配電盤の方向へ、このアイテム(の向き)を回す。子の Arrow は、このアイテムの前(+Z)を指しておく。

const SWITCH_POS = new Vector3(-35.1689987,0.90200001,-0.671999991);

// プレイヤーの前方(向いている方向)へ、このアイテムをずらす距離[m]。0なら、プレイヤーの真上。
const FORWARD_OFFSET = .5;

$.onReceive((messageType, arg, sender) => {
  switch (messageType) {
    case "playerHd":
      $.state.player = arg;
      break;

    case "blackOutFinish":
      $.destroy();
      break;
  }
});

$.onUpdate(() => {
  const player = $.state.player;
  if (!player) return;
  if (!player.exists()) { // 追従する相手が退室した
    $.destroy();
    return;
  }
  const pos = player.getPosition();
  if (!pos) return;

  // プレイヤーの前方へ、少しだけずらして置く(向きが取れないときは、ずらさない)
  const placed = pos.clone();
  const rot = player.getRotation();
  if (rot) {
    const forward = new Vector3(0, 0, 1).applyQuaternion(rot);
    forward.y = 0;
    if (forward.lengthSq() > 0.0001) {
      forward.normalize();
      placed.add(forward.multiplyScalar(FORWARD_OFFSET));
    }
  }
  $.setPosition(placed);

  // 配電盤の方向(水平方向だけ)に、アイテムを回す。方向は、ずらす前のプレイヤーの位置から測る
  const dx = SWITCH_POS.x - pos.x;
  const dz = SWITCH_POS.z - pos.z;
  if (dx * dx + dz * dz < 0.0001) return; // ほぼ真上・真下にいるときは、向きを変えない
  const yaw = Math.atan2(dx, dz) * 180 / Math.PI;
  $.setRotation(new Quaternion().setFromEulerAngles(new Vector3(0, yaw, 0)));
});