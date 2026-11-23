const HIDDEN_POSITION = new Vector3(0, -100, 0);
const KILL_COOLDOWN = 10; // キルクールダウン[秒]
const FORWARD_OFFSET = 1; // インポスターの前方何mの位置にセンサーを置くか

$.onStart(() => {
  $.state.imposter = null;
  $.state.cooldown = 0;    // 残りクールタイム[秒]
  $.setPosition(HIDDEN_POSITION);
});

$.onReceive((messageType, arg) => {
  switch (messageType) {
    case "bindImposter": // from GM. arg: 紐づけられたインポスターのHd
      $.state.imposter = arg;
      $.state.cooldown = KILL_COOLDOWN;
      arg.send("killCooldownStart", KILL_COOLDOWN);
      break;

    case "unbind": // from GM.
      $.state.imposter = null;
      $.state.cooldown = 0;
      $.setPosition(HIDDEN_POSITION);
      break;

    case "tryKill": { // from imposter via GM. arg: 紐づけられたインポスターのHd
      if (!$.state.imposter) return;
      if (!arg || arg.id !== $.state.imposter.id) return;
      if ($.state.cooldown > 0) return;

      const overlaps = $.getOverlaps().map(o => o.handle).filter(h => h?.type === "player");
      const target = overlaps.find(p => p.id !== $.state.imposter.id);
      if (target) {
        $.worldItemReference("gameManager").send("kill", target);
        $.state.cooldown = KILL_COOLDOWN;
        $.state.imposter.send("killCooldownStart", KILL_COOLDOWN);
      }
      break;
    }
  }
});

$.onUpdate(deltaTime => {
  if (!$.state.imposter) return;

  // インポスターの前方へ追従
  const pos = $.state.imposter.getPosition();
  const rot = $.state.imposter.getRotation();
  if (pos) {
    if (rot) {
      // プレイヤーの向きを、水平方向だけの前向きベクトルにする(上や下を向いていても、前に1mずらすだけにする)
      const forward = new Vector3(0, 0, 1).applyQuaternion(rot);
      forward.y = 0;
      if (forward.lengthSq() > 0.0001) {
        forward.normalize();
        pos.add(forward.clone().multiplyScalar(FORWARD_OFFSET));
        const yaw = Math.atan2(forward.x, forward.z) * 180 / Math.PI;
        $.setRotation(new Quaternion().setFromEulerAngles(new Vector3(0, yaw, 0)));
      }
    }
    $.setPosition(pos);
  }

  if ($.state.cooldown > 0) {
    $.state.cooldown = Math.max(0, $.state.cooldown - deltaTime);
  }
});